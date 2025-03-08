// pages/index.js
import { useEffect, useState } from 'react';

export default function YoutubeHelper() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [captionContent, setCaptionContent] = useState('');
  const [translatedSrt, setTranslatedSrt] = useState('');
  const [audioContent, setAudioContent] = useState('');
  useEffect(() => {
    console.log('Componenta YoutubeHelper s-a montat.');
  }, []);
  
  // Exemplu: tokenul de acces se va obține din fluxul OAuth real; aici folosim un placeholder.
  const accessToken = 'YOUR_ACCESS_TOKEN';

  // Listăm videoclipurile
  const fetchVideos = async () => {
    console.log('Fetching videos...');
    try {
      const res = await fetch('/api/listVideos', {
        headers: { Authorization: accessToken }
      });
      const data = await res.json();
      console.log('Videos fetched:', data);
      setVideos(data.items || []); // Dacă data.items este undefined, setează un array gol
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  // Obținem subtitrările pentru videoclipul selectat
  const getCaptions = async (videoId) => {
    console.log(`Fetching captions for videoId: ${videoId}`);
    try {
      const res = await fetch(`/api/getCaptions?videoId=${videoId}`, {
        headers: { Authorization: accessToken }
      });
      const text = await res.text();
      console.log('Captions fetched:', text);
      setCaptionContent(text);
    } catch (error) {
      console.error('Error fetching captions:', error);
    }
  };

  // Procesăm subtitrările: corectare, traducere și generare MP3
  const processSubtitles = async () => {
    console.log('Processing subtitles...');
    try {
      const res = await fetch('/api/processSubtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srtContent: captionContent,
          targetLanguage: 'en'
        })
      });
      const data = await res.json();
      console.log('Subtitles processed:', data);
      setTranslatedSrt(data.translatedSrt);
      setAudioContent(data.audioContent);
    } catch (error) {
      console.error('Error processing subtitles:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>MVP: Automatizare Subtitrări</h1>
      <button onClick={fetchVideos}>Listă Videoclipuri</button>
      <ul>
      {videos && videos.length > 0 ? (
  videos.map(video => (
    <li key={video.id} style={{ cursor: 'pointer' }}
        onClick={() => { 
          console.log('Selected video:', video);
          setSelectedVideo(video.id); 
          getCaptions(video.id); 
        }}>
      {video.snippet.title}
    </li>
  ))
) : (
  <li>Nu există videoclipuri de afișat.</li>
)}

      </ul>
      
      {captionContent && (
        <div>
          <h2>Subtitrări Originale</h2>
          <textarea rows="10" cols="80" value={captionContent} readOnly />
          <br />
          <button onClick={processSubtitles}>Procesează Subtitrări</button>
        </div>
      )}
      
      {translatedSrt && (
        <div>
          <h2>Subtitrări Traduse (.srt)</h2>
          <textarea rows="10" cols="80" value={translatedSrt} readOnly />
        </div>
      )}
      
      {audioContent && (
        <div>
          <h2>Audio MP3 (base64)</h2>
          <textarea rows="5" cols="80" value={audioContent} readOnly />
        </div>
      )}



    </div>
  );
}
