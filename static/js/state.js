export const ADVICE_KEYS = [
  "client_objection",
  "objection_type",
  "client_sentiment",
  "sales_stage",
  "recommended_response",
  "next_question",
  "product_recommendation",
  "risk_flag",
];

export const MIN_SEGMENT_MS = 300;

export const store = {
  sid: null,
  serverReady: null,
  recording: {
    active: false,
    userStopRequested: false,
    startedAt: 0,
    segment: null,
    keyHold: { client: false, manager: false },
  },
  media: {
    stream: null,
    recorder: null,
  },
  timers: {
    record: 0,
  },
  transcript: [],
  advice: null,
  metrics: {
    started_at: 0,
    duration_sec: 0,
    messages_total: 0,
    messages_client: 0,
    messages_manager: 0,
  },
  ui: {
    micGranted: false,
  },
  llm: {
    has_key: false,
    key_masked: "",
    base_url: "",
    effective_base_url: "",
    model: "",
    stub_mode: false,
    last_error: null,
  },
  asr: {
    model: "",
    device: "",
    compute_type: "",
    quality: "balanced",
    quality_options: ["fast", "balanced", "accurate"],
    beam_size: 3,
  },
};

export function resetSession() {
  store.transcript = [];
  store.advice = null;
  store.metrics = {
    started_at: Date.now() / 1000,
    duration_sec: 0,
    messages_total: 0,
    messages_client: 0,
    messages_manager: 0,
  };
}

export function speakerFromFlags(clientHeld, managerHeld) {
  if (clientHeld && !managerHeld) return "client";
  if (managerHeld && !clientHeld) return "manager";
  return null;
}

export function activeSpeaker() {
  const { client, manager } = store.recording.keyHold;
  return speakerFromFlags(client, manager);
}
