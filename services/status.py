from __future__ import annotations

from typing import Any

from services import llm_config, transcription
from services.prompt_builder import load_products
from services.sales_ai import openai_base_url, openai_key_configured, stub_mode_enabled

_products_cache: list | None = None

def products() -> list:

    global _products_cache
    if _products_cache is None:
        _products_cache = load_products()
    return _products_cache

def server_status_payload() -> dict[str, Any]:

    return {
        "whisper_ok": transcription.faster_whisper_available(),
        "whisper_error": transcription.faster_whisper_import_error(),
        "ffmpeg_ok": transcription.ffmpeg_available(),
        "asr": transcription.runtime_state(),
        "llm": llm_config.public_status(),
        "openai_key_set": openai_key_configured(),
        "openai_stub": stub_mode_enabled(),
        "openai_base_url": openai_base_url(),
        "model": transcription.whisper_model_name(),
    }
