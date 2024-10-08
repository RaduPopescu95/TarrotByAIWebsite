// Importul necesar pentru a lucra cu cereri și răspunsuri în Next.js
import { NextRequest } from "next/server";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Primiți textul și limba țintă din corpul cererii
    const { text, target } = req.body;

    // Adresa URL și opțiunile pentru noua API de traducere
    const url =
      "https://google-translate113.p.rapidapi.com/api/v1/translator/text";
    const options = {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "X-RapidAPI-Key": "fdb30fac7dmshee22c632d48569ap1d9819jsna577a39fffd6",
        "X-RapidAPI-Host": "google-translate113.p.rapidapi.com",
      },
      body: new URLSearchParams({
        from: "ro", // Limba sursă setată la Română
        to: target, // Utilizează limba țintă primită
        text: text, // Utilizează textul primit
      }),
    };

    try {
      // Efectuați cererea la API-ul de traducere
      const response = await fetch(url, options);
      const result = await response.json(); // Assuming the response is in JSON format
      res.status(200).json(result); // Send back the response data
    } catch (error) {
      console.error("API error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    // Răspundeți cu 405 pentru cererile non-POST
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
