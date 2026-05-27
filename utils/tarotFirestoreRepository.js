import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function getItemsCollectionPath(category, key) {
  const datasetId = `${sanitizeSegment(category)}__${sanitizeSegment(key)}`;
  return `TarotCatalog/${datasetId}/items`;
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const aId = Number(a?.id);
    const bId = Number(b?.id);
    if (Number.isFinite(aId) && Number.isFinite(bId)) return aId - bId;
    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
}

export async function getFirestoreDataset(category, key) {
  const path = getItemsCollectionPath(category, key);
  const snap = await getDocs(collection(db, path));
  const rows = [];
  snap.forEach((item) => rows.push(item.data()));
  return sortRows(rows);
}

export async function setFirestoreDatasetItem(category, key, data) {
  if (!data || data.id === undefined || data.id === null || data.id === "") {
    throw new Error("Missing data.id for Firestore dataset item.");
  }
  const path = getItemsCollectionPath(category, key);
  const ref = doc(collection(db, path), String(data.id));
  await setDoc(ref, data, { merge: false });
}

export async function updateFirestoreDatasetItem(category, key, id, data) {
  const path = getItemsCollectionPath(category, key);
  const ref = doc(collection(db, path), String(id));
  await updateDoc(ref, data);
}
