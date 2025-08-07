// API endpoint to configure Daily.co domain webhooks
// This needs to be called once to set up webhooks for recording events
// Usage: POST /api/daily/setup-webhook

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  
  if (!DAILY_API_KEY) {
    return res.status(500).json({ error: 'Daily.co API key not configured' });
  }

  try {
    console.log('🔗 [WEBHOOK-SETUP] Setting up Daily.co domain webhooks...');

    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cristinazurba.com'}/api/daily/webhook`;
    
    // Get current webhooks first
    const getWebhooksResponse = await fetch('https://api.daily.co/v1/webhooks', {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (getWebhooksResponse.ok) {
      const webhooks = await getWebhooksResponse.json();
      console.log('📋 [WEBHOOK-SETUP] Current webhooks:', webhooks);
      
      // Check if our webhook already exists
      const existingWebhook = webhooks.data?.find(webhook => 
        webhook.url === webhookUrl
      );
      
      if (existingWebhook) {
        console.log('✅ [WEBHOOK-SETUP] Webhook already exists:', existingWebhook.id);
        return res.status(200).json({
          success: true,
          message: 'Webhook already configured',
          webhook: existingWebhook
        });
      }
    }

    // Create new webhook
    const createWebhookResponse = await fetch('https://api.daily.co/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: {
          'recording.ready-to-download': true,
          'recording.finished': true,
          'recording.error': true,
          'room.exp': true
        }
      }),
    });

    if (!createWebhookResponse.ok) {
      const errorData = await createWebhookResponse.text();
      console.error('❌ [WEBHOOK-SETUP] Failed to create webhook:', errorData);
      return res.status(500).json({ 
        error: 'Failed to create webhook',
        details: errorData 
      });
    }

    const webhook = await createWebhookResponse.json();
    console.log('✅ [WEBHOOK-SETUP] Webhook created successfully:', webhook.id);

    res.status(200).json({
      success: true,
      message: 'Webhook configured successfully',
      webhook: webhook,
      url: webhookUrl
    });

  } catch (error) {
    console.error('💥 [WEBHOOK-SETUP] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
} 