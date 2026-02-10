import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../lib/requireAuth";
import { extractVimeoId } from "../../../../lib/courses";

const COURSE_MEDIA_COLLECTION = "courseMedia";

function maskUid(value) {
  if (typeof value !== "string" || !value) return "unknown";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (err) {
    console.warn("[courses.entitlement] playback_unauthorized", {
      message: err?.message || "unauthorized",
    });
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const {
    query: { courseId },
  } = req;

  if (!courseId || typeof courseId !== "string") {
    return res.status(400).json({ error: "Missing courseId" });
  }

  console.info("[courses.entitlement] playback_start", {
    courseId,
    uid: maskUid(authUser.uid),
  });

  try {
    const db = getAdminDb();

    const purchaseSnap = await db
      .collection("users")
      .doc(authUser.uid)
      .collection("purchases")
      .doc(courseId)
      .get();

    if (!purchaseSnap.exists || purchaseSnap.data()?.status !== "paid") {
      console.info("[courses.entitlement] playback_denied", {
        courseId,
        uid: maskUid(authUser.uid),
      });
      return res.status(403).json({ error: "No active entitlement for this course" });
    }

    const [mediaSnap, courseSnap] = await Promise.all([
      db.collection(COURSE_MEDIA_COLLECTION).doc(courseId).get(),
      db.collection("courses").doc(courseId).get(),
    ]);

    if (!courseSnap.exists) {
      console.warn("[courses.entitlement] playback_course_not_found", {
        courseId,
        uid: maskUid(authUser.uid),
      });
      return res.status(404).json({ error: "Course not found" });
    }

    const mediaData = mediaSnap.exists ? mediaSnap.data() : null;
    const courseData = courseSnap.data() || {};
    const vimeoUrl =
      (typeof mediaData?.vimeoUrl === "string" && mediaData.vimeoUrl) ||
      (typeof courseData?.vimeoUrl === "string" ? courseData.vimeoUrl : "");
    const vimeoId = mediaData?.vimeoId || courseData?.vimeoId || extractVimeoId(vimeoUrl);

    if (!vimeoId) {
      console.warn("[courses.entitlement] playback_source_missing", {
        courseId,
        uid: maskUid(authUser.uid),
      });
      return res.status(404).json({ error: "Playback source not found" });
    }

    console.info("[courses.entitlement] playback_ok", {
      courseId,
      uid: maskUid(authUser.uid),
      provider: "vimeo",
    });

    return res.status(200).json({ provider: "vimeo", vimeoId });
  } catch (error) {
    console.error("[courses.entitlement] playback_failed", {
      courseId,
      uid: maskUid(authUser.uid),
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load playback source" });
  }
}
