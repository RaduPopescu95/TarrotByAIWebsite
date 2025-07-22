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

// Fallback function to search recordings directly by email
async function searchRecordingsByEmailDirectly(emailLower) {
  console.log('🔍 [FALLBACK SEARCH] Searching recordings directly by email in SimpleRecordings:', emailLower);
  
  const collections = ['SimpleRecordings']; // 🎯 Single collection for all recordings
  const foundRecordings = [];
  
  for (const collectionName of collections) {
    try {
      console.log(`🔍 [FALLBACK] Searching ${collectionName} directly...`);
      
      // Search by userEmail field
      let snapshot = await db.collection(collectionName)
        .where('userEmail', '==', emailLower)
        .get();
      
      console.log(`📧 [FALLBACK ${collectionName}] Found ${snapshot.size} by userEmail`);
      
      snapshot.forEach(doc => {
        const recording = doc.data();
        foundRecordings.push({
          id: doc.id,
          ...recording,
          collection: collectionName,
          type: 'direct_email_match',
          matchMethod: 'userEmail'
        });
        console.log(`📧 [FALLBACK MATCH] ${doc.id} in ${collectionName} by userEmail`);
      });
      
      // Also search by adminEmail field if it exists
      try {
        snapshot = await db.collection(collectionName)
          .where('adminEmail', '==', emailLower)
          .get();
        
        console.log(`👨‍💼 [FALLBACK ${collectionName}] Found ${snapshot.size} by adminEmail`);
        
        snapshot.forEach(doc => {
          const recording = doc.data();
          // Avoid duplicates
          const exists = foundRecordings.find(r => r.id === doc.id);
          if (!exists) {
            foundRecordings.push({
              id: doc.id,
              ...recording,
              collection: collectionName,
              type: 'direct_email_match',
              matchMethod: 'adminEmail'
            });
            console.log(`👨‍💼 [FALLBACK MATCH] ${doc.id} in ${collectionName} by adminEmail`);
          }
        });
      } catch (adminEmailError) {
        console.log(`⚠️ [FALLBACK] No adminEmail field in ${collectionName}`);
      }
      
    } catch (error) {
      console.error(`❌ [FALLBACK] Error searching ${collectionName}:`, error);
    }
  }
  
  console.log(`🎯 [FALLBACK SEARCH] Total found: ${foundRecordings.length} recordings`);
  return enrichRecordingsWithContext(foundRecordings);
}

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
    console.log('🔍 [STEP 1] Searching consultations for email:', emailLower);
    const consultationsSnapshot = await db.collection('RezervariConsultatii')
      .where('email', '==', emailLower)
      .get();

    console.log('📋 [RECORDINGS SEARCH] Found consultations:', consultationsSnapshot.size);
    
    // Debug: Log consultations details
    consultationsSnapshot.forEach((doc, index) => {
      const consultation = doc.data();
      console.log(`📋 [CONSULTATION ${index + 1}] documentId: ${doc.id}, meetingCode: ${consultation.meetingCode}, email: ${consultation.email}, nume: ${consultation.nume}`);
    });

    // ALSO search for consultations where the email might be an admin email
    // This covers cases where the search email is the consultant email
    console.log('🔍 [STEP 1B] Searching for consultations where user might be admin...');
    let adminConsultationsSnapshot;
    try {
      // Try to get ALL consultations to check admin involvement (with limit for safety)
      adminConsultationsSnapshot = await db.collection('RezervariConsultatii')
        .orderBy('selectedSlot.timestamp', 'desc')
        .limit(1000)
        .get();
      
      console.log(`🔍 [ADMIN SEARCH] Checking ${adminConsultationsSnapshot.size} consultations for admin involvement`);
      
    } catch (error) {
      console.log('⚠️ [ADMIN SEARCH] Could not search by timestamp, trying without ordering');
      adminConsultationsSnapshot = await db.collection('RezervariConsultatii')
        .limit(1000)
        .get();
    }

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
    console.log('🔍 [STEP 3] Extracting meeting codes...');
    consultationsSnapshot.forEach(doc => {
      const consultation = doc.data();
      if (consultation.meetingCode) {
        meetingCodes.push({
          meetingCode: consultation.meetingCode,
          type: 'consultation',
          data: consultation
        });
        console.log(`📋 [CONSULTATION MEETING CODE] ${consultation.meetingCode} from doc ${doc.id}`);
      } else {
        console.log(`⚠️ [CONSULTATION NO MEETING CODE] Doc ${doc.id} missing meetingCode`);
      }
    });

    // ALSO add meeting codes for consultations where user might be admin
    // Check if the search email matches known admin emails
    const { ADMIN_EMAILS } = require('../../../data/constants');
    const isAdminEmail = ADMIN_EMAILS.includes(emailLower);
    
    if (isAdminEmail) {
      console.log('👨‍💼 [ADMIN DETECTION] Email is recognized as admin, including all recent consultations');
      adminConsultationsSnapshot.forEach(doc => {
        const consultation = doc.data();
        if (consultation.meetingCode) {
          // Check if not already added
          const alreadyAdded = meetingCodes.find(mc => mc.meetingCode === consultation.meetingCode);
          if (!alreadyAdded) {
            meetingCodes.push({
              meetingCode: consultation.meetingCode,
              type: 'consultation_admin',
              data: consultation
            });
            console.log(`👨‍💼 [ADMIN CONSULTATION] Added ${consultation.meetingCode} from admin search`);
          }
        }
      });
    }

    // Meeting codes pentru conferințe (format: group_${conferenceId})
    userConferences.forEach(conference => {
      const groupMeetingCode = `group_${conference.documentId}`;
      meetingCodes.push({
        meetingCode: groupMeetingCode,
        type: 'group_conference',
        data: conference
      });
      console.log(`🎪 [CONFERENCE MEETING CODE] ${groupMeetingCode} from conference ${conference.documentId}`);
    });

    console.log('🎯 [RECORDINGS SEARCH] Meeting codes to search:', meetingCodes.length);
    meetingCodes.forEach((mc, index) => {
      console.log(`🎯 [MEETING CODE ${index + 1}] ${mc.meetingCode} (${mc.type})`);
    });

    if (meetingCodes.length === 0) {
      console.log('⚠️ [NO MEETING CODES] No meeting codes found, trying fallback search...');
      
      // FALLBACK: Caută direct în înregistrări după email
      const fallbackRecordings = await searchRecordingsByEmailDirectly(emailLower);
      
      if (fallbackRecordings.length > 0) {
        console.log(`✅ [FALLBACK SEARCH] Found ${fallbackRecordings.length} recordings by direct email search`);
        return res.status(200).json({
          success: true,
          recordings: fallbackRecordings,
          total: fallbackRecordings.length,
          searchEmail: emailLower,
          searchMethod: 'direct_email_fallback'
        });
      }
      
      return res.status(200).json({
        success: true,
        recordings: [],
        message: 'Nu s-au găsit sesiuni pentru acest email',
        searchEmail: emailLower
      });
    }

    // 4. 🚀 OPTIMIZAT: Caută înregistrări DOAR în SimpleRecordings (single source of truth)
    console.log('🔍 [STEP 4] Starting recordings search in SimpleRecordings...');
    const allRecordings = [];
    const collections = ['SimpleRecordings']; // 🎯 Single collection for all recordings
    const SEARCH_LIMIT = 1000; // Increased limit since we're only searching one collection

    for (const collectionName of collections) {
      try {
        console.log(`🔍 [RECORDINGS SEARCH OPTIMIZED] Searching ${collectionName} with limit ${SEARCH_LIMIT}`);
        
        // OPTIMIZAT: Folosim limite și ordering pentru a reduce read-urile
        let recordingsSnapshot;
        try {
          // Încearcă cu ordering pentru cele mai recente înregistrări
          recordingsSnapshot = await db.collection(collectionName)
            .orderBy('uploadTime', 'desc')
            .limit(SEARCH_LIMIT)
            .get();
          console.log(`✅ [RECORDINGS SEARCH] Ordered query successful for ${collectionName}`);
        } catch (orderError) {
          // FALLBACK: Dacă ordering nu funcționează, folosește limita simplă
          console.log(`⚠️ [RECORDINGS SEARCH] Ordering failed for ${collectionName}, using simple limit`);
          recordingsSnapshot = await db.collection(collectionName)
            .limit(SEARCH_LIMIT)
            .get();
        }
        
        const collectionMatches = [];
        
        recordingsSnapshot.forEach(doc => {
          const recording = doc.data();
          
          // Method 1: Match by meetingCode (existing logic)
          let meetingCodeMatch = meetingCodes.find(mc => mc.meetingCode === recording.meetingCode);
          
          // Method 1b: Match by meetingCode without documentId suffix (for consultation format: code__documentId)
          if (!meetingCodeMatch && recording.meetingCode && recording.meetingCode.includes('__')) {
            const baseMeetingCode = recording.meetingCode.split('__')[0];
            meetingCodeMatch = meetingCodes.find(mc => mc.meetingCode === baseMeetingCode);
            if (meetingCodeMatch) {
              console.log(`🔄 [MATCH VARIANT] Found match for ${recording.meetingCode} using base code ${baseMeetingCode}`);
            }
          }
          
          // Method 1c: Match the other way - if meetingCode in search list has __ format
          if (!meetingCodeMatch) {
            meetingCodeMatch = meetingCodes.find(mc => {
              if (mc.meetingCode.includes('__')) {
                const baseMeetingCode = mc.meetingCode.split('__')[0];
                return baseMeetingCode === recording.meetingCode;
              }
              return false;
            });
            if (meetingCodeMatch) {
              console.log(`🔄 [MATCH VARIANT 2] Found match for ${recording.meetingCode} using search code base`);
            }
          }
          
          // Method 2: Match by userEmail directly (for fallback recordings)
          const emailMatch = recording.userEmail && recording.userEmail.toLowerCase() === emailLower;
          
          // Method 3: Match by adminEmail directly (for admin recordings)
          const adminEmailMatch = recording.adminEmail && recording.adminEmail.toLowerCase() === emailLower;
          
          if (meetingCodeMatch || emailMatch || adminEmailMatch) {
            const recordingData = {
              id: doc.id,
              ...recording,
              collection: collectionName,
              associatedData: meetingCodeMatch?.data || null,
              type: meetingCodeMatch?.type || (emailMatch || adminEmailMatch ? 'direct_email_match' : 'unknown'),
              matchMethod: meetingCodeMatch ? 'meetingCode' : (emailMatch ? 'userEmail' : 'adminEmail')
            };
            
            collectionMatches.push(recordingData);
            allRecordings.push(recordingData);
          }
        });

        // Count matches by method for this collection
        const meetingCodeMatches = collectionMatches.filter(r => r.matchMethod === 'meetingCode').length;
        const emailMatches = collectionMatches.filter(r => r.matchMethod === 'userEmail').length;
        const adminEmailMatches = collectionMatches.filter(r => r.matchMethod === 'adminEmail').length;
        
        console.log(`📦 [RECORDINGS SEARCH OPTIMIZED] Collection ${collectionName}: ${collectionMatches.length} matches from ${recordingsSnapshot.size} docs (limit: ${SEARCH_LIMIT})`);
        console.log(`  📋 Meeting code matches: ${meetingCodeMatches}`);
        console.log(`  📧 User email matches: ${emailMatches}`);
        console.log(`  👨‍💼 Admin email matches: ${adminEmailMatches}`);
        
        // AVERTIZARE dacă s-a atins limita - s-ar putea să existe mai multe înregistrări
        if (recordingsSnapshot.size === SEARCH_LIMIT) {
          console.log(`⚠️ [RECORDINGS SEARCH] ATENȚIE: S-a atins limita de ${SEARCH_LIMIT} pentru ${collectionName}. Ar putea exista mai multe înregistrări.`);
        }
        
      } catch (error) {
        console.error(`❌ [RECORDINGS SEARCH] Error searching ${collectionName}:`, error);
        
        // FALLBACK EXTREM: Dacă optimizarea eșuează, încearcă metoda originală cu atenție
        try {
          console.log(`🔄 [FALLBACK] Trying original method for ${collectionName} (without limit)`);
          const fallbackSnapshot = await db.collection(collectionName).get();
          
          // Procesează doar primele 1000 pentru siguranță
          let processed = 0;
          const MAX_FALLBACK = 1000;
          
          fallbackSnapshot.forEach(doc => {
            if (processed >= MAX_FALLBACK) return;
            
            const recording = doc.data();
            let meetingCodeMatch = meetingCodes.find(mc => mc.meetingCode === recording.meetingCode);
            
            // Try variant matching for fallback too
            if (!meetingCodeMatch && recording.meetingCode && recording.meetingCode.includes('__')) {
              const baseMeetingCode = recording.meetingCode.split('__')[0];
              meetingCodeMatch = meetingCodes.find(mc => mc.meetingCode === baseMeetingCode);
            }
            
            const emailMatch = recording.userEmail && recording.userEmail.toLowerCase() === emailLower;
            const adminEmailMatch = recording.adminEmail && recording.adminEmail.toLowerCase() === emailLower;
            
            if (meetingCodeMatch || emailMatch || adminEmailMatch) {
              allRecordings.push({
                id: doc.id,
                ...recording,
                collection: collectionName,
                associatedData: meetingCodeMatch?.data || null,
                type: meetingCodeMatch?.type || (emailMatch || adminEmailMatch ? 'direct_email_match' : 'unknown'),
                matchMethod: meetingCodeMatch ? 'meetingCode' : (emailMatch ? 'userEmail' : 'adminEmail')
              });
            }
            processed++;
          });
          
          console.log(`✅ [FALLBACK] Processed ${processed} docs from ${collectionName} (max: ${MAX_FALLBACK})`);
          
        } catch (fallbackError) {
          console.error(`❌ [FALLBACK] Complete failure for ${collectionName}:`, fallbackError);
        }
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