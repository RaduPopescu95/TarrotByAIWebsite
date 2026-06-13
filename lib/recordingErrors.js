import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'RecordingErrors';

const ALLOWED_SOURCES = new Set([
  'webhook',
  'send-recording-email',
  'resend-recording-default',
  'send-recording-custom',
  'manual-test',
]);

function sanitizeContext(context) {
  if (!context || typeof context !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) continue;
    if (value === null) {
      out[key] = null;
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
      continue;
    }
    try {
      out[key] = JSON.parse(JSON.stringify(value));
    } catch {
      out[key] = String(value);
    }
  }
  return out;
}

export async function logRecordingError(adminDb, payload = {}) {
  if (!adminDb) {
    console.error('[recordingErrors] adminDb is null - cannot persist error');
    return null;
  }

  const source = ALLOWED_SOURCES.has(payload.source) ? payload.source : 'webhook';
  const recordingId = payload.recordingId || null;
  const documentId = payload.documentId || null;
  const roomName = payload.roomName || null;
  const sessionType = payload.sessionType || 'unknown';
  const errorMessage = String(payload.errorMessage || payload.error?.message || 'Unknown error').slice(0, 500);
  const errorCode = payload.errorCode || payload.error?.code || null;
  const errorContext = sanitizeContext(payload.errorContext || {});

  const doc = {
    source,
    recordingId,
    documentId,
    roomName,
    sessionType,
    errorMessage,
    errorCode,
    errorContext,
    createdAt: FieldValue.serverTimestamp(),
    resolved: false,
  };

  try {
    const ref = await adminDb.collection(COLLECTION).add(doc);
    console.log(`[recordingErrors] Logged error ${ref.id} (${source}): ${errorMessage}`);
    return ref.id;
  } catch (writeError) {
    console.error('[recordingErrors] FAILED to persist error to Firestore:', {
      writeError: writeError.message,
      originalPayload: { source, recordingId, documentId, roomName, errorMessage },
    });
    return null;
  }
}

export const RECORDING_ERRORS_COLLECTION = COLLECTION;
