// pages/api/listVideos.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  // Initializează clientul OAuth2 cu credențialele din .env
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  // Tokenul de acces trebuie să fie transmis de la client (ex.: în header Authorization)
  oauth2Client.setCredentials({ access_token: req.headers.authorization });
  
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });
  
  try {
    const response = await youtube.videos.list({
      part: 'snippet,contentDetails',
      mine: true,
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
