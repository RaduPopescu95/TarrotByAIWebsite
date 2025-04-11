// pages/api/download-archive.js

import archiver from "archiver";
import fetch from "node-fetch";
import getStream from "get-stream";

export default async function handler(req, res) {
  // Utilizează variabila de mediu pentru URL-ul de bază sau folosește valoarea implicită
  const baseUrl = process.env.API_URL || "cristinazurba.com";

  if (req.method === "POST") {
    try {
      // Preia ID-urile facturilor din corpul cererii (body)
      const { invoiceIds } = req.body;
      if (!invoiceIds || invoiceIds.length === 0) {
        return res
          .status(400)
          .json({ error: "Nu au fost furnizate ID-uri ale facturilor." });
      }

      // Creează un obiect de arhivare ZIP cu nivel de compresie maxim
      const archive = archiver("zip", { zlib: { level: 9 } });

      // Atașează un handler pentru erori la procesul de arhivare
      archive.on("error", (err) => {
        console.error("Eroare la arhivare:", err);
        // Este posibil ca răspunsul să fi fost deja inițiat,
        // dar în orice caz trimitem un mesaj de eroare
        res.status(500).send("Eroare la crearea arhivei ZIP.");
      });

      // Parcurge fiecare ID din invoiceIds și încearcă să adauge PDF-ul în arhivă
      for (const invoiceId of invoiceIds) {
        try {
          // Obține URL-ul PDF pentru factura dată
          const pdfResponse = await fetch(
            `https://${baseUrl}/api/get-invoice-pdf?invoiceId=${invoiceId}`
          );
          if (!pdfResponse.ok) {
            throw new Error(
              `Fetch PDF pentru invoice ${invoiceId} a returnat statusul ${pdfResponse.status}`
            );
          }
          const { pdfUrl } = await pdfResponse.json();

          if (pdfUrl) {
            // Obține conținutul PDF ca buffer
            const pdfFileResponse = await fetch(pdfUrl);
            if (!pdfFileResponse.ok) {
              throw new Error(
                `Fetch pentru fișierul PDF al invoice ${invoiceId} a eșuat cu status ${pdfFileResponse.status}`
              );
            }
            const pdfBuffer = await pdfFileResponse.buffer();

            // Preia detaliile facturii pentru a construi numele fișierului
            const invoiceDetailsResponse = await fetch(
              `https://${baseUrl}/api/get-invoice-details?invoiceId=${invoiceId}`
            );
            if (!invoiceDetailsResponse.ok) {
              throw new Error(
                `Fetch pentru detaliile invoice ${invoiceId} a returnat statusul ${invoiceDetailsResponse.status}`
              );
            }
            const invoiceDetails = await invoiceDetailsResponse.json();

            // Extrage data facturii din detalii
            const invoiceDate = new Date(invoiceDetails.created * 1000);
            const day = invoiceDate.getDate().toString().padStart(2, "0");
            const month = (invoiceDate.getMonth() + 1).toString().padStart(2, "0");
            const year = invoiceDate.getFullYear();

            // Construiește numele fișierului folosind invoiceId pentru unicitate
            const fileName = `Factura_${invoiceId}_${day}-${month}-${year}.pdf`;

            // Adaugă PDF-ul în arhivă
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
      // Acumulăm tot conținutul arhivei într-un buffer folosind getStream
      const buffer = await getStream.buffer(archive);

      // Setează headerele pentru descărcare
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=facturi_${Date.now()}.zip`
      );
      res.setHeader("Content-Length", buffer.length);

      // Trimite bufferul ca răspuns
      return res.status(200).end(buffer);
    } catch (error) {
      console.error("Eroare la crearea arhivei ZIP:", error);
      return res.status(500).send("Eroare la crearea arhivei ZIP.");
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end("Method Not Allowed");
  }
}
