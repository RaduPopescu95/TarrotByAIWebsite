export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 [TEST-WEBHOOK] Testing webhook flow with temporary download links');

    // Simulate a Daily.co webhook payload for recording.ready-to-download
    const simulatedWebhookData = {
      type: 'recording.ready-to-download',
      room: {
        name: 'consultation-test-temp-webhook'
      },
      recording: {
        id: 'fake-recording-id-12345',
        duration: 1800, // 30 minutes
        status: 'finished'
      }
    };

    console.log('🧪 [TEST-WEBHOOK] Simulated webhook data:', simulatedWebhookData);

    // Test the webhook processing
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const webhookResponse = await fetch(`${baseUrl}/api/daily/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simulatedWebhookData),
    });

    const webhookResult = await webhookResponse.text();

    console.log('🧪 [TEST-WEBHOOK] Webhook response:', {
      status: webhookResponse.status,
      result: webhookResult
    });

    if (webhookResponse.ok) {
      res.status(200).json({
        success: true,
        message: 'Webhook test completed successfully',
        webhookStatus: webhookResponse.status,
        webhookResult: webhookResult,
        testData: simulatedWebhookData
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'Webhook test completed with errors',
        webhookStatus: webhookResponse.status,
        webhookResult: webhookResult,
        testData: simulatedWebhookData
      });
    }

  } catch (error) {
    console.error('💥 [TEST-WEBHOOK] Error during webhook test:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 