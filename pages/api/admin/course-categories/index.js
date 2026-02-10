import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireDashboardAccess } from "../../../../lib/requireAuth";

function isCategoryLocales(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const db = getAdminDb();
  const collectionRef = db.collection("courseCategories");

  if (req.method === "GET") {
    try {
      console.info("[course-categories] GET");
      const snapshot = await collectionRef.orderBy("name", "asc").get();
      const categories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.info("[course-categories] GET ok", { count: categories.length });
      return res.status(200).json({ categories });
    } catch (err) {
      console.error("[course-categories] GET failed", err);
      return res.status(500).json({ error: "Failed to load categories" });
    }
  }

  if (req.method === "POST") {
    const { name, locales } = req.body || {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Invalid name" });
    }
    if (locales !== undefined && !isCategoryLocales(locales)) {
      return res.status(400).json({ error: "Invalid locales" });
    }
    try {
      console.info("[course-categories] POST");
      const payload = {
        name: name.trim(),
        ...(locales ? { locales } : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: "dashboard",
      };
      const ref = await collectionRef.add(payload);
      console.info("[course-categories] POST ok", { id: ref.id });
      return res.status(201).json({ id: ref.id });
    } catch (err) {
      console.error("[course-categories] POST failed", err);
      return res.status(500).json({ error: "Failed to create category" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
}
