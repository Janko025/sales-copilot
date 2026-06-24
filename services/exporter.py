from __future__ import annotations

import json
from datetime import datetime, timezone

from services.state_manager import SessionState

def _fmt_ts(epoch: float) -> str:
    return datetime.fromtimestamp(epoch, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

def session_to_dict(session: SessionState) -> dict:
    return {
        "session_id": session.sid,
        "started_at": _fmt_ts(session.started_at),
        "profile": session.client_profile.to_dict(),
        "metrics": session.metrics().to_dict(),
        "transcript": [m.to_dict() for m in session.messages],
        "last_advice": session.last_advice or {},
    }

def session_to_json(session: SessionState) -> str:
    return json.dumps(session_to_dict(session), ensure_ascii=False, indent=2)

def session_to_markdown(session: SessionState) -> str:
    metrics = session.metrics()
    duration_sec = int(metrics.duration_sec)
    duration_str = f"{duration_sec // 60:02d}:{duration_sec % 60:02d}"

    lines: list[str] = [
        "# AI Sales Copilot — Session export",
        "",
        f"- **Session ID:** `{session.sid}`",
        f"- **Started:** {_fmt_ts(session.started_at)}",
        f"- **Duration:** {duration_str}",
        f"- **Messages:** {metrics.messages_total} "
        f"(client: {metrics.messages_client}, manager: {metrics.messages_manager})",
        "",
        "## Client profile",
        "",
    ]

    profile = session.client_profile.to_dict()
    if any(profile.values()):
        for key, value in profile.items():
            lines.append(f"- **{key}:** {value or '—'}")
    else:
        lines.append("_empty_")
    lines.append("")

    lines.append("## Transcript")
    lines.append("")
    if not session.messages:
        lines.append("_no messages yet_")
    else:
        for msg in session.messages:
            who = "Client" if msg.role == "client" else "Manager"
            stamp = datetime.fromtimestamp(msg.timestamp, tz=timezone.utc).strftime("%H:%M:%S")
            lines.append(f"- `{stamp}` **{who}:** {msg.text}")
    lines.append("")

    lines.append("## Last AI advice")
    lines.append("")
    advice = session.last_advice or {}
    if not advice:
        lines.append("_not generated yet_")
    else:
        for key, value in advice.items():
            lines.append(f"- **{key}:** {value or '—'}")

    lines.append("")
    return "\n".join(lines)
