from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

_APP_DIR = Path(__file__).resolve().parent

from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from services import db, llm_config, transcription
from services.config import load_config
from services.exporter import session_to_json, session_to_markdown
from services.realtime import Connection, registry
from services.repository import get_session_detail, list_sessions, load_session_state
from services.sales_ai import openai_base_url, openai_key_configured, stub_mode_enabled
from services.state_manager import StateManager
from services.status import server_status_payload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_copilot")

CFG = load_config(_APP_DIR)
state_mgr = StateManager()

async def _broadcast_status() -> None:
    await registry.broadcast("server_ready", server_status_payload())

def _log_startup_state() -> None:
    asr = transcription.runtime_state()
    logger.info(
        "ASR profile=%s beam_size=%s model=%s",
        asr["quality"], asr["beam_size"], asr["model"],
    )
    if stub_mode_enabled():
        logger.info("SALES_AI_STUB=1 — using mock JSON advice (no OpenAI calls).")
    elif not openai_key_configured():
        logger.warning("OPENAI_API_KEY missing — set it via the UI settings.")
    else:
        logger.info("OpenAI key loaded; base URL %s", openai_base_url() or "api.openai.com")

@asynccontextmanager
async def lifespan(_app: FastAPI):
    await asyncio.to_thread(db.init_db)
    _log_startup_state()
    yield

app = FastAPI(title="AI Sales Copilot", version="2.0.0", lifespan=lifespan)

@app.get("/")
async def index() -> FileResponse:
    return FileResponse(_APP_DIR / "templates" / "index.html")

@app.get("/healthz")
async def healthz() -> JSONResponse:
    db_ok = await asyncio.to_thread(db.ping)
    status = "ok" if db_ok else "degraded"
    return JSONResponse({"status": status, "database": db_ok})

@app.get("/api/llm/config")
async def llm_config_get() -> JSONResponse:
    return JSONResponse(llm_config.public_status())

@app.post("/api/llm/config")
async def llm_config_post(request: Request) -> JSONResponse:
    payload = await _json_body(request)
    llm_config.update(payload)
    await _broadcast_status()
    return JSONResponse(llm_config.public_status())

@app.post("/api/llm/test")
async def llm_test(request: Request) -> JSONResponse:
    payload = await _json_body(request)
    if payload:
        llm_config.update(payload)
    ok, error = await asyncio.to_thread(llm_config.test_connection)
    await _broadcast_status()
    return JSONResponse({"ok": ok, "error": error, "status": llm_config.public_status()})

@app.post("/api/asr/quality")
async def asr_quality(request: Request) -> JSONResponse:
    payload = await _json_body(request)
    name = str(payload.get("quality") or "").strip().lower()
    try:
        transcription.set_quality(name)
    except ValueError as exc:
        return JSONResponse({"ok": False, "error": str(exc)}, status_code=400)
    await _broadcast_status()
    return JSONResponse({"ok": True, "asr": transcription.runtime_state()})

@app.get("/api/sessions")
async def sessions_list() -> JSONResponse:
    rows = await asyncio.to_thread(list_sessions, 50)
    return JSONResponse({"sessions": rows})

@app.get("/api/sessions/{sid}")
async def session_detail(sid: str) -> JSONResponse:
    detail = await asyncio.to_thread(get_session_detail, sid)
    if detail is None:
        return JSONResponse({"error": "Unknown session"}, status_code=404)
    return JSONResponse(detail)

@app.get("/api/export/{fmt}")
async def export_session(fmt: str, sid: str = "") -> Response:
    session = await asyncio.to_thread(load_session_state, sid) if sid else None
    if session is None:
        return Response("Unknown session", status_code=404)
    if fmt == "json":
        return Response(
            session_to_json(session),
            media_type="application/json; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="session-{sid}.json"'},
        )
    if fmt == "md":
        return Response(
            session_to_markdown(session),
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="session-{sid}.md"'},
        )
    return Response("Unsupported format", status_code=400)

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket) -> None:
    await Connection(websocket, state_mgr).run()

app.mount("/static", StaticFiles(directory=_APP_DIR / "static"), name="static")

async def _json_body(request: Request) -> dict:
    try:
        data = await request.json()
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}

def main() -> None:
    import uvicorn

    ssl_kwargs: dict = {}
    if CFG.use_tls:
        if not (Path(CFG.ssl_certfile).is_file() and Path(CFG.ssl_keyfile).is_file()):
            logger.error("SSL_CERTFILE / SSL_KEYFILE set but file not found.")
            raise SystemExit(1)
        ssl_kwargs = {"ssl_certfile": CFG.ssl_certfile, "ssl_keyfile": CFG.ssl_keyfile}

    scheme = "https" if ssl_kwargs else "http"
    logger.info("Starting server %s://%s:%s", scheme, CFG.host, CFG.port)
    uvicorn.run(app, host=CFG.host, port=CFG.port, log_level="info", **ssl_kwargs)

if __name__ == "__main__":
    main()
