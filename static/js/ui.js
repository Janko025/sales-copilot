import { ADVICE_KEYS, store, activeSpeaker } from "./state.js";
import { getLang, t, localizeAdviceValue } from "./i18n.js";
import { getTheme } from "./theme.js";

export const els = {};

export function cacheElements() {
  const ids = [
    "btnLang",
    "btnTheme",
    "btnShortcuts",
    "btnSettings",
    "btnExportMd",
    "btnExportJson",
    "btnReset",
    "btnMicPerm",
    "btnRecord",
    "btnStop",
    "recTimer",
    "recState",
    "recError",
    "transcriptBox",
    "transcriptEmpty",
    "adviceBox",
    "adviceEmpty",
    "adviceThinking",
    "connPill",
    "asrPill",
    "llmPill",
    "micPill",
    "speakerPill",
    "profileForm",
    "metricDuration",
    "metricMessages",
    "metricClient",
    "metricManager",
    "metricSentiment",
    "metricStage",
    "toast",
    "shortcutsModal",
    "shortcutsClose",
    "settingsModal",
    "settingsClose",
    "llmForm",
    "llmPreset",
    "llmBaseUrl",
    "llmModel",
    "llmApiKey",
    "llmKeyToggle",
    "llmKeyHint",
    "llmStub",
    "llmTest",
    "llmSave",
    "llmStatus",
    "asrProfile",
    "asrModel",
    "asrStatus",
  ];
  for (const id of ids) {
    els[id] = document.getElementById(id);
  }
}

export function applyI18nToDom() {
  document.documentElement.lang = getLang();
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) el.setAttribute("placeholder", t(key));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    const value = t(key);
    el.setAttribute("title", value);
    if (el.hasAttribute("aria-label")) el.setAttribute("aria-label", value);
  });
  els.btnLang.textContent = getLang() === "en" ? "RU" : "EN";
  els.btnLang.setAttribute("aria-label", t("nav.lang"));
  els.btnTheme.textContent = getTheme() === "dark" ? t("theme.light") : t("theme.dark");
  els.btnTheme.setAttribute("aria-label", t("nav.theme"));
}

export function setConnectionPill(connected) {
  els.connPill.textContent = connected ? t("status.connected") : t("status.disconnected");
  els.connPill.dataset.state = connected ? "ok" : "bad";
}

export function setMicPill(text, ok) {
  els.micPill.textContent = text;
  els.micPill.dataset.state = ok ? "ok" : "warn";
}

export function setSpeakerPill() {
  if (!store.recording.active) {
    els.speakerPill.textContent = t("speaker.idle");
    els.speakerPill.dataset.role = "idle";
    return;
  }
  const speaker = activeSpeaker();
  if (speaker === "client") {
    els.speakerPill.textContent = t("speaker.client");
    els.speakerPill.dataset.role = "client";
  } else if (speaker === "manager") {
    els.speakerPill.textContent = t("speaker.manager");
    els.speakerPill.dataset.role = "manager";
  } else {
    els.speakerPill.textContent = t("speaker.none");
    els.speakerPill.dataset.role = "none";
  }
}

