// pages/api/download-archive.js
import archiver from "archiver";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Preia ID-urile facturilor din corpul cererii (body)
      const { invoiceIds } = req.body;

      if (!invoiceIds || invoiceIds.length === 0) {
        return res
          .status(400)
          .json({ error: "Nu au fost furnizate ID-uri ale facturilor." });
      }

      // Setează răspunsul pentru a indica un fișier de tip ZIP
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=facturi_${Date.now()}.zip`
      );

      // Creează un obiect de arhivare
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);

      // Parcurge ID-urile facturilor și preia link-ul PDF folosind API-ul existent
      for (const invoiceId of invoiceIds) {
        try {
          // Obține URL-ul PDF al facturii folosind API-ul existent
          const pdfResponse = await fetch(
            `http://localhost:3000/api/get-invoice-pdf?invoiceId=${invoiceId}`
          );
          const { pdfUrl } = await pdfResponse.json();

          if (pdfUrl) {
            // Fetch pentru a obține conținutul PDF de la link-ul furnizat de Stripe
            const pdfBuffer = await fetch(pdfUrl).then((res) => res.buffer());

            // Aici adăugăm logica pentru a include ziua, luna și anul în numele fișierului PDF
            const invoiceDetailsResponse = await fetch(
              `http://localhost:3000/api/get-invoice-details?invoiceId=${invoiceId}`
            );
            const invoiceDetails = await invoiceDetailsResponse.json();

            // Obține data facturii (ziua și luna) din detaliile facturii
            const invoiceDate = new Date(invoiceDetails.created * 1000); // `created` este timestamp-ul în secunde
            const day = invoiceDate.getDate().toString().padStart(2, "0"); // Ziua (e.g., "05" pentru 5)
            const month = (invoiceDate.getMonth() + 1)
              .toString()
              .padStart(2, "0"); // Luna (e.g., "03" pentru Martie)
            const year = new Date().getFullYear(); // Anul curent

            // Construiește numele fișierului cu ziua, luna și anul curent
            const fileName = `Factura_${day}-${month}-${year}.pdf`;

            // Adaugă fișierul PDF în arhivă cu numele personalizat
            archive.append(pdfBuffer, { name: fileName });
          } else {
            console.error(
              `Nu am reușit să obțin link-ul PDF pentru factura ${invoiceId}`
            );
            archive.append(
              `Factura ${invoiceId} nu a fost găsită sau nu am reușit să obțin PDF-ul.`,
              { name: `${invoiceId}_not_found.txt` }
            );
          }
        } catch (error) {
          console.error(
            `Eroare la obținerea PDF-ului pentru factura ${invoiceId}:`,
            error
          );
          archive.append(`Factura ${invoiceId} nu a fost găsită.`, {
            name: `${invoiceId}_not_found.txt`,
          });
        }
      }

      // Finalizează arhivarea
      await archive.finalize();
    } catch (error) {
      console.error("Eroare la crearea arhivei ZIP:", error);
      res.status(500).send("Eroare la crearea arhivei ZIP.");
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end("Method Not Allowed");
  }
}
