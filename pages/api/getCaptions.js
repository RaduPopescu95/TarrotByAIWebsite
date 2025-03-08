// pages/api/getCaptions.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  const { videoId } = req.query;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: req.headers.authorization });
  
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
    // Descărcarea fișierului .srt (tfmt poate fi 'srt' sau 'sbv', conform documentației)
    const captionData = await youtube.captions.download({
      id: caption.id,
      tfmt: 'srt'
    });
    res.status(200).send(captionData.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
