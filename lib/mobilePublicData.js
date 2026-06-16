import { getAdminDb } from "./firebaseAdmin";
import { withFirestoreCostLog } from "./firestoreCostLogger";
import { slugify } from "./slugify";

const serializeFirestoreValue = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = serializeFirestoreValue(val);
    }
    return out;
  }
  return value;
};

const normalizeLimit = (value, fallback = 120, max = 300) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : "";

const docToObject = (docSnap) => ({
  id: docSnap.id,
  ...serializeFirestoreValue(docSnap.data() || {}),
});

const getRating = (reviews) => {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + (Number(review?.rating) || 0), 0);
  return sum / reviews.length;
};

const enrichClinic = (clinic) => {
  const data = { ...clinic };
  if (Array.isArray(data.clinicImagesURI)) {
    data.clinicMainImage = data.clinicImagesURI.find((image) => image?.isMainImg) || "";
  } else {
    data.clinicMainImage = "";
  }
  const reviews = Array.isArray(data.clinicReviews) ? data.clinicReviews : [];
  data.ratingMedia = getRating(reviews);
  data.numberOfReviews = reviews.length;
  return data;
};

const enrichDoctor = (doctor) => {
  const data = { ...doctor };
  const reviews = Array.isArray(data.doctorReviews) ? data.doctorReviews : [];
  data.ratingMedia = getRating(reviews);
  data.numberOfReviews = reviews.length;
  return data;
};

const loadDoctorUnregisteredAppointments = async (db, doctorId, limit, queryName) => {
  const normalizedDoctorId = normalizeString(doctorId);
  if (!normalizedDoctorId) return [];
  const appointmentsSnap = await withFirestoreCostLog(
    {
      page: "api.mobile.clinic-search",
      queryName,
      locale: "ro",
      isrRevalidateSeconds: 300,
    },
    () =>
      db
        .collection("Doctors")
        .doc(normalizedDoctorId)
        .collection("clinicAppointmentsUnregisteredDocCol")
        .limit(limit)
        .get()
  );
  return appointmentsSnap.docs.map(docToObject);
};

export async function loadVarianteCarti({ carte, categorie }) {
  const normalizedCarte = normalizeString(carte);
  const normalizedCategorie = normalizeString(categorie);
  if (!normalizedCarte || !normalizedCategorie) return [];

  const db = getAdminDb();
  const snap = await withFirestoreCostLog(
    {
      page: "api.mobile.variante-carti",
      queryName: "VarianteCarti.byCarteCategorie",
      locale: "ro",
      isrRevalidateSeconds: 86400,
    },
    () =>
      db
        .collection("VarianteCarti")
        .where("carte", "==", normalizedCarte)
        .where("categorie", "==", normalizedCategorie)
        .get()
  );

  return snap.docs
    .map((docSnap) => docSnap.data()?.data)
    .filter((value) => value !== undefined && value !== null);
}

export async function loadPositiveAffirmations({ limit } = {}) {
  const db = getAdminDb();
  const resolvedLimit = normalizeLimit(limit, 120, 300);
  const snap = await withFirestoreCostLog(
    {
      page: "api.mobile.positive-affirmations",
      queryName: "AfirmatiiPozitive.initial",
      locale: "ro",
      isrRevalidateSeconds: 86400,
    },
    () => db.collection("AfirmatiiPozitive").limit(resolvedLimit).get()
  );
  return snap.docs.map(docToObject).filter((item) => item?.info);
}

export async function loadVideoCategories() {
  const db = getAdminDb();
  const snap = await withFirestoreCostLog(
    {
      page: "api.mobile.video-categories",
      queryName: "videoCategories.all",
      locale: "ro",
      isrRevalidateSeconds: 86400,
    },
    () => db.collection("videoCategories").orderBy("name", "asc").get()
  );
  return snap.docs.map((docSnap) => {
    const obj = docToObject(docSnap);
    obj.slug = slugify(obj.name || "");
    return obj;
  });
}

export async function loadClinicSearch({ city, clinicLimit, doctorLimit, subcollectionLimit }) {
  const normalizedCity = normalizeString(city);
  if (!normalizedCity) {
    return { clinicsAroundPatient: [], doctorsAroundPatient: [] };
  }

  const db = getAdminDb();
  const resolvedClinicLimit = normalizeLimit(clinicLimit, 50, 100);
  const resolvedDoctorLimit = normalizeLimit(doctorLimit, 50, 100);
  const resolvedSubcollectionLimit = normalizeLimit(subcollectionLimit, 50, 100);

  const clinicSnap = await withFirestoreCostLog(
    {
      page: "api.mobile.clinic-search",
      queryName: "Users.byClinicCity",
      locale: "ro",
      isrRevalidateSeconds: 300,
    },
    () =>
      db
        .collection("Users")
        .where("clinicCity", "==", normalizedCity)
        .limit(resolvedClinicLimit)
        .get()
  );

  const clinicsAroundPatient = clinicSnap.docs.map((docSnap) =>
    enrichClinic({ id: docSnap.id, ...(docSnap.data() || {}) })
  );

  await Promise.all(
    clinicsAroundPatient.map(async (clinic) => {
      const ownerUid = normalizeString(clinic.owner_uid || clinic.id);
      if (!ownerUid) {
        clinic.clinicDoctors = [];
        return;
      }
      const doctorsSnap = await withFirestoreCostLog(
        {
          page: "api.mobile.clinic-search",
          queryName: "Users.Doctors.byClinic",
          locale: "ro",
          isrRevalidateSeconds: 300,
        },
        () =>
          db
            .collection("Users")
            .doc(ownerUid)
            .collection("Doctors")
            .limit(resolvedSubcollectionLimit)
            .get()
      );
      clinic.clinicDoctors = await Promise.all(
        doctorsSnap.docs.map(async (docSnap) => {
          const doctor = enrichDoctor({ id: docSnap.id, ...(docSnap.data() || {}) });
          doctor.clinicAppointmentsUnregistered = await loadDoctorUnregisteredAppointments(
            db,
            docSnap.id,
            resolvedSubcollectionLimit,
            "Users.Doctors.clinicAppointmentsUnregisteredDocCol"
          );
          return doctor;
        })
      );
    })
  );

  const doctorsSnap = await withFirestoreCostLog(
    {
      page: "api.mobile.clinic-search",
      queryName: "Doctors.byClinicCity",
      locale: "ro",
      isrRevalidateSeconds: 300,
    },
    () =>
      db
        .collection("Doctors")
        .where("clinicCity", "==", normalizedCity)
        .limit(resolvedDoctorLimit)
        .get()
  );

  const doctorsAroundPatient = await Promise.all(
    doctorsSnap.docs.map(async (docSnap) => {
      const doctor = enrichDoctor({ id: docSnap.id, ...(docSnap.data() || {}) });
      doctor.clinicAppointmentsUnregistered = await loadDoctorUnregisteredAppointments(
        db,
        docSnap.id,
        resolvedSubcollectionLimit,
        "Doctors.clinicAppointmentsUnregisteredDocCol"
      );
      return doctor;
    })
  );

  return { clinicsAroundPatient, doctorsAroundPatient };
}
