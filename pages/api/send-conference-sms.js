const Twilio = require("twilio");
const moment = require("moment");

// Configurații Twilio - aceleași ca în functions/index.js
const accountSid = "AC6cf01717a74bbf7cc02d4a723db53232";
const authToken = "8c6b979039e8d0fb5aa878dcc2eefac6";
const twilioPhoneNumber = "+15042266134";

// Inițializare client Twilio
const client = new Twilio(accountSid, authToken);

// Lista de UIDs autorizate (eliminat restricțiile)
const authorizedUIDs = [
  "zFsAwNZA5bUonVRIQzRn2HZB3y62",
  "BhJZdiWVQJNnbLOCGWxzjGHVjHB2", 
  "MSBePxFVcVO3vsfM5nwHr36ROfh2",
  "AW8kjQIhAiaJM5q0QgGlOKpGF2j1"
];

export default async function handler(req, res) {
  console.log("🚀 [CONFERENCE SMS API] Request primit:", req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipients, conferenceData, smsType, userUID } = req.body;

    // Verifică UID-ul utilizatorului (opțional - poate fi eliminat)
    if (!userUID) {
      console.error("❌ [CONFERENCE SMS API] UID lipsă:", userUID);
      return res.status(403).json({ error: 'UID utilizator necesar pentru trimiterea SMS-urilor.' });
    }
    console.log("✅ [CONFERENCE SMS API] Utilizator autentificat:", userUID);

    // Validează datele de intrare
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Lista de destinatari este invalidă' });
    }

    if (!conferenceData) {
      return res.status(400).json({ error: 'Datele conferinței lipsesc' });
    }

    if (!smsType || !['confirmation', 'reminder'].includes(smsType)) {
      return res.status(400).json({ error: 'Tipul SMS-ului trebuie să fie "confirmation" sau "reminder"' });
    }

    console.log("📱 [CONFERENCE SMS API] Destinatari:", recipients.length);
    console.log("📅 [CONFERENCE SMS API] Conferința:", conferenceData.titlu);
    console.log("📲 [CONFERENCE SMS API] Tip SMS:", smsType);

    // Formatează datele conferinței
    const formatConferenceData = (conferinta) => {
      const dataInceput = moment(conferinta.dataInceput || conferinta.dataIncepere);
      const dataFinal = conferinta.dataFinal ? moment(conferinta.dataFinal) : null;
      
      if (conferinta.tipConferinta === "course" && dataFinal) {
        return {
          type: "Curs Multi-zi",
          dataRange: `${dataInceput.format("DD MMMM YYYY")}, ${conferinta.oraInceput} - ${dataFinal.format("DD MMMM YYYY")}, ${conferinta.oraFinal}`,
          oraRange: `${conferinta.oraInceput} - ${conferinta.oraFinal}`,
          dataStart: dataInceput.format("DD.MM.YYYY"),
          oraStart: conferinta.oraInceput
        };
      } else {
        return {
          type: "Conferință",
          dataRange: dataInceput.format("DD MMMM YYYY"),
          oraRange: conferinta.oraInceput,
          dataStart: dataInceput.format("DD.MM.YYYY"),
          oraStart: conferinta.oraInceput
        };
      }
    };

    const displayInfo = formatConferenceData(conferenceData);

    // Construiește mesajele SMS bazate pe tip
    const buildSMSMessage = (recipient, conferinta, type, displayInfo) => {
      const nume = `${recipient.nume} ${recipient.prenume}`;
      const accessLink = recipient.uniqueAccessLink || recipient.accessLink;
      const conferenceLink = `https://www.cristinazurba.com/conferinta-grup/${accessLink}`;

      if (type === 'confirmation') {
        return `Bună ziua ${nume}!\n\n` +
               `Rezervarea pentru "${conferinta.titlu}" a fost confirmată.\n\n` +
               `📅 Data: ${displayInfo.dataStart}\n` +
               `🕐 Ora: ${displayInfo.oraStart}\n\n` +
               `🔗 Link acces: ${conferenceLink}\n\n` +
               `Vă așteptăm!\n` +
               `- Cristina Zurba`;
      } else if (type === 'reminder') {
        return `Bună ziua ${nume}!\n\n` +
               `🔔 REMINDER: "${conferinta.titlu}" începe în curând!\n\n` +
               `📅 Data: ${displayInfo.dataStart}\n` +
               `🕐 Ora: ${displayInfo.oraStart}\n\n` +
               `🔗 Link acces: ${conferenceLink}\n\n` +
               `Nu uitați să vă conectați la timp!\n` +
               `- Cristina Zurba`;
      }
    };

    // Rezultatele trimiterii
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let twilioErrorsCount = 0;

    // Trimite SMS-uri individuale pentru fiecare destinatar
    for (const recipient of recipients) {
      try {
        // Verifică dacă participantul are număr de telefon
        if (!recipient.telefon && !recipient.phone) {
          console.log(`⚠️ [SMS SKIP] ${recipient.nume} ${recipient.prenume} - nu are număr de telefon`);
          results.push({
            recipient: `${recipient.nume} ${recipient.prenume}`,
            email: recipient.email,
            phone: "N/A",
            status: "skipped",
            reason: "Număr de telefon lipsă"
          });
          continue;
        }

        const phoneNumber = recipient.telefon || recipient.phone;
        console.log(`📤 [SMS SEND] Trimitere către: ${recipient.nume} ${recipient.prenume} (${phoneNumber})`);

        // Construiește mesajul personalizat
        const smsMessage = buildSMSMessage(recipient, conferenceData, smsType, displayInfo);

        // Trimite SMS-ul prin Twilio
        const message = await client.messages.create({
          body: smsMessage,
          from: twilioPhoneNumber,
          to: phoneNumber,
        });

        console.log(`✅ [SMS SUCCESS] SMS trimis cu succes către ${recipient.nume} - SID: ${message.sid}`);
        
        results.push({
          recipient: `${recipient.nume} ${recipient.prenume}`,
          email: recipient.email,
          phone: phoneNumber,
          status: "success",
          messageSid: message.sid,
          sentAt: new Date().toISOString()
        });
        
        successCount++;

      } catch (twilioError) {
        console.error(`💥 [SMS ERROR] Eroare Twilio pentru ${recipient.nume}:`, twilioError.message);
        twilioErrorsCount++;
        errorCount++;

        // Determină tipul erorii Twilio
        let errorReason = "Eroare necunoscută";
        if (twilioError.code) {
          switch (twilioError.code) {
            case 21211:
              errorReason = "Număr de telefon invalid";
              break;
            case 21610:
              errorReason = "Numărul este în blacklist";
              break;
            case 21614:
              errorReason = "Numărul nu poate primi SMS-uri";
              break;
            case 20003:
              errorReason = "Permisiuni autentificare insuficiente";
              break;
            case 20429:
              errorReason = "Rate limit depășit";
              break;
            case 21408:
              errorReason = "Permisiuni insuficiente pentru destinatar";
              break;
            default:
              errorReason = `Eroare Twilio: ${twilioError.message}`;
          }
        }

        results.push({
          recipient: `${recipient.nume} ${recipient.prenume}`,
          email: recipient.email,
          phone: recipient.telefon || recipient.phone || "N/A",
          status: "error",
          error: errorReason,
          twilioCode: twilioError.code || null,
          failedAt: new Date().toISOString()
        });

        // Continuă cu următorul destinatar chiar dacă acest SMS a eșuat
        continue;
      }
    }

    // Verifică dacă contul Twilio are probleme de credit
    if (twilioErrorsCount > 0 && twilioErrorsCount === recipients.length) {
      console.error("🚨 [TWILIO ACCOUNT] Toate SMS-urile au eșuat - posibile probleme de credit sau configurare");
    }

    // Răspunsul final
    const response = {
      success: true,
      smsType: smsType,
      conference: conferenceData.titlu,
      summary: {
        total: recipients.length,
        sent: successCount,
        failed: errorCount,
        skipped: recipients.length - successCount - errorCount
      },
      results: results,
      twilioStatus: {
        errorsCount: twilioErrorsCount,
        accountWarning: twilioErrorsCount > recipients.length * 0.5 ? 
          "Multe erori Twilio detectate - verificați creditul contului" : null
      }
    };

    console.log("📊 [SMS SUMMARY]", response.summary);
    
    return res.status(200).json(response);

  } catch (error) {
    console.error("💥 [CONFERENCE SMS API] Eroare generală:", error);
    return res.status(500).json({ 
      error: 'Eroare la trimiterea SMS-urilor', 
      details: error.message 
    });
  }
} 