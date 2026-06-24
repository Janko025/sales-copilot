import { store } from "./state.js";
import { t } from "./i18n.js";
import {
  els,
  closeSettings,
  openSettings,
  setAsrStatus,
  setLlmStatus,
  toast,
} from "./ui.js";

const PRESETS = {
  openai: { base_url: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  aitunnel: { base_url: "https://api.aitunnel.ru/v1", model: "gpt-4o-mini" },
  ollama: { base_url: "http://localhost:11434/v1", model: "llama3.1" },
  custom: null,
};

let isOpen = false;
let asrRequestInflight = false;

function detectPreset(baseUrl) {
  const value = (baseUrl || "").trim().toLowerCase();
  if (!value) return "openai";
  if (value.includes("api.openai.com")) return "openai";
  if (value.includes("aitunnel")) return "aitunnel";
  if (value.includes("ollama") || value.includes(":11434")) return "ollama";
  return "custom";
}

function applyPresetToInputs(preset) {
  const preset_cfg = PRESETS[preset];
  if (!preset_cfg) return;
  els.llmBaseUrl.value = preset_cfg.base_url;
  if (!els.llmModel.value.trim()) {
    els.llmModel.value = preset_cfg.model;
  }
}

function syncFormFromStore() {
  const llm = store.llm || {};
  els.llmBaseUrl.value = llm.base_url || "";
  els.llmModel.value = llm.model || "gpt-4o-mini";
  els.llmStub.checked = Boolean(llm.stub_mode);
  els.llmApiKey.value = "";
  els.llmApiKey.placeholder = llm.has_key
    ? `${t("settings.savedKey")}: ${llm.key_masked || "********"}`
    : "sk-...";
  els.llmPreset.value = detectPreset(llm.base_url);
  if (llm.last_error) {
    setLlmStatus(`${t("settings.lastError")}: ${llm.last_error}`, "error");
  } else {
    setLlmStatus("", "idle");
  }
}

function syncAsrFromStore() {
  const asr = store.asr || {};
  if (asr.quality_options && els.asrProfile) {
    const current = els.asrProfile.value;
    els.asrProfile.innerHTML = "";
    for (const opt of asr.quality_options) {
      const option = document.createElement("option");
      option.value = opt;
      const labelKey = `settings.asr${opt.charAt(0).toUpperCase()}${opt.slice(1)}`;
      option.textContent = t(labelKey);
      option.dataset.i18n = labelKey;
      els.asrProfile.appendChild(option);
    }
    els.asrProfile.value = asr.quality || current || "balanced";
  }
  if (els.asrModel) {
    els.asrModel.value = `${asr.model || "?"} · ${asr.device || "cpu"} · ${asr.compute_type || ""}`;
  }
}

async function fetchJson(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

function payloadFromForm({ includeKey = true } = {}) {
  const payload = {
    base_url: els.llmBaseUrl.value.trim(),
    model: els.llmModel.value.trim(),
    stub_mode: Boolean(els.llmStub.checked),
  };
  if (includeKey) {
    const apiKey = els.llmApiKey.value;
    if (apiKey && apiKey.trim()) {
      payload.api_key = apiKey.trim();
    }
  }
  return payload;
}

async function saveSettings(event) {
  event.preventDefault();
  setLlmStatus(t("settings.saving"), "pending");
  try {
    const data = await fetchJson("/api/llm/config", {
      method: "POST",
      body: JSON.stringify(payloadFromForm()),
    });
    Object.assign(store.llm, data);
    syncFormFromStore();
    setLlmStatus(t("settings.savedOk"), "ok");
    toast(t("toast.settingsSaved"), "success");
  } catch (error) {
    setLlmStatus(`${t("settings.savedError")}: ${error.message || error}`, "error");
  }
}

async function testConnection() {
  setLlmStatus(t("settings.testing"), "pending");
  try {
    const data = await fetchJson("/api/llm/test", {
      method: "POST",
      body: JSON.stringify(payloadFromForm()),
    });
    if (data.status) Object.assign(store.llm, data.status);
    syncFormFromStore();
    if (data.ok) {
      setLlmStatus(t("settings.testOk"), "ok");
    } else {
      setLlmStatus(`${t("settings.testFailed")}: ${data.error || "?"}`, "error");
    }
  } catch (error) {
    setLlmStatus(`${t("settings.testFailed")}: ${error.message || error}`, "error");
  }
}

async function changeAsrProfile(event) {
  const quality = event.target.value;
  if (!quality || asrRequestInflight) return;
  asrRequestInflight = true;
  setAsrStatus(t("settings.applying"), "pending");
  try {
    const data = await fetchJson("/api/asr/quality", {
      method: "POST",
      body: JSON.stringify({ quality }),
    });
    if (data && data.asr) {
      Object.assign(store.asr, data.asr);
    }
    setAsrStatus(t("settings.asrApplied"), "ok");
    toast(t("toast.asrApplied"), "success");
  } catch (error) {
    setAsrStatus(`${t("settings.asrFailed")}: ${error.message || error}`, "error");
  } finally {
    asrRequestInflight = false;
  }
}

function onPresetChange(event) {
  const preset = event.target.value;
  if (preset === "custom") return;
  applyPresetToInputs(preset);
}

function toggleKeyVisibility() {
  const isPassword = els.llmApiKey.type === "password";
  els.llmApiKey.type = isPassword ? "text" : "password";
  els.llmKeyToggle.textContent = isPassword ? "🙈" : "👁";
}

function refreshStatusFromServer() {
  fetchJson("/api/llm/config", { method: "GET" })
    .then((data) => {
      Object.assign(store.llm, data);
      syncFormFromStore();
    })
    .catch(() => {

    });
}

export function bindSettings() {
  els.btnSettings.addEventListener("click", () => toggleSettings());
  els.settingsClose.addEventListener("click", () => closeSettingsAction());
  els.settingsModal.addEventListener("click", (event) => {
    if (event.target === els.settingsModal) closeSettingsAction();
  });

  els.llmForm.addEventListener("submit", saveSettings);
  els.llmTest.addEventListener("click", testConnection);
  els.llmPreset.addEventListener("change", onPresetChange);
  els.llmKeyToggle.addEventListener("click", toggleKeyVisibility);
  els.asrProfile.addEventListener("change", changeAsrProfile);

  els.llmPill.addEventListener("click", () => openSettingsAction());
  els.asrPill.addEventListener("click", () => openSettingsAction());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) {
      closeSettingsAction();
    }
  });
}

function openSettingsAction() {
  refreshStatusFromServer();
  syncFormFromStore();
  syncAsrFromStore();
  setLlmStatus("", "idle");
  setAsrStatus("", "idle");
  openSettings();
  isOpen = true;
  els.llmApiKey.focus();
}

function closeSettingsAction() {
  closeSettings();
  isOpen = false;
}

function toggleSettings() {
  if (isOpen) {
    closeSettingsAction();
  } else {
    openSettingsAction();
  }
}

export function refreshSettingsView() {
  syncFormFromStore();
  syncAsrFromStore();
}
