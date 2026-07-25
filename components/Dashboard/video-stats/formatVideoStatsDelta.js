/**
 * Format comparison vs previous period without fake +100% when previous is 0.
 * @returns {{ label: string, tone: "emerald"|"rose"|"slate", absoluteDiff: number }}
 */
export function formatVideoStatsDelta(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  const absoluteDiff = cur - prev;

  if (prev <= 0) {
    if (cur <= 0) {
      return { label: "—", tone: "slate", absoluteDiff: 0 };
    }
    return {
      label: `+${cur} față de perioada anterioară`,
      tone: "slate",
      absoluteDiff: cur,
      isNewActivity: true,
    };
  }

  const pct = Math.round((absoluteDiff / prev) * 100);
  if (pct > 0) {
    return { label: `+${pct}%`, tone: "emerald", absoluteDiff };
  }
  if (pct < 0) {
    return { label: `${pct}%`, tone: "rose", absoluteDiff };
  }
  return { label: "0%", tone: "slate", absoluteDiff: 0 };
}

export function formatRelativeUpdatedAt(updatedAtMs, nowMs = Date.now()) {
  if (!Number.isFinite(updatedAtMs) || updatedAtMs <= 0) return "—";
  const diffMs = Math.max(0, nowMs - updatedAtMs);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Actualizat acum câteva secunde";
  if (minutes === 1) return "Actualizat acum 1 minut";
  if (minutes < 60) return `Actualizat acum ${minutes} minute`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Actualizat acum 1 oră";
  return `Actualizat acum ${hours} ore`;
}

export function platformLabel(platform) {
  if (platform === "bunny") return "Bunny";
  if (platform === "vimeo") return "Vimeo";
  if (platform === "youtube") return "YouTube";
  return platform || "—";
}

export function formatDayRo(day) {
  if (typeof day !== "string" || day.length < 10) return day || "";
  try {
    const date = new Date(`${day}T12:00:00`);
    return new Intl.DateTimeFormat("ro-RO", {
      day: "numeric",
      month: "short",
    }).format(date);
  } catch {
    const [, month, date] = day.split("-");
    return `${date}.${month}`;
  }
}

export function titleInitial(title) {
  const value = typeof title === "string" ? title.trim() : "";
  if (!value) return "?";
  return value.slice(0, 1).toUpperCase();
}
