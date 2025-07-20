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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email este necesar' 
      });
    }

    const emailLower = email.toLowerCase().trim();
    console.log('🔍 [RECORDINGS SEARCH] Searching for email:', emailLower);

    // 1. Găsește toate consultațiile pentru acest email
    const consultationsSnapshot = await db.collection('RezervariConsultatii')
      .where('email', '==', emailLower)
      .get();

    console.log('📋 [RECORDINGS SEARCH] Found consultations:', consultationsSnapshot.size);

    // 2. Găsește toate conferințele unde utilizatorul este participant
    const conferencesSnapshot = await db.collection('ConferinteGrup').get();
    const userConferences = [];

    conferencesSnapshot.forEach(doc => {
      const conference = doc.data();
      if (conference.participanti) {
        const isParticipant = conference.participanti.some(participant => 
          participant.email && participant.email.toLowerCase() === emailLower
        );
        if (isParticipant) {
          userConferences.push({
            documentId: doc.id,
            ...conference
          });
        }
      }
    });

    console.log('🎪 [RECORDINGS SEARCH] Found conferences:', userConferences.length);

    // 3. Construiește lista de meetingCodes pentru a căuta înregistrări
    const meetingCodes = [];

    // Meeting codes pentru consultații
    consultationsSnapshot.forEach(doc => {
      const consultation = doc.data();
      if (consultation.meetingCode) {
        meetingCodes.push({
          meetingCode: consultation.meetingCode,
          type: 'consultation',
          data: consultation
        });
      }
    });

    // Meeting codes pentru conferințe (format: group_${conferenceId})
    userConferences.forEach(conference => {
      meetingCodes.push({
        meetingCode: `group_${conference.documentId}`,
        type: 'group_conference',
        data: conference
      });
    });

    console.log('🎯 [RECORDINGS SEARCH] Meeting codes to search:', meetingCodes.length);

    if (meetingCodes.length === 0) {
      return res.status(200).json({
        success: true,
        recordings: [],
        message: 'Nu s-au găsit sesiuni pentru acest email'
      });
    }

    // 4. Caută înregistrări în toate colecțiile - atât prin meeting codes, cât și prin email direct
    const allRecordings = [];
    const collections = ['SimpleRecordings', 'Recordings', 'BrowserRecordings'];

    for (const collectionName of collections) {
      try {
        const recordingsSnapshot = await db.collection(collectionName).get();
        const collectionMatches = [];
        
        recordingsSnapshot.forEach(doc => {
          const recording = doc.data();
          
          // Method 1: Match by meetingCode (existing logic)
          const meetingCodeMatch = meetingCodes.find(mc => mc.meetingCode === recording.meetingCode);
          
          // Method 2: Match by userEmail directly (for fallback recordings)
          const emailMatch = recording.userEmail && recording.userEmail.toLowerCase() === emailLower;
          
          if (meetingCodeMatch || emailMatch) {
            const recordingData = {
              id: doc.id,
              ...recording,
              collection: collectionName,
              associatedData: meetingCodeMatch?.data || null,
              type: meetingCodeMatch?.type || (emailMatch ? 'direct_email_match' : 'unknown'),
              matchMethod: meetingCodeMatch ? 'meetingCode' : 'userEmail'
            };
            
            collectionMatches.push(recordingData);
            allRecordings.push(recordingData);
          }
        });

        // Count matches by method for this collection
        const meetingCodeMatches = collectionMatches.filter(r => r.matchMethod === 'meetingCode').length;
        const emailMatches = collectionMatches.filter(r => r.matchMethod === 'userEmail').length;
        
        console.log(`📦 [RECORDINGS SEARCH] Collection ${collectionName}: ${collectionMatches.length} matches`);
        console.log(`  📋 Meeting code matches: ${meetingCodeMatches}`);
        console.log(`  📧 Direct email matches: ${emailMatches}`);
      } catch (error) {
        console.error(`Error searching ${collectionName}:`, error);
      }
    }

    // 5. Deduplică și îmbogățește înregistrările
    const uniqueRecordings = deduplicateRecordings(allRecordings);
    const enrichedRecordings = enrichRecordingsWithContext(uniqueRecordings);

    // 6. Sortează după dată (cele mai recente prima dată)
    enrichedRecordings.sort((a, b) => {
      const dateA = a.createdAt || a.uploadTime || a.startTimestamp || 0;
      const dateB = b.createdAt || b.uploadTime || b.startTimestamp || 0;
      return dateB - dateA;
    });

    console.log('✅ [RECORDINGS SEARCH] Returning recordings:', enrichedRecordings.length);

    res.status(200).json({
      success: true,
      recordings: enrichedRecordings,
      total: enrichedRecordings.length,
      searchEmail: emailLower
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

function deduplicateRecordings(recordings) {
  const uniqueMap = new Map();

  recordings.forEach(recording => {
    const existing = uniqueMap.get(recording.meetingCode);
    
    if (!existing) {
      uniqueMap.set(recording.meetingCode, recording);
    } else {
      // Preferă înregistrarea cu downloadURL
      if (recording.downloadURL && !existing.downloadURL) {
        uniqueMap.set(recording.meetingCode, recording);
      }
      // Sau înregistrarea cu status completed
      else if (recording.status === 'completed' && existing.status !== 'completed') {
        uniqueMap.set(recording.meetingCode, recording);
      }
    }
  });

  return Array.from(uniqueMap.values());
}

function enrichRecordingsWithContext(recordings) {
  return recordings.map(recording => {
    const enriched = { ...recording };

    if (recording.type === 'group_conference') {
      enriched.typeLabel = 'Conferință de Grup';
      enriched.title = recording.associatedData?.titlu || 'Conferință de Grup';
      enriched.date = recording.associatedData?.dataInceput || recording.associatedData?.dataIncepere;
      enriched.time = recording.associatedData?.oraInceput || recording.associatedData?.oraIncepere;
      enriched.description = recording.associatedData?.descriere;
      enriched.participants = recording.associatedData?.participanti?.length || 0;
    } else {
      enriched.typeLabel = 'Consultație Individuală';
      enriched.title = `Consultație cu ${recording.associatedData?.nume || 'Client'}`;
      enriched.date = recording.associatedData?.selectedSlot?.data || recording.associatedData?.data;
      enriched.time = recording.associatedData?.selectedSlot?.ora || recording.associatedData?.ora;
      enriched.clientName = recording.associatedData?.nume;
      enriched.category = recording.associatedData?.categorie;
    }

    // Format file size
    if (enriched.size) {
      enriched.sizeFormatted = formatFileSize(enriched.size);
    }

    // Format duration
    if (enriched.duration) {
      enriched.durationFormatted = formatDuration(enriched.duration);
    }

    // Format creation date
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

    // Determine status
    if (enriched.downloadURL && enriched.status === 'completed') {
      enriched.status = 'completed';
    } else if (enriched.downloadURL && !enriched.status) {
      enriched.status = 'completed';
    } else if (!enriched.downloadURL) {
      enriched.status = 'processing';
    }

    return enriched;
  });
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