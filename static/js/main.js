import { initLang, setLang, getLang } from "./i18n.js";
import { initTheme, setTheme, toggleTheme, getTheme } from "./theme.js";
import { store, resetSession } from "./state.js";
import {
  cacheElements,
  applyI18nToDom,
  applyServerReady,
  setConnectionPill,
  setMicPill,
  setSpeakerPill,
  refreshRecState,
  renderAdvice,
  renderMetrics,
  rerenderTranscript,
  showRecError,
  toast,
  openShortcuts,
  closeShortcuts,
  els,
} from "./ui.js";
import { connectSocket } from "./socket.js";
import { requestMicPermission, startRecording, stopRecording, micEnvironmentBlocker } from "./recorder.js";
import { exportJson, exportMarkdown } from "./exporter.js";
import { bindGlobalShortcuts } from "./shortcuts.js";
import { bindSettings, refreshSettingsView } from "./settings.js";
import { t } from "./i18n.js";

let socket = null;
let shortcutsOpen = false;

function refreshMicHint() {
  if (micEnvironmentBlocker()) {
    setMicPill(t("status.micCheck"), false);
  } else if (store.ui.micGranted) {
    setMicPill(t("status.micReady"), true);
  } else {
    setMicPill(t("status.micRequest"), false);
  }
}

function refreshAll() {
  applyI18nToDom();
  refreshRecState();
  setSpeakerPill();
  refreshMicHint();

  els.adviceBox.innerHTML = "";
  renderAdvice(store.advice);
  renderMetrics();
  rerenderTranscript();
  refreshSettingsView();
  if (store.serverReady) {
    applyServerReady(store.serverReady);
  }
}

function toggleLang() {
  const next = getLang() === "en" ? "ru" : "en";
  setLang(next);
  refreshAll();
}

function toggleThemeAction() {
  toggleTheme();
  els.btnTheme.textContent = getTheme() === "dark" ? t("theme.light") : t("theme.dark");
}

function resetSessionAction() {
  resetSession();
  rerenderTranscript();
  renderAdvice(null);
  renderMetrics();
  showRecError("");
  if (socket && socket.connected) socket.emit("reset_session");
  toast(t("toast.sessionReset"), "info");
}

function toggleShortcutsAction() {
  if (shortcutsOpen) {
    closeShortcuts();
    shortcutsOpen = false;
  } else {
    openShortcuts();
    shortcutsOpen = true;
  }
}

function bindButtons() {
  els.btnLang.addEventListener("click", toggleLang);
  els.btnTheme.addEventListener("click", toggleThemeAction);
  els.btnShortcuts.addEventListener("click", toggleShortcutsAction);
  els.btnReset.addEventListener("click", resetSessionAction);
  els.btnExportMd.addEventListener("click", exportMarkdown);
  els.btnExportJson.addEventListener("click", exportJson);
  els.btnMicPerm.addEventListener("click", requestMicPermission);
  els.btnRecord.addEventListener("click", () => startRecording(socket));
  els.btnStop.addEventListener("click", stopRecording);
  els.shortcutsClose.addEventListener("click", () => {
    closeShortcuts();
    shortcutsOpen = false;
  });
  els.shortcutsModal.addEventListener("click", (event) => {
    if (event.target === els.shortcutsModal) {
      closeShortcuts();
      shortcutsOpen = false;
    }
  });

  els.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(els.profileForm);
    const payload = {
      budget_range: data.get("budget_range") || "",
      product_interest_category: data.get("product_interest_category") || "",
      priority: data.get("priority") || "",
      experience_level: data.get("experience_level") || "",
      purchase_urgency: data.get("purchase_urgency") || "",
    };
    if (socket && socket.connected) socket.emit("client_profile", payload);
  });
}

function init() {
  initLang();
  initTheme();
  cacheElements();
  applyI18nToDom();
  setConnectionPill(false);
  renderAdvice(null);
  renderMetrics();
  bindButtons();
  bindSettings();
  socket = connectSocket();
  bindGlobalShortcuts({
    socket,
    actions: {
      toggleRecording: () =>
        store.recording.active ? stopRecording() : startRecording(socket),
      toggleLang,
      toggleTheme: toggleThemeAction,
      resetSession: resetSessionAction,
      exportMarkdown,
      toggleShortcuts: toggleShortcutsAction,
    },
  });
  refreshMicHint();
}

init();
