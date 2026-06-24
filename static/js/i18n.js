const STORAGE_KEY = "ai_copilot_ui_lang";

export const DICTIONARIES = {
  en: {
    "app.title": "AI Sales Copilot",
    "app.subtitle": "Local faster-whisper · GPT-4o-mini · WebSockets",
    "app.tagline": "Real-time guidance for sales conversations",

    "nav.theme": "Theme",
    "nav.lang": "Language",
    "nav.shortcuts": "Shortcuts",
    "nav.settings": "Settings",
    "nav.export": "Export",
    "nav.reset": "Reset session",

    "theme.light": "Light",
    "theme.dark": "Dark",

    "status.connecting": "Connecting…",
    "status.connected": "Connected",
    "status.disconnected": "Offline",
    "status.asrReady": "ASR ready",
    "status.asrUnavailable": "ASR unavailable",
    "status.asrNoFfmpeg": "ffmpeg missing",
    "status.llmStub": "LLM stub",
    "status.llmReady": "LLM ready",
    "status.llmMissing": "LLM key missing",
    "status.llmError": "LLM error",
    "status.micReady": "Mic ready",
    "status.micCheck": "Check mic context",
    "status.micRequest": "Mic permission needed",
    "status.micDenied": "Mic blocked",

    "rec.title": "Live recording",
    "rec.hint":
      "Press Start to arm the microphone. Then hold Shift to capture the client's reply, Space for the manager. The full utterance is transcribed when you release the key.",
    "rec.micHint":
      "Open in Chrome or Safari. For other LAN devices use HTTPS with SSL_CERTFILE and SSL_KEYFILE.",
    "rec.timer": "Duration",
    "rec.idle": "ready",
    "rec.armed": "armed — hold Shift (client) or Space (manager)",
    "rec.captureClient": "capturing client…",
    "rec.captureManager": "capturing manager…",
    "rec.stopping": "stopping…",
    "rec.sending": "sending / transcribing…",

    "speaker.idle": "Hold Shift or Space to speak",
    "speaker.client": "Client (Shift held)",
    "speaker.manager": "Manager (Space held)",
    "speaker.none": "Release key to transcribe",
    "speaker.clientName": "Client",
    "speaker.managerName": "Manager",

    "buttons.grantMic": "Grant microphone",
    "buttons.grantMicOk": "Microphone granted",
    "buttons.start": "Start recording",
    "buttons.stop": "Stop",
    "buttons.saveProfile": "Save profile",
    "buttons.exportMd": "Export Markdown",
    "buttons.exportJson": "Export JSON",
    "buttons.reset": "Reset",
    "buttons.shortcuts": "Shortcuts",
    "buttons.close": "Close",

    "profile.title": "Client profile",
    "profile.subtitle": "Used to personalise AI advice and ranking of the catalog.",
    "profile.budget": "Budget range",
    "profile.budgetPlaceholder": "e.g. $500–$900",
    "profile.interest": "Product category",
    "profile.priority": "Priority",
    "profile.experience": "Experience level",
    "profile.urgency": "Urgency",
    "profile.optionAny": "any",
    "profile.optionSmartphones": "smartphones",
    "profile.optionLaptops": "laptops",
    "profile.optionAudio": "audio",
    "profile.optionPrice": "price",
    "profile.optionQuality": "quality",
    "profile.optionPerformance": "performance",
    "profile.optionBrand": "brand",
    "profile.optionBeginner": "beginner",
    "profile.optionAverage": "average",
    "profile.optionExpert": "expert",
    "profile.optionLow": "low",
    "profile.optionMedium": "medium",
    "profile.optionHigh": "high",
    "profile.saved": "Saved",

    "metrics.title": "Live metrics",
    "metrics.duration": "Duration",
    "metrics.messages": "Messages",
    "metrics.client": "Client",
    "metrics.manager": "Manager",
    "metrics.sentiment": "Sentiment",
    "metrics.stage": "Sales stage",
    "metrics.empty": "—",

    "transcript.title": "Transcript",
    "transcript.empty": "Transcript appears here once you start recording.",

    "advice.title": "AI guidance",
    "advice.empty": "AI advice appears after the first transcribed segment.",
    "advice.thinking": "Thinking…",
    "advice.client_objection": "Client objection",
    "advice.client_objectionDesc":
      "What the client is hesitating about right now (price, fit, timing…). Empty when there is no objection.",
    "advice.objection_type": "Objection type",
    "advice.objection_typeDesc":
      "Category of the objection: price, trust, need, timing, competitor, quality, other or none.",
    "advice.client_sentiment": "Client sentiment",
    "advice.client_sentimentDesc":
      "Overall tone from the client's last lines: positive, neutral, cautious or negative.",
    "advice.sales_stage": "Sales stage",
    "advice.sales_stageDesc":
      "Where the call sits in the funnel: discovery → qualification → needs → demo → objection handling → negotiation → closing → post-sale.",
    "advice.recommended_response": "Recommended response",
    "advice.recommended_responseDesc":
      "A ready-to-say line for the manager (1–3 sentences) tailored to the latest exchange.",
    "advice.next_question": "Next question",
    "advice.next_questionDesc":
      "One open clarifying question that should move the conversation forward.",
    "advice.product_recommendation": "Product recommendation",
    "advice.product_recommendationDesc":
      "Concrete product from the catalog that fits the client right now. Empty if it is too early to recommend.",
    "advice.risk_flag": "Risk flag",
    "advice.risk_flagDesc":
      "Warning for the manager: churn risk, compliance / legal, competitor mention, manager over-promise, etc. 'none' when nothing is flagged.",
    "enum.objection_type.price": "price",
    "enum.objection_type.trust": "trust",
    "enum.objection_type.need": "need",
    "enum.objection_type.timing": "timing",
    "enum.objection_type.competitor": "competitor",
    "enum.objection_type.quality": "quality",
    "enum.objection_type.other": "other",
    "enum.objection_type.none": "none",
    "enum.client_sentiment.positive": "positive",
    "enum.client_sentiment.neutral": "neutral",
    "enum.client_sentiment.cautious": "cautious",
    "enum.client_sentiment.negative": "negative",
    "enum.sales_stage.discovery": "discovery",
    "enum.sales_stage.qualification": "qualification",
    "enum.sales_stage.needs": "needs analysis",
    "enum.sales_stage.demo": "demo",
    "enum.sales_stage.objection_handling": "objection handling",
    "enum.sales_stage.negotiation": "negotiation",
    "enum.sales_stage.closing": "closing",
    "enum.sales_stage.post_sale": "post-sale",
    "enum.sales_stage.consideration": "consideration",
    "enum.risk_flag.churn": "churn risk",
    "enum.risk_flag.compliance": "compliance",
    "enum.risk_flag.legal": "legal risk",
    "enum.risk_flag.competitor": "competitor mention",
    "enum.risk_flag.over-promise": "over-promise",
    "enum.risk_flag.overpromise": "over-promise",
    "enum.risk_flag.none": "none",

    "shortcuts.title": "Keyboard shortcuts",
    "shortcuts.record": "Arm / disarm microphone",
    "shortcuts.client": "Hold to capture the client (push-to-talk)",
    "shortcuts.manager": "Hold to capture the manager (push-to-talk)",
    "shortcuts.lang": "Toggle language (EN/RU)",
    "shortcuts.theme": "Toggle theme (light/dark)",
    "shortcuts.reset": "Reset session",
    "shortcuts.help": "Open this shortcuts panel",

    "toast.profileSaved": "Profile saved",
    "toast.sessionReset": "Session reset",
    "toast.exportReady": "Export prepared",
    "toast.exportEmpty": "Nothing to export yet",
    "toast.copied": "Copied",
    "toast.settingsSaved": "LLM settings saved",
    "toast.asrApplied": "Transcription profile updated",

    "settings.title": "Settings",
    "settings.llmHeading": "LLM provider",
    "settings.llmIntro":
      "Connect any OpenAI-compatible API (OpenAI, AITunnel, LocalAI, Ollama, vLLM …). Settings live only in server memory and reset on restart.",
    "settings.preset": "Preset",
    "settings.presetOpenAI": "OpenAI",
    "settings.presetAITunnel": "AITunnel",
    "settings.presetOllama": "Ollama (local)",
    "settings.presetCustom": "Custom",
    "settings.baseUrl": "Base URL",
    "settings.model": "Model",
    "settings.apiKey": "API key",
    "settings.toggleKey": "Show / hide key",
    "settings.keyHint": "Leave empty to keep the previously saved key.",
    "settings.savedKey": "stored key",
    "settings.stubMode": "Stub mode (skip LLM, return demo advice)",
    "settings.save": "Save",
    "settings.saving": "Saving…",
    "settings.savedOk": "Saved.",
    "settings.savedError": "Failed to save",
    "settings.testButton": "Test connection",
    "settings.testing": "Calling the model…",
    "settings.testOk": "OK — the model replied successfully.",
    "settings.testFailed": "Test failed",
    "settings.lastError": "Last error",
    "settings.asrHeading": "Transcription quality",
    "settings.asrIntro":
      "Each press of Shift/Space is transcribed as one utterance. Higher quality profiles widen Whisper's beam search and VAD thresholds — slower but more accurate.",
    "settings.asrProfile": "Profile",
    "settings.asrModel": "Whisper model",
    "settings.asrFast": "Fast (beam 1, low latency)",
    "settings.asrBalanced": "Balanced (beam 3)",
    "settings.asrAccurate": "Accurate (beam 5, slower)",
    "settings.applying": "Applying…",
    "settings.asrApplied": "Profile applied.",
    "settings.asrFailed": "Could not change profile",

    "errors.serverDisconnected": "No connection to server.",
    "errors.unknown": "Unknown error.",
    "errors.audioEncode": "Failed to encode audio.",
    "errors.microphone": "Microphone error.",
    "errors.micBlocked":
      "Microphone needs HTTPS or localhost. Open http://127.0.0.1:<port> or run TLS. See docs/RUN.md.",
    "errors.noGetUserMedia":
      "getUserMedia is unavailable (often in IDE previews). Open in Chrome or Safari.",
    "errors.browserMic": "This browser does not support microphone access.",
    "errors.micNotAllowed": "Microphone blocked. Allow access in the address bar.",
    "errors.micNotFound": "No microphone found. Connect one and retry.",
    "errors.micBusy": "Microphone is busy in another app.",

    "tooltips.llmStub": "No OpenAI calls in stub mode. Click to configure.",
    "tooltips.llmOk": "OpenAI-compatible client is configured. Click to change.",
    "tooltips.llmMissing":
      "Click to enter an API key, or enable stub mode in the settings.",
    "tooltips.llmSettings": "Open LLM settings",
    "tooltips.asrInstall": "Install with: pip install faster-whisper",
    "tooltips.asrSettings": "Open transcription settings",
  },
  ru: {
    "app.title": "AI Sales Copilot",
    "app.subtitle": "Локально: faster-whisper · GPT-4o-mini · WebSockets",
    "app.tagline": "Подсказки для менеджера в реальном времени",

    "nav.theme": "Тема",
    "nav.lang": "Язык",
    "nav.shortcuts": "Хоткеи",
    "nav.settings": "Настройки",
    "nav.export": "Экспорт",
    "nav.reset": "Сбросить сессию",

    "theme.light": "Светлая",
    "theme.dark": "Тёмная",

    "status.connecting": "Подключаемся…",
    "status.connected": "Онлайн",
    "status.disconnected": "Нет связи",
    "status.asrReady": "ASR готов",
    "status.asrUnavailable": "ASR недоступен",
    "status.asrNoFfmpeg": "нет ffmpeg",
    "status.llmStub": "LLM: заглушка",
    "status.llmReady": "LLM готов",
    "status.llmMissing": "Нет ключа LLM",
    "status.llmError": "LLM: ошибка",
    "status.micReady": "Микрофон готов",
    "status.micCheck": "Проверьте контекст",
    "status.micRequest": "Нужно разрешение микрофона",
    "status.micDenied": "Микрофон заблокирован",

    "rec.title": "Запись разговора",
    "rec.hint":
      "Нажмите «Старт», чтобы включить микрофон. Затем удерживайте Shift, пока говорит клиент, и Пробел, пока говорит менеджер. Реплика расшифровывается целиком, когда вы отпускаете клавишу.",
    "rec.micHint":
      "Используйте Chrome или Safari. Для LAN-устройств — HTTPS с SSL_CERTFILE и SSL_KEYFILE.",
    "rec.timer": "Длительность",
    "rec.idle": "готово",
    "rec.armed": "ожидание — Shift = клиент, Пробел = менеджер",
    "rec.captureClient": "запись клиента…",
    "rec.captureManager": "запись менеджера…",
    "rec.stopping": "останавливаем…",
    "rec.sending": "отправка / распознавание…",

    "speaker.idle": "Удерживайте Shift или Пробел, чтобы говорить",
    "speaker.client": "Клиент (удерживается Shift)",
    "speaker.manager": "Менеджер (удерживается Пробел)",
    "speaker.none": "Отпустите клавишу для расшифровки",
    "speaker.clientName": "Клиент",
    "speaker.managerName": "Менеджер",

    "buttons.grantMic": "Разрешить микрофон",
    "buttons.grantMicOk": "Микрофон разрешён",
    "buttons.start": "Старт записи",
    "buttons.stop": "Стоп",
    "buttons.saveProfile": "Сохранить профиль",
    "buttons.exportMd": "Скачать Markdown",
    "buttons.exportJson": "Скачать JSON",
    "buttons.reset": "Сброс",
    "buttons.shortcuts": "Хоткеи",
    "buttons.close": "Закрыть",

    "profile.title": "Профиль клиента",
    "profile.subtitle": "Используется для персонализации подсказок и сортировки каталога.",
    "profile.budget": "Бюджет",
    "profile.budgetPlaceholder": "например, $500–$900",
    "profile.interest": "Категория",
    "profile.priority": "Приоритет",
    "profile.experience": "Опыт",
    "profile.urgency": "Срочность",
    "profile.optionAny": "любая",
    "profile.optionSmartphones": "смартфоны",
    "profile.optionLaptops": "ноутбуки",
    "profile.optionAudio": "аудио",
    "profile.optionPrice": "цена",
    "profile.optionQuality": "качество",
    "profile.optionPerformance": "производительность",
    "profile.optionBrand": "бренд",
    "profile.optionBeginner": "новичок",
    "profile.optionAverage": "средний",
    "profile.optionExpert": "эксперт",
    "profile.optionLow": "низкая",
    "profile.optionMedium": "средняя",
    "profile.optionHigh": "высокая",
    "profile.saved": "Сохранено",

    "metrics.title": "Метрики",
    "metrics.duration": "Длительность",
    "metrics.messages": "Реплик",
    "metrics.client": "Клиент",
    "metrics.manager": "Менеджер",
    "metrics.sentiment": "Тональность",
    "metrics.stage": "Этап",
    "metrics.empty": "—",

    "transcript.title": "Транскрипт",
    "transcript.empty": "Транскрипт появится здесь после начала записи.",

    "advice.title": "Подсказки ИИ",
    "advice.empty": "Подсказки появятся после первой расшифровки.",
    "advice.thinking": "ИИ думает…",
    "advice.client_objection": "Возражение клиента",
    "advice.client_objectionDesc":
      "Что сейчас смущает клиента (цена, соответствие, сроки…). Пусто, если возражений нет.",
    "advice.objection_type": "Тип возражения",
    "advice.objection_typeDesc":
      "Категория возражения: цена, доверие, потребность, сроки, конкурент, качество, другое или нет.",
    "advice.client_sentiment": "Тональность",
    "advice.client_sentimentDesc":
      "Общий тон последних реплик клиента: позитивная, нейтральная, настороженная или негативная.",
    "advice.sales_stage": "Этап продажи",
    "advice.sales_stageDesc":
      "Где сейчас разговор в воронке: знакомство → квалификация → выявление потребностей → демонстрация → работа с возражениями → переговоры → закрытие → пост-продажа.",
    "advice.recommended_response": "Рекомендуемый ответ",
    "advice.recommended_responseDesc":
      "Готовая фраза менеджеру (1–3 предложения) под последний обмен репликами.",
    "advice.next_question": "Следующий вопрос",
    "advice.next_questionDesc":
      "Один открытый уточняющий вопрос, который двигает разговор вперёд.",
    "advice.product_recommendation": "Рекомендация товара",
    "advice.product_recommendationDesc":
      "Конкретный товар из каталога, который сейчас подходит клиенту. Пусто, если рекомендовать рано.",
    "advice.risk_flag": "Флаг риска",
    "advice.risk_flagDesc":
      "Предупреждение менеджеру: клиент уходит, юридический/комплаенс-риск, упомянут конкурент, менеджер обещает лишнее и т.п. «нет», если рисков нет.",
    "enum.objection_type.price": "цена",
    "enum.objection_type.trust": "доверие",
    "enum.objection_type.need": "потребность",
    "enum.objection_type.timing": "сроки",
    "enum.objection_type.competitor": "конкурент",
    "enum.objection_type.quality": "качество",
    "enum.objection_type.other": "другое",
    "enum.objection_type.none": "нет",
    "enum.client_sentiment.positive": "позитивная",
    "enum.client_sentiment.neutral": "нейтральная",
    "enum.client_sentiment.cautious": "настороженная",
    "enum.client_sentiment.negative": "негативная",
    "enum.sales_stage.discovery": "знакомство",
    "enum.sales_stage.qualification": "квалификация",
    "enum.sales_stage.needs": "выявление потребностей",
    "enum.sales_stage.demo": "демонстрация",
    "enum.sales_stage.objection_handling": "работа с возражениями",
    "enum.sales_stage.negotiation": "переговоры",
    "enum.sales_stage.closing": "закрытие",
    "enum.sales_stage.post_sale": "пост-продажа",
    "enum.sales_stage.consideration": "обдумывание",
    "enum.risk_flag.churn": "риск ухода",
    "enum.risk_flag.compliance": "комплаенс-риск",
    "enum.risk_flag.legal": "юридический риск",
    "enum.risk_flag.competitor": "упомянут конкурент",
    "enum.risk_flag.over-promise": "лишние обещания",
    "enum.risk_flag.overpromise": "лишние обещания",
    "enum.risk_flag.none": "нет",

    "shortcuts.title": "Горячие клавиши",
    "shortcuts.record": "Включить / выключить микрофон",
    "shortcuts.client": "Удерживать — запись клиента (push-to-talk)",
    "shortcuts.manager": "Удерживать — запись менеджера (push-to-talk)",
    "shortcuts.lang": "Переключить язык (EN/RU)",
    "shortcuts.theme": "Переключить тему (светлая/тёмная)",
    "shortcuts.reset": "Сброс сессии",
    "shortcuts.help": "Открыть эту панель",

    "toast.profileSaved": "Профиль сохранён",
    "toast.sessionReset": "Сессия сброшена",
    "toast.exportReady": "Экспорт готов",
    "toast.exportEmpty": "Пока нечего экспортировать",
    "toast.copied": "Скопировано",
    "toast.settingsSaved": "Настройки LLM сохранены",
    "toast.asrApplied": "Профиль транскрипции применён",

    "settings.title": "Настройки",
    "settings.llmHeading": "Провайдер LLM",
    "settings.llmIntro":
      "Подключите любой OpenAI-совместимый API (OpenAI, AITunnel, LocalAI, Ollama, vLLM …). Настройки хранятся только в памяти сервера и сбрасываются при перезапуске.",
    "settings.preset": "Пресет",
    "settings.presetOpenAI": "OpenAI",
    "settings.presetAITunnel": "AITunnel",
    "settings.presetOllama": "Ollama (локально)",
    "settings.presetCustom": "Произвольный",
    "settings.baseUrl": "Base URL",
    "settings.model": "Модель",
    "settings.apiKey": "API-ключ",
    "settings.toggleKey": "Показать / скрыть ключ",
    "settings.keyHint": "Оставьте пустым, чтобы оставить сохранённый ключ.",
    "settings.savedKey": "сохранённый ключ",
    "settings.stubMode": "Заглушка (без вызова LLM, демо-ответы)",
    "settings.save": "Сохранить",
    "settings.saving": "Сохраняем…",
    "settings.savedOk": "Сохранено.",
    "settings.savedError": "Не удалось сохранить",
    "settings.testButton": "Проверить связь",
    "settings.testing": "Вызываем модель…",
    "settings.testOk": "Готово — модель ответила.",
    "settings.testFailed": "Проверка не прошла",
    "settings.lastError": "Последняя ошибка",
    "settings.asrHeading": "Качество транскрипции",
    "settings.asrIntro":
      "Каждое нажатие Shift/Пробел расшифровывается как одна реплика. Более качественные профили расширяют beam search и пороги VAD у Whisper — точнее, но медленнее.",
    "settings.asrProfile": "Профиль",
    "settings.asrModel": "Модель Whisper",
    "settings.asrFast": "Быстрый (beam 1, минимум задержки)",
    "settings.asrBalanced": "Сбалансированный (beam 3)",
    "settings.asrAccurate": "Точный (beam 5, медленнее)",
    "settings.applying": "Применяем…",
    "settings.asrApplied": "Профиль применён.",
    "settings.asrFailed": "Не удалось сменить профиль",

    "errors.serverDisconnected": "Нет соединения с сервером.",
    "errors.unknown": "Неизвестная ошибка.",
    "errors.audioEncode": "Не удалось закодировать аудио.",
    "errors.microphone": "Ошибка микрофона.",
    "errors.micBlocked":
      "Для микрофона нужен HTTPS или localhost. Откройте http://127.0.0.1:<порт> или запустите TLS. См. docs/RUN.md.",
    "errors.noGetUserMedia":
      "getUserMedia недоступен (часто в превью IDE). Откройте в Chrome или Safari.",
    "errors.browserMic": "В этом браузере недоступен микрофон.",
    "errors.micNotAllowed": "Микрофон заблокирован. Разрешите доступ в адресной строке.",
    "errors.micNotFound": "Микрофон не найден. Подключите устройство и повторите.",
    "errors.micBusy": "Микрофон занят другим приложением.",

    "tooltips.llmStub": "В режиме заглушки OpenAI не вызывается. Кликните, чтобы настроить.",
    "tooltips.llmOk": "OpenAI-совместимый клиент настроен. Кликните, чтобы изменить.",
    "tooltips.llmMissing":
      "Кликните, чтобы ввести ключ или включить режим заглушки.",
    "tooltips.llmSettings": "Открыть настройки LLM",
    "tooltips.asrInstall": "Установите: pip install faster-whisper",
    "tooltips.asrSettings": "Открыть настройки транскрипции",
  },
};

let currentLang = "en";

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== "en" && lang !== "ru") return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {

  }
}

export function initLang() {
  let initial = "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ru" || saved === "en") {
      initial = saved;
    } else if ((navigator.language || "").toLowerCase().startsWith("ru")) {
      initial = "ru";
    }
  } catch {

  }
  currentLang = initial;
  return initial;
}

export function t(key) {
  const dict = DICTIONARIES[currentLang] || DICTIONARIES.en;
  return dict[key] ?? DICTIONARIES.en[key] ?? key;
}

const ENUM_FIELDS = new Set([
  "objection_type",
  "client_sentiment",
  "sales_stage",
  "risk_flag",
]);

const TOKEN_RE = /[\p{L}\p{N}][\p{L}\p{N}_-]*/giu;

export function localizeAdviceValue(field, raw) {
  if (!field || !ENUM_FIELDS.has(field)) return raw ?? "";
  const text = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
  if (!text) return "";
  return text.replace(TOKEN_RE, (match) => {
    const key = `enum.${field}.${match.toLowerCase()}`;
    const dict = DICTIONARIES[currentLang] || DICTIONARIES.en;
    const translated = dict[key] ?? DICTIONARIES.en[key];
    return translated ?? match;
  });
}
