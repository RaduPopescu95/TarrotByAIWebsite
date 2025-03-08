// pages/api/listVideos.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  let accessToken = req.headers.authorization;
  if (!accessToken) {
    return res.status(401).json({ error: "Token de acces lipsă în header." });
  }

  // Eliminăm prefixul "Bearer " dacă există
  if (accessToken.startsWith("Bearer ")) {
    accessToken = accessToken.slice("Bearer ".length);
  }

  console.log("Tokenul de acces primit:", accessToken);

  // Inițializăm clientul OAuth2
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  try {
    // 1. Preluăm informațiile canalului pentru a obține uploads playlist id
    const channelResponse = await youtube.channels.list({
      part: 'contentDetails',
      mine: true,
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).json({ error: "Canalul nu a fost găsit." });
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
    console.log("Uploads playlist ID:", uploadsPlaylistId);

    // 2. Preluăm toate videoclipurile din uploads playlist, folosind paginarea
    let allVideos = [];
    let nextPageToken = null;

    do {
      const playlistResponse = await youtube.playlistItems.list({
        part: 'snippet,contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      allVideos = allVideos.concat(playlistResponse.data.items);
      nextPageToken = playlistResponse.data.nextPageToken;
    } while (nextPageToken);

    res.status(200).json({ items: allVideos });
  } catch (error) {
    console.error("Eroare la YouTube API:", error);
    res.status(500).json({ error: error.message });
  }
}
