import type {
  AdminUiLogEntry,
  AdminUiLogErrorPayload,
  AdminUiLogListResponse,
  AdminUiLogPayload,
} from "../types/adminUiLog";

const UI_LOGS_API_URL = "/api/admin/ui-logs";
const DASHBOARD_ACCESS_KEY = "dashboard_access_token";
const QUEUE_STORAGE_KEY = "admin_ui_logs_queue_v1";
const MAX_QUEUE_ITEMS = 200;
const MAX_KEYS_PER_OBJECT = 20;
const MAX_ITEMS_PER_ARRAY = 20;
const MAX_STRING_LENGTH = 500;
const MAX_DEPTH = 3;

function clipString(value: string, maxLength = MAX_STRING_LENGTH): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return clipString(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (depth >= MAX_DEPTH) return undefined;

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ITEMS_PER_ARRAY)
      .map((item) => sanitizeValue(item, depth + 1))
      .filter((item) => item !== undefined);
    return items;
  }

  if (isRecord(value)) {
    const safeRecord: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value).slice(0, MAX_KEYS_PER_OBJECT)) {
      const safeNested = sanitizeValue(nested, depth + 1);
      if (safeNested !== undefined) {
        safeRecord[clipString(key, 80)] = safeNested;
      }
    }
    return safeRecord;
  }

  return clipString(String(value));
}

function sanitizeRecord(value: unknown): Record<string, unknown> | undefined {
  const safeValue = sanitizeValue(value, 0);
  if (!isRecord(safeValue)) return undefined;
  return safeValue;
}

function sanitizeError(value: unknown): AdminUiLogErrorPayload | undefined {
  if (!isRecord(value)) return undefined;
  const name = typeof value.name === "string" ? clipString(value.name, 100) : undefined;
  const message = typeof value.message === "string" ? clipString(value.message, 500) : undefined;
  const stackTop = typeof value.stackTop === "string" ? clipString(value.stackTop, 500) : undefined;
  if (!name && !message && !stackTop) return undefined;
  return { name, message, stackTop };
}

function sanitizePayload(payload: AdminUiLogPayload): AdminUiLogPayload {
  return {
    source: payload.source,
    event: payload.event,
    level: payload.level,
    message: clipString(payload.message || "", 300),
    clientTs: Number.isFinite(payload.clientTs) ? payload.clientTs : Date.now(),
    sessionId: clipString(payload.sessionId || "unknown", 100),
    pagePath: clipString(payload.pagePath || "/dashboard/videos", 300),
    uiState: sanitizeRecord(payload.uiState),
    error: sanitizeError(payload.error),
    meta: sanitizeRecord(payload.meta),
  };
}

function getDashboardAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DASHBOARD_ACCESS_KEY);
  } catch (_) {
    return null;
  }
}

function readQueue(): AdminUiLogPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => isRecord(item)) as AdminUiLogPayload[];
  } catch (_) {
    return [];
  }
}

function writeQueue(queue: AdminUiLogPayload[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_ITEMS)));
  } catch (_) {}
}

function enqueue(payload: AdminUiLogPayload): void {
  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);
}

async function sendPayload(payload: AdminUiLogPayload): Promise<void> {
  const dashboardAccess = getDashboardAccessToken();
  const response = await fetch(UI_LOGS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(dashboardAccess ? { "X-Dashboard-Access": dashboardAccess } : {}),
    },
    body: JSON.stringify(payload),
    keepalive: true,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to persist admin UI log.");
  }
}

export async function flushAdminUiLogQueue(maxToFlush = 20): Promise<{
  flushed: number;
  remaining: number;
}> {
  const queue = readQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };

  let flushed = 0;
  while (queue.length > 0 && flushed < maxToFlush) {
    const current = queue[0];
    try {
      await sendPayload(current);
      queue.shift();
      flushed += 1;
    } catch (_) {
      break;
    }
  }
  writeQueue(queue);
  return { flushed, remaining: queue.length };
}

export async function logAdminUiEvent(payload: AdminUiLogPayload): Promise<{
  persisted: boolean;
  queued: boolean;
}> {
  const sanitized = sanitizePayload(payload);
  try {
    await sendPayload(sanitized);
    await flushAdminUiLogQueue(20);
    return { persisted: true, queued: false };
  } catch (_) {
    enqueue(sanitized);
    return { persisted: false, queued: true };
  }
}

export async function fetchAdminUiLogs(params?: {
  limit?: number;
  cursor?: string | null;
}): Promise<AdminUiLogListResponse> {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.cursor) search.set("cursor", params.cursor);

  const dashboardAccess = getDashboardAccessToken();
  const response = await fetch(
    `${UI_LOGS_API_URL}${search.toString() ? `?${search.toString()}` : ""}`,
    {
      method: "GET",
      headers: {
        ...(dashboardAccess ? { "X-Dashboard-Access": dashboardAccess } : {}),
      },
    }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to load admin UI logs.");
  }

  const logs = Array.isArray(data?.logs) ? (data.logs as AdminUiLogEntry[]) : [];
  const nextCursor = typeof data?.nextCursor === "string" ? data.nextCursor : null;
  return { logs, nextCursor };
}
