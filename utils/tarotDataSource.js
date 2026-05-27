export const DATA_SOURCE_MODES = {
  RTDB: "rtdb",
  DUAL: "dual",
  FIRESTORE_PRIMARY: "firestore_primary",
};

export function getTarotDataSourceMode() {
  const raw = String(process.env.NEXT_PUBLIC_TAROT_DATA_SOURCE_MODE || "").toLowerCase();
  if (raw === DATA_SOURCE_MODES.DUAL) return DATA_SOURCE_MODES.DUAL;
  if (raw === DATA_SOURCE_MODES.FIRESTORE_PRIMARY) return DATA_SOURCE_MODES.FIRESTORE_PRIMARY;
  return DATA_SOURCE_MODES.RTDB;
}

export function getTarotDatasetKey(category, key) {
  return `${String(category || "").trim()}::${String(key || "").trim()}`;
}

const FIRESTORE_DATASETS = new Set([
  "Citire-Personalizata::Carti",
  "Citire-Personalizata::Categorii",
  "Citire-Personalizata::VarianteCarti",
  "Citire-Viitor::Carti",
  "Citire-Viitor::Categorii",
  "Others::Citate-Motivationale",
  "Others::Culori-Norocoase",
  "Others::Numere-Norocoase",
  "Others::Ore-Norocoase",
  "Others::PozaApi",
]);

export function isFirestoreEligibleDataset(category, key) {
  return FIRESTORE_DATASETS.has(getTarotDatasetKey(category, key));
}
