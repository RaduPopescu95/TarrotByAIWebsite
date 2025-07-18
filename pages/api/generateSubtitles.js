// // pages/api/generateSubtitlesOpenAI.js
// import fs from 'fs';
// import path from 'path';
// import os from 'os';
// import { Configuration, OpenAIApi } from "openai";
// import ytdl from 'ytdl-core';

// export default async function handler(req, res) {
//   const { videoId } = req.query;
//   if (!videoId) {
//     return res.status(400).json({ error: 'Lipseste parametrul videoId.' });
//   }
  
//   try {
//     // 1. Construim URL-ul video și directorul temporar pentru fișierul audio
//     const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
//     const tempDir = path.join(process.cwd(), 'tmp');
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir, { recursive: true });
//     }
//     const tempFilePath = path.join(tempDir, `${videoId}.mp3`);
//     console.log(`Se descarcă audio-ul din ${videoUrl} în ${tempFilePath}`);
    
//     // 2. Descărcăm audio-ul de pe YouTube folosind ytdl-core (doar componenta audio)
//     const audioStream = ytdl(videoUrl, { quality: 'highestaudio', filter: 'audioonly' });
//     const writeStream = fs.createWriteStream(tempFilePath);
//     await new Promise((resolve, reject) => {
//       audioStream.pipe(writeStream);
//       writeStream.on('finish', resolve);
//       writeStream.on('error', reject);
//     });
    
//     // 3. Configurăm OpenAI API
//     const configuration = new Configuration({
//       apiKey: process.env.OPENAI_API_KEY, // Asigură-te că această variabilă este setată în mediul tău
//     });
//     const openai = new OpenAIApi(configuration);
    
//     console.log('Se trimite fișierul audio către OpenAI pentru transcriere...');
//     // 4. Folosim modelul "whisper-1" pentru transcriere; fișierul trebuie trimis ca stream
//     const transcriptionResponse = await openai.createTranscription(
//       fs.createReadStream(tempFilePath),
//       "whisper-1"
//     );
//     const transcription = transcriptionResponse.data.text;
    
//     // 5. Ștergem fișierul temporar
//     fs.unlinkSync(tempFilePath);
    
//     res.status(200).json({ transcription });
//   } catch (error) {
//     console.error("Eroare la generarea subtitrărilor cu OpenAI:", error);
//     res.status(500).json({ error: error.message });
//   }
// }
