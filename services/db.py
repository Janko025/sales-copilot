from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session as OrmSession
from sqlalchemy.orm import sessionmaker

from services.config import load_config
from services.models import Base

logger = logging.getLogger(__name__)

_CFG = load_config(Path(__file__).resolve().parent.parent)

def _build_engine(url: str) -> Engine:
    if url.startswith("sqlite"):
        db_file = url.replace("sqlite:///", "", 1)
        if db_file and db_file != ":memory:":
            Path(db_file).parent.mkdir(parents=True, exist_ok=True)
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            future=True,
        )
    return create_engine(url, pool_pre_ping=True, future=True)

engine: Engine = _build_engine(_CFG.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

def init_db(retries: int = 10, delay: float = 1.5) -> None:

    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            Base.metadata.create_all(engine)
            logger.info("Database schema ready (%s)", engine.url.render_as_string())
            return
        except OperationalError as exc:
            last_error = exc
            logger.warning(
                "Database not ready (attempt %s/%s): %s", attempt, retries, exc
            )
            time.sleep(delay)
    raise RuntimeError(f"Database is unreachable after {retries} attempts: {last_error}")

def ping() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

@contextmanager
def session_scope() -> Iterator[OrmSession]:

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
