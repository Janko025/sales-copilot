import { store } from "./state.js";
import { t } from "./i18n.js";
import { toast } from "./ui.js";

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function hasContent() {
  return store.transcript.length > 0 || store.advice !== null;
}

function buildPayload() {
  return {
    exported_at: new Date().toISOString(),
    session_id: store.sid,
    metrics: store.metrics,
    transcript: store.transcript,
    advice: store.advice,
  };
}

function buildMarkdown() {
  const payload = buildPayload();
  const lines = [
    "# AI Sales Copilot — Session",
    "",
    `- **Exported:** ${payload.exported_at}`,
    `- **Session ID:** ${payload.session_id || "—"}`,
    `- **Messages:** ${payload.metrics.messages_total || 0} ` +
      `(client: ${payload.metrics.messages_client || 0}, ` +
      `manager: ${payload.metrics.messages_manager || 0})`,
    "",
    "## Transcript",
    "",
  ];
  if (!payload.transcript.length) {
    lines.push("_empty_");
  } else {
    for (const item of payload.transcript) {
      const who = item.role === "client" ? "Client" : "Manager";
      lines.push(`- **${who}:** ${item.text}`);
    }
  }
  lines.push("", "## Last AI advice", "");
  if (!payload.advice) {
    lines.push("_no advice yet_");
  } else {
    for (const key of Object.keys(payload.advice)) {
      lines.push(`- **${key}:** ${payload.advice[key] || "—"}`);
    }
  }
  return lines.join("\n");
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function exportJson() {
  if (!hasContent()) {
    toast(t("toast.exportEmpty"), "warn");
    return;
  }
  const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], {
    type: "application/json;charset=utf-8",
  });
  triggerDownload(blob, `ai-copilot-session-${timestamp()}.json`);
  toast(t("toast.exportReady"), "success");
}

export function exportMarkdown() {
  if (!hasContent()) {
    toast(t("toast.exportEmpty"), "warn");
    return;
  }
  const blob = new Blob([buildMarkdown()], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, `ai-copilot-session-${timestamp()}.md`);
  toast(t("toast.exportReady"), "success");
}
