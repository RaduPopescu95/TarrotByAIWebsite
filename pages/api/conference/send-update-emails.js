import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

// Init Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } catch (e) {
    console.error('[CONF-UPDATE] Firebase Admin init failed:', e.message);
  }
}

const db = (() => { try { return getFirestore(); } catch { return null; } })();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Firestore not available' });
  }

  try {
    const { conferenceId } = req.body;
    if (!conferenceId) {
      return res.status(400).json({ error: 'conferenceId is required' });
    }

    const confDoc = await db.collection('ConferinteGrup').doc(conferenceId).get();
    if (!confDoc.exists) {
      return res.status(404).json({ error: 'Conference not found' });
    }

    const conf = confDoc.data();
    const participants = (Array.isArray(conf?.participanti) ? conf.participanti : []).filter(p => !!p);
    if (participants.length === 0) {
      return res.status(200).json({ success: true, sent: 0 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cristinazurba.com';

    const formatDate = (iso) => {
      try {
        return new Date(iso).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
      } catch { return iso; }
    };

    const isCourse = conf.tipConferinta === 'course';
    const dateDisplay = isCourse && conf.dataFinal
      ? `${formatDate(conf.dataInceput)} - ${formatDate(conf.dataFinal)}`
      : `${formatDate(conf.dataInceput)}`;

    let sent = 0;
    let errors = [];

    for (const p of participants) {
      const email = p?.email;
      if (!email) continue;

      let participantLinkPart = p?.uniqueAccessLink || p?.accessLink || conf.accessLink || '';
      if (typeof participantLinkPart === 'string') {
        participantLinkPart = participantLinkPart.trim();
      }
      const link = participantLinkPart ? `${baseUrl}/conferinta-grup/${participantLinkPart}` : '';

      const subject = `📢 Actualizare program conferință: ${conf.titlu}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f7f9fc; padding: 24px;">
          <div style="background: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 6px 18px rgba(0,0,0,0.08);">
            <h2 style="margin: 0 0 12px; color: #1f2937;">Actualizare conferință</h2>
            <p style="margin: 0 0 18px; color: #374151;">Bună ${p?.prenume || p?.nume || ''},</p>
            <p style="margin: 0 0 12px; color: #374151;">
              Te anunțăm că evenimentul <strong>${conf.titlu}</strong> a fost <strong>reprogramat</strong>.
            </p>
            <div style="background:#f3f4f6; padding: 14px 16px; border-radius: 8px; margin: 14px 0;">
              <div><strong>Noua dată:</strong> ${dateDisplay}</div>
              <div><strong>Ora:</strong> ${conf.oraInceput}${isCourse && conf.oraFinal ? ` - ${conf.oraFinal}` : ''}</div>
            </div>
            ${link ? `
              <p style=\"margin: 0 0 12px; color: #374151;\">Linkul tău de acces a rămas neschimbat:</p>
              <p style=\"margin: 0 0 18px;\"><a href=\"${link}\" style=\"color:#2563eb; font-weight:600;\">${link}</a></p>
            ` : `
              <div style=\"background:#fff7ed; border:1px solid #fdba74; padding:12px; border-radius:8px; color:#9a3412; margin-bottom: 12px;\">
                Nu am putut include linkul de acces în acest email. Verifică panoul \\\"Conferințe de grup\\\" pentru linkul tău de acces sau contactează suportul.
              </div>
            `}
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Îți mulțumim pentru înțelegere!</p>
          </div>
        </div>
      `;

      try {
        const info = await transporter.sendMail({
          from: { name: 'Conferințe de Grup - Cristina Zurba', address: process.env.EMAIL_USER },
          to: email,
          subject,
          html,
        });
        sent += 1;
      } catch (e) {
        errors.push({ email, error: e.message, linkIncluded: !!link });
      }
    }

    // Send admin summary notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail) {
        const summaryHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f7f9fc; padding: 24px;">
            <div style="background: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 6px 18px rgba(0,0,0,0.08);">
              <h2 style="margin: 0 0 12px; color: #1f2937;">Rezumat notificări reprogramare conferință</h2>
              <p style="margin: 0 0 8px; color: #374151;"><strong>Conferință:</strong> ${conf.titlu}</p>
              <p style="margin: 0 0 8px; color: #374151;"><strong>Data/Interval:</strong> ${dateDisplay}</p>
              <p style="margin: 0 0 8px; color: #374151;"><strong>Ora:</strong> ${conf.oraInceput}${isCourse && conf.oraFinal ? ` - ${conf.oraFinal}` : ''}</p>
              <p style="margin: 0 0 12px; color: #374151;"><strong>Notificări trimise:</strong> ${sent}/${participants.length}</p>
              ${errors.length ? `<div style="background:#fff7ed; border:1px solid #fdba74; padding:12px; border-radius:8px;">
                <div style="color:#9a3412; font-weight:600;">Erori (${errors.length}):</div>
                <ul style="margin:8px 0 0 18px; color:#9a3412;">
                  ${errors.slice(0,10).map(e => `<li>${e.email}: ${e.error}</li>`).join('')}
                </ul>
                ${errors.length > 10 ? `<div style=\"color:#9a3412;\">... și alte ${errors.length - 10} erori</div>` : ''}
              </div>` : ''}
              <div style="margin-top: 16px;">
                <a href="${baseUrl}/admin-conferinte-grup" style="display:inline-block; background:#2563eb; color:white; padding:10px 14px; border-radius:8px; text-decoration:none;">Deschide panoul administrare</a>
              </div>
            </div>
          </div>
        `;
        await transporter.sendMail({
          from: { name: 'Conferințe de Grup - Notificări', address: process.env.EMAIL_USER },
          to: adminEmail,
          subject: `Rezumat reprogramare: ${conf.titlu} (${sent}/${participants.length} trimise)`,
          html: summaryHtml,
        });
      }
    } catch (e) {
      console.error('[CONF-UPDATE] Failed to send admin summary email:', e.message);
    }

    return res.status(200).json({ success: true, sent, errors });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}


