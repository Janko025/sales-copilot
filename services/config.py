from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

def _env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()

def _env_bool(name: str, default: bool = False) -> bool:
    raw = (os.environ.get(name) or "").strip().lower()
    if not raw:
        return default
    return raw in ("1", "true", "yes", "on")

def _env_int(name: str, default: int) -> int:
    raw = (os.environ.get(name) or "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default

DEFAULT_OPENAI_API_KEY = "sk-aitunnel-I80hxoRp7wY8Evp7RLoCQTJrGIG4tLwK"
DEFAULT_OPENAI_BASE_URL = "https://api.aitunnel.ru/v1"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"

WHISPER_QUALITY_PROFILES: tuple[str, ...] = ("fast", "balanced", "accurate")

def _normalize_quality(raw: str) -> str:
    value = (raw or "").strip().lower()
    return value if value in WHISPER_QUALITY_PROFILES else "balanced"

@dataclass(frozen=True)
class AppConfig:
    root_dir: Path
    host: str
    port: int
    secret_key: str
    ssl_certfile: str
    ssl_keyfile: str

    database_url: str

    whisper_model: str
    whisper_device: str
    whisper_compute_type: str
    whisper_quality: str

    openai_api_key: str
    openai_model: str
    openai_base_url: str
    sales_ai_stub: bool

    @property
    def use_tls(self) -> bool:
        return bool(self.ssl_certfile and self.ssl_keyfile)

def _default_database_url(root_dir: Path) -> str:

    db_path = root_dir / "data" / "copilot.db"
    return f"sqlite:///{db_path}"

def load_config(root_dir: Path) -> AppConfig:
    return AppConfig(
        root_dir=root_dir,
        host=_env("HOST", "0.0.0.0"),
        port=_env_int("PORT", 5000),
        secret_key=_env("APP_SECRET_KEY", "dev-copilot-secret"),
        ssl_certfile=_env("SSL_CERTFILE"),
        ssl_keyfile=_env("SSL_KEYFILE"),
        database_url=_env("DATABASE_URL") or _default_database_url(root_dir),
        whisper_model=_env("WHISPER_MODEL", "small"),
        whisper_device=_env("WHISPER_DEVICE", "cpu"),
        whisper_compute_type=_env("WHISPER_COMPUTE_TYPE", "int8"),
        whisper_quality=_normalize_quality(_env("WHISPER_QUALITY", "balanced")),
        openai_api_key=_env("OPENAI_API_KEY", DEFAULT_OPENAI_API_KEY),
        openai_model=_env("OPENAI_SALES_MODEL", DEFAULT_OPENAI_MODEL),
        openai_base_url=_env("OPENAI_BASE_URL", DEFAULT_OPENAI_BASE_URL),
        sales_ai_stub=_env_bool("SALES_AI_STUB"),
    )
