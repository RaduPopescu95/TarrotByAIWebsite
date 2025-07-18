// // pages/api/listVideos.js
// import { google } from 'googleapis';

// export default async function handler(req, res) {
//   let accessToken = req.headers.authorization;
//   if (!accessToken) {
//     console.error("Token de acces lipsă în header.");
//     return res.status(401).json({ error: "Token de acces lipsă în header." });
//   }
//   if (accessToken.startsWith("Bearer ")) {
//     accessToken = accessToken.slice("Bearer ".length);
//   }

//   console.log("Tokenul de acces primit:", accessToken);

//   const oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
//   );
//   oauth2Client.setCredentials({ access_token: accessToken });

//   // Debug: Afișează data de expirare, dacă există
//   if (oauth2Client.credentials.expiry_date) {
//     console.log("Token expiry_date:", new Date(oauth2Client.credentials.expiry_date).toLocaleString());
//     console.log("Current time:", new Date().toLocaleString());
//   } else {
//     console.log("expiry_date nu este setat în credentials.");
//   }

//   // Verifică dacă token-ul a expirat și încearcă refresh-ul
//   if (oauth2Client.credentials.expiry_date && Date.now() >= oauth2Client.credentials.expiry_date) {
//     console.log("Tokenul a expirat. Se încearcă reîmprospătarea...");
//     try {
//       const { credentials } = await oauth2Client.refreshAccessToken();
//       oauth2Client.setCredentials(credentials);
//       console.log('Token reîmprospătat:', credentials.access_token);
//       // Dacă vrei, trimite și noul token în răspuns pentru client
//     } catch (error) {
//       console.error('Eroare la reîmprospătarea token-ului:', error);
//       return res.status(500).json({ error: 'Eroare la reîmprospătarea token-ului.' });
//     }
//   } else {
//     console.log("Tokenul este încă valid.");
//   }

//   const youtube = google.youtube({
//     version: 'v3',
//     auth: oauth2Client,
//   });

//   try {
//     console.log("Se obțin detaliile canalului...");
//     const channelResponse = await youtube.channels.list({
//       part: 'contentDetails',
//       mine: true,
//     });
//     console.log("Răspunsul canalului:", channelResponse.data);

//     if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
//       console.error("Canalul nu a fost găsit.");
//       return res.status(404).json({ error: "Canalul nu a fost găsit." });
//     }

//     const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
//     console.log("Uploads playlist ID:", uploadsPlaylistId);

//     let allVideos = [];
//     let nextPageToken = null;
//     let pageCount = 0;

//     do {
//       pageCount++;
//       console.log(`Se preiau videoclipurile - pagina ${pageCount}, nextPageToken:`, nextPageToken);
//       const playlistResponse = await youtube.playlistItems.list({
//         part: 'snippet,contentDetails',
//         playlistId: uploadsPlaylistId,
//         maxResults: 50,
//         pageToken: nextPageToken,
//       });
//       console.log(`Videoclipuri primite pentru pagina ${pageCount}:`, playlistResponse.data.items?.length || 0);
//       allVideos = allVideos.concat(playlistResponse.data.items);
//       nextPageToken = playlistResponse.data.nextPageToken;
//     } while (nextPageToken);

//     console.log("Total videoclipuri preluate:", allVideos.length);
//     res.status(200).json({ items: allVideos });
//   } catch (error) {
//     console.error("Eroare la YouTube API:", error);
//     res.status(500).json({ error: error.message });
//   }
// }
