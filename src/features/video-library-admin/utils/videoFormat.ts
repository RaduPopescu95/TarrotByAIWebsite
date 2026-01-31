import type { Timestamp } from "firebase/firestore";

export function formatTimestamp(value?: Timestamp | null): string {
  if (!value) return "—";
  try {
    if (typeof (value as Timestamp).toDate === "function") {
      const d = (value as Timestamp).toDate();
      return d.toLocaleString("ro-RO");
    }
    const anyVal = value as unknown as { seconds?: number };
    if (typeof anyVal?.seconds === "number") {
      const d = new Date(anyVal.seconds * 1000);
      return d.toLocaleString("ro-RO");
    }
  } catch (_) {}
  return "—";
}

export function clampNumber(value?: number, min = 0, max = 999999): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.min(Math.max(value, min), max);
}
