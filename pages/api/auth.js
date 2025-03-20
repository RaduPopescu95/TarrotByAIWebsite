// // pages/api/auth.js
// import { google } from 'googleapis';

// export default async function handler(req, res) {
//   console.log("Request method:", req.method);
//   console.log("Query parameters:", req.query);

//   const oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
//   );

//   if (req.method === 'GET') {
//     if (!req.query.code) {
//       console.log("Nu s-a găsit codul de autentificare în query. Se generează URL-ul de autentificare.");
//       // Definim scopurile necesare pentru aplicație
//       const scopes = [
//         'https://www.googleapis.com/auth/youtube.readonly',
//         'https://www.googleapis.com/auth/youtube.force-ssl',
//       ];

//       // Generăm URL-ul de autentificare Google
//       const authUrl = oauth2Client.generateAuthUrl({
//         access_type: 'offline',
//         scope: scopes,
//         prompt: 'consent',
//       });
//       console.log("URL-ul de autentificare generat:", authUrl);

//       // Redirecționăm utilizatorul către acest URL
//       return res.redirect(authUrl);
//     } else {
//       // Dacă am primit 'code' în query, înseamnă că Google ne-a redirecționat înapoi
//       const code = req.query.code;
//       console.log("Cod de autentificare primit:", code);
//       try {
//         // Obținem token-urile de acces (access_token, refresh_token, etc.)
//         const { tokens } = await oauth2Client.getToken(code);
//         console.log('Tokens from Google:', tokens);

//         // Setăm credențialele în clientul OAuth2
//         oauth2Client.setCredentials(tokens);

//         console.log("Redirect către youtube-helper cu accessToken:", tokens.access_token);
//         // Redirecționăm către pagina youtube-helper, trimițând access_token în query
//         return res.redirect(`/youtube-helper?accessToken=${tokens.access_token}`);
//       } catch (error) {
//         console.error('Eroare la obținerea token-urilor:', error);
//         // În caz de eroare, returnăm un mesaj și detalii
//         return res.status(500).json({
//           error: 'Eroare la obținerea token-urilor.',
//           details: error.message,
//         });
//       }
//     }
//   } else {
//     console.error("Metodă nepermisă:", req.method);
//     // Dacă nu este un request GET, returnăm status 405
//     return res.status(405).json({ error: 'Metoda nu este permisă.' });
//   }
// }
