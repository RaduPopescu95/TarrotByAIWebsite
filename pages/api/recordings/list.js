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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userEmail, type } = req.query;
    const safeLimit = clampLimit(req.query.limit);
    const email = normalizeEmail(userEmail);

    console.log('📋 [RECORDINGS LIST] Loading indexed recordings for user:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    const recordings = await loadRecordingsForEmail(email, safeLimit);
    const uniqueRecordings = deduplicateRecordings(recordings);

    const filteredRecordings = type && type !== 'all'
      ? uniqueRecordings.filter((recording) => {
          if (type === 'group_conferences') {
            return recording.meetingCode?.startsWith('group_');
          }
          if (type === 'consultations') {
            return !recording.meetingCode?.startsWith('group_');
          }
          return true;
        })
      : uniqueRecordings;

    const enrichedRecordings = await enrichRecordingsWithMetadata(filteredRecordings);
    enrichedRecordings.sort((a, b) => getRecordingTime(b) - getRecordingTime(a));

    console.log(`📋 [RECORDINGS LIST] Returning ${enrichedRecordings.length} recordings`);

    res.status(200).json({
      success: true,
      recordings: enrichedRecordings,
      total: enrichedRecordings.length,
      userEmail: email
    });
  } catch (error) {
    console.error('❌ [RECORDINGS LIST] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load recordings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function loadRecordingsForEmail(email, limitCount) {
  const recordingsByKey = new Map();
  const emailCandidates = uniqueValues([email, email.toLowerCase()]);
  const fields = ['userEmail', 'recipientEmail', 'adminEmail'];

  for (const field of fields) {
    for (const candidate of emailCandidates) {
      try {
        const snapshot = await db
          .collection(RECORDINGS_COLLECTION)
          .where(field, '==', candidate)
          .limit(limitCount)
          .get();

        snapshot.forEach((docSnap) => {
          addRecording(recordingsByKey, docSnap, {
            matchMethod: field,
            type: field === 'adminEmail' ? 'admin_email_match' : 'direct_email_match',
          });
        });
      } catch (error) {
        console.error(`⚠️ [RECORDINGS LIST] Query failed for ${field}:`, error.message);
      }
    }
  }

  return Array.from(recordingsByKey.values())
    .sort((a, b) => getRecordingTime(b) - getRecordingTime(a))
    .slice(0, limitCount);
}

async function enrichRecordingsWithMetadata(recordings) {
  const enriched = await Promise.all(
    recordings.map(async (recording) => {
      const next = { ...recording };

      if (recording.meetingCode?.startsWith('group_')) {
        next.type = 'group_conference';
        next.typeLabel = 'Conferință de Grup';

        const conferinta = await loadConference(recording.meetingCode);
        if (conferinta) {
          next.title = conferinta.titlu;
          next.date = conferinta.dataInceput || conferinta.dataIncepere;
          next.time = conferinta.oraInceput || conferinta.oraIncepere;
          next.description = conferinta.descriere;
          next.participants = conferinta.participanti?.length || 0;
          next.conferenceId = conferinta.documentId;
        }
      } else {
        next.type = 'consultation';
        next.typeLabel = 'Consultație Individuală';

        const consultatie = await loadConsultation(recording.meetingCode);
        if (consultatie) {
          next.title = `Consultație cu ${consultatie.nume || 'Client'}`;
          next.date = consultatie.selectedSlot?.data || consultatie.data;
          next.time = consultatie.selectedSlot?.ora || consultatie.ora;
          next.clientName = consultatie.nume;
          next.clientEmail = consultatie.email;
          next.category = consultatie.categorie;
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
    console.error('⚠️ [RECORDINGS LIST] Conference metadata read failed:', error.message);
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
      console.error('⚠️ [RECORDINGS LIST] Consultation metadata read failed:', error.message);
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

function shouldReplaceRecording(existing, candidate) {
  if (candidate.downloadURL && !existing.downloadURL) return true;
  if (candidate.status === 'completed' && existing.status !== 'completed') return true;
  return getRecordingTime(candidate) > getRecordingTime(existing);
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
  return Array.isArray(value) ? value[0]?.trim() : value?.trim();
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
