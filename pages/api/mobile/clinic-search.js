import { readSingleQueryValue } from "../../../lib/courses";
import { loadClinicSearch } from "../../../lib/mobilePublicData";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  try {
    const payload = await loadClinicSearch({
      city: readSingleQueryValue(req.query.city),
      clinicLimit: readSingleQueryValue(req.query.clinicLimit),
      doctorLimit: readSingleQueryValue(req.query.doctorLimit),
      subcollectionLimit: readSingleQueryValue(req.query.subcollectionLimit),
    });
    return res.status(200).json(payload);
  } catch (error) {
    console.error("[mobile.clinic-search] failed", error?.message || error);
    return res.status(500).json({
      error: "Failed to load clinic search",
      clinicsAroundPatient: [],
      doctorsAroundPatient: [],
    });
  }
}
