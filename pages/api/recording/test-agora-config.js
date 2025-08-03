// Test Agora Configuration
export default async function handler(req, res) {
  console.log('🧪 [TEST AGORA] === API CALLED ===');
  console.log('🧪 [TEST AGORA] Method:', req.method);
  
  try {
    // Read environment variables exactly as start.js does
    const AGORA_CONFIG = {
      appId: process.env.PUBLIC_AGORA_APP_ID,
      appCertificate: process.env.AGORA_APP_CERTIFICATE, 
      customerId: process.env.AGORA_CUSTOMER_ID,
      customerSecret: process.env.AGORA_CUSTOMER_SECRET,
      storageConfig: {
        vendor: parseInt(process.env.AGORA_CLOUD_STORAGE_VENDOR) || 6,
        region: parseInt(process.env.AGORA_GCS_REGION) || 0,
        bucket: process.env.AGORA_CLOUD_STORAGE_BUCKET,
        accessKey: process.env.GCS_HMAC_ACCESS_KEY,
        secretKey: process.env.GCS_HMAC_SECRET_KEY
      }
    };

    console.log('🔍 [TEST AGORA] Config loaded:', {
      appId: AGORA_CONFIG.appId?.substring(0, 8) + '...',
      hasAppCertificate: !!AGORA_CONFIG.appCertificate,
      hasCustomerId: !!AGORA_CONFIG.customerId,
      hasCustomerSecret: !!AGORA_CONFIG.customerSecret,
      storageVendor: AGORA_CONFIG.storageConfig.vendor,
      storageRegion: AGORA_CONFIG.storageConfig.region,
      hasBucket: !!AGORA_CONFIG.storageConfig.bucket,
      hasAccessKey: !!AGORA_CONFIG.storageConfig.accessKey,
      hasSecretKey: !!AGORA_CONFIG.storageConfig.secretKey
    });

    // Test basic validation
    const missingFields = [];
    if (!AGORA_CONFIG.appId) missingFields.push('PUBLIC_AGORA_APP_ID');
    if (!AGORA_CONFIG.customerId) missingFields.push('AGORA_CUSTOMER_ID');
    if (!AGORA_CONFIG.customerSecret) missingFields.push('AGORA_CUSTOMER_SECRET');
    if (!AGORA_CONFIG.storageConfig.bucket) missingFields.push('AGORA_CLOUD_STORAGE_BUCKET');
    if (!AGORA_CONFIG.storageConfig.accessKey) missingFields.push('GCS_HMAC_ACCESS_KEY');
    if (!AGORA_CONFIG.storageConfig.secretKey) missingFields.push('GCS_HMAC_SECRET_KEY');

    // Test Agora REST API connection (simple endpoint)
    let agoraTestResult = null;
    let agoraTestError = null;
    
    try {
      console.log('🌐 [TEST AGORA] Testing Agora API connectivity...');
      
      // Basic auth test to a simple Agora endpoint
      const basicAuth = Buffer.from(`${AGORA_CONFIG.customerId}:${AGORA_CONFIG.customerSecret}`).toString('base64');
      
      const testResponse = await fetch(`https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/acquire`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cname: 'test-channel-config-check',
          uid: '999999999',
          clientRequest: {}
        })
      });

      console.log('📡 [TEST AGORA] Agora API response status:', testResponse.status);
      
      const agoraResponseText = await testResponse.text();
      console.log('📡 [TEST AGORA] Agora API response:', agoraResponseText);
      
      if (testResponse.ok) {
        agoraTestResult = JSON.parse(agoraResponseText);
        console.log('✅ [TEST AGORA] Agora API accessible');
      } else {
        agoraTestError = `HTTP ${testResponse.status}: ${agoraResponseText}`;
        console.log('❌ [TEST AGORA] Agora API error:', agoraTestError);
      }
      
    } catch (fetchError) {
      agoraTestError = fetchError.message;
      console.log('❌ [TEST AGORA] Agora API fetch error:', fetchError.message);
    }

    const response = {
      success: missingFields.length === 0 && !agoraTestError,
      timestamp: new Date().toISOString(),
      environmentVariables: {
        PUBLIC_AGORA_APP_ID: !!process.env.PUBLIC_AGORA_APP_ID,
        AGORA_APP_CERTIFICATE: !!process.env.AGORA_APP_CERTIFICATE,
        AGORA_CUSTOMER_ID: !!process.env.AGORA_CUSTOMER_ID,
        AGORA_CUSTOMER_SECRET: !!process.env.AGORA_CUSTOMER_SECRET,
        AGORA_CLOUD_STORAGE_VENDOR: !!process.env.AGORA_CLOUD_STORAGE_VENDOR,
        AGORA_GCS_REGION: !!process.env.AGORA_GCS_REGION,
        AGORA_CLOUD_STORAGE_BUCKET: !!process.env.AGORA_CLOUD_STORAGE_BUCKET,
        GCS_HMAC_ACCESS_KEY: !!process.env.GCS_HMAC_ACCESS_KEY,
        GCS_HMAC_SECRET_KEY: !!process.env.GCS_HMAC_SECRET_KEY
      },
      agoraConfig: {
        appId: AGORA_CONFIG.appId?.substring(0, 8) + '...' || 'MISSING',
        appIdLength: AGORA_CONFIG.appId?.length || 0,
        appCertificateLength: AGORA_CONFIG.appCertificate?.length || 0,
        customerIdLength: AGORA_CONFIG.customerId?.length || 0,
        customerSecretLength: AGORA_CONFIG.customerSecret?.length || 0,
        storageVendor: AGORA_CONFIG.storageConfig.vendor,
        storageRegion: AGORA_CONFIG.storageConfig.region,
        bucketName: AGORA_CONFIG.storageConfig.bucket,
        accessKeyLength: AGORA_CONFIG.storageConfig.accessKey?.length || 0,
        secretKeyLength: AGORA_CONFIG.storageConfig.secretKey?.length || 0
      },
      validation: {
        missingFields,
        allFieldsPresent: missingFields.length === 0
      },
      agoraApiTest: {
        accessible: !agoraTestError,
        result: agoraTestResult,
        error: agoraTestError
      }
    };
    
    console.log('📋 [TEST AGORA] Test results:', JSON.stringify(response, null, 2));
    
    res.status(200).json(response);
    
  } catch (error) {
    console.log('💥 [TEST AGORA] Test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
} 