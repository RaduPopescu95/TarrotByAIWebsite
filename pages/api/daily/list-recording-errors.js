import { getAdminDb } from '../../../lib/firebaseAdmin';
import { RECORDING_ERRORS_COLLECTION } from '../../../lib/recordingErrors';

function serializeError(doc) {
  const data = doc.data();
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
  return {
    id: doc.id,
    source: data.source || 'unknown',
    recordingId: data.recordingId || null,
    documentId: data.documentId || null,
    roomName: data.roomName || null,
    sessionType: data.sessionType || 'unknown',
    errorMessage: data.errorMessage || '',
    errorCode: data.errorCode || null,
    errorContext: data.errorContext || {},
    createdAt,
    resolved: Boolean(data.resolved),
  };
}

export default async function handler(req, res) {
  let adminDb;
  try {
    adminDb = getAdminDb();
  } catch (initError) {
    console.error('[list-recording-errors] Firebase Admin init failed:', initError.message);
    return res.status(500).json({ success: false, error: 'Firebase Admin not initialized' });
  }

  if (req.method === 'GET') {
    return handleList(req, res, adminDb);
  }
  if (req.method === 'POST') {
    return handleResolve(req, res, adminDb);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req, res, adminDb) {
  try {
    const {
      limit = '50',
      recordingId,
      documentId,
      roomName,
      since,
      resolved,
    } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    let query = adminDb.collection(RECORDING_ERRORS_COLLECTION);

    if (recordingId) query = query.where('recordingId', '==', recordingId);
    if (documentId) query = query.where('documentId', '==', documentId);
    if (roomName) query = query.where('roomName', '==', roomName);
    if (resolved === 'true') query = query.where('resolved', '==', true);
    if (resolved === 'false') query = query.where('resolved', '==', false);

    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        query = query.where('createdAt', '>=', sinceDate);
      }
    }

    query = query.orderBy('createdAt', 'desc').limit(parsedLimit);

    const snap = await query.get();
    const errors = snap.docs.map(serializeError);

    return res.status(200).json({
      success: true,
      errors,
      total: errors.length,
    });
  } catch (error) {
    console.error('[list-recording-errors] Query failed:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to list recording errors',
      details: error.message,
    });
  }
}

async function handleResolve(req, res, adminDb) {
  try {
    const { id, resolved = true } = req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, error: 'id is required' });
    }

    const ref = adminDb.collection(RECORDING_ERRORS_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ success: false, error: 'Error document not found' });
    }

    await ref.update({
      resolved: Boolean(resolved),
      resolvedAt: resolved ? new Date() : null,
    });

    return res.status(200).json({ success: true, id, resolved: Boolean(resolved) });
  } catch (error) {
    console.error('[list-recording-errors] Resolve failed:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to update error',
      details: error.message,
    });
  }
}
