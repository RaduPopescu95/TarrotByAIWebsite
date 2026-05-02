export const getYoutubeEmbedUrl = (youtubeLink) => {
  // Verifică dacă link-ul este valid
  if (!youtubeLink || typeof youtubeLink !== 'string') {
    return null;
  }

  // Curăță link-ul de caractere nedorite
  const cleanLink = youtubeLink.replace(/^@+/, '').trim();
  
  // Verifică din nou după curățare
  if (!cleanLink) {
    return null;
  }

  let embedUrl = null;
  
  try {
    if (cleanLink.includes("list=") && !cleanLink.includes("watch?v=")) {
      // Este o listă de redare (fără videoclip principal în URL)
      const listId = cleanLink.split("list=")[1]?.split("&")[0];
      if (listId) {
        embedUrl = `https://www.youtube.com/embed/videoseries?list=${listId}`;
      }
    } else if (cleanLink.includes("watch?v=")) {
      // Este un videoclip individual
      const videoId = cleanLink.split("watch?v=")[1]?.split("&")[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (cleanLink.includes("youtu.be/")) {
      // Format scurt YouTube (youtu.be/VIDEO_ID)
      const videoId = cleanLink.split("youtu.be/")[1]?.split("?")[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (cleanLink.includes("youtube.com/embed/")) {
      // Link deja în format embed
      embedUrl = cleanLink;
    } else if (cleanLink.includes("youtube.com/shorts/")) {
      const videoId = cleanLink.split("youtube.com/shorts/")[1]?.split(/[?#/]/)[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (cleanLink.includes("youtube.com/live/")) {
      const videoId = cleanLink.split("youtube.com/live/")[1]?.split(/[?#/]/)[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch (error) {
    console.error('Error processing YouTube link:', cleanLink, error);
    return null;
  }
  
  return embedUrl;
};

export const getYoutubeVideoId = (youtubeLink) => {
  // Curăță link-ul de caractere nedorite
  const cleanLink = youtubeLink?.replace(/^@+/, '').trim();
  
  if (!cleanLink) return null;
  
  try {
    if (cleanLink.includes("watch?v=")) {
      return cleanLink.split("watch?v=")[1]?.split("&")[0];
    } else if (cleanLink.includes("youtu.be/")) {
      return cleanLink.split("youtu.be/")[1]?.split("?")[0];
    } else if (cleanLink.includes("youtube.com/embed/")) {
      return cleanLink.split("youtube.com/embed/")[1]?.split("?")[0];
    } else if (cleanLink.includes("youtube.com/shorts/")) {
      return cleanLink.split("youtube.com/shorts/")[1]?.split(/[?#/]/)[0] || null;
    } else if (cleanLink.includes("youtube.com/live/")) {
      return cleanLink.split("youtube.com/live/")[1]?.split(/[?#/]/)[0] || null;
    }
  } catch (error) {
    console.error('Error extracting video ID:', cleanLink, error);
  }
  
  return null;
};

export const handleYotubeLinksToArray = (links) => {
  let arr = [];
  // Verifică dacă inputul este un string și nu este gol
  if (typeof links === "string" && links.trim() !== "") {
    // Separă linkurile pe baza separatorului ';' și elimină spațiile albe de la începutul și sfârșitul fiecărui link
    const linkArray = links.split(";").map((link) => {
      // Curăță fiecare link de prefixul @ și alte caractere nedorite
      return link.replace(/^@+/, '').trim();
    });
    // Elimină orice string gol din array, care poate apărea dacă există două semne ';' consecutive
    arr = linkArray.filter((link) => link !== "" && link.length > 0);
    return arr;
  }
  // Dacă inputul nu este un string valid, returnează un array gol
  return arr;
};
