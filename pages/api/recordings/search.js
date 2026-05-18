import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
const RECORDINGS_COLLECTION = 'SimpleRecordings';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MEETING_CODE_LOOKUP_LIMIT = 10;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const email = normalizeEmail(req.body?.email);
    const safeLimit = clampLimit(req.body?.limit);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email este necesar'
      });
    }

    const emailLower = email.toLowerCase();
    console.log('🔍 [RECORDINGS SEARCH] Indexed search for email:', emailLower);

    const consultations = await loadConsultationsForEmail(email, safeLimit);
    const recordingsByKey = new Map();

    await addDirectEmailRecordings(recordingsByKey, email, safeLimit);
    await addConsultationRecordings(recordingsByKey, consultations, safeLimit);

    const uniqueRecordings = deduplicateRecordings(Array.from(recordingsByKey.values()));
    const enrichedRecordings = await enrichRecordingsWithContext(uniqueRecordings);
    enrichedRecordings.sort((a, b) => getRecordingTime(b) - getRecordingTime(a));

    console.log('✅ [RECORDINGS SEARCH] Returning recordings:', enrichedRecordings.length);

    res.status(200).json({
      success: true,
      recordings: enrichedRecordings.slice(0, safeLimit),
      total: enrichedRecordings.length,
      searchEmail: emailLower,
      searchMethod: 'indexed_queries'
    });
  } catch (error) {
    console.error('❌ [RECORDINGS SEARCH] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la căutarea înregistrărilor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function loadConsultationsForEmail(email, limitCount) {
  const consultationsById = new Map();
  const emailCandidates = uniqueValues([email, email.toLowerCase()]);

  for (const candidate of emailCandidates) {
    try {
      const snapshot = await db
        .collection('RezervariConsultatii')
        .where('email', '==', candidate)
        .limit(limitCount)
        .get();

      snapshot.forEach((docSnap) => {
        consultationsById.set(docSnap.id, {
          documentId: docSnap.id,
          ...docSnap.data(),
        });
      });
    } catch (error) {
      console.error('⚠️ [RECORDINGS SEARCH] Consultation email query failed:', error.message);
    }
  }

  console.log('📋 [RECORDINGS SEARCH] Consultations found by email:', consultationsById.size);
  return Array.from(consultationsById.values());
}

async function addDirectEmailRecordings(target, email, limitCount) {
  const fields = ['userEmail', 'recipientEmail', 'adminEmail'];
  const emailCandidates = uniqueValues([email, email.toLowerCase()]);

  for (const field of fields) {
    for (const candidate of emailCandidates) {
      try {
        const snapshot = await db
          .collection(RECORDINGS_COLLECTION)
          .where(field, '==', candidate)
          .limit(limitCount)
          .get();

        snapshot.forEach((docSnap) => {
          addRecording(target, docSnap, {
            type: field === 'adminEmail' ? 'admin_email_match' : 'direct_email_match',
            matchMethod: field,
          });
        });
      } catch (error) {
        console.error(`⚠️ [RECORDINGS SEARCH] Recording ${field} query failed:`, error.message);
      }
    }
  }
}

async function addConsultationRecordings(target, consultations, limitCount) {
  const meetingCodes = [];

  consultations.slice(0, limitCount).forEach((consultation) => {
    if (!consultation.meetingCode) return;
    getMeetingCodeVariants(consultation.meetingCode).forEach((meetingCode) => {
      meetingCodes.push({
        meetingCode,
        consultation,
      });
    });
  });

  for (const entry of meetingCodes.slice(0, limitCount)) {
    await addRecordingsByMeetingCode(target, entry.meetingCode, {
      type: 'consultation',
      matchMethod: 'meetingCode',
      associatedData: entry.consultation,
    });
  }
}

async function addRecordingsByMeetingCode(target, meetingCode, metadata = {}) {
  for (const candidate of getMeetingCodeVariants(meetingCode)) {
    try {
      const directSnap = await db.collection(RECORDINGS_COLLECTION).doc(candidate).get();
      if (directSnap.exists) {
        addRecording(target, directSnap, metadata);
      }

      const querySnap = await db
        .collection(RECORDINGS_COLLECTION)
        .where('meetingCode', '==', candidate)
        .limit(MEETING_CODE_LOOKUP_LIMIT)
        .get();

      querySnap.forEach((docSnap) => addRecording(target, docSnap, metadata));
    } catch (error) {
      console.error('⚠️ [RECORDINGS SEARCH] Recording meetingCode lookup failed:', error.message);
    }
  }
}

async function enrichRecordingsWithContext(recordings) {
  const enriched = await Promise.all(
    recordings.map(async (recording) => {
      const next = { ...recording };

      if (recording.meetingCode?.startsWith('group_')) {
        next.type = 'group_conference';
        next.typeLabel = 'Conferință de Grup';

        const conference = recording.associatedData || await loadConference(recording.meetingCode);
        if (conference) {
          next.title = conference.titlu || 'Conferință de Grup';
          next.date = conference.dataInceput || conference.dataIncepere;
          next.time = conference.oraInceput || conference.oraIncepere;
          next.description = conference.descriere;
          next.participants = conference.participanti?.length || 0;
          next.conferenceId = conference.documentId;
        } else {
          next.title = next.title || 'Conferință de Grup';
        }
      } else {
        next.type = 'consultation';
        next.typeLabel = 'Consultație Individuală';

        const consultation = recording.associatedData || await loadConsultation(recording.meetingCode);
        if (consultation) {
          next.associatedData = consultation;
          next.title = `Consultație cu ${consultation.nume || 'Client'}`;
          next.date = consultation.selectedSlot?.data || consultation.data;
          next.time = consultation.selectedSlot?.ora || consultation.ora;
          next.clientName = consultation.nume;
          next.clientEmail = consultation.email;
          next.category = consultation.categorie;
        } else {
          next.title = next.title || 'Consultație Individuală';
        }
      }

      applyPresentationFields(next);
      return next;
    })
  );

  return enriched;
}

async function loadConference(meetingCode) {
  const conferenceId = getConferenceId(meetingCode);
  if (!conferenceId) return null;

  try {
    const docSnap = await db.collection('ConferinteGrup').doc(conferenceId).get();
    if (!docSnap.exists) return null;
    return { documentId: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('⚠️ [RECORDINGS SEARCH] Conference metadata read failed:', error.message);
    return null;
  }
}

async function loadConsultation(meetingCode) {
  for (const candidate of getMeetingCodeVariants(meetingCode)) {
    try {
      const directSnap = await db.collection('RezervariConsultatii').doc(candidate).get();
      if (directSnap.exists) {
        return { documentId: directSnap.id, ...directSnap.data() };
      }

      const querySnap = await db
        .collection('RezervariConsultatii')
        .where('meetingCode', '==', candidate)
        .limit(1)
        .get();

      if (!querySnap.empty) {
        const docSnap = querySnap.docs[0];
        return { documentId: docSnap.id, ...docSnap.data() };
      }
    } catch (error) {
      console.error('⚠️ [RECORDINGS SEARCH] Consultation metadata read failed:', error.message);
    }
  }

  return null;
}

function addRecording(target, docSnap, metadata = {}) {
  const data = docSnap.data();
  const recording = {
    id: docSnap.id,
    ...data,
    collection: RECORDINGS_COLLECTION,
    ...metadata,
  };
  const key = recording.meetingCode || docSnap.id;
  const existing = target.get(key);

  if (!existing || shouldReplaceRecording(existing, recording)) {
    target.set(key, recording);
  }
}

function deduplicateRecordings(recordings) {
  const uniqueMap = new Map();

  recordings.forEach((recording) => {
    const key = recording.meetingCode || recording.id;
    const existing = uniqueMap.get(key);
    if (!existing || shouldReplaceRecording(existing, recording)) {
      uniqueMap.set(key, recording);
    }
  });

  return Array.from(uniqueMap.values());
}

function shouldReplaceRecording(existing, candidate) {
  if (candidate.downloadURL && !existing.downloadURL) return true;
  if (candidate.status === 'completed' && existing.status !== 'completed') return true;
  return getRecordingTime(candidate) > getRecordingTime(existing);
}

function applyPresentationFields(recording) {
  if (recording.size) {
    recording.sizeFormatted = formatFileSize(recording.size);
  }

  if (recording.duration) {
    recording.durationFormatted = formatDuration(recording.duration);
  }

  const timestamp = recording.createdAt || recording.uploadTime || recording.startTimestamp;
  if (timestamp) {
    recording.createdAtFormatted = new Date(getRecordingTime(recording)).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (recording.downloadURL && !recording.status) {
    recording.status = 'completed';
  } else if (!recording.downloadURL) {
    recording.status = 'processing';
  }
}

function getConferenceId(meetingCode) {
  if (!meetingCode?.startsWith('group_')) return null;
  return String(meetingCode).replace(/^group_/, '').split('__')[0];
}

function getMeetingCodeVariants(meetingCode) {
  if (!meetingCode) return [];
  const code = String(meetingCode);
  return uniqueValues([code, code.split('__')[0]]);
}

function getRecordingTime(recording) {
  const value = recording?.createdAt || recording?.uploadTime || recording?.startTimestamp || 0;
  if (typeof value === 'number') return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?._seconds === 'number') return value._seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeEmail(value) {
  if (Array.isArray(value)) return value[0]?.trim();
  return typeof value === 'string' ? value.trim() : '';
}

function clampLimit(value) {
  const parsed = parseInt(Array.isArray(value) ? value[0] : value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function formatFileSize(bytes) {
  if (!bytes) return 'N/A';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
