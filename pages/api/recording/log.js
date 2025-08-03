import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createApiLogger } from '../../../utils/logger';

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
const logger = createApiLogger('LOG');

export default async function handler(req, res) {
  console.log('📝 [LOG API] === API CALLED ===');
  console.log('📝 [LOG API] Method:', req.method);
  console.log('📝 [LOG API] Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ [LOG API] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { log } = req.body;

    if (!log) {
      console.log('❌ [LOG API] No log data provided');
      logger.warn('Log endpoint called without log data');
      return res.status(400).json({ 
        message: 'Log data is required',
        success: false 
      });
    }
    
    console.log('📝 [LOG API] Processing log:', {
      level: log.level,
      context: log.context,
      message: log.message?.substring(0, 100) + '...',
      sessionId: log.sessionId
    });

    logger.debug('Received client log', {
      logLevel: log.level,
      logContext: log.context,
      logMessage: log.message,
      clientSessionId: log.sessionId
    });

    // Store critical logs in Firestore for persistent storage
    if (log.level === 'ERROR' || log.level === 'WARN') {
      console.log('💾 [LOG API] Storing critical log in Firestore...');
      
      const logData = {
        ...log,
        receivedAt: new Date(),
        receivedTimestamp: Date.now(),
        serverProcessed: true
      };

      // Store in different collections based on log type
      let collectionName = 'ClientLogs';
      if (log.context.includes('RECORDING')) {
        collectionName = 'RecordingLogs';
      } else if (log.context.includes('API')) {
        collectionName = 'ApiLogs';
      }

      console.log('💾 [LOG API] Collection:', collectionName);
      
      const logRef = db.collection(collectionName).doc();
      await logRef.set(logData);

      console.log('✅ [LOG API] Log stored in Firestore:', logRef.id);
      
      logger.info('Critical client log stored in Firestore', {
        collection: collectionName,
        logId: logRef.id,
        logLevel: log.level,
        logContext: log.context
      });
    } else {
      console.log('📝 [LOG API] Non-critical log, not storing in Firestore');
    }

    // Log to server console for immediate visibility
    const serverLogMessage = `📱 CLIENT LOG [${log.level}] [${log.context}]: ${log.message}`;
    
    switch (log.level) {
      case 'ERROR':
        logger.error(serverLogMessage, {
          clientData: log.data,
          clientUrl: log.url,
          clientUserAgent: log.userAgent,
          clientSessionId: log.sessionId
        });
        break;
      case 'WARN':
        logger.warn(serverLogMessage, {
          clientData: log.data,
          clientUrl: log.url,
          clientSessionId: log.sessionId
        });
        break;
      default:
        logger.debug(serverLogMessage, {
          clientData: log.data,
          clientSessionId: log.sessionId
        });
    }

    console.log('✅ [LOG API] === LOG PROCESSED SUCCESSFULLY ===');
    
    res.status(200).json({
      success: true,
      message: 'Log received and processed'
    });

  } catch (error) {
    console.log('❌ [LOG API] === ERROR PROCESSING LOG ===');
    console.log('❌ [LOG API] Error:', error.message);
    console.log('❌ [LOG API] Stack:', error.stack);
    
    logger.error('Failed to process client log', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to process log',
      error: error.message
    });
  }
} 