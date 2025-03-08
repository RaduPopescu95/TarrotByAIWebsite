// pages/api/auth.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (req.method === 'GET') {
    if (!req.query.code) {
      const scopes = [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ];
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
      });
      return res.redirect(authUrl);
    } else {
      const code = req.query.code;
      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        // Redirecționează către pagina Youtube Helper cu tokenul în query
        return res.redirect(`/youtube-helper?accessToken=${tokens.access_token}`);
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
