export const RANGE_OPTIONS = [
  { value: "today", label: "Astăzi" },
  { value: "7d", label: "7 zile" },
  { value: "30d", label: "30 zile" },
  { value: "all", label: "Total" },
];

export const LIST_TABS = [
  { id: "evolutie", label: "Evoluție" },
  { id: "clasament", label: "Clasament" },
  { id: "videoclipuri", label: "Videoclipuri" },
];

export const DETAIL_TABS = [
  { id: "evolutie", label: "Evoluție" },
  { id: "interactiuni", label: "Interacțiuni" },
  { id: "informatii", label: "Informații" },
];

export const VALID_RANGES = new Set(["today", "7d", "30d", "all"]);
export const VALID_LIST_TABS = new Set(["evolutie", "clasament", "videoclipuri"]);
export const VALID_DETAIL_TABS = new Set(["evolutie", "interactiuni", "informatii"]);
export const PAGE_SIZE_OPTIONS = [20, 50, 100];

export const TRACKING_INFO =
  "Vizualizările se numără la deschiderea playerului (app + site), cu debounce per utilizator. Perioadele pe zile folosesc tracking-ul zilnic; Total pe carduri poate reflecta counter-ul lifetime.";
