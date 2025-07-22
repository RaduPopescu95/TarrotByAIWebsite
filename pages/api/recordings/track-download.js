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

// Helper function to calculate string similarity (Levenshtein distance)
function calculateSimilarity(str1, str2) {
  const matrix = [];
  const m = str1.length;
  const n = str2.length;

  // Create matrix
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // deletion
          matrix[i][j - 1] + 1,    // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  const maxLength = Math.max(m, n);
  return maxLength > 0 ? (maxLength - matrix[m][n]) / maxLength : 1;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { meetingCode, userEmail, recordingId, collection } = req.body;

    if (!meetingCode || !userEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Meeting code și email sunt necesare' 
      });
    }

    const emailLower = userEmail.toLowerCase().trim();
    
    // 🔒 STRICT EMAIL VALIDATION - prevent partial email bypass
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailLower)) {
      console.warn('⚠️ [DOWNLOAD TRACKING] Invalid email format:', emailLower);
      return res.status(400).json({
        success: false,
        message: 'Format email invalid. Introduceți un email complet și valid.'
      });
    }

    console.log('📥 [DOWNLOAD TRACKING] Checking download status:', {
      meetingCode,
      userEmail: emailLower,
      recordingId,
      collection: collection || 'Unknown'
    });

    // Search for the recording in multiple collections
    const collections = ['SimpleRecordings']; // 🎯 Single collection for all recordings
    let recordingDoc = null;
    let recordingData = null;
    let foundCollection = null;

    for (const collName of collections) {
      try {
        const docRef = db.collection(collName).doc(meetingCode);
        const doc = await docRef.get();
        
        if (doc.exists) {
          recordingDoc = docRef;
          recordingData = doc.data();
          foundCollection = collName;
          console.log(`📋 [DOWNLOAD TRACKING] Found recording in collection: ${collName}`);
          break;
        }
      } catch (error) {
        console.warn(`Error checking collection ${collName}:`, error);
      }
    }

    if (!recordingDoc || !recordingData) {
      console.warn('⚠️ [DOWNLOAD TRACKING] Recording not found:', meetingCode);
      return res.status(404).json({
        success: false,
        message: 'Înregistrarea nu a fost găsită'
      });
    }

    // Check if this email has already downloaded this recording
    const downloadedBy = recordingData.downloadedBy || [];
    const downloadAttempts = recordingData.downloadAttempts || [];
    
    // 🔒 ENHANCED CHECKING - prevent bypass with partial emails
    const exactMatch = downloadedBy.includes(emailLower);
    
    // Extract email prefix and domain for similarity checking
    const [emailPrefix, emailDomain] = emailLower.split('@');
    
    // Check for similar/related emails that might be trying to bypass
    const similarEmails = downloadedBy.filter(existingEmail => {
      const [existingPrefix, existingDomain] = existingEmail.split('@');
      
      // Check for same prefix with different/partial domains
      if (emailPrefix === existingPrefix) {
        return true;
      }
      
      // Check for same domain with similar prefixes (90% similarity)
      if (emailDomain === existingDomain) {
        const similarity = calculateSimilarity(emailPrefix, existingPrefix);
        return similarity > 0.9;
      }
      
      return false;
    });
    
    const alreadyDownloaded = exactMatch || similarEmails.length > 0;
    
    if (alreadyDownloaded) {
      const matchedEmail = exactMatch ? emailLower : similarEmails[0];
             console.log('🚫 [DOWNLOAD TRACKING] Email already downloaded (or similar):', {
         inputEmail: emailLower,
         matchedEmail,
         exactMatch,
         similarCount: similarEmails.length
       });
      
      // Find the download date for this email (exact or similar)
      const downloadAttempt = downloadAttempts.find(attempt => 
        (attempt.email === emailLower || attempt.email === matchedEmail) && attempt.success === true
      );
      
      const downloadDate = downloadAttempt ? 
        new Date(downloadAttempt.timestamp).toLocaleDateString('ro-RO') : 
        'dată necunoscută';
      
      const isExactMatch = exactMatch;
      const message = isExactMatch 
        ? `Înregistrarea a fost deja descărcată pentru acest email în data de ${downloadDate}.`
        : `Înregistrarea a fost deja descărcată pentru un email similar (${matchedEmail}) în data de ${downloadDate}. Nu se permit descărcări multiple pentru email-uri similare.`;
      
      return res.status(403).json({
        success: false,
        alreadyDownloaded: true,
        message,
        downloadDate,
        matchedEmail: isExactMatch ? emailLower : matchedEmail,
        isExactMatch,
        supportInfo: {
          message: 'Dacă aveți probleme privind descărcarea sau credeți că aceasta este o greșeală, trimiteți un email la webdynamicx@gmail.com cu emailul și data înregistrării.',
          supportEmail: 'webdynamicx@gmail.com',
          recordingDate: new Date(recordingData.createdAt || recordingData.uploadTime || recordingData.startTimestamp || Date.now()).toLocaleDateString('ro-RO')
        }
      });
    }

    // Record the download attempt (successful)
    const downloadTimestamp = Date.now();
    const downloadAttempt = {
      email: emailLower,
      timestamp: downloadTimestamp,
      success: true,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown'
    };

    // Update the recording document
    await recordingDoc.update({
      downloadedBy: [...downloadedBy, emailLower],
      downloadAttempts: [...downloadAttempts, downloadAttempt],
      lastDownloadedAt: downloadTimestamp
    });

    console.log('✅ [DOWNLOAD TRACKING] Download tracked successfully:', {
      meetingCode,
      userEmail: emailLower,
      collection: foundCollection,
      totalDownloads: downloadedBy.length + 1
    });

    res.status(200).json({
      success: true,
      message: 'Descărcarea a fost înregistrată cu succes',
      downloadData: {
        meetingCode,
        userEmail: emailLower,
        downloadedAt: downloadTimestamp,
        totalDownloads: downloadedBy.length + 1
      }
    });

  } catch (error) {
    console.error('❌ [DOWNLOAD TRACKING] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la înregistrarea descărcării',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 