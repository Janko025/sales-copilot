from __future__ import annotations

import logging
import os
import shutil
import subprocess
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from services.config import WHISPER_QUALITY_PROFILES, load_config

logger = logging.getLogger(__name__)

_CFG = load_config(Path(__file__).resolve().parent.parent)

_FASTER_WHISPER_ERROR: str | None = None

try:
    from faster_whisper import WhisperModel
except Exception as exc:
    WhisperModel = None
    _FASTER_WHISPER_ERROR = str(exc)

@dataclass(frozen=True)
class QualityProfile:

    beam_size: int
    best_of: int
    temperatures: tuple[float, ...]
    vad_min_silence_ms: int
    vad_speech_pad_ms: int
    condition_on_previous_text: bool
    no_speech_threshold: float
    log_prob_threshold: float
    compression_ratio_threshold: float

_PROFILES: dict[str, QualityProfile] = {
    "fast": QualityProfile(
        beam_size=1,
        best_of=1,
        temperatures=(0.0,),
        vad_min_silence_ms=400,
        vad_speech_pad_ms=120,
        condition_on_previous_text=False,
        no_speech_threshold=0.6,
        log_prob_threshold=-1.0,
        compression_ratio_threshold=2.4,
    ),
    "balanced": QualityProfile(
        beam_size=3,
        best_of=3,
        temperatures=(0.0, 0.2),
        vad_min_silence_ms=500,
        vad_speech_pad_ms=200,
        condition_on_previous_text=True,
        no_speech_threshold=0.55,
        log_prob_threshold=-1.0,
        compression_ratio_threshold=2.4,
    ),
    "accurate": QualityProfile(
        beam_size=5,
        best_of=5,
        temperatures=(0.0, 0.2, 0.4, 0.6),
        vad_min_silence_ms=600,
        vad_speech_pad_ms=250,
        condition_on_previous_text=True,
        no_speech_threshold=0.5,
        log_prob_threshold=-1.0,
        compression_ratio_threshold=2.4,
    ),
}

_state_lock = threading.Lock()
_active_quality: str = _CFG.whisper_quality

def faster_whisper_available() -> bool:
    return WhisperModel is not None

def faster_whisper_import_error() -> str | None:
    return _FASTER_WHISPER_ERROR

def ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None

def whisper_model_name() -> str:
    return _CFG.whisper_model

def available_quality_profiles() -> tuple[str, ...]:
    return WHISPER_QUALITY_PROFILES

def get_quality() -> str:
    with _state_lock:
        return _active_quality

def set_quality(name: str) -> str:
    normalized = (name or "").strip().lower()
    if normalized not in _PROFILES:
        raise ValueError(f"Unknown quality profile: {name!r}")
    with _state_lock:
        global _active_quality
        _active_quality = normalized
    logger.info("Whisper quality profile set to %s", normalized)
    return normalized

def current_profile() -> QualityProfile:
    return _PROFILES[get_quality()]

_model_lock = threading.Lock()
_model_cache: Any = None

def _load_model() -> Any:

    global _model_cache
    if _model_cache is not None:
        return _model_cache
    if WhisperModel is None:
        raise RuntimeError(
            "faster-whisper is not installed. Run: pip install faster-whisper"
        )
    def _instantiate(local_files_only: bool) -> Any:
        return WhisperModel(
            _CFG.whisper_model,
            device=_CFG.whisper_device,
            compute_type=_CFG.whisper_compute_type,
            local_files_only=local_files_only,
        )

    with _model_lock:
        if _model_cache is not None:
            return _model_cache
        logger.info(
            "Loading faster-whisper model=%s device=%s compute_type=%s (first run may download)",
            _CFG.whisper_model,
            _CFG.whisper_device,
            _CFG.whisper_compute_type,
        )
        try:
            _model_cache = _instantiate(local_files_only=False)
        except Exception as exc:

            logger.warning(
                "Online model fetch failed (%s); retrying from local cache", exc
            )
            _model_cache = _instantiate(local_files_only=True)
    return _model_cache

def _resolve_language(language: str | None) -> str | None:

    value = (language or "").strip().lower()
    if not value or value == "auto":
        return None
    return value

def transcribe_file(
    path: str,
    language: str = "ru",
    initial_prompt: str | None = None,
) -> tuple[str, str | None]:

    if not os.path.isfile(path):
        return "", "Audio file not found"

    if not faster_whisper_available():
        return "", (
            "faster-whisper is unavailable. Install: pip install faster-whisper. "
            f"Details: {faster_whisper_import_error() or 'unknown'}"
        )

    if not ffmpeg_available():
        return "", (
            "ffmpeg not found in PATH. Install ffmpeg "
            "(macOS: brew install ffmpeg; Ubuntu: sudo apt install ffmpeg; "
            "Windows: winget install ffmpeg)."
        )

    try:
        model = _load_model()
    except Exception as exc:
        logger.exception("Whisper model load failed")
        return "", f"Failed to load model: {exc}"

    profile = current_profile()
    lang_arg = _resolve_language(language)
    prompt = (initial_prompt or "").strip() or None

    try:
        segments, info = model.transcribe(
            path,
            language=lang_arg,
            beam_size=profile.beam_size,
            best_of=profile.best_of,
            temperature=list(profile.temperatures),
            condition_on_previous_text=profile.condition_on_previous_text,
            initial_prompt=prompt,
            no_speech_threshold=profile.no_speech_threshold,
            log_prob_threshold=profile.log_prob_threshold,
            compression_ratio_threshold=profile.compression_ratio_threshold,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": profile.vad_min_silence_ms,
                "speech_pad_ms": profile.vad_speech_pad_ms,
            },
        )
        parts = [seg.text.strip() for seg in segments if seg.text and seg.text.strip()]
        text = " ".join(parts).strip()
        detected = getattr(info, "language", lang_arg or "?")
        prob = getattr(info, "language_probability", 0.0) or 0.0
        logger.info(
            "transcription done quality=%s lang=%s prob=%.3f chars=%s",
            get_quality(),
            detected,
            prob,
            len(text),
        )
        if not text:
            return "", "No speech detected (check microphone and language)"
        return text, None
    except subprocess.CalledProcessError as exc:
        logger.exception("ffmpeg/subprocess error during transcribe")
        return "", f"ffmpeg decoding error: {exc}"
    except Exception as exc:
        logger.exception("transcribe failed")
        return "", f"Transcription error: {exc}"

def runtime_state() -> dict[str, Any]:

    profile = current_profile()
    return {
        "model": _CFG.whisper_model,
        "device": _CFG.whisper_device,
        "compute_type": _CFG.whisper_compute_type,
        "quality": get_quality(),
        "quality_options": list(WHISPER_QUALITY_PROFILES),
        "beam_size": profile.beam_size,
    }
