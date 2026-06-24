from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select

from services.db import session_scope
from services.models import Advice, Message, Session
from services.state_manager import ChatMessage, ClientProfile, SessionState

def _ensure_session(db, sid: str) -> Session:
    row = db.get(Session, sid)
    if row is None:
        row = Session(id=sid, profile={})
        db.add(row)
        db.flush()
    return row

def create_session(sid: str) -> None:
    with session_scope() as db:
        _ensure_session(db, sid)

def save_profile(sid: str, profile: dict[str, str]) -> None:
    with session_scope() as db:
        row = _ensure_session(db, sid)
        row.profile = dict(profile or {})

def add_message(sid: str, role: str, text: str, created_at: float | None = None) -> None:
    ts = (
        datetime.fromtimestamp(created_at, tz=timezone.utc)
        if created_at is not None
        else datetime.now(tz=timezone.utc)
    )
    with session_scope() as db:
        _ensure_session(db, sid)
        db.add(Message(session_id=sid, role=role, text=text, created_at=ts))

def add_advice(sid: str, payload: dict[str, str]) -> None:
    with session_scope() as db:
        _ensure_session(db, sid)
        db.add(Advice(session_id=sid, payload=dict(payload)))

def reset_session(sid: str) -> None:

    with session_scope() as db:
        row = db.get(Session, sid)
        if row is None:
            return
        row.messages.clear()
        row.advice_entries.clear()
        row.started_at = datetime.now(tz=timezone.utc)

def list_sessions(limit: int = 50) -> list[dict[str, Any]]:
    with session_scope() as db:
        msg_counts = dict(
            db.execute(
                select(Message.session_id, func.count(Message.id)).group_by(
                    Message.session_id
                )
            ).all()
        )
        advice_counts = dict(
            db.execute(
                select(Advice.session_id, func.count(Advice.id)).group_by(
                    Advice.session_id
                )
            ).all()
        )
        rows = db.execute(
            select(Session).order_by(Session.started_at.desc()).limit(limit)
        ).scalars().all()
        return [
            {
                "session_id": row.id,
                "started_at": row.started_at.isoformat(),
                "profile": row.profile or {},
                "messages_total": msg_counts.get(row.id, 0),
                "advice_total": advice_counts.get(row.id, 0),
            }
            for row in rows
        ]

def get_session_detail(sid: str) -> dict[str, Any] | None:
    with session_scope() as db:
        row = db.get(Session, sid)
        if row is None:
            return None
        return {
            "session_id": row.id,
            "started_at": row.started_at.isoformat(),
            "profile": row.profile or {},
            "transcript": [
                {
                    "role": m.role,
                    "text": m.text,
                    "timestamp": m.created_at.timestamp(),
                }
                for m in row.messages
            ],
            "advice_history": [
                {"payload": a.payload, "created_at": a.created_at.isoformat()}
                for a in row.advice_entries
            ],
        }

def load_session_state(sid: str) -> SessionState | None:

    with session_scope() as db:
        row = db.get(Session, sid)
        if row is None:
            return None
        state = SessionState(sid=row.id, started_at=row.started_at.timestamp())
        state.client_profile = ClientProfile.from_payload(row.profile or {})
        state.messages = [
            ChatMessage(role=m.role, text=m.text, timestamp=m.created_at.timestamp())
            for m in row.messages
        ]
        if row.advice_entries:
            state.last_advice = dict(row.advice_entries[-1].payload)
        return state
