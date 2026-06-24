from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect, WebSocketState

from services import audio_handler, llm_config, repository, transcription
from services.prompt_builder import (
    build_product_context,
    build_system_prompt,
    build_user_prompt,
)
from services.sales_ai import get_sales_advice
from services.state_manager import Speaker, StateManager
from services.status import products, server_status_payload

logger = logging.getLogger("ai_copilot.ws")

ALLOWED_SPEAKERS: tuple[str, ...] = ("client", "manager")
ALLOWED_LANGS: tuple[str, ...] = ("en", "ru", "auto")
_LLM_CONTEXT_MESSAGES = 10

def _parse_speaker(value: str | None, fallback: Speaker = "client") -> Speaker:
    return value if value in ALLOWED_SPEAKERS else fallback

def _parse_asr_language(value: str | None) -> str:
    return value if value in ALLOWED_LANGS else "ru"

def _transcribe_chunk(
    audio_b64: str, fmt: str | None, language: str, prompt: str | None
) -> tuple[str | None, tuple[str, str] | None]:

    path, err = audio_handler.save_chunk_from_base64(audio_b64, fmt)
    if err:
        return None, ("save", err)
    try:
        text, terr = transcription.transcribe_file(
            path, language=language, initial_prompt=prompt or None
        )
    finally:
        audio_handler.safe_unlink(path)
    if terr:
        return None, ("transcribe", terr)
    return text, None

class ConnectionRegistry:

    def __init__(self) -> None:
        self._connections: set["Connection"] = set()

    def add(self, conn: "Connection") -> None:
        self._connections.add(conn)

    def discard(self, conn: "Connection") -> None:
        self._connections.discard(conn)

    async def broadcast(self, event: str, data: dict[str, Any]) -> None:
        for conn in list(self._connections):
            await conn.send(event, data)

registry = ConnectionRegistry()

class Connection:

    def __init__(self, websocket: WebSocket, state: StateManager) -> None:
        self.ws = websocket
        self.state = state
        self.sid = uuid.uuid4().hex
        self._send_lock = asyncio.Lock()
        self._tasks: set[asyncio.Task] = set()

    async def send(self, event: str, data: dict[str, Any]) -> None:
        if self.ws.application_state != WebSocketState.CONNECTED:
            return
        async with self._send_lock:
            try:
                await self.ws.send_json({"event": event, "data": data})
            except (WebSocketDisconnect, RuntimeError):
                pass

    async def run(self) -> None:
        await self.ws.accept()
        registry.add(self)
        self.state.get_or_create(self.sid)
        await asyncio.to_thread(repository.create_session, self.sid)
        logger.info("client connected sid=%s", self.sid)
        await self.send("connected", {"sid": self.sid})
        await self.send("server_ready", server_status_payload())
        try:
            while True:
                message = await self.ws.receive_json()
                await self._dispatch(message)
        except WebSocketDisconnect:
            logger.info("client disconnected sid=%s", self.sid)
        finally:
            await self._teardown()

    async def _teardown(self) -> None:
        registry.discard(self)
        for task in list(self._tasks):
            task.cancel()
        self.state.drop(self.sid)

    async def _dispatch(self, message: Any) -> None:
        if not isinstance(message, dict):
            return
        event = message.get("event")
        data = message.get("data") or {}
        handler = {
            "client_profile": self._on_profile,
            "set_speaker": self._on_set_speaker,
            "reset_session": self._on_reset,
            "audio_chunk": self._on_audio_chunk,
        }.get(event)
        if handler is None:
            logger.debug("ignoring unknown event %r sid=%s", event, self.sid)
            return
        await handler(data)

    async def _on_profile(self, data: dict[str, Any]) -> None:
        profile = self.state.update_profile(self.sid, data)
        await asyncio.to_thread(repository.save_profile, self.sid, profile.to_dict())
        await self.send("profile_saved", {"profile": profile.to_dict()})

    async def _on_set_speaker(self, data: dict[str, Any]) -> None:
        speaker = _parse_speaker(data.get("speaker"))
        self.state.set_speaker(self.sid, speaker)
        await self.send("speaker_ack", {"speaker": speaker})

    async def _on_reset(self, _data: dict[str, Any]) -> None:
        self.state.reset(self.sid)
        await asyncio.to_thread(repository.reset_session, self.sid)
        metrics = self.state.get_or_create(self.sid).metrics().to_dict()
        await self.send("session_reset", {"metrics": metrics})
        logger.info("session reset sid=%s", self.sid)

    async def _on_audio_chunk(self, data: dict[str, Any]) -> None:
        session = self.state.get_or_create(self.sid)
        language = _parse_asr_language(data.get("language"))
        override = data.get("speaker")
        speaker = (
            _parse_speaker(override)
            if override in ALLOWED_SPEAKERS
            else session.active_speaker
        )

        prompt = self.state.transcript_tail(self.sid)
        text, err = await asyncio.to_thread(
            _transcribe_chunk,
            data.get("audio_base64") or "",
            data.get("format"),
            language,
            prompt or None,
        )
        if err is not None:
            step, detail = err
            logger.warning("audio %s failed sid=%s: %s", step, self.sid, detail)
            await self.send(
                "transcript_update",
                {"ok": False, "step": step, "error": detail, "transcript": None,
                 "speaker": speaker},
            )
            return

        assert text is not None
        message = self.state.append_transcript(self.sid, speaker, text)
        session = self.state.get_or_create(self.sid)
        logger.info(
            "chunk processed sid=%s speaker=%s lang=%s chars=%s",
            self.sid, speaker, language, len(text),
        )

        if message is not None:
            await asyncio.to_thread(
                repository.add_message, self.sid, speaker, message.text, message.timestamp
            )

        await self.send(
            "transcript_update",
            {
                "ok": True,
                "transcript": message.to_dict() if message else None,
                "metrics": session.metrics().to_dict(),
                "thinking": message is not None,
            },
        )

        if message is not None:
            self._spawn(self._run_llm())

    def _spawn(self, coro) -> None:
        task = asyncio.create_task(coro)
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def _run_llm(self) -> None:

        session = self.state.get_or_create(self.sid)
        recent = session.last_messages(_LLM_CONTEXT_MESSAGES)
        if not recent:
            return

        products_block = build_product_context(products(), session.client_profile)
        system_prompt = build_system_prompt(products_block)
        user_prompt = build_user_prompt(session.client_profile, recent)

        advice, err = await asyncio.to_thread(
            get_sales_advice, system_prompt, user_prompt
        )
        has_advice = not err and advice and any(advice.values())
        if has_advice:
            self.state.set_last_advice(self.sid, advice)
            await asyncio.to_thread(repository.add_advice, self.sid, advice)

        llm_config.record_call_result(err)
        await registry.broadcast("server_ready", server_status_payload())

        logger.info("advice ready sid=%s llm_err=%s", self.sid, bool(err))
        await self.send(
            "advice_update",
            {
                "ok": not bool(err),
                "error": err,
                "advice": advice if not err else None,
                "metrics": session.metrics().to_dict(),
            },
        )
