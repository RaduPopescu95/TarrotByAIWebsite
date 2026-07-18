import {
  buildManualAstrologyAnalysis,
  buildManualSynastryAnalysis,
  translateAstrologyAnalysis,
  translateSynastryAnalysis,
  geocodePlace,
} from "../../../lib/adminPdf/astroData";
import {
  buildAstrologyPdfHtml,
  buildSynastryPdfHtml,
} from "../../../lib/adminPdf/pdfTemplates";
import { requireDashboardAccess } from "../../../lib/requireAuth";

// Building a full natal/synastry report fans out to many DivineAPI requests.
export const config = {
  maxDuration: 60,
};

const requiredPersonFields = ["full_name", "day", "month", "year", "lat", "lon"];

const validatePerson = (person, label) => {
  if (!person || typeof person !== "object") {
    return `${label}: date lipsă`;
  }
  for (const field of requiredPersonFields) {
    const value = person[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      return `${label}: câmpul "${field}" este obligatoriu`;
    }
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    requireDashboardAccess(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: "Neautorizat" });
  }

  const { mode, language } = req.body || {};

  try {
    if (mode === "geocode") {
      const geo = await geocodePlace(req.body?.query);
      if (!geo) {
        return res
          .status(404)
          .json({ error: "Nu am găsit coordonate pentru această locație." });
      }
      return res.status(200).json(geo);
    }

    if (mode === "astrology") {
      const person = req.body?.person;
      const validationError = validatePerson(person, "Persoană");
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const builtAnalysis = await buildManualAstrologyAnalysis(person);
      if (!builtAnalysis?.natalData?.data) {
        return res.status(502).json({
          error:
            "Serviciul de astrologie nu a returnat datele necesare. Încearcă din nou.",
        });
      }

      const analysis = await translateAstrologyAnalysis(builtAnalysis, language);
      const html = buildAstrologyPdfHtml(analysis, language);
      return res.status(200).json({
        html,
        fullName: analysis?.full_name || person.full_name || "astrograma",
      });
    }

    if (mode === "synastry") {
      const person1 = req.body?.person1;
      const person2 = req.body?.person2;
      const error1 = validatePerson(person1, "Persoana 1");
      const error2 = validatePerson(person2, "Persoana 2");
      if (error1 || error2) {
        return res.status(400).json({ error: error1 || error2 });
      }

      const builtAnalysis = await buildManualSynastryAnalysis(person1, person2);
      if (!builtAnalysis?.synastry?.natalWheelChart) {
        return res.status(502).json({
          error:
            "Serviciul de sinastrie nu a returnat datele necesare. Încearcă din nou.",
        });
      }

      const analysis = await translateSynastryAnalysis(builtAnalysis, language);
      const html = buildSynastryPdfHtml(analysis, language);
      const fullName = `${person1.full_name} & ${person2.full_name}`;
      return res.status(200).json({ html, fullName });
    }

    return res.status(400).json({ error: "Mod necunoscut (mode)." });
  } catch (error) {
    console.error("[astro-pdf] error:", error?.message || error);
    return res
      .status(500)
      .json({ error: "A apărut o eroare la generarea raportului." });
  }
}
