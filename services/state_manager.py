from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any, Literal

Speaker = Literal["client", "manager"]

@dataclass
class ClientProfile:
    budget_range: str = ""
    product_interest_category: str = ""
    priority: str = ""
    experience_level: str = ""
    purchase_urgency: str = ""

    def to_dict(self) -> dict[str, str]:
        return {
            "budget_range": self.budget_range,
            "product_interest_category": self.product_interest_category,
            "priority": self.priority,
            "experience_level": self.experience_level,
            "purchase_urgency": self.purchase_urgency,
        }

    @classmethod
    def from_payload(cls, data: dict[str, Any] | None) -> ClientProfile:
        if not data:
            return cls()
        return cls(
            budget_range=str(data.get("budget_range") or ""),
            product_interest_category=str(data.get("product_interest_category") or ""),
            priority=str(data.get("priority") or ""),
            experience_level=str(data.get("experience_level") or ""),
            purchase_urgency=str(data.get("purchase_urgency") or ""),
        )

@dataclass
class ChatMessage:
    role: Speaker
    text: str
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> dict[str, Any]:
        return {"role": self.role, "text": self.text, "timestamp": self.timestamp}

@dataclass
class SessionMetrics:
    started_at: float
    messages_total: int
    messages_client: int
    messages_manager: int

    @property
    def duration_sec(self) -> float:
        return max(0.0, time.time() - self.started_at)

    def to_dict(self) -> dict[str, Any]:
        return {
            "started_at": self.started_at,
            "duration_sec": self.duration_sec,
            "messages_total": self.messages_total,
            "messages_client": self.messages_client,
            "messages_manager": self.messages_manager,
        }

_TRANSCRIPT_PROMPT_MAX_CHARS = 240

@dataclass
class SessionState:
    sid: str
    started_at: float = field(default_factory=time.time)
    client_profile: ClientProfile = field(default_factory=ClientProfile)
    active_speaker: Speaker = "client"
    messages: list[ChatMessage] = field(default_factory=list)
    last_advice: dict[str, str] | None = None
    transcript_tail: str = ""

    def append_transcript(self, role: Speaker, text: str) -> ChatMessage | None:
        cleaned = (text or "").strip()
        if not cleaned:
            return None
        message = ChatMessage(role=role, text=cleaned)
        self.messages.append(message)
        joined = f"{self.transcript_tail} {cleaned}".strip()
        if len(joined) > _TRANSCRIPT_PROMPT_MAX_CHARS:
            joined = joined[-_TRANSCRIPT_PROMPT_MAX_CHARS:]
        self.transcript_tail = joined
        return message

    def last_messages(self, n: int = 10) -> list[ChatMessage]:
        if n <= 0:
            return []
        return self.messages[-n:]

    def metrics(self) -> SessionMetrics:
        client = sum(1 for m in self.messages if m.role == "client")
        manager = sum(1 for m in self.messages if m.role == "manager")
        return SessionMetrics(
            started_at=self.started_at,
            messages_total=len(self.messages),
            messages_client=client,
            messages_manager=manager,
        )

    def reset(self) -> None:
        self.started_at = time.time()
        self.messages.clear()
        self.last_advice = None
        self.transcript_tail = ""

class StateManager:

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._sessions: dict[str, SessionState] = {}

    def get_or_create(self, sid: str) -> SessionState:
        with self._lock:
            if sid not in self._sessions:
                self._sessions[sid] = SessionState(sid=sid)
            return self._sessions[sid]

    def exists(self, sid: str) -> bool:
        with self._lock:
            return sid in self._sessions

    def update_profile(self, sid: str, payload: dict[str, Any] | None) -> ClientProfile:
        state = self.get_or_create(sid)
        with self._lock:
            state.client_profile = ClientProfile.from_payload(payload)
        return state.client_profile

    def set_speaker(self, sid: str, speaker: Speaker) -> Speaker:
        state = self.get_or_create(sid)
        with self._lock:
            state.active_speaker = speaker
        return state.active_speaker

    def append_transcript(self, sid: str, role: Speaker, text: str) -> ChatMessage | None:
        state = self.get_or_create(sid)
        with self._lock:
            return state.append_transcript(role, text)

    def transcript_tail(self, sid: str) -> str:
        state = self.get_or_create(sid)
        with self._lock:
            return state.transcript_tail

    def set_last_advice(self, sid: str, advice: dict[str, str]) -> None:
        state = self.get_or_create(sid)
        with self._lock:
            state.last_advice = dict(advice)

    def reset(self, sid: str) -> None:
        state = self.get_or_create(sid)
        with self._lock:
            state.reset()

    def drop(self, sid: str) -> None:
        with self._lock:
            self._sessions.pop(sid, None)
