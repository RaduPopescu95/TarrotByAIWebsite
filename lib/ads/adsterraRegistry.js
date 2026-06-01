/**
 * Prevents duplicate Adsterra keys on one page (invalid duplicate container-* ids)
 * and caps total slots for a subtler experience.
 */

let mountedKeys = new Set();
let slotsThisPage = 0;

export function getAdsterraMaxSlotsPerPage() {
  const raw = process.env.NEXT_PUBLIC_ADSTERRA_MAX_SLOTS_PER_PAGE;
  const parsed = Number.parseInt(String(raw ?? "3"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export function resetAdsterraPageRegistry() {
  mountedKeys = new Set();
  slotsThisPage = 0;
}

/**
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function claimAdsterraSlot(key) {
  if (!key) return { ok: false, reason: "no-key" };
  if (mountedKeys.has(key)) return { ok: false, reason: "duplicate-key" };
  if (slotsThisPage >= getAdsterraMaxSlotsPerPage()) {
    return { ok: false, reason: "max-slots" };
  }
  mountedKeys.add(key);
  slotsThisPage += 1;
  return { ok: true };
}
