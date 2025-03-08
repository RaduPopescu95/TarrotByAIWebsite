// pages/api/getCaptions.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  const { videoId } = req.query;
  
  // Extragem tokenul din header și eliminăm prefixul "Bearer " dacă există
  let token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: "Token de acces lipsă." });
  }
  if (token.startsWith("Bearer ")) {
    token = token.slice("Bearer ".length);
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({ access_token: token });
  
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });
  
  try {
    const captionsList = await youtube.captions.list({
      part: 'id,snippet',
      videoId: videoId,
    });
    
    // Caută track-ul cu limba română
    const caption = captionsList.data.items.find(item => item.snippet.language === 'ro');
    if (!caption) {
      return res.status(404).json({ error: 'Nu s-au găsit subtitrări în limba română.' });
    }
    
    // Descărcarea fișierului .srt (tfmt poate fi 'srt' sau 'sbv')
    const captionData = await youtube.captions.download({
      id: caption.id,
      tfmt: 'srt'
    });
    
    res.status(200).send(captionData.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
