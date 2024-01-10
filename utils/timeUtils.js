export function getCurrentDateTime() {
  const now = new Date();

  // Obține data în formatul "21-09-2023"
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Adăugați 1 la lună, deoarece indexul lunii începe de la 0
  const year = now.getFullYear();

  // Obține ora în formatul "16:00"
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const dateFormatted = `${day}-${month}-${year}`;
  const timeFormatted = `${hours}:${minutes}`;

  return {
    date: dateFormatted,
    time: timeFormatted,
  };
}