export function applyServerReady(payload) {
  store.serverReady = payload || null;
  const whisperOk = Boolean(payload && payload.whisper_ok);
  const ffmpegOk = Boolean(payload && payload.ffmpeg_ok);
  const asr = (payload && payload.asr) || null;
  const llm = (payload && payload.llm) || null;
  if (asr) Object.assign(store.asr, asr);
  if (llm) Object.assign(store.llm, llm);

  const model = (asr && asr.model) || (payload && payload.model) || "small";
  const quality = (asr && asr.quality) || store.asr.quality;

  if (whisperOk && ffmpegOk) {
    els.asrPill.textContent = `${t("status.asrReady")} · ${model} · ${quality}`;
    els.asrPill.dataset.state = "ok";
    els.asrPill.title = t("tooltips.asrSettings");
  } else if (!whisperOk) {
    els.asrPill.textContent = t("status.asrUnavailable");
    els.asrPill.dataset.state = "bad";
    els.asrPill.title = (payload && payload.whisper_error) || t("tooltips.asrInstall");
  } else {
    els.asrPill.textContent = t("status.asrNoFfmpeg");
    els.asrPill.dataset.state = "bad";
    els.asrPill.title = "";
  }

  const stub = Boolean(llm ? llm.stub_mode : payload && payload.openai_stub);
  const hasKey = Boolean(llm ? llm.has_key : payload && payload.openai_key_set);
  const lastError = llm && llm.last_error;
  if (stub) {
    els.llmPill.textContent = t("status.llmStub");
    els.llmPill.dataset.state = "warn";
    els.llmPill.title = t("tooltips.llmStub");
  } else if (!hasKey) {
    els.llmPill.textContent = t("status.llmMissing");
    els.llmPill.dataset.state = "bad";
    els.llmPill.title = t("tooltips.llmMissing");
  } else if (lastError) {
    els.llmPill.textContent = t("status.llmError");
    els.llmPill.dataset.state = "bad";
    els.llmPill.title = `${t("settings.lastError")}: ${lastError}`;
  } else {
    els.llmPill.textContent = t("status.llmReady");
    els.llmPill.dataset.state = "ok";
    els.llmPill.title = t("tooltips.llmOk");
  }
}

export function openSettings() {
  els.settingsModal.hidden = false;
  els.settingsModal.classList.add("is-open");
}

export function closeSettings() {
  els.settingsModal.classList.remove("is-open");
  els.settingsModal.hidden = true;
}

export function setLlmStatus(text, state = "idle") {
  if (!els.llmStatus) return;
  els.llmStatus.textContent = text || "";
  els.llmStatus.dataset.state = state;
}

export function setAsrStatus(text, state = "idle") {
  if (!els.asrStatus) return;
  els.asrStatus.textContent = text || "";
  els.asrStatus.dataset.state = state;
}

export function showRecError(message) {
  if (!message) {
    els.recError.hidden = true;
    els.recError.textContent = "";
    return;
  }
  els.recError.hidden = false;
  els.recError.textContent = message;
}

export function refreshRecState() {
  if (!store.recording.active) {
    els.recState.textContent = t("rec.idle");
    return;
  }
  if (store.recording.userStopRequested) {
    els.recState.textContent = t("rec.stopping");
    return;
  }
  const segment = store.recording.segment;
  if (segment?.speaker === "client") {
    els.recState.textContent = t("rec.captureClient");
  } else if (segment?.speaker === "manager") {
    els.recState.textContent = t("rec.captureManager");
  } else {
    els.recState.textContent = t("rec.armed");
  }
}

export function appendTranscript({ role, text, timestamp }) {
  store.transcript.push({ role, text, timestamp });
  els.transcriptEmpty.hidden = true;
  const wrap = document.createElement("div");
  wrap.className = `msg msg--${role}`;
  const who = document.createElement("div");
  who.className = "msg__who";
  who.textContent = role === "client" ? t("speaker.clientName") : t("speaker.managerName");
  const body = document.createElement("div");
  body.className = "msg__body";
  body.textContent = text;
  wrap.appendChild(who);
  wrap.appendChild(body);
  els.transcriptBox.appendChild(wrap);
  els.transcriptBox.scrollTop = els.transcriptBox.scrollHeight;
}

export function rerenderTranscript() {
  els.transcriptBox.innerHTML = "";
  if (!store.transcript.length) {
    els.transcriptEmpty.hidden = false;
    return;
  }
  els.transcriptEmpty.hidden = true;
  for (const item of store.transcript) {
    const wrap = document.createElement("div");
    wrap.className = `msg msg--${item.role}`;
    const who = document.createElement("div");
    who.className = "msg__who";
    who.textContent =
      item.role === "client" ? t("speaker.clientName") : t("speaker.managerName");
    const body = document.createElement("div");
    body.className = "msg__body";
    body.textContent = item.text;
    wrap.appendChild(who);
    wrap.appendChild(body);
    els.transcriptBox.appendChild(wrap);
  }
  els.transcriptBox.scrollTop = els.transcriptBox.scrollHeight;
}

