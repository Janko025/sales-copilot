import { store } from "./state.js";
import { t } from "./i18n.js";
import {
  appendTranscript,
  applyServerReady,
  renderAdvice,
  renderMetrics,
  setAdviceThinking,
  setConnectionPill,
  showRecError,
  toast,
} from "./ui.js";

const RECONNECT_DELAY_MS = 1500;

class WsClient {
  constructor(url) {
    this.url = url;
    this.id = null;
    this.connected = false;
    this.handlers = new Map();
    this._closedByUser = false;
    this._connect();
  }

  _connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
    };

    this.ws.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.event === "connected") {
        this.id = message.data?.sid || null;
        this._emitLocal("connect");
        return;
      }
      this._emitLocal(message.event, message.data);
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.id = null;
      this._emitLocal("disconnect");
      if (!this._closedByUser) {
        setTimeout(() => this._connect(), RECONNECT_DELAY_MS);
      }
    };

    this.ws.onerror = () => this.ws.close();
  }

  _emitLocal(event, data) {
    const callbacks = this.handlers.get(event);
    if (callbacks) callbacks.forEach((cb) => cb(data));
  }

  on(event, callback) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event).push(callback);
  }

  emit(event, data = {}) {
    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  disconnect() {
    this._closedByUser = true;
    this.ws.close();
  }
}

function applyMetrics(metrics) {
  if (!metrics) return;
  Object.assign(store.metrics, metrics);
  renderMetrics();
}

function wsUrl() {
  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${window.location.host}/ws`;
}

export function connectSocket() {
  const socket = new WsClient(wsUrl());

  socket.on("connect", () => {
    store.sid = socket.id;
    setConnectionPill(true);
  });

  socket.on("disconnect", () => setConnectionPill(false));

  socket.on("server_ready", (payload) => applyServerReady(payload));

  socket.on("profile_saved", () => toast(t("toast.profileSaved"), "success"));

  socket.on("session_reset", ({ metrics }) => {
    applyMetrics(metrics);
    setAdviceThinking(false);
    toast(t("toast.sessionReset"), "info");
  });

  socket.on("transcript_update", (message) => {
    if (!message || !message.ok) {
      showRecError((message && message.error) || t("errors.unknown"));
      setAdviceThinking(false);
      return;
    }
    showRecError("");
    if (message.transcript && message.transcript.text) {
      appendTranscript(message.transcript);
    }
    applyMetrics(message.metrics);
    setAdviceThinking(Boolean(message.thinking));
  });

  socket.on("advice_update", (message) => {
    setAdviceThinking(false);
    if (!message) return;
    if (!message.ok) {
      if (message.error) showRecError(`LLM: ${message.error}`);
      return;
    }
    showRecError("");
    if (message.advice) {
      renderAdvice(message.advice, { merge: true });
    }
    applyMetrics(message.metrics);
  });

  return socket;
}
