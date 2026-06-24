from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from services.state_manager import ClientProfile, ChatMessage

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_PATH = ROOT / "data" / "products.json"

REQUIRED_JSON_KEYS = [
    "client_objection",
    "objection_type",
    "client_sentiment",
    "sales_stage",
    "recommended_response",
    "next_question",
    "product_recommendation",
    "risk_flag",
]

def load_products() -> list[dict[str, Any]]:
    try:
        raw = PRODUCTS_PATH.read_text(encoding="utf-8")
        data = json.loads(raw)
        if isinstance(data, list):
            return data
    except Exception as exc:
        logger.error("Failed to load products: %s", exc)
    return []

def _category_match(product: dict[str, Any], interest: str) -> bool:
    if not interest:
        return True
    cat = str(product.get("category", "")).lower()
    interest_l = interest.lower().strip()
    return interest_l in cat or cat in interest_l

def build_product_context(
    products: list[dict[str, Any]],
    profile: ClientProfile,
    max_chars: int = 12000,
) -> str:
    interest = profile.product_interest_category
    ranked: list[dict[str, Any]] = []
    for p in products:
        if _category_match(p, interest):
            ranked.append(p)
    for p in products:
        if p not in ranked:
            ranked.append(p)

    chunks: list[str] = []
    total = 0
    for p in ranked:
        block = json.dumps(p, ensure_ascii=False, indent=2)
        if total + len(block) > max_chars:
            break
        chunks.append(block)
        total += len(block)
    if not chunks:
        return "Product catalog is empty."
    return "\n\n---\n\n".join(chunks)

def build_system_prompt(products_block: str) -> str:
    keys_line = ", ".join(f'"{k}"' for k in REQUIRED_JSON_KEYS)
    return f"""Ты встроенный AI-копилот для менеджера по продажам электроники.
Тебе дают фрагмент диалога (клиент / менеджер), профиль клиента и каталог товаров.

ФОРМАТ ОТВЕТА:
- Только один JSON-объект, без markdown и без текста вокруг.
- Все ключи обязательны: {keys_line}.
- Значения короткие, конкретные, на русском (1–2 фразы).

ОПИСАНИЕ КЛЮЧЕЙ:
- client_objection: главное возражение / сомнение клиента в последних репликах
  ("" если возражений нет).
- objection_type: тип возражения одним словом: price | trust | need | timing |
  competitor | quality | other | none.
- client_sentiment: positive | neutral | cautious | negative.
- sales_stage: discovery | qualification | needs | demo | objection_handling |
  negotiation | closing | post_sale.
- recommended_response: что менеджеру сказать прямо сейчас (1–3 предложения,
  можно как готовую фразу).
- next_question: один открытый уточняющий вопрос клиенту ("" если не нужно).
- product_recommendation: конкретное имя товара ИЗ каталога ниже или "" пока рано.
- risk_flag: короткое предупреждение менеджеру о риске или "none". Используй,
  если клиент собирается уйти/отказаться, агрессивен, упоминает конкурента,
  требует юридических гарантий, либо менеджер пообещал лишнее. Формат:
  "<тип риска>: <одна фраза>". Примеры: "churn: клиент сравнивает с Samsung",
  "compliance: требует возврат денег", "over-promise: менеджер обещает 24h доставку".

ТРЕБОВАНИЯ К КАЧЕСТВУ:
- Если данных мало — поля можно оставить пустыми ("" / "none"), не фантазируй.
- Сохраняй преемственность: если этап продажи и тональность не изменились,
  оставь прежние значения; меняй только то, что реально изменилось.

Каталог товаров (контекст для RAG):
{products_block}
"""

def build_user_prompt(
    profile: ClientProfile,
    recent: list[ChatMessage],
) -> str:
    lines = [
        "Профиль клиента:",
        json.dumps(profile.to_dict(), ensure_ascii=False, indent=2),
        "",
        "Последние реплики (до 10):",
    ]
    for m in recent:
        who = "Клиент" if m.role == "client" else "Менеджер"
        lines.append(f"- {who}: {m.text}")
    lines.append("")
    lines.append("Проанализируй последнюю динамику и дай рекомендацию в строгом JSON.")
    return "\n".join(lines)
