export default async function handler(req, res) {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;

  if (!DAILY_API_KEY) {
    return res.status(500).json({ error: 'Daily.co API key not configured' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get recordings for a specific room or all recordings
        const { roomName, limit = 10 } = req.query;
        
        let url = 'https://api.daily.co/v1/recordings';
        const params = new URLSearchParams();
        
        if (roomName) {
          params.append('room_name', roomName);
        }
        params.append('limit', limit);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const getResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!getResponse.ok) {
          const errorData = await getResponse.text();
          console.error('Failed to get recordings:', errorData);
          return res.status(500).json({ error: 'Failed to get recordings' });
        }

        const recordings = await getResponse.json();
        return res.status(200).json(recordings);

      case 'POST':
        // Start recording for a room
        const { roomName: recordRoomName } = req.body;
        
        if (!recordRoomName) {
          return res.status(400).json({ error: 'roomName is required' });
        }

        const startRecordingResponse = await fetch(`https://api.daily.co/v1/rooms/${recordRoomName}/recordings/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              layout: {
                preset: 'default'
              },
              instance_id: recordRoomName,
            }
          }),
        });

        if (!startRecordingResponse.ok) {
          const errorData = await startRecordingResponse.text();
          console.error('Failed to start recording:', errorData);
          return res.status(500).json({ error: 'Failed to start recording' });
        }

        const recordingData = await startRecordingResponse.json();
        return res.status(200).json(recordingData);

      case 'DELETE':
        // Stop recording for a room
        const { roomName: stopRoomName } = req.body;
        
        if (!stopRoomName) {
          return res.status(400).json({ error: 'roomName is required' });
        }

        const stopRecordingResponse = await fetch(`https://api.daily.co/v1/rooms/${stopRoomName}/recordings/stop`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!stopRecordingResponse.ok) {
          const errorData = await stopRecordingResponse.text();
          console.error('Failed to stop recording:', errorData);
          return res.status(500).json({ error: 'Failed to stop recording' });
        }

        const stopData = await stopRecordingResponse.json();
        return res.status(200).json(stopData);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in recordings API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 