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

  const {
    query: { categoryId },
  } = req;
  const db = getAdminDb();
  const ref = db.collection("courseCategories").doc(categoryId);

  if (req.method === "GET") {
    try {
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ id: snap.id, ...snap.data() });
    } catch (_) {
      return res.status(500).json({ error: "Failed to load category" });
    }
  }

  if (req.method === "PUT") {
    const { name, locales } = req.body || {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Invalid name" });
    }
    if (locales !== undefined && !isCategoryLocales(locales)) {
      return res.status(400).json({ error: "Invalid locales" });
    }
    let existing;
    try {
      existing = await ref.get();
      if (!existing.exists) {
        return res.status(404).json({ error: "Category not found" });
      }
    } catch (_) {
      return res.status(500).json({ error: "Failed to load category" });
    }
    try {
      await ref.update({
        name: name.trim(),
        ...(locales ? { locales } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ id: categoryId });
    } catch (error) {
      if (error?.code === 5 || error?.message?.toLowerCase?.().includes("not found")) {
        return res.status(404).json({ error: "Category not found" });
      }
      return res.status(500).json({ error: "Failed to update category" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const categorySnap = await ref.get();
      if (!categorySnap.exists) {
        return res.status(404).json({ error: "Category not found" });
      }

      const linkedCoursesSnap = await db
        .collection("courses")
        .where("categoryIds", "array-contains", categoryId)
        .get();

      if (!linkedCoursesSnap.empty) {
        const linkedTitles = linkedCoursesSnap.docs
          .slice(0, 3)
          .map((docSnap) => docSnap.data()?.title || docSnap.id)
          .join(", ");
        const suffix = linkedCoursesSnap.size > 3 ? "..." : "";
        return res.status(409).json({
          error: `Categoria este folosită în ${linkedCoursesSnap.size} cursuri (${linkedTitles}${suffix}). Elimină categoria din cursuri înainte de ștergere.`,
          code: "CATEGORY_IN_USE",
          linkedCoursesCount: linkedCoursesSnap.size,
        });
      }

      await ref.delete();
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete category" });
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).end("Method Not Allowed");
}
