import { handleQueryFirestore } from "./firestoreUtils";

// Faza 2 + 3 a unificarii: web-ul citeste VarianteCarti prin acelasi endpoint public
// folosit de aplicatia mobile (/api/public/variante-carti -> lib/loadVarianteCarti),
// in loc sa interogheze Firestore direct din client.
//
// Flag de siguranta pentru rollback instant: setand NEXT_PUBLIC_USE_API_READS="false"
// se revine la citirea directa din Firestore, fara a schimba randarea.
const useApiReads = () =>
  String(process.env.NEXT_PUBLIC_USE_API_READS ?? "true").toLowerCase() !== "false";

const buildQuery = (params) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      usp.append(key, String(value));
    }
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
};

// FORMA CANONICA (Faza 3): un element de varianta este intotdeauna `{ data: <varianta> }`,
// exact cum o consuma CitirePersonalizatDialog (`item.data.*`). Ambele cai de citire
// (API si fallback Firestore) trec prin acest singur normalizator, deci sunt complet
// interschimbabile, iar randarea ramane neschimbata indiferent de sursa.
//
// IMPORTANT: nu schimbam aici forma asteptata de dialog, pentru ca acelasi dialog este
// folosit si de paginile de istoric (istoric-citiri-personalizate / istoric-citiri-viitor),
// unde inregistrarile salvate au forme mixte. Unificarea se face strict la nivel de client.
const wrapVariant = (variant) => ({ data: variant });

const hasUsableVariant = (variant) =>
  variant !== undefined && variant !== null;

/**
 * Returneaza variantele pentru o (carte, categorie) in forma canonica `{ data: <varianta> }`.
 *
 * - Calea API: /api/public/variante-carti intoarce { arr: [<varianta>] } (doar campul `.data`
 *   din documentul Firestore). Reimpachetam fiecare element ca { data }.
 * - Fallback: la orice eroare de retea/raspuns se revine la handleQueryFirestore, care intoarce
 *   documentul complet `{ carte, categorie, data }`; extragem `.data` ca sa obtinem EXACT
 *   aceeasi forma canonica ca pe calea API.
 */
export async function queryVarianteCartiUnified(carte, categorie) {
  if (useApiReads()) {
    try {
      const res = await fetch(
        `/api/public/variante-carti${buildQuery({ carte, categorie })}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) {
        throw new Error(`variante-carti request failed with status ${res.status}`);
      }
      const payload = await res.json();
      const arr = Array.isArray(payload?.arr) ? payload.arr : [];
      return arr.filter(hasUsableVariant).map(wrapVariant);
    } catch (error) {
      console.warn(
        "[varianteCarti] citirea prin API a esuat, revin la Firestore:",
        error?.message || error
      );
    }
  }

  const docs = await handleQueryFirestore(
    "VarianteCarti",
    "carte",
    carte,
    "categorie",
    categorie
  );

  return (Array.isArray(docs) ? docs : [])
    .map((doc) => doc?.data)
    .filter(hasUsableVariant)
    .map(wrapVariant);
}