function buildAdviceCards() {
  els.adviceBox.innerHTML = "";
  for (const key of ADVICE_KEYS) {
    const card = document.createElement("article");
    card.className = `adv-card adv-card--${key}`;
    card.dataset.key = key;

    const head = document.createElement("header");
    head.className = "adv-card__head";

    const title = document.createElement("h4");
    title.className = "adv-card__title";
    title.dataset.i18n = `advice.${key}`;
    title.textContent = t(`advice.${key}`);

    const hint = document.createElement("span");
    hint.className = "adv-card__hint";
    hint.dataset.i18nTitle = `advice.${key}Desc`;
    hint.setAttribute("aria-label", t(`advice.${key}Desc`));
    hint.title = t(`advice.${key}Desc`);
    hint.textContent = "?";

    head.appendChild(title);
    head.appendChild(hint);

    const body = document.createElement("p");
    body.className = "adv-card__body";
    body.dataset.role = "value";
    body.textContent = "—";

    card.appendChild(head);
    card.appendChild(body);
    els.adviceBox.appendChild(card);
  }
}

function flashUpdated(card) {
  card.classList.remove("is-updated");

  void card.offsetWidth;
  card.classList.add("is-updated");
}

export function renderAdvice(data, { merge = false } = {}) {
  if (!data && !merge) {
    store.advice = null;
    els.adviceBox.innerHTML = "";
    els.adviceEmpty.hidden = false;
    return;
  }
  if (!els.adviceBox.children.length) {
    buildAdviceCards();
  }

  const hasAny = data && ADVICE_KEYS.some((key) => (data[key] || "").trim() !== "");
  if (!hasAny && !store.advice) {
    els.adviceEmpty.hidden = false;
    return;
  }
  els.adviceEmpty.hidden = true;

  const previous = store.advice || {};
  const next = { ...previous };

  for (const key of ADVICE_KEYS) {
    const incoming = data && typeof data[key] === "string" ? data[key].trim() : "";
    if (merge && !incoming) continue;
    next[key] = incoming;
  }
  store.advice = next;

  els.adviceBox.querySelectorAll(".adv-card").forEach((card) => {
    const key = card.dataset.key;
    const valueEl = card.querySelector('[data-role="value"]');
    const rawVal = next[key] || "";
    const displayVal = rawVal ? localizeAdviceValue(key, rawVal) : "—";
    if (valueEl.textContent !== displayVal) {
      valueEl.textContent = displayVal;
      flashUpdated(card);
    }
  });
}

export function setAdviceThinking(active) {
  if (!els.adviceThinking) return;
  els.adviceThinking.hidden = !active;
  els.adviceThinking.classList.toggle("is-active", Boolean(active));
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function renderMetrics() {
  const m = store.metrics;
  els.metricDuration.textContent = formatDuration(m.duration_sec);
  els.metricMessages.textContent = String(m.messages_total || 0);
  els.metricClient.textContent = String(m.messages_client || 0);
  els.metricManager.textContent = String(m.messages_manager || 0);
  const advice = store.advice || {};
  els.metricSentiment.textContent = advice.client_sentiment
    ? localizeAdviceValue("client_sentiment", advice.client_sentiment)
    : t("metrics.empty");
  els.metricStage.textContent = advice.sales_stage
    ? localizeAdviceValue("sales_stage", advice.sales_stage)
    : t("metrics.empty");
}

let toastTimerId = 0;
export function toast(message, variant = "info") {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.dataset.variant = variant;
  els.toast.hidden = false;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimerId);
  toastTimerId = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2200);
}

export function openShortcuts() {
  els.shortcutsModal.hidden = false;
  els.shortcutsModal.classList.add("is-open");
}

export function closeShortcuts() {
  els.shortcutsModal.classList.remove("is-open");
  els.shortcutsModal.hidden = true;
}
