import { handleQueryFirestore } from "./firestoreUtils";

// Faza 2 a unificarii: web-ul citeste VarianteCarti prin acelasi endpoint public
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

/**
 * Returneaza variantele pentru o (carte, categorie) in forma legacy `{ data: <varianta> }`,
 * exact cum o consuma CitirePersonalizatDialog (`item.data.*`), indiferent de sursa.
 *
 * - Calea API: /api/public/variante-carti intoarce { arr: [<.data>] }; reimpachetam fiecare
 *   element ca { data } pentru a pastra afisarea identica cu citirea directa din Firestore.
 * - Fallback: la orice eroare de retea/raspuns se revine la handleQueryFirestore (doc complet),
 *   care expune deja `.data`, deci dialogul ramane neschimbat.
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
      return arr.map((data) => ({ data }));
    } catch (error) {
      console.warn(
        "[varianteCarti] citirea prin API a esuat, revin la Firestore:",
        error?.message || error
      );
    }
  }

  return handleQueryFirestore(
    "VarianteCarti",
    "carte",
    carte,
    "categorie",
    categorie
  );
}
