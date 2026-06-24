from __future__ import annotations

import base64
import logging
import os
import tempfile
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

MAX_CHUNK_BYTES = 8 * 1024 * 1024
MIN_CHUNK_BYTES = 256

def _suffix_for_format(fmt: str | None) -> str:
    if not fmt:
        return ".webm"
    f = fmt.lower().strip().lstrip(".")
    if f in ("webm", "ogg", "wav", "mp3", "mp4", "m4a", "flac"):
        return f".{f}"
    return ".webm"

def save_chunk_from_base64(
    audio_b64: str,
    fmt: str | None = None,
) -> tuple[str | None, str | None]:

    if not audio_b64 or not isinstance(audio_b64, str):
        return None, "Empty or invalid audio payload"

    try:
        raw = base64.b64decode(audio_b64, validate=False)
    except Exception as exc:
        logger.warning("base64 decode failed: %s", exc)
        return None, "Failed to decode base64 audio"

    if len(raw) > MAX_CHUNK_BYTES:
        return None, "Audio chunk too large; shorten the recording"

    if len(raw) < MIN_CHUNK_BYTES:
        return None, "Too little audio data to transcribe"

    suffix = _suffix_for_format(fmt)
    tmp_dir = tempfile.gettempdir()
    name = f"ai_copilot_{uuid.uuid4().hex}{suffix}"
    path = str(Path(tmp_dir) / name)

    try:
        with open(path, "wb") as fh:
            fh.write(raw)
    except OSError as exc:
        logger.error("temp write failed: %s", exc)
        return None, f"Failed to write temp file: {exc}"

    logger.debug("saved audio chunk %s (%s bytes)", path, len(raw))
    return path, None

def safe_unlink(path: str | None) -> None:
    if not path:
        return
    try:
        os.unlink(path)
    except OSError:
        pass
