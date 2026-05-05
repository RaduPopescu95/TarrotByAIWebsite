# Videoteca site (`videosVideoModule`)

Lista publică de videoclipuri este servită doar prin **`GET /api/premium/video-library`** (Firebase Admin SDK). În răspuns **nu** se expune câmpul `videoUrl` brut decât rezultând într-o adresă **`embedSrc`** permisă și doar dacă utilizatorul are drept de redare (teaser public sau `hasPremiumAccess`).

Pentru costuri, API-ul nu mai scanează `videosVideoModule` la fiecare request. Citește cache-ul materializat din **`internalCaches/videoLibraryPublic`**; dacă documentul lipsește sau are versiune invalidă, serverul îl reconstruiește o singură dată din `videosVideoModule`. Dashboard-ul de videotecă apelează **`POST /api/admin/video-library-cache/rebuild`** după create/update/delete/publish pentru a ține cache-ul sincronizat.

## Pentru ce să revizuiți regulile Firebase

Dashboard-ul pentru videotecă ([`videos.service.ts`](../src/features/video-library-admin/services/videos.service.ts)) folosește **client Firebase SDK** către aceeași colecție. Dacă regulile Firestore permit **`read`** anonim pe `videosVideoModule`, browserul poate descărca documentele întregi, inclusiv `videoUrl`.

## Recomandare

În Firebase Console → Firestore → Rules:

1. Împiedicați `read` pentru clienții neautorizați pentru `videosVideoModule` dacă aceștia pot totuși să obțină datele și fără cont de admin — sau restrângeți lista la utilizatori cu claim de admin, după cum modelați și restul CRM-ului.
2. Împiedicați `read` public și pentru `internalCaches`, deoarece documentul materializat este o optimizare server-side, nu un API client.
3. Pentru că site-ul citește prin Admin SDK pe server (**nu** prin client), regula strictă de read nu întrerupe biblioteca `/videouri` atâta timp cât backend-ul folosește **service account** cu drepturi de admin/read.

Adaptați textul efectiv al regulilor cu **owner_uid/custom claims** după aceeași schemă pe care deja o folosiți pentru alte tabele sensibile în proiect.
