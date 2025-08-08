export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  if (!DAILY_API_KEY) {
    return res.status(500).json({ error: 'Daily.co API key not configured' });
  }

  try {
    const { recordingId } = req.body;

    if (!recordingId) {
      return res.status(400).json({ error: 'recordingId is required' });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cristinazurba.com' || 'http://localhost:3000';

    // 1) Fetch recording details from Daily
    const recResp = await fetch(`https://api.daily.co/v1/recordings/${recordingId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!recResp.ok) {
      const errText = await recResp.text();
      return res.status(recResp.status).json({ error: 'Failed to fetch recording details', details: errText });
    }

    const recording = await recResp.json();
    const roomName = recording.room_name;
    const duration = recording.duration;

    let sessionType = 'unknown';
    let documentId = null;

    if (roomName?.startsWith('consultation-')) {
      sessionType = 'consultation';
      documentId = roomName.replace('consultation-', '');
    } else if (roomName?.startsWith('conference-')) {
      sessionType = 'conference';
      documentId = roomName.replace('conference-', '');
    }

    if (!documentId || sessionType === 'unknown') {
      return res.status(400).json({ error: 'Unable to determine session type or documentId from recording' });
    }

    // 2) Generate a fresh temporary download link
    const linkResp = await fetch(`${baseUrl}/api/daily/get-recording-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordingId }),
    });

    if (!linkResp.ok) {
      const errText = await linkResp.text();
      return res.status(linkResp.status).json({ error: 'Failed to generate download link', details: errText });
    }

    const linkData = await linkResp.json();
    const downloadLink = linkData.downloadLink;
    const linkExpires = linkData.expires;

    if (!downloadLink) {
      return res.status(500).json({ error: 'No download link generated' });
    }

    // 3) Send emails depending on session type
    if (sessionType === 'consultation') {
      const emailResp = await fetch(`${baseUrl}/api/daily/send-recording-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          recordingUrl: downloadLink,
          roomName,
          duration,
          linkExpires,
        }),
      });

      const emailResult = await emailResp.json();
      if (!emailResp.ok || !emailResult.success) {
        return res.status(500).json({ error: 'Failed to send consultation email', details: emailResult.error || 'unknown' });
      }

      return res.status(200).json({
        success: true,
        sessionType,
        documentId,
        recipients: 1,
        messageId: emailResult.messageId,
      });
    }

    if (sessionType === 'conference') {
      try {
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');
        if (!getApps().length) {
          initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
          });
        }
        const db = getFirestore();
        const confDoc = await db.collection('ConferinteGrup').doc(documentId).get();
        if (!confDoc.exists) {
          return res.status(404).json({ error: 'Conference document not found' });
        }
        const confData = confDoc.data();
        const participants = Array.isArray(confData?.participanti) ? confData.participanti : [];

        let sent = 0;
        let errors = [];
        for (const p of participants) {
          if (!p?.email) continue;
          const resp = await fetch(`${baseUrl}/api/daily/send-recording-custom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordingId,
              customEmail: p.email,
              customName: p.nume || 'Participant',
              roomName,
              duration,
            }),
          });
          const result = await resp.json();
          if (resp.ok && result.success) {
            sent += 1;
          } else {
            errors.push({ email: p.email, error: result.error || 'unknown' });
          }
        }

        return res.status(200).json({
          success: true,
          sessionType,
          documentId,
          recipients: sent,
          errors,
        });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to query conference participants', details: e.message });
      }
    }

    return res.status(400).json({ error: 'Unsupported session type' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

