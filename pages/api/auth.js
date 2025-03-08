// pages/api/auth.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  // Inițializarea clientului OAuth2 cu variabilele din .env
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Tratarea metodei GET
  if (req.method === 'GET') {
    // Dacă nu există query parameter "code", inițiem fluxul de autentificare
    if (!req.query.code) {
      // Definim scope-urile necesare pentru YouTube API (în funcție de ce ai nevoie)
      const scopes = [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ];
      // Generăm URL-ul de autorizare
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
      });
      // Redirecționăm utilizatorul către pagina de consimțământ Google
      return res.redirect(authUrl);
    } else {
      // Dacă "code" este prezent, înseamnă că suntem în callback-ul de la Google
      const code = req.query.code;
      try {
        // Schimbăm codul primit pentru tokenuri
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        // Pentru o aplicație reală, ar trebui să stochezi token-urile (în sesiune, cookie etc.)
        return res.status(200).json({ tokens });
      } catch (error) {
        return res.status(500).json({
          error: 'Eroare la obținerea token-urilor.',
          details: error.message,
        });
      }
    }
  } else {
    return res.status(405).json({ error: 'Metoda nu este permisă.' });
  }
}
