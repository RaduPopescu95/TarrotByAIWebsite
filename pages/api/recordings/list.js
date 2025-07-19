import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userEmail, type, limit = 50 } = req.query;

    console.log('📋 [RECORDINGS LIST] Loading recordings for user:', userEmail);

    if (!userEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'User email is required' 
      });
    }

    // Load recordings from different collections
    const collections = ['SimpleRecordings', 'Recordings', 'BrowserRecordings'];
    const allRecordings = [];

    for (const collectionName of collections) {
      try {
        console.log(`📋 [RECORDINGS LIST] Loading from ${collectionName}...`);
        
        const snapshot = await db.collection(collectionName)
          .orderBy('createdAt', 'desc')
          .limit(parseInt(limit))
          .get();

        const collectionRecordings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          collection: collectionName
        }));

        allRecordings.push(...collectionRecordings);
        console.log(`📋 [RECORDINGS LIST] Found ${collectionRecordings.length} recordings in ${collectionName}`);
      } catch (error) {
        console.error(`Error loading from ${collectionName}:`, error);
        // Continue with other collections even if one fails
      }
    }

    // Remove duplicates based on meetingCode
    const uniqueRecordings = allRecordings.reduce((unique, recording) => {
      const existing = unique.find(r => r.meetingCode === recording.meetingCode);
      if (!existing) {
        unique.push(recording);
      } else if (recording.downloadURL && !existing.downloadURL) {
        // Replace with recording that has downloadURL
        const index = unique.indexOf(existing);
        unique[index] = recording;
      }
      return unique;
    }, []);

    // Filter by type if specified
    const filteredRecordings = type && type !== 'all' 
      ? uniqueRecordings.filter(recording => {
          if (type === 'group_conferences') {
            return recording.meetingCode?.startsWith('group_');
          } else if (type === 'consultations') {
            return !recording.meetingCode?.startsWith('group_');
          }
          return true;
        })
      : uniqueRecordings;

    // Sort by creation date (newest first)
    filteredRecordings.sort((a, b) => {
      const dateA = a.createdAt || a.uploadTime || a.startTimestamp || 0;
      const dateB = b.createdAt || b.uploadTime || b.startTimestamp || 0;
      return dateB - dateA;
    });

    // Enrich recordings with metadata
    const enrichedRecordings = await enrichRecordingsWithMetadata(filteredRecordings);

    console.log(`📋 [RECORDINGS LIST] Returning ${enrichedRecordings.length} recordings`);

    res.status(200).json({
      success: true,
      recordings: enrichedRecordings,
      total: enrichedRecordings.length,
      userEmail: userEmail
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

async function enrichRecordingsWithMetadata(recordings) {
  try {
    // Load conference and consultation data for context
    const conferenceSnapshot = await db.collection('ConferinteGrup').get();
    const consultationSnapshot = await db.collection('RezervariConsultatii').get();
    
    const conferinte = conferenceSnapshot.docs.map(doc => ({
      documentId: doc.id,
      ...doc.data()
    }));
    
    const consultatii = consultationSnapshot.docs.map(doc => ({
      documentId: doc.id,
      ...doc.data()
    }));

    return recordings.map(recording => {
      const enriched = { ...recording };

      // Determine recording type and add context
      if (recording.meetingCode?.startsWith('group_')) {
        enriched.type = 'group_conference';
        enriched.typeLabel = 'Conferință de Grup';
        
        // Find conference details
        const conferenceId = recording.meetingCode.replace('group_', '');
        const conferinta = conferinte.find(c => c.documentId === conferenceId);
        
        if (conferinta) {
          enriched.title = conferinta.titlu;
          enriched.date = conferinta.dataInceput || conferinta.dataIncepere;
          enriched.time = conferinta.oraInceput || conferinta.oraIncepere;
          enriched.description = conferinta.descriere;
          enriched.participants = conferinta.participanti?.length || 0;
          enriched.conferenceId = conferenceId;
        }
      } else {
        enriched.type = 'consultation';
        enriched.typeLabel = 'Consultație Individuală';
        
        // Find consultation details
        const consultatie = consultatii.find(c => 
          c.documentId === recording.meetingCode || 
          c.meetingCode === recording.meetingCode
        );
        
        if (consultatie) {
          enriched.title = `Consultație cu ${consultatie.nume || 'Client'}`;
          enriched.date = consultatie.data;
          enriched.time = consultatie.ora;
          enriched.clientName = consultatie.nume;
          enriched.clientEmail = consultatie.email;
        }
      }

      // Format file size
      if (enriched.size) {
        enriched.sizeFormatted = formatFileSize(enriched.size);
      }

      // Format duration
      if (enriched.duration) {
        enriched.durationFormatted = formatDuration(enriched.duration);
      }

      // Format dates
      if (enriched.createdAt || enriched.uploadTime || enriched.startTimestamp) {
        const timestamp = enriched.createdAt || enriched.uploadTime || enriched.startTimestamp;
        enriched.createdAtFormatted = new Date(timestamp).toLocaleDateString('ro-RO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      return enriched;
    });
  } catch (error) {
    console.error('Error enriching recordings:', error);
    return recordings;
  }
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