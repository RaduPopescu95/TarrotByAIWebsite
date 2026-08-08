import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../lib/requireAuth";
import {
  PREMIUM_PRICE_CHANGE_SITE_NOTICE_VERSION,
  buildPriceChangeSiteNoticeRecord,
} from "../../../../lib/premiumPriceChangeConsent";

const ALLOWED_SOURCES = new Set(["site_banner", "accept_page"]);

async function findUserDocument(db, uid) {
  const directRef = db.collection("Users").doc(uid);
  const direct = await directRef.get();
  if (direct.exists) return { ref: directRef, data: direct.data() || {} };

  const byOwner = await db.collection("Users").where("owner_uid", "==", uid).limit(2).get();
  if (byOwner.docs.length !== 1) return null;
  return { ref: byOwner.docs[0].ref, data: byOwner.docs[0].data() || {} };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: error?.message || "Unauthorized" });
  }

  try {
    const rawSource = typeof req.body?.source === "string" ? req.body.source.trim() : "site_banner";
    const source = ALLOWED_SOURCES.has(rawSource) ? rawSource : "site_banner";

    const db = getAdminDb();
    const user = await findUserDocument(db, authUser.uid);
    if (!user) return res.status(404).json({ error: "User profile not found" });

    const notice = buildPriceChangeSiteNoticeRecord({
      source,
      version: PREMIUM_PRICE_CHANGE_SITE_NOTICE_VERSION,
      serverTimestamp: FieldValue.serverTimestamp(),
    });

    await user.ref.set({ premiumPriceChangeNotice: notice }, { merge: true });

    console.info("[premium.price-change-notice] acknowledged", {
      uid: authUser.uid,
      source,
      version: PREMIUM_PRICE_CHANGE_SITE_NOTICE_VERSION,
    });

    return res.status(200).json({
      ok: true,
      version: PREMIUM_PRICE_CHANGE_SITE_NOTICE_VERSION,
      source,
      acknowledged: true,
    });
  } catch (error) {
    console.error("[premium.price-change-notice] acknowledge_failed", {
      uid: authUser.uid,
      message: String(error?.message || "unknown_error").slice(0, 300),
    });
    return res.status(500).json({ error: "Could not acknowledge price change notice" });
  }
}
