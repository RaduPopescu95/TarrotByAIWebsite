export type AdminUiLogSource = "videos.create";

export type AdminUiLogLevel = "info" | "warn" | "error";

export type AdminUiLogEvent =
  | "create_button_pointerdown"
  | "create_button_click"
  | "create_modal_opened"
  | "create_modal_closed"
  | "create_modal_open_timeout"
  | "create_runtime_error"
  | "create_submit_start"
  | "create_submit_success"
  | "create_submit_error";

export type AdminUiLogErrorPayload = {
  name?: string;
  message?: string;
  stackTop?: string;
};

export type AdminUiLogPayload = {
  source: AdminUiLogSource;
  event: AdminUiLogEvent;
  level: AdminUiLogLevel;
  message: string;
  clientTs: number;
  sessionId: string;
  pagePath: string;
  uiState?: Record<string, unknown>;
  error?: AdminUiLogErrorPayload;
  meta?: Record<string, unknown>;
};

export type AdminUiLogEntry = AdminUiLogPayload & {
  id: string;
  createdAtMs: number | null;
  createdAtIso: string | null;
};

export type AdminUiLogListResponse = {
  logs: AdminUiLogEntry[];
  nextCursor: string | null;
};
