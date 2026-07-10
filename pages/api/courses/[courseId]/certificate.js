import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";
import {
  isCourseVisibleOnChannel,
  normalizeLocale,
  resolveCourseRequestChannel,
  resolveDate,
  toSafeCourse,
} from "../../../../lib/courses";
import { requireAuth } from "../../../../lib/requireAuth";
import { resolveCourseEntitlement } from "../../../../lib/courseSubscriptionAccess";
import { resolveCourseMediaClientBlock } from "../../../../lib/courseMobileClientGuard";
import { getCertificateLocaleCopy, resolveCertificateLocale } from "../../../../lib/certificateLocale";
import { buildCourseCertificatePdf } from "../../../../lib/certificatePdf";

function maskUid(value) {
  if (typeof value !== "string" || !value) return "unknown";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

function readLocale(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function prettifyEmailName(value) {
  if (typeof value !== "string" || !value.includes("@")) return null;
  const raw = value.split("@")[0] || "";
  if (!raw.trim()) return null;
  return raw
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");
}

function resolveRecipientName(authRecord, authEmail) {
  const displayName =
    typeof authRecord?.displayName === "string" ? authRecord.displayName.trim() : "";
  if (displayName) return displayName;

  const emailName = prettifyEmailName(authEmail);
  if (emailName) return emailName;

  return "Student";
}

function buildCertificateId({ issuedAt, uid, courseId }) {
  const date = issuedAt instanceof Date && !Number.isNaN(issuedAt.getTime()) ? issuedAt : new Date();
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const coursePart = (courseId || "course").replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6) || "COURSE";
  const uidPart = (uid || "user").replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6) || "USER";
  return `CZ-${y}${m}${d}-${coursePart}-${uidPart}`;
}

function slugifyFilename(value) {
  if (typeof value !== "string") return "course";
  const ascii = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || "course";
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
    console.warn("[courses.certificate] unauthorized", {
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

  const requestedLocale = normalizeLocale(readLocale(req.query?.locale), "ro");
  const copyLocale = resolveCertificateLocale(requestedLocale);
  const contentLocale = requestedLocale;

  console.info("[courses.certificate] start", {
    courseId,
    uid: maskUid(authUser.uid),
    locale: requestedLocale,
    copyLocale,
  });

  try {
    const clientBlock = await resolveCourseMediaClientBlock(req);
    if (clientBlock) {
      console.info("[courses.certificate] client_blocked", {
        courseId,
        uid: maskUid(authUser.uid),
        minAppVersion: clientBlock.body?.minAppVersion || null,
        platform: clientBlock.body?.platform || null,
      });
      return res.status(clientBlock.status).json(clientBlock.body);
    }

    const db = getAdminDb();

    const courseSnap = await db.collection("courses").doc(courseId).get();

    if (!courseSnap.exists) {
      console.warn("[courses.certificate] course_not_found", {
        courseId,
        uid: maskUid(authUser.uid),
      });
      return res.status(404).json({ error: "Course not found" });
    }

    const courseData = courseSnap.data() || {};
    const channel = resolveCourseRequestChannel(req);
    const courseVisible = isCourseVisibleOnChannel(courseData, channel, Date.now());
    const entitlement = await resolveCourseEntitlement(db, authUser.uid, courseId, courseData, {
      courseVisible,
    });

    if (entitlement.accessSource === "free") {
      console.info("[courses.certificate] free_course_no_certificate", {
        courseId,
        uid: maskUid(authUser.uid),
      });
      return res.status(403).json({
        error: "Certificate is only available for purchased courses",
      });
    }

    if (!entitlement.hasAccess) {
      console.info("[courses.certificate] access_denied", {
        courseId,
        uid: maskUid(authUser.uid),
      });
      return res.status(403).json({ error: "No active entitlement for this course" });
    }

    const purchaseSnap = await db
      .collection("users")
      .doc(authUser.uid)
      .collection("purchases")
      .doc(courseId)
      .get();
    const purchaseData = purchaseSnap.exists ? purchaseSnap.data() || {} : {};

    const safeCourse = toSafeCourse(courseId, courseData, contentLocale);
    const courseTitle = safeCourse?.title || "Course";

    let authRecord = null;
    try {
      authRecord = await getAdminAuth().getUser(authUser.uid);
    } catch (authRecordError) {
      console.warn("[courses.certificate] auth_user_lookup_failed", {
        uid: maskUid(authUser.uid),
        message: authRecordError?.message || "unknown_error",
      });
    }

    const recipientName = resolveRecipientName(authRecord, authUser?.email || "");
    const purchasedAt =
      purchaseData.status === "paid"
        ? resolveDate(purchaseData.purchasedAt) || new Date()
        : new Date();
    const certificateId = buildCertificateId({
      issuedAt: purchasedAt,
      uid: authUser.uid,
      courseId,
    });
    const copy = getCertificateLocaleCopy(copyLocale);

    const pdfBuffer = await buildCourseCertificatePdf({
      localeCode: copyLocale,
      copy,
      recipientName,
      courseTitle,
      issuedAt: purchasedAt,
      certificateId,
    });

    const safeCourseSlug = slugifyFilename(courseTitle);
    const filename = `certificat-${safeCourseSlug}-${copyLocale}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    console.info("[courses.certificate] success", {
      courseId,
      uid: maskUid(authUser.uid),
      locale: requestedLocale,
      copyLocale,
      filename,
    });

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("[courses.certificate] failed", {
      courseId,
      uid: maskUid(authUser.uid),
      locale: requestedLocale,
      copyLocale,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to generate certificate" });
  }
}
