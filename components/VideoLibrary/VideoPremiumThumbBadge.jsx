/**
 * Corner badge for subscriber-only clips — star only (high contrast on thumbnails).
 */
export default function VideoPremiumThumbBadge({ label, compact = false }) {
  const tip = typeof label === "string" ? label.trim() : "";
  const a11y = tip ? { role: "img", "aria-label": tip } : { "aria-hidden": true };

  const iconClass = compact ? "h-2.5 w-2.5 shrink-0" : "h-4 w-4 shrink-0 opacity-95";

  const icon = (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.267 5.274c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.267-5.274-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z"
        clipRule="evenodd"
      />
    </svg>
  );

  if (compact) {
    return (
      <span
        {...a11y}
        title={tip || undefined}
        className="pointer-events-none absolute left-1 top-1 z-[11] inline-flex rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-1 text-amber-950 shadow-md ring-1 ring-white/50"
      >
        {icon}
      </span>
    );
  }

  return (
    <span
      {...a11y}
      title={tip || undefined}
      className="pointer-events-none absolute left-2 top-2 z-[11] inline-flex rounded-lg bg-gradient-to-br from-amber-100 via-amber-400 to-amber-600 p-1.5 text-amber-950 shadow-[0_2px_12px_rgba(180,83,9,0.35)] ring-1 ring-white/70"
    >
      {icon}
    </span>
  );
}
