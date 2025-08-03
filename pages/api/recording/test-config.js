import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 
                       process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                       `${projectId}.appspot.com`;
  
  initializeApp({
    credential: cert({
      projectId: projectId,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: storageBucket
  });
}

export default async function handler(req, res) {
  console.log('🧪 [TEST CONFIG] === API CALLED ===');
  console.log('🧪 [TEST CONFIG] Method:', req.method);
  console.log('🔍 Testing Firebase Admin configuration...');
  
  try {
    const adminStorage = getStorage();
    
    // Test environment variables
    const envVars = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: !!process.env.FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    console.log('📊 Environment variables status:', envVars);
    
    // Test bucket access
    let bucket;
    let bucketName = 'Not determined';
    let bucketError = null;
    
    try {
      bucket = adminStorage.bucket();
      bucketName = bucket.name;
      console.log(`✅ Default bucket accessible: ${bucketName}`);
    } catch (error) {
      bucketError = error.message;
      console.log(`❌ Default bucket error: ${error.message}`);
      
      // Try explicit bucket
      try {
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const explicitBucketName = process.env.FIREBASE_STORAGE_BUCKET || 
                                   process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                                   `${projectId}.appspot.com`;
        
        bucket = adminStorage.bucket(explicitBucketName);
        bucketName = explicitBucketName;
        console.log(`✅ Explicit bucket accessible: ${bucketName}`);
        bucketError = null;
      } catch (explicitError) {
        bucketError = `Default: ${error.message}, Explicit: ${explicitError.message}`;
        console.log(`❌ Explicit bucket error: ${explicitError.message}`);
      }
    }
    
    // Test bucket operations (list files to verify access)
    let bucketAccessible = false;
    let listError = null;
    
    if (bucket && !bucketError) {
      try {
        const [files] = await bucket.getFiles({ maxResults: 1 });
        bucketAccessible = true;
        console.log(`✅ Bucket operations successful (found ${files.length} files in test)`);
      } catch (listErr) {
        listError = listErr.message;
        console.log(`❌ Bucket list error: ${listErr.message}`);
      }
    }
    
    const response = {
      success: !bucketError,
      timestamp: new Date().toISOString(),
      environmentVariables: envVars,
      bucket: {
        name: bucketName,
        accessible: bucketAccessible,
        error: bucketError,
        listError: listError
      },
      firebaseAdmin: {
        appsInitialized: getApps().length,
        storageServiceAvailable: !!adminStorage
      }
    };
    
    console.log('📋 Test results:', response);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('💥 Firebase Admin test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
} 