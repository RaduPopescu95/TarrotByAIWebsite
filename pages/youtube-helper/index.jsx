// pages/youtube-helper/index.jsx
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';

export default function YoutubeHelper() {
  // const router = useRouter();
  // const [videos, setVideos] = useState([]);
  // const [selectedVideo, setSelectedVideo] = useState(null);
  // const [captionContent, setCaptionContent] = useState('');
  // const [translatedSrt, setTranslatedSrt] = useState('');
  // const [audioContent, setAudioContent] = useState('');
  // const [accessToken, setAccessToken] = useState('');

  // useEffect(() => {
  //   console.log('Componenta YoutubeHelper s-a montat.');
  //   if (router.query.accessToken) {
  //     // Preia tokenul din query și îl salvează în state și localStorage
  //     setAccessToken(router.query.accessToken);
  //     localStorage.setItem('accessToken', router.query.accessToken);
  //   } else {
  //     // Încearcă să recuperezi tokenul din localStorage
  //     const token = localStorage.getItem('accessToken');
  //     if (token) {
  //       setAccessToken(token);
  //     }
  //   }
  // }, [router.query]);

  // // Funcție de deconectare: șterge token-ul și resetează state-ul
  // const handleLogout = () => {
  //   localStorage.removeItem('accessToken');
  //   setAccessToken('');
  // };

  // // Funcția pentru listarea videoclipurilor
  // const fetchVideos = async () => {
  //   if (!accessToken) {
  //     console.error("Access token-ul nu este disponibil!");
  //     return;
  //   }
  //   console.log('Fetching videos...');
  //   try {
  //     const res = await fetch('/api/listVideos', {
  //       headers: { Authorization: `Bearer ${accessToken}` }
  //     });
  //     const data = await res.json();
  //     console.log('Videos fetched:', data);
  //     setVideos(data.items || []);
  //   } catch (error) {
  //     console.error('Error fetching videos:', error);
  //   }
  // };

  // // Funcția pentru obținerea subtitrărilor pentru un videoclip selectat
  // const getCaptions = async (videoId) => {
  //   if (!accessToken) {
  //     console.error("Access token-ul nu este disponibil!");
  //     return;
  //   }
  //   console.log(`Fetching captions for videoId: ${videoId}`);
  //   try {
  //     let res = await fetch(`/api/getCaptions?videoId=${videoId}`, {
  //       headers: { Authorization: `Bearer ${accessToken}` }
  //     });
  //     if (res.ok) {
  //       // Dacă răspunsul este OK, preluăm subtitrările existente
  //       const text = await res.text();
  //       console.log('Captions fetched:', text);
  //       setCaptionContent(text);
  //     } else {
  //       const errorData = await res.json();
  //       console.error('Error fetching captions:', errorData);
  //       // Dacă nu s-au găsit subtitrări în limba română, încercăm generarea lor
  //       if (errorData.error === 'Nu s-au găsit subtitrări în limba română.') {
  //         console.log('Trying to generate subtitles from audio...');
  //         let resGen = await fetch(`/api/generateSubtitles?videoId=${videoId}`, {
  //           headers: { Authorization: `Bearer ${accessToken}` }
  //         });
  //         if (resGen.ok) {
  //           const dataGen = await resGen.json();
  //           console.log('Subtitles generated:', dataGen.transcription);
  //           setCaptionContent(dataGen.transcription);
  //         } else {
  //           const errDataGen = await resGen.json();
  //           console.error('Error generating subtitles:', errDataGen);
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error fetching captions:', error);
  //   }
  // };

  // Funcția pentru procesarea subtitrărilor (traducere, generare MP3 etc.)
  // const processSubtitles = async () => {
  //   console.log('Processing subtitles...');
  //   try {
  //     const res = await fetch('/api/processSubtitles', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         srtContent: captionContent,
  //         targetLanguage: 'en'
  //       })
  //     });
  //     const data = await res.json();
  //     console.log('Subtitles processed:', data);
  //     setTranslatedSrt(data.translatedSrt);
  //     setAudioContent(data.audioContent);
  //   } catch (error) {
  //     console.error('Error processing subtitles:', error);
  //   }
  // };

  return (
    null
    // <div style={{ padding: '20px' }}>
    //   <h1>MVP: Automatizare Subtitrări</h1>
      
    //   {/* Dacă nu avem token, afișăm link-ul de autentificare */}
    //   {!accessToken && (
    //     <div>
    //       <p>Nu ai token de acces. Pentru a-l obține, te rugăm să te autentifici cu Google:</p>
    //       <a href="/api/auth">Autentifică-te cu Google</a>
    //     </div>
    //   )}
      
    //   {/* Dacă avem token, afișăm funcționalitățile aplicației */}
    //   {accessToken && (
    //     <>
    //       <button onClick={fetchVideos}>
    //         Listă Videoclipuri
    //       </button>
    //       <button onClick={handleLogout} style={{ marginLeft: '10px' }}>
    //         Deconectare
    //       </button>
    //       <ul>
    //         {videos && videos.length > 0 ? (
    //           videos.map(video => (
    //             <li
    //               key={video.id}
    //               style={{ cursor: 'pointer' }}
    //               onClick={() => { 
    //                 console.log('Selected video:', video);
    //                 setSelectedVideo(video.id);
    //                 // Folosește video.contentDetails.videoId pentru a obține subtitrările
    //                 getCaptions(video.contentDetails.videoId);
    //               }}
    //             >
    //               {video.snippet.title}
    //             </li>
    //           ))
    //         ) : (
    //           <li>Nu există videoclipuri de afișat.</li>
    //         )}
    //       </ul>
    //     </>
    //   )}
      
    //   {captionContent && (
    //     <div>
    //       <h2>Subtitrări Originale</h2>
    //       <textarea rows="10" cols="80" value={captionContent} readOnly />
    //       <br />
    //       <button onClick={processSubtitles}>Procesează Subtitrări</button>
    //     </div>
    //   )}
      
    //   {translatedSrt && (
    //     <div>
    //       <h2>Subtitrări Traduse (.srt)</h2>
    //       <textarea rows="10" cols="80" value={translatedSrt} readOnly />
    //     </div>
    //   )}
      
    //   {audioContent && (
    //     <div>
    //       <h2>Audio MP3 (base64)</h2>
    //       <textarea rows="5" cols="80" value={audioContent} readOnly />
    //     </div>
    //   )}
    // </div>
  );
}
