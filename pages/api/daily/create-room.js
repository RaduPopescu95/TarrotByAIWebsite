export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { documentId, isOwner, userRole, sessionType } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: 'documentId is required' });
  }

  try {
    // Daily.co API configuration
    const DAILY_API_KEY = process.env.DAILY_API_KEY;
    const DAILY_DOMAIN = process.env.DAILY_DOMAIN || process.env.NEXT_PUBLIC_DAILY_DOMAIN;

    if (!DAILY_API_KEY) {
      console.error('DAILY_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Daily.co API key not configured' });
    }

    if (!DAILY_DOMAIN) {
      console.error('DAILY_DOMAIN not found in environment variables');
      return res.status(500).json({ error: 'Daily.co domain not configured' });
    }

    // Determine session type and room naming
    const isConsultationAdmin = userRole === 'admin' && !sessionType; // meeting-admin page (consultations)
    const isConferenceAdmin = userRole === 'admin' && sessionType === 'conference'; // admin-conferinta-grup-video page
    const isClient = userRole === 'client';
    
    // Different room naming for different session types
    const roomName = sessionType === 'conference' 
      ? `conference-${documentId}` 
      : `consultation-${documentId}`;

    console.log('🎥 Creating Daily.co room for:', {
      documentId,
      isOwner,
      userRole,
      sessionType: sessionType || 'consultation',
      isConsultationAdmin,
      isConferenceAdmin,
      isClient,
      roomName
    });

    // First, try to get existing room
    let roomResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let room;
    
    if (roomResponse.status === 404) {
      // Room doesn't exist, create it
      console.log(`Creating new Daily.co room: ${roomName}`);
      
      const createRoomResponse = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            start_video_off: false,
            start_audio_off: false,
            enable_screenshare: true,
            enable_chat: true, // Enable Daily.co chat functionality
            enable_advanced_chat: true, // Enable emoji reactions, Giphy, etc.
            enable_knocking: false,
            enable_prejoin_ui: true, // Force clients to enter their name
            enable_network_ui: true,
            enable_noise_cancellation_ui: true,
            max_participants: sessionType === 'conference' ? 50 : 2, // Conference: up to 50, Consultation: only admin and client
            exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60), // 4 hours from now
            eject_at_room_exp: true,
            // Recording capability enabled for all sessions (admin controls via token)
            enable_recording: 'cloud',
            autojoin: true
          }
        }),
      });

      if (!createRoomResponse.ok) {
        const errorData = await createRoomResponse.text();
        console.error('Failed to create Daily.co room:', errorData);
        return res.status(500).json({ error: 'Failed to create video room' });
      }

      room = await createRoomResponse.json();
    } else if (roomResponse.ok) {
      // Room exists
      room = await roomResponse.json();
      console.log(`Using existing Daily.co room: ${roomName}`);
    } else {
      const errorData = await roomResponse.text();
      console.error('Error checking room existence:', errorData);
      return res.status(500).json({ error: 'Failed to check room status' });
    }

    // Generate meeting token for this user
    const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: isOwner,
          // Admin gets predefined name, client will be prompted via prejoin UI
          ...(userRole === 'admin' && {
            user_name: 'Cristina Zurba'
          }),
          exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60), // 4 hours from now
          start_video_off: false,
          start_audio_off: false,
          
          // Recording UI and permissions based on user role
          ...(userRole === 'admin' && {
            // Admin gets full recording permissions for ALL sessions (consultation AND conference)
            enable_recording: 'cloud',
            enable_recording_ui: true,
            permissions: {
              canSend: ['audio', 'video', 'screenVideo', 'screenAudio']
            }
          }),
          
          ...(userRole === 'client' && {
            // Client: no recording UI, limited permissions
            enable_recording_ui: false,
            permissions: {
              canSend: ['audio', 'video'] // No screen sharing for clients
            }
          }),
        },
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Failed to create meeting token:', errorData);
      return res.status(500).json({ error: 'Failed to create access token' });
    }

    const tokenData = await tokenResponse.json();

    // Return room URL and token
    res.status(200).json({
      roomUrl: room.url,
      roomName: room.name,
      token: tokenData.token,
      domain: DAILY_DOMAIN,
    });

  } catch (error) {
    console.error('Error in create-room API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 