import { normalizeLocale, readSingleQueryValue } from "../../../lib/courses";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { loadPremiumVideoLibraryVideos } from "../../../lib/loadPremiumVideoLibrary";
import { hasPremiumAccess } from "../../../lib/premiumAccess";
import { getOptionalAuth } from "../../../lib/requireAuth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  const decoded = await getOptionalAuth(req);
  const uid = decoded?.uid || null;
  let premiumActive = false;

  try {
    const db = getAdminDb();
    if (uid) {
      const userSnap = await db.collection("Users").doc(uid).get();
      if (userSnap.exists) {
        premiumActive = hasPremiumAccess(userSnap.data() || {});
      }
    }

    const localeRaw = readSingleQueryValue(req.query.locale);
    const locale = normalizeLocale(
      typeof localeRaw === "string" ? localeRaw : undefined,
      "ro"
    );

    const videos = await loadPremiumVideoLibraryVideos({ locale, premiumActive });

    return res.status(200).json({
      videos,
      locale,
      premiumActive,
      loggedIn: Boolean(uid),
    });
  } catch (error) {
    console.error("[premium.video-library] failed", error?.message || error);
    return res.status(500).json({ error: "Failed to load video library" });
  }
}
