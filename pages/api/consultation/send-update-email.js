import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

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
    console.error('[CONSULT-UPDATE] Firebase Admin init failed:', e.message);
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
  if (!db) return res.status(500).json({ error: 'Firestore not available' });

  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    const docRef = db.collection('RezervariConsultatii').doc(documentId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Reservation not found' });

    const data = snap.data();
    const clientEmail = data.email;
    const clientName = data.nume || 'Client';
    const selectedSlot = data.selectedSlot || {};
    let meetingCode = typeof data.meetingCode === 'string' ? data.meetingCode.trim() : '';
    if (!clientEmail) return res.status(400).json({ error: 'Reservation missing client email' });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const meetingLink = meetingCode ? `${baseUrl}/meeting?meetingCode=${meetingCode}__${documentId}` : '';

    const slotDay = selectedSlot.day || '-';
    const slotTime = selectedSlot.slot || '-';
    const year = selectedSlot.currentYear || '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f7f9fc; padding: 24px;">
        <div style="background: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 6px 18px rgba(0,0,0,0.08);">
          <h2 style="margin: 0 0 12px; color: #1f2937;">Reprogramare consultație</h2>
          <p style="margin: 0 0 12px; color: #374151;">Bună ${clientName},</p>
          <p style="margin: 0 0 12px; color: #374151;">Consultația ta a fost <strong>reprogramată</strong>. Noile detalii sunt:</p>
          <div style="background:#f3f4f6; padding: 14px 16px; border-radius: 8px; margin: 14px 0;">
            <div><strong>Ziua:</strong> ${slotDay} ${year ? `(an ${year})` : ''}</div>
            <div><strong>Ora:</strong> ${slotTime}</div>
            <div><strong>Tip consultatie:</strong> ${data.tipConsultatie || '-'}</div>
          </div>
          ${meetingLink ? `
            <p style=\"margin: 0 0 8px; color: #374151;\">Accesează consultația la ora programată folosind linkul:</p>
            <p style=\"margin: 0 0 18px;\"><a href=\"${meetingLink}\" style=\"color:#2563eb; font-weight:600;\">${meetingLink}</a></p>
          ` : `
            <div style=\"background:#fff7ed; border:1px solid #fdba74; padding:12px; border-radius:8px; color:#9a3412; margin-bottom: 12px;\">
              Nu am putut include linkul de acces în acest email. Verifică pagina \"Rezervări\" pentru linkul de acces sau contactează suportul.
            </div>
          `}
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Îți mulțumim pentru înțelegere!</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: { name: 'Consultații - Cristina Zurba', address: process.env.EMAIL_USER },
      to: clientEmail,
      subject: '📢 Consultație reprogramată',
      html,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}


