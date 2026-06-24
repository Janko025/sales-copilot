from __future__ import annotations

import json
import logging
import re
from typing import Any

from openai import OpenAI

from services import llm_config
from services.prompt_builder import REQUIRED_JSON_KEYS

logger = logging.getLogger(__name__)

OPENAI_TIMEOUT_SEC = 15.0
OPENAI_MAX_RETRIES = 1

_STUB_ADVICE: dict[str, str] = {
    "client_objection": "(stub) Цена кажется высокой по сравнению с альтернативами.",
    "objection_type": "(stub) price",
    "client_sentiment": "(stub) neutral",
    "sales_stage": "(stub) discovery → consideration",
    "recommended_response": "(stub) Подтвердите бюджет, переключите фокус на ценность "
    "(гарантия + trade-in) и задайте уточняющий вопрос про сценарий использования.",
    "next_question": "(stub) Для чего планируете использовать: фото, игры или автономность?",
    "product_recommendation": "(stub) Подберём после 1–2 уточняющих вопросов.",
    "risk_flag": "(stub) none — это демо-ответ (SALES_AI_STUB=1).",
}

def stub_mode_enabled() -> bool:
    return llm_config.current().stub_mode

def openai_key_configured() -> bool:
    return llm_config.current().has_key()

def openai_base_url() -> str:
    return llm_config.current().base_url

def _extract_json_object(raw: str) -> dict[str, Any] | None:

    text = (raw or "").strip()
    if not text:
        return None
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if fence:
        text = fence.group(1).strip()
    try:
        obj = json.loads(text)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            obj = json.loads(text[start : end + 1])
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            return None
    return None

def _validate(data: dict[str, Any] | None) -> tuple[dict[str, str], list[str]]:
    errors: list[str] = []
    if not data:
        return {k: "" for k in REQUIRED_JSON_KEYS}, ["Empty model response"]

    out: dict[str, str] = {}
    for key in REQUIRED_JSON_KEYS:
        if key not in data:
            errors.append(f"Missing key: {key}")
            out[key] = ""
            continue
        val = data[key]
        out[key] = "" if val is None else str(val).strip()
    return out, errors

def get_sales_advice(system_prompt: str, user_prompt: str) -> tuple[dict[str, str], str | None]:
    settings = llm_config.current()
    empty = {k: "" for k in REQUIRED_JSON_KEYS}

    if settings.stub_mode:
        logger.info("SALES_AI_STUB active — skipping OpenAI (mock advice)")
        return dict(_STUB_ADVICE), None

    if not settings.has_key():
        return empty, (
            "OPENAI_API_KEY не задан. Откройте «Настройки LLM» и введите ключ, "
            "либо включите режим заглушки."
        )

    client_kwargs: dict[str, Any] = {
        "api_key": settings.api_key,
        "timeout": OPENAI_TIMEOUT_SEC,
        "max_retries": OPENAI_MAX_RETRIES,
    }
    if settings.base_url:
        client_kwargs["base_url"] = settings.base_url

    client = OpenAI(**client_kwargs)

    try:
        resp = client.chat.completions.create(
            model=settings.model,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = (resp.choices[0].message.content or "").strip()
        logger.debug("openai raw length=%s", len(content))
    except Exception as exc:
        logger.exception("OpenAI request failed")
        return empty, f"OpenAI API error: {exc}"

    parsed = _extract_json_object(content)
    validated, errs = _validate(parsed)
    if errs:
        logger.warning("JSON validation issues: %s", errs)
    return validated, None
