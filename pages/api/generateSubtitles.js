// pages/api/generateSubtitles.js
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import { SpeechClient } from '@google-cloud/speech';

export default async function handler(req, res) {
  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: 'Lipseste parametrul videoId.' });
  }
  
  try {
    // 1. Descărcăm audio-ul din YouTube folosind ytdl-core
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    // Generăm un nume temporar pentru fișierul audio
    const tempFilePath = path.join('/tmp', `${videoId}.mp3`);
    
    const audioStream = ytdl(videoUrl, { quality: 'highestaudio' });
    const writeStream = fs.createWriteStream(tempFilePath);
    
    await new Promise((resolve, reject) => {
      audioStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // 2. Citim fișierul audio și-l convertim în base64 pentru API-ul Speech-to-Text
    const fileBuffer = fs.readFileSync(tempFilePath);
    const audioBytes = fileBuffer.toString('base64');
    
    // 3. Configurăm clientul Speech-to-Text
    const client = new SpeechClient();
    const audio = { content: audioBytes };
    const config = {
      encoding: 'MP3',
      sampleRateHertz: 44100,  // ajustează dacă e necesar
      languageCode: 'ro-RO',
      enableAutomaticPunctuation: true,
      // Pentru a obține timpi (word time offsets) poți activa: enableWordTimeOffsets: true
    };
    const request = { audio, config };
    
    const [response] = await client.recognize(request);
    let transcription = '';
    response.results.forEach(result => {
      transcription += result.alternatives[0].transcript + '\n';
    });
    
    // Ștergem fișierul temporar
    fs.unlinkSync(tempFilePath);
    
    // La acest punct, `transcription` conține textul brut transcris din audio.
    // Aici poți apela un alt serviciu (de exemplu, un endpoint Python) pentru:
    // - Corectarea gramaticală (cu language_tool_python)
    // - Ajustarea timpilor și generarea unui fișier SRT cu timpi corecți
    // - Traducerea textului și generarea fișierelor audio cu Google Cloud Text-to-Speech
    
    res.status(200).json({ transcription });
  } catch (error) {
    console.error('Eroare la generarea subtitrărilor:', error);
    res.status(500).json({ error: error.message });
  }
}
