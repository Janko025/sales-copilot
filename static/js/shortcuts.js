import { store } from "./state.js";
import { setSpeakerPill } from "./ui.js";
import { beginSegment, endSegment } from "./recorder.js";

const PTT_KEYS = {
  ShiftLeft: "client",
  ShiftRight: "client",
  Space: "manager",
};

function isEditableTarget(target) {
  if (!target) return false;
  const tag = (target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea") return true;
  return Boolean(target.isContentEditable);
}

function emitSpeaker(socket, speaker) {
  if (!speaker) return;
  if (socket && socket.connected) {
    socket.emit("set_speaker", { speaker });
  }
}

function handlePttDown(event, socket) {
  const speaker = PTT_KEYS[event.code];
  if (!speaker) return false;
  if (isEditableTarget(event.target)) return false;
  if (!store.recording.active) return false;
  if (event.code === "Space") event.preventDefault();
  if (event.repeat) return true;

  if (store.recording.segment) return true;

  store.recording.keyHold[speaker] = true;
  setSpeakerPill();
  emitSpeaker(socket, speaker);
  beginSegment(speaker, socket);
  return true;
}

function handlePttUp(event) {
  const speaker = PTT_KEYS[event.code];
  if (!speaker) return false;

  if (store.recording.keyHold[speaker]) {
    store.recording.keyHold[speaker] = false;
  }
  const segment = store.recording.segment;
  if (segment && segment.speaker === speaker) {
    endSegment();
  }
  setSpeakerPill();
  return true;
}

export function bindGlobalShortcuts({ socket, actions }) {
  window.addEventListener("keydown", (event) => {
    if (handlePttDown(event, socket)) return;

    if (isEditableTarget(event.target)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    switch (event.key.toLowerCase()) {
      case "r":
        event.preventDefault();
        actions.toggleRecording();
        break;
      case "l":
        event.preventDefault();
        actions.toggleLang();
        break;
      case "t":
        event.preventDefault();
        actions.toggleTheme();
        break;
      case "c":
        event.preventDefault();
        actions.resetSession();
        break;
      case "e":
        event.preventDefault();
        actions.exportMarkdown();
        break;
      case "?":
      case "/":
        if (event.key === "?" || event.shiftKey) {
          event.preventDefault();
          actions.toggleShortcuts();
        }
        break;
      default:
        break;
    }
  });

  window.addEventListener("keyup", (event) => handlePttUp(event));

  window.addEventListener("blur", () => {
    store.recording.keyHold.client = false;
    store.recording.keyHold.manager = false;
    if (store.recording.segment) endSegment();
    setSpeakerPill();
  });
}
