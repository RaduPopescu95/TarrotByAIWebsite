import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import type {
  VideoCategoryDoc,
  VideoCategoryLocales,
  VideoCreateInput,
  VideoDoc,
  VideoUpdateInput,
} from "../types/video";
import { sortVideos } from "../utils/videoSorting";

const COLLECTION_NAME = "videosVideoModule";
const CATEGORY_COLLECTION_NAME = "videoCategories";
const videosCollection = collection(db, COLLECTION_NAME);
const categoriesCollection = collection(db, CATEGORY_COLLECTION_NAME);
const metaDocRef = doc(db, COLLECTION_NAME, "_meta");

const getNextOrder = async (): Promise<number> => {
  const metaSnapshot = await getDoc(metaDocRef);
  if (metaSnapshot.exists()) {
    return await runTransaction(db, async (tx) => {
      const metaSnap = await tx.get(metaDocRef);
      const lastOrder = metaSnap.data()?.lastOrder;
      const nextOrder = typeof lastOrder === "number" ? lastOrder + 1 : 1;
      tx.set(metaDocRef, { lastOrder: nextOrder }, { merge: true });
      return nextOrder;
    });
  }

  const lastOrderQuery = query(videosCollection, orderBy("order", "desc"), limit(1));
  const lastSnap = await getDocs(lastOrderQuery);
  const lastDoc = lastSnap.docs[0];
  const lastOrder = lastDoc?.data()?.order;
  const baseOrder = typeof lastOrder === "number" ? lastOrder : 0;

  return await runTransaction(db, async (tx) => {
    const metaSnap = await tx.get(metaDocRef);
    if (metaSnap.exists()) {
      const existingOrder = metaSnap.data()?.lastOrder;
      const nextOrder = typeof existingOrder === "number" ? existingOrder + 1 : baseOrder + 1;
      tx.set(metaDocRef, { lastOrder: nextOrder }, { merge: true });
      return nextOrder;
    }
    const nextOrder = baseOrder + 1;
    tx.set(metaDocRef, { lastOrder: nextOrder }, { merge: true });
    return nextOrder;
  });
};

export async function listVideos(): Promise<VideoDoc[]> {
  const snapshot = await getDocs(videosCollection);
  const items: VideoDoc[] = snapshot.docs.map((d) => {
    const data = d.data() as Omit<VideoDoc, "id">;
    return { id: d.id, ...data };
  });
  return sortVideos(items);
}

export async function createVideo(input: VideoCreateInput): Promise<VideoDoc> {
  const nextOrder = input.order ?? (await getNextOrder());
  const payload = {
    ...input,
    isPublished: !!input.isPublished,
    order: nextOrder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(videosCollection, payload);
  return { id: ref.id, ...(payload as Omit<VideoDoc, "id">) } as VideoDoc;
}

export async function updateVideo(id: string, data: VideoUpdateInput): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteVideo(id: string): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, id);
  await deleteDoc(ref);
}

export async function togglePublish(id: string, isPublished: boolean): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, id);
  await updateDoc(ref, { isPublished, updatedAt: serverTimestamp() });
}

export async function listVideoCategories(): Promise<VideoCategoryDoc[]> {
  const snapshot = await getDocs(categoriesCollection);
  const items = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Omit<VideoCategoryDoc, "id">;
    return { id: docSnap.id, ...data };
  });
  return items
    .filter((item) => typeof item.name === "string" && item.name.trim().length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addVideoCategory(
  name: string,
  locales?: VideoCategoryLocales
): Promise<VideoCategoryDoc> {
  const payload = {
    name: name.trim(),
    locales,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(categoriesCollection, payload);
  return { id: ref.id, ...(payload as Omit<VideoCategoryDoc, "id">) } as VideoCategoryDoc;
}

export async function deleteVideoCategoryByName(name: string): Promise<void> {
  const snapshot = await getDocs(categoriesCollection);
  const target = snapshot.docs.find((docSnap) => {
    const data = docSnap.data() as { name?: string };
    return data.name?.toLowerCase() === name.toLowerCase();
  });
  if (!target) return;
  await deleteDoc(doc(db, CATEGORY_COLLECTION_NAME, target.id));
}
