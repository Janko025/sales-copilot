import { store, MIN_SEGMENT_MS } from "./state.js";
import { getLang, t } from "./i18n.js";
import {
  els,
  setMicPill,
  setSpeakerPill,
  showRecError,
  refreshRecState,
} from "./ui.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatMs(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${pad2(minutes)}:${pad2(seconds % 60)}`;
}

function ensureMediaDevicesPolyfill() {
  try {
    if (!navigator.mediaDevices) navigator.mediaDevices = {};
  } catch {
    return false;
  }
  if (typeof navigator.mediaDevices.getUserMedia === "function") return true;
  const legacy =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;
  if (!legacy) return false;
  navigator.mediaDevices.getUserMedia = (constraints) =>
    new Promise((resolve, reject) => legacy.call(navigator, constraints, resolve, reject));
  return true;
}

function micEnvironmentBlocker() {
  if (!window.isSecureContext) return t("errors.micBlocked");
  if (!ensureMediaDevicesPolyfill()) return t("errors.noGetUserMedia");
  if (typeof navigator.mediaDevices.getUserMedia !== "function") {
    return t("errors.browserMic");
  }
  return null;
}

function micDeniedMessage(err) {
  if (!err) return t("errors.microphone");
  const name = err.name || "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return t("errors.micNotAllowed");
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return t("errors.micNotFound");
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return t("errors.micBusy");
  }
  return err.message || String(err);
}

async function requestStream() {
  const blocker = micEnvironmentBlocker();
  if (blocker) {
    const error = new Error(blocker);
    error.name = "MicEnvironmentError";
    throw error;
  }
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return (
    candidates.find(
      (mime) => window.MediaRecorder && MediaRecorder.isTypeSupported(mime),
    ) || ""
  );
}

function serverFormat(mime) {
  const value = (mime || "").toLowerCase();
  if (value.includes("ogg")) return "ogg";
  return "webm";
}

function stopTracks() {
  if (!store.media.stream) return;
  store.media.stream.getTracks().forEach((track) => track.stop());
  store.media.stream = null;
}

function clearTimers() {
  if (store.timers.record) {
    clearInterval(store.timers.record);
    store.timers.record = 0;
  }
}

function endLiveSessionUi() {
  store.recording.active = false;
  store.recording.userStopRequested = false;
  store.recording.segment = null;
  store.recording.keyHold.client = false;
  store.recording.keyHold.manager = false;
  clearTimers();
  els.btnRecord.disabled = false;
  els.btnRecord.dataset.state = "idle";
  els.btnStop.disabled = true;
  refreshRecState();
  setSpeakerPill();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string" || !result.includes(",")) {
        reject(new Error("encode"));
        return;
      }
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(blob);
  });
}

async function sendSegmentBlob(blob, speaker, format, socket) {
  if (!socket || !socket.connected) {
    showRecError(t("errors.serverDisconnected"));
    return;
  }
  let base64;
  try {
    base64 = await blobToBase64(blob);
  } catch {
    showRecError(t("errors.audioEncode"));
    return;
  }
  els.recState.textContent = t("rec.sending");
  socket.emit("audio_chunk", {
    audio_base64: base64,
    format,
    speaker,
    language: getLang(),
  });
}

export async function requestMicPermission() {
  showRecError("");
  try {
    const stream = await requestStream();
    stream.getTracks().forEach((track) => track.stop());
    store.ui.micGranted = true;
    setMicPill(t("status.micReady"), true);
    els.btnMicPerm.textContent = `${t("buttons.grantMicOk")} ✓`;
    els.btnMicPerm.dataset.state = "ok";
  } catch (error) {
    store.ui.micGranted = false;
    setMicPill(t("status.micDenied"), false);
    els.btnMicPerm.textContent = t("buttons.grantMic");
    delete els.btnMicPerm.dataset.state;
    showRecError(
      error?.name === "MicEnvironmentError" ? error.message : micDeniedMessage(error),
    );
  }
}

export async function startRecording(socket) {
  showRecError("");
  if (store.recording.active) return;
  if (!socket || !socket.connected) {
    showRecError(t("errors.serverDisconnected"));
    return;
  }
  els.btnRecord.disabled = true;
  els.btnRecord.dataset.state = "recording";
  els.btnStop.disabled = false;
  store.recording.active = true;
  store.recording.userStopRequested = false;
  store.recording.segment = null;
  store.recording.keyHold.client = false;
  store.recording.keyHold.manager = false;
  refreshRecState();
  setSpeakerPill();

  try {
    store.media.stream = await requestStream();
  } catch (error) {
    showRecError(
      error?.name === "MicEnvironmentError" ? error.message : micDeniedMessage(error),
    );
    endLiveSessionUi();
    return;
  }

  store.recording.startedAt = Date.now();
  els.recTimer.textContent = "00:00";
  store.timers.record = window.setInterval(() => {
    els.recTimer.textContent = formatMs(Date.now() - store.recording.startedAt);
  }, 250);
}

export function stopRecording() {
  if (!store.recording.active) return;
  store.recording.userStopRequested = true;
  refreshRecState();

  if (store.recording.segment) {
    store.recording.segment.discarded = true;
    store.recording.segment = null;
  }
  if (store.media.recorder && store.media.recorder.state === "recording") {
    try {
      store.media.recorder.stop();
    } catch {

    }
  }

  stopTracks();
  store.media.recorder = null;
  if (store.timers.record) {
    clearInterval(store.timers.record);
    store.timers.record = 0;
  }
  els.recTimer.textContent = formatMs(Date.now() - store.recording.startedAt);
  endLiveSessionUi();
}

export function toggleRecording(socket) {
  if (store.recording.active) {
    stopRecording();
  } else {
    startRecording(socket);
  }
}

export function beginSegment(speaker, socket) {
  if (!store.recording.active) return false;
  if (store.recording.segment) return false;
  if (!store.media.stream) return false;

  const mimeType = pickMimeType();
  const recorderOptions = mimeType ? { mimeType } : {};
  const format = serverFormat(mimeType);

  let recorder;
  try {
    recorder = new MediaRecorder(store.media.stream, recorderOptions);
  } catch (error) {
    showRecError(`MediaRecorder: ${error?.message || error}`);
    return false;
  }

  const segment = { speaker, startedAt: Date.now() };
  store.recording.segment = segment;
  store.media.recorder = recorder;

  let blob = null;
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) blob = event.data;
  };
  recorder.onstop = () => {

    if (store.media.recorder === recorder) store.media.recorder = null;
    if (segment.discarded) return;
    const durationMs = Date.now() - segment.startedAt;
    if (!blob || blob.size < 64 || durationMs < MIN_SEGMENT_MS) {
      refreshRecState();
      return;
    }
    sendSegmentBlob(blob, segment.speaker, format, socket);
  };

  try {
    recorder.start();
  } catch (error) {
    showRecError(`MediaRecorder: ${error?.message || error}`);
    store.recording.segment = null;
    store.media.recorder = null;
    return false;
  }
  refreshRecState();
  setSpeakerPill();
  return true;
}

export function endSegment() {
  const segment = store.recording.segment;
  if (!segment) return;
  store.recording.segment = null;
  const recorder = store.media.recorder;
  if (recorder && recorder.state === "recording") {
    try {
      recorder.stop();
    } catch {
      store.media.recorder = null;
    }
  }
  refreshRecState();
  setSpeakerPill();
}

export { micEnvironmentBlocker };
