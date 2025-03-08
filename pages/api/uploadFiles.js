// pages/api/uploadFiles.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  const { videoId, captionFileContent, audioFileContent } = req.body;
  
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
    // Upload-ul subtitrărilor (.srt)
    const captionResponse = await youtube.captions.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          videoId: videoId,
          language: 'en', // presupunem traducerea în engleză
          name: 'Subtitrări traduse',
          isDraft: false,
        },
      },
      media: {
        mimeType: 'application/octet-stream',
        body: Buffer.from(captionFileContent, 'utf-8'),
      }
    });
    
    // Pentru fișierul audio, se poate salva local sau se poate integra într-un alt serviciu,
    // deoarece YouTube API nu permite încărcarea unei piste audio separate pe un videoclip existent.
    
    res.status(200).json({ captionResponse });
  } catch (error) {
    console.error('Eroare la upload:', error);
    res.status(500).json({ error: error.message });
  }
}
