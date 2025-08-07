// API endpoint for admin recording control
// Usage: POST /api/daily/recording-control
// Body: { action: "start"|"stop", roomName: "consultation-xxx", adminToken: "xxx" }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  
  if (!DAILY_API_KEY) {
    return res.status(500).json({ error: 'Daily.co API key not configured' });
  }

  try {
    const { action, roomName, adminToken } = req.body;

    if (!action || !roomName) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['action', 'roomName']
      });
    }

    if (!['start', 'stop'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action',
        allowed: ['start', 'stop']
      });
    }

    console.log(`🎥 [RECORDING-CONTROL] ${action.toUpperCase()} recording for room:`, roomName);

    let endpoint, method, body = {};

    if (action === 'start') {
      endpoint = `https://api.daily.co/v1/rooms/${roomName}/recordings/start`;
      method = 'POST';
      body = {
        properties: {
          layout: {
            preset: 'default',
            composition_id: 'default'
          }
        }
      };
    } else if (action === 'stop') {
      endpoint = `https://api.daily.co/v1/rooms/${roomName}/recordings/stop`;
      method = 'POST';
    }

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ [RECORDING-CONTROL] Failed to ${action} recording:`, errorData);
      return res.status(500).json({ 
        error: `Failed to ${action} recording`,
        details: errorData 
      });
    }

    const responseData = await response.json();
    console.log(`✅ [RECORDING-CONTROL] Recording ${action} successful:`, responseData);

    res.status(200).json({
      success: true,
      action: action,
      roomName: roomName,
      recording: responseData,
      message: `Recording ${action} successful`
    });

  } catch (error) {
    console.error('💥 [RECORDING-CONTROL] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
} 