from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, replace
from typing import Any

from openai import OpenAI

from services.config import load_config
from pathlib import Path

logger = logging.getLogger(__name__)

OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1"

_PLACEHOLDER_KEYS: frozenset[str] = frozenset(
    {
        "changeme",
        "change_me",
        "your-api-key",
        "your_api_key",
        "your-openai-api-key",
        "your_openai_api_key",
        "sk-placeholder",
        "sk-xxxx",
        "sk-xxxxx",
        "replace_me",
        "xxx",
        "none",
        "null",
    }
)

def _looks_like_placeholder(value: str) -> bool:
    return value.strip().lower() in _PLACEHOLDER_KEYS

def _sanitize_key(raw: str | None) -> str:
    if not raw:
        return ""
    key = raw.strip()
    if not key or _looks_like_placeholder(key):
        return ""
    return key

@dataclass(frozen=True)
class LLMSettings:

    api_key: str
    base_url: str
    model: str
    stub_mode: bool

    def has_key(self) -> bool:
        return bool(self.api_key)

def _initial_from_env() -> LLMSettings:
    cfg = load_config(Path(__file__).resolve().parent.parent)
    return LLMSettings(
        api_key=_sanitize_key(cfg.openai_api_key),
        base_url=cfg.openai_base_url or "",
        model=cfg.openai_model or "gpt-4o-mini",
        stub_mode=cfg.sales_ai_stub,
    )

_lock = threading.Lock()
_settings: LLMSettings = _initial_from_env()
_last_error: str | None = None

def current() -> LLMSettings:
    with _lock:
        return _settings

def last_error() -> str | None:
    with _lock:
        return _last_error

def _set_last_error(value: str | None) -> None:
    global _last_error
    with _lock:
        _last_error = value

def record_call_result(error: str | None) -> None:

    _set_last_error(error)

def public_status() -> dict[str, Any]:

    s = current()
    masked = ""
    if s.api_key:
        tail = s.api_key[-4:]
        masked = f"…{tail}"
    return {
        "has_key": s.has_key(),
        "key_masked": masked,
        "base_url": s.base_url,
        "effective_base_url": s.base_url or OPENAI_DEFAULT_BASE_URL,
        "model": s.model,
        "stub_mode": s.stub_mode,
        "last_error": last_error(),
    }

def update(payload: dict[str, Any] | None) -> LLMSettings:

    payload = payload or {}
    with _lock:
        global _settings
        new_key = _settings.api_key
        if "api_key" in payload:
            raw = payload.get("api_key")
            if raw is None:
                new_key = ""
            else:
                cleaned = _sanitize_key(str(raw))
                if cleaned:
                    new_key = cleaned
                elif str(raw).strip() == "":
                    new_key = _settings.api_key

        new_base = _settings.base_url
        if "base_url" in payload:
            new_base = str(payload.get("base_url") or "").strip()

        new_model = _settings.model
        if "model" in payload:
            candidate = str(payload.get("model") or "").strip()
            new_model = candidate or _settings.model

        new_stub = _settings.stub_mode
        if "stub_mode" in payload:
            new_stub = bool(payload.get("stub_mode"))

        _settings = replace(
            _settings,
            api_key=new_key,
            base_url=new_base,
            model=new_model,
            stub_mode=new_stub,
        )
        global _last_error
        _last_error = None
        return _settings

def reset_to_env() -> LLMSettings:

    with _lock:
        global _settings, _last_error
        _settings = _initial_from_env()
        _last_error = None
        return _settings

def build_client() -> OpenAI:

    s = current()
    if not s.api_key:
        raise RuntimeError("OpenAI API key is not configured")
    kwargs: dict[str, Any] = {"api_key": s.api_key}
    if s.base_url:
        kwargs["base_url"] = s.base_url
    return OpenAI(**kwargs)

def test_connection(timeout: float = 10.0) -> tuple[bool, str | None]:

    s = current()
    if s.stub_mode:
        _set_last_error(None)
        return True, "stub-mode: OpenAI calls are skipped"
    if not s.api_key:
        msg = "API key is missing"
        _set_last_error(msg)
        return False, msg

    kwargs: dict[str, Any] = {
        "api_key": s.api_key,
        "timeout": timeout,
        "max_retries": 0,
    }
    if s.base_url:
        kwargs["base_url"] = s.base_url

    try:
        client = OpenAI(**kwargs)
        resp = client.chat.completions.create(
            model=s.model,
            temperature=0.0,
            max_tokens=4,
            messages=[
                {"role": "system", "content": "Reply with the single word: ok"},
                {"role": "user", "content": "ping"},
            ],
        )
        content = (resp.choices[0].message.content or "").strip()
        logger.info("LLM test ok (model=%s, reply=%r)", s.model, content[:32])
        _set_last_error(None)
        return True, None
    except Exception as exc:
        message = str(exc) or exc.__class__.__name__
        logger.warning("LLM test failed: %s", message)
        _set_last_error(message)
        return False, message
