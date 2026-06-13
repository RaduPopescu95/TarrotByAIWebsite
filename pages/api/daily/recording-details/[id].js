import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { RECORDING_ERRORS_COLLECTION } from '../../../../lib/recordingErrors';

// Initialize Firebase Admin if not already initialized
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
    // non-fatal
    console.error('[RECORDING-DETAILS] Firebase Admin init failed:', e.message);
  }
}

const adminDb = (() => {
  try {
    return getFirestore();
  } catch {
    return null;
  }
})();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return getRecordingDetails(req, res, id);
  } else if (req.method === 'DELETE') {
    return deleteRecording(req, res, id);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get detailed recording information
async function getRecordingDetails(req, res, recordingId) {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;

  if (!DAILY_API_KEY) {
    return res.status(500).json({ error: 'Daily.co API key not configured' });
  }

  if (!recordingId) {
    return res.status(400).json({ error: 'Recording ID is required' });
  }

  try {
    console.log('🔍 [RECORDING-DETAILS] Fetching details for recording:', recordingId);

    const recordingResponse = await fetch(
      `https://api.daily.co/v1/recordings/${recordingId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!recordingResponse.ok) {
      const errorData = await recordingResponse.text();
      console.error('❌ [RECORDING-DETAILS] Failed to fetch recording details:', {
        recordingId,
        status: recordingResponse.status,
        error: errorData
      });
      return res.status(recordingResponse.status).json({ 
        error: 'Failed to fetch recording details',
        details: errorData 
      });
    }

    const recording = await recordingResponse.json();
    
    // Process and format all available data
    const roomName = recording.room_name;
    let documentId = null;
    let sessionType = 'unknown';
    
    if (roomName) {
      if (roomName.startsWith('consultation-')) {
        documentId = roomName.replace('consultation-', '');
        sessionType = 'consultation';
      } else if (roomName.startsWith('conference-')) {
        documentId = roomName.replace('conference-', '');
        sessionType = 'conference';
      }
    }

    // Format timestamps
    const startTs = recording.start_ts;
    const startDate = startTs ? new Date(startTs * 1000) : null;
    const creationDate = recording.creation_timestamp ? new Date(recording.creation_timestamp * 1000) : null;

    // Process tracks detailed information
    const tracksDetails = recording.tracks ? recording.tracks.map(track => ({
      type: track.type,
      kind: track.kind,
      userId: track.user_id,
      sessionId: track.session_id,
      startTs: track.start_ts,
      endTs: track.end_ts,
      duration: track.duration,
      size: track.size,
      downloadUrl: track.download_url
    })) : [];

    const detailedInfo = {
      // Basic info
      id: recording.id,
      roomName: roomName,
      documentId: documentId,
      sessionType: sessionType,
      status: recording.status,
      
      // Timing info
      startTs: startTs,
      startDate: startDate ? startDate.toISOString() : null,
      startDateFormatted: startDate ? startDate.toLocaleString('ro-RO') : null,
      creationTimestamp: recording.creation_timestamp,
      creationDate: creationDate ? creationDate.toISOString() : null,
      creationDateFormatted: creationDate ? creationDate.toLocaleString('ro-RO') : null,
      duration: recording.duration,
      durationFormatted: recording.duration ? 
        `${Math.floor(recording.duration / 60)}m ${recording.duration % 60}s` : 'Unknown',
      
      // Session info
      maxParticipants: recording.max_participants,
      mtgSessionId: recording.mtgSessionId || recording.meeting_session_id || null,
      domainName: recording.domain_name,
      
      // Storage info
      sizeBytes: recording.size_bytes,
      sizeMB: recording.size_bytes ? (recording.size_bytes / (1024 * 1024)).toFixed(2) : null,
      s3key: recording.s3key || recording.s3_key || null,
      
      // Media info
      downloadUrl: recording.download_url || null,
      playbackUrl: recording.playback_url || null,
      composedBy: recording.composed_by,
      
      // Tracks details
      tracks: {
        count: tracksDetails.length,
        details: tracksDetails,
        types: tracksDetails.map(t => t.type).join(', ') || 'N/A'
      },
      
      // Output settings
      outputSettings: recording.output_settings || null,
      
      // Complete raw data
      rawData: recording
    };

    // Optionally enrich with Firestore data
    if (adminDb && documentId && sessionType !== 'unknown') {
      try {
        if (sessionType === 'consultation') {
          const docRef = adminDb.collection('RezervariConsultatii').doc(documentId);
          const snap = await docRef.get();
          if (snap.exists) {
            const data = snap.data();
            detailedInfo.firestore = {
              type: 'consultation',
              data: {
                nume: data.nume || null,
                prenume: data.prenume || null,
                email: data.email || null,
                telefon: data.telefon || null,
                categorie: data.categorie || null,
                tipConsultatie: data.tipConsultatie || null,
                selectedSlot: data.selectedSlot || null,
                adresaClient: data.adresaClient || null,
                costConsultatie: data.costConsultatie || null,
                meetingCode: data.meetingCode || null,
                session_id: data.session_id || null,
                recording: data.recording || null
              }
            };
          }
        } else if (sessionType === 'conference') {
          const confRef = adminDb.collection('ConferinteGrup').doc(documentId);
          const snap = await confRef.get();
          if (snap.exists) {
            const data = snap.data();
            detailedInfo.firestore = {
              type: 'conference',
              data: {
                titlu: data.titlu || null,
                descriere: data.descriere || null,
                dataInceput: data.dataInceput || data.dataIncepere || null,
                oraInceput: data.oraInceput || data.oraIncepere || null,
                participanti: Array.isArray(data.participanti) ? data.participanti : [],
                recording: data.recording || null
              }
            };
          }
        }
      } catch (e) {
        console.error('💥 [RECORDING-DETAILS] Firestore enrichment failed:', e.message);
      }
    }

    // Enrich with RecordingErrors (most recent 20)
    if (adminDb) {
      try {
        const queries = [];
        if (recordingId) {
          queries.push(
            adminDb
              .collection(RECORDING_ERRORS_COLLECTION)
              .where('recordingId', '==', recordingId)
              .orderBy('createdAt', 'desc')
              .limit(20)
              .get()
          );
        }
        if (documentId) {
          queries.push(
            adminDb
              .collection(RECORDING_ERRORS_COLLECTION)
              .where('documentId', '==', documentId)
              .orderBy('createdAt', 'desc')
              .limit(20)
              .get()
          );
        }

        const snapshots = await Promise.all(queries);
        const seen = new Set();
        const collected = [];
        for (const snap of snapshots) {
          for (const doc of snap.docs) {
            if (seen.has(doc.id)) continue;
            seen.add(doc.id);
            const data = doc.data();
            collected.push({
              id: doc.id,
              source: data.source || 'unknown',
              recordingId: data.recordingId || null,
              documentId: data.documentId || null,
              roomName: data.roomName || null,
              sessionType: data.sessionType || 'unknown',
              errorMessage: data.errorMessage || '',
              errorCode: data.errorCode || null,
              errorContext: data.errorContext || {},
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
              resolved: Boolean(data.resolved),
            });
          }
        }
        collected.sort((a, b) => {
          const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
          const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
          return tb - ta;
        });
        detailedInfo.errors = collected.slice(0, 20);
      } catch (errEnrichError) {
        console.error('[RECORDING-DETAILS] errors enrichment failed:', errEnrichError.message);
        detailedInfo.errors = [];
      }
    } else {
      detailedInfo.errors = [];
    }

    console.log('✅ [RECORDING-DETAILS] Successfully fetched detailed info:', {
      recordingId,
      hasDetails: true,
      tracksCount: tracksDetails.length,
      status: recording.status,
      errorsCount: detailedInfo.errors?.length || 0,
    });

    res.status(200).json({
      success: true,
      data: detailedInfo
    });

  } catch (error) {
    console.error('💥 [RECORDING-DETAILS] Error fetching recording details:', {
      recordingId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error while fetching recording details',
      details: error.message 
    });
  }
}

// Delete recording
async function deleteRecording(req, res, recordingId) {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;

  if (!DAILY_API_KEY) {
    return res.status(500).json({ error: 'Daily.co API key not configured' });
  }

  if (!recordingId) {
    return res.status(400).json({ error: 'Recording ID is required' });
  }

  try {
    console.log('🗑️ [DELETE-RECORDING] Attempting to delete recording:', recordingId);

    const deleteResponse = await fetch(
      `https://api.daily.co/v1/recordings/${recordingId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.text();
      console.error('❌ [DELETE-RECORDING] Failed to delete recording:', {
        recordingId,
        status: deleteResponse.status,
        error: errorData
      });
      return res.status(deleteResponse.status).json({ 
        error: 'Failed to delete recording',
        details: errorData 
      });
    }

    console.log('✅ [DELETE-RECORDING] Successfully deleted recording:', recordingId);

    res.status(200).json({
      success: true,
      message: 'Recording deleted successfully',
      recordingId: recordingId
    });

  } catch (error) {
    console.error('💥 [DELETE-RECORDING] Error deleting recording:', {
      recordingId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error while deleting recording',
      details: error.message 
    });
  }
} 