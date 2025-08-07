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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testEmail, testName } = req.body;
    
    // Use provided email or a default test email (NOT example.com)
    const clientEmail = testEmail || 'webdynamicx@gmail.com'; // Using your real email for test
    const clientName = testName || 'Test Client Recording';
    
    console.log('🧪 [TEST-REAL-EMAIL] Creating test reservation with real email');

    // Create a test reservation in Firebase
    const testDocumentId = `test-recording-${Date.now()}`;
    const testReservationData = {
      email: clientEmail,
      nume: clientName.split(' ')[0],
      prenume: clientName.split(' ').slice(1).join(' ') || 'Recording',
      telefon: '0700000000',
      status: 'confirmed',
      categorie: {
        nume: 'Test Recording Email'
      },
      dataRezervare: new Date(),
      oraRezervare: '14:00',
      createdAt: new Date(),
      isTestData: true // Mark as test data for cleanup
    };

    // Save test reservation to Firebase
    await db.collection('RezervariConsultatii').doc(testDocumentId).set(testReservationData);
    
    console.log('✅ [TEST-REAL-EMAIL] Created test reservation:', {
      documentId: testDocumentId,
      email: clientEmail,
      name: clientName
    });

    // Wait a moment for Firebase to be consistent
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify the reservation was created and can be read
    const verifyReservationRef = db.collection('RezervariConsultatii').doc(testDocumentId);
    const verifyDoc = await verifyReservationRef.get();
    
    if (!verifyDoc.exists) {
      throw new Error('Test reservation was not created successfully in Firebase');
    }
    
    const verifyData = verifyDoc.data();
    console.log('✅ [TEST-REAL-EMAIL] Verified reservation exists:', {
      email: verifyData.email,
      nume: verifyData.nume,
      hasEmail: !!verifyData.email
    });

    // Now test via HTTP call with longer timeout
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const emailResponse = await fetch(`${baseUrl}/api/daily/send-recording-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: testDocumentId,
        recordingUrl: 'https://sample-recording-url.com/test-recording.mp4',
        roomName: `consultation-${testDocumentId}`,
        duration: 1800,
        linkExpires: Math.floor(Date.now() / 1000) + (12 * 60 * 60)
      }),
    });

    let emailResult;
    const responseText = await emailResponse.text();
    
    try {
      emailResult = JSON.parse(responseText);
    } catch (parseError) {
      emailResult = { 
        success: false, 
        error: 'JSON Parse Error', 
        details: responseText,
        parseError: parseError.message 
      };
    }

    console.log('📧 [TEST-REAL-EMAIL] Email sending result:', emailResult);

    // Clean up test reservation after email is sent (longer delay for manual testing)
    setTimeout(async () => {
      try {
        await db.collection('RezervariConsultatii').doc(testDocumentId).delete();
        console.log('🧹 [TEST-REAL-EMAIL] Cleaned up test reservation:', testDocumentId);
      } catch (cleanupError) {
        console.error('❌ [TEST-REAL-EMAIL] Failed to cleanup test reservation:', cleanupError);
      }
    }, 60000); // Delete after 60 seconds (1 minute)

    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: 'Test recording email sent successfully with REAL Firebase data',
        testData: {
          documentId: testDocumentId,
          clientEmail: clientEmail,
          clientName: clientName,
          reservationCreated: true,
          emailSent: true,
          messageId: emailResult.messageId
        },
        emailResult
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test recording email',
        error: emailResult.error,
        testData: {
          documentId: testDocumentId,
          clientEmail: clientEmail,
          clientName: clientName,
          reservationCreated: true,
          emailSent: false
        }
      });
    }

  } catch (error) {
    console.error('💥 [TEST-REAL-EMAIL] Error during test:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 