const Twilio = require("twilio");
const moment = require("moment");

// Configurații Twilio - aceleași ca în functions/index.js
const accountSid = "AC6cf01717a74bbf7cc02d4a723db53232";
const authToken = "8c6b979039e8d0fb5aa878dcc2eefac6";
const twilioPhoneNumber = "+15042266134";

console.log("🔧 [TWILIO CONFIG] Account SID:", accountSid);
console.log("🔧 [TWILIO CONFIG] Auth Token:", authToken ? `${authToken.substring(0, 8)}...` : 'MISSING');
console.log("🔧 [TWILIO CONFIG] Phone Number:", twilioPhoneNumber);

// Inițializare client Twilio
const client = new Twilio(accountSid, authToken);
console.log("✅ [TWILIO CONFIG] Client inițializat cu succes");

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
        console.log(`📤 [SMS VALIDATION] Verificare număr pentru: ${recipient.nume} ${recipient.prenume}`);
        console.log(`📞 [SMS VALIDATION] Numărul primit: "${phoneNumber}"`);
        console.log(`📞 [SMS VALIDATION] Tip: ${typeof phoneNumber}`);
        console.log(`📞 [SMS VALIDATION] Lungime: ${phoneNumber?.length || 0}`);

        // Validare format E.164 pentru Twilio
        if (!phoneNumber.startsWith('+')) {
          console.error(`❌ [SMS FORMAT] Număr invalid pentru ${recipient.nume}: "${phoneNumber}" - nu începe cu +`);
          results.push({
            recipient: `${recipient.nume} ${recipient.prenume}`,
            email: recipient.email,
            phone: phoneNumber,
            status: "error",
            error: "Format invalid - numărul trebuie să înceapă cu + (format E.164)",
            failedAt: new Date().toISOString()
          });
          continue;
        }

        // Verificare format E.164 complet
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
          console.error(`❌ [SMS FORMAT] Format E.164 invalid pentru ${recipient.nume}: "${phoneNumber}"`);
          results.push({
            recipient: `${recipient.nume} ${recipient.prenume}`,
            email: recipient.email,
            phone: phoneNumber,
            status: "error",
            error: "Format E.164 invalid (ex: +40712345678)",
            failedAt: new Date().toISOString()
          });
          continue;
        }

        console.log(`✅ [SMS VALIDATION] Număr valid în format E.164: "${phoneNumber}"`);
        console.log(`📤 [SMS SEND] Încep trimiterea către: ${recipient.nume} ${recipient.prenume}`);

        // Construiește mesajul personalizat
        const smsMessage = buildSMSMessage(recipient, conferenceData, smsType, displayInfo);

        // Pregătire date pentru Twilio
        const twilioData = {
          body: smsMessage,
          from: twilioPhoneNumber,
          to: phoneNumber,
        };

        console.log(`🔄 [TWILIO REQUEST] Pregătire trimitere...`);
        console.log(`📋 [TWILIO REQUEST] From: "${twilioPhoneNumber}"`);
        console.log(`📋 [TWILIO REQUEST] To: "${phoneNumber}"`);
        console.log(`📋 [TWILIO REQUEST] Body length: ${smsMessage.length} caractere`);

        // Trimite SMS-ul prin Twilio
        const message = await client.messages.create(twilioData);

        console.log(`✅ [SMS SUCCESS] SMS trimis cu succes către ${recipient.nume}`);
        console.log(`📧 [SMS SUCCESS] SID: ${message.sid}`);
        console.log(`📊 [SMS SUCCESS] Status: ${message.status}`);
        console.log(`💰 [SMS SUCCESS] Price: ${message.price || 'N/A'} ${message.priceUnit || ''}`);
        console.log(`📡 [SMS SUCCESS] Direction: ${message.direction}`);
        console.log(`📅 [SMS SUCCESS] Created: ${message.dateCreated}`);
        
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
        console.error(`💥 [SMS ERROR] ===== EROARE TWILIO PENTRU ${recipient.nume} =====`);
        console.error(`📞 [SMS ERROR] Număr destinatar: "${phoneNumber}"`);
        console.error(`🔢 [SMS ERROR] Cod eroare: ${twilioError.code || 'N/A'}`);
        console.error(`📝 [SMS ERROR] Mesaj eroare: ${twilioError.message}`);
        console.error(`📊 [SMS ERROR] Status HTTP: ${twilioError.status || 'N/A'}`);
        console.error(`🔍 [SMS ERROR] More info: ${twilioError.moreInfo || 'N/A'}`);
        console.error(`📄 [SMS ERROR] Full error:`, JSON.stringify(twilioError, null, 2));
        
        twilioErrorsCount++;
        errorCount++;

        // Determină tipul erorii Twilio cu detalii suplimentare
        let errorReason = "Eroare necunoscută";
        let technicalDetails = "";
        
        if (twilioError.code) {
          switch (twilioError.code) {
            case 21211:
              errorReason = "Număr de telefon invalid";
              technicalDetails = "Numărul nu respectă formatul E.164 sau nu este un număr de telefon valid";
              break;
            case 21610:
              errorReason = "Numărul este în blacklist";
              technicalDetails = "Numărul a fost marcat ca spam sau este blocat";
              break;
            case 21614:
              errorReason = "Numărul nu poate primi SMS-uri";
              technicalDetails = "Numărul este fix sau nu suportă SMS-uri";
              break;
            case 20003:
              errorReason = "Permisiuni autentificare insuficiente";
              technicalDetails = "Verificați Account SID și Auth Token Twilio";
              break;
            case 20429:
              errorReason = "Rate limit depășit";
              technicalDetails = "Prea multe requesturi într-un timp scurt";
              break;
            case 21408:
              errorReason = "Permisiuni insuficiente pentru destinatar";
              technicalDetails = "Contul Twilio nu poate trimite către acest număr";
              break;
            case 20009:
              errorReason = "Credit insuficient în contul Twilio";
              technicalDetails = "Adăugați credit în contul Twilio pentru a continua";
              break;
            case 21612:
              errorReason = "Numărul nu poate primi SMS-uri";
              technicalDetails = "Numărul de telefon nu poate primi mesaje text";
              break;
            default:
              errorReason = `Eroare Twilio (${twilioError.code})`;
              technicalDetails = twilioError.message;
          }
        }

        console.error(`🎯 [SMS ERROR] Reason: ${errorReason}`);
        console.error(`🔧 [SMS ERROR] Technical: ${technicalDetails}`);

        results.push({
          recipient: `${recipient.nume} ${recipient.prenume}`,
          email: recipient.email,
          phone: recipient.telefon || recipient.phone || "N/A",
          status: "error",
          error: errorReason,
          technicalDetails: technicalDetails,
          twilioCode: twilioError.code || null,
          twilioStatus: twilioError.status || null,
          twilioMoreInfo: twilioError.moreInfo || null,
          fullErrorMessage: twilioError.message,
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