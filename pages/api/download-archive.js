// pages/api/download-archive.js

import archiver from "archiver";
import fetch from "node-fetch";
import getStream from "get-stream";

export default async function handler(req, res) {
  // Folosește direct URL-ul de bază
  const baseUrl = "cristinazurba.com";

  if (req.method === "POST") {
    try {
      const { invoiceIds } = req.body;
      if (!invoiceIds || invoiceIds.length === 0) {
        return res
          .status(400)
          .json({ error: "Nu au fost furnizate ID-uri ale facturilor." });
      }

      // Creează o arhivă ZIP cu nivel maxim de compresie
      const archive = archiver("zip", { zlib: { level: 9 } });

      // Ascultă eventualele erori din timpul arhivării
      archive.on("error", (err) => {
        console.error("Eroare la arhivare:", err);
        if (!res.headersSent) {
          res.status(500).send("Eroare la crearea arhivei ZIP.");
        }
      });

      // Procesează facturile în paralel pentru a reduce timpul total
      const invoiceFiles = await Promise.all(
        invoiceIds.map(async (invoiceId) => {
          try {
            // Obține URL-ul PDF al facturii din API-ul existent
            const pdfResponse = await fetch(
              `https://${baseUrl}/api/get-invoice-pdf?invoiceId=${invoiceId}`
            );
            if (!pdfResponse.ok) {
              throw new Error(
                `Fetch PDF pentru invoice ${invoiceId} a returnat statusul ${pdfResponse.status}`
              );
            }
            const { pdfUrl } = await pdfResponse.json();
            if (!pdfUrl) {
              throw new Error(`Link PDF indisponibil pentru invoice ${invoiceId}`);
            }

            // Efectuează simultan fetch pentru conținutul PDF și pentru detaliile facturii
            const [pdfFileResponse, invoiceDetailsResponse] = await Promise.all([
              fetch(pdfUrl),
              fetch(`https://${baseUrl}/api/get-invoice-details?invoiceId=${invoiceId}`),
            ]);

            if (!pdfFileResponse.ok) {
              throw new Error(
                `Fetch pentru fișierul PDF al invoice ${invoiceId} a eșuat cu status ${pdfFileResponse.status}`
              );
            }
            if (!invoiceDetailsResponse.ok) {
              throw new Error(
                `Fetch pentru detaliile invoice ${invoiceId} a returnat statusul ${invoiceDetailsResponse.status}`
              );
            }

            const pdfBuffer = await pdfFileResponse.buffer();
            const invoiceDetails = await invoiceDetailsResponse.json();

            // Extrage data facturii și construiește un nume de fișier unic
            const invoiceDate = new Date(invoiceDetails.created * 1000);
            const day = invoiceDate.getDate().toString().padStart(2, "0");
            const month = (invoiceDate.getMonth() + 1).toString().padStart(2, "0");
            const year = invoiceDate.getFullYear();
            const fileName = `Factura_${invoiceId}_${day}-${month}-${year}.pdf`;

            return { fileName, pdfBuffer };
          } catch (error) {
            console.error(
              `Eroare la procesarea facturii ${invoiceId}:`,
              error.message
            );
            return { fileName: `${invoiceId}_not_found.txt`, error: error.message };
          }
        })
      );

      // Adaugă fiecare fișier (PDF sau mesaj de eroare) în arhivă
      for (const file of invoiceFiles) {
        if (file.error) {
          archive.append(
            `Factura ${file.fileName} nu a fost procesată: ${file.error}`,
            { name: file.fileName }
          );
        } else {
          archive.append(file.pdfBuffer, { name: file.fileName });
        }
      }

      // Finalizează arhivarea
      archive.finalize();

      // Acumulăm întregul conținut al arhivei într-un buffer,
      // specificând { encoding: null } pentru a obține un Buffer
      const buffer = await getStream(archive, { encoding: null });

      // Setează headerele pentru descărcare și trimite fișierul ZIP
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=facturi_${Date.now()}.zip`
      );
      res.setHeader("Content-Length", buffer.length);

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
