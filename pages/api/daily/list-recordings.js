export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY;

  if (!DAILY_API_KEY) {
    console.error('DAILY_API_KEY not found in environment variables');
    return res.status(500).json({ error: 'Daily.co API key not configured' });
  }

  try {
    const { 
      limit = 100,
      starting_after,
      ending_before
    } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 100);

    console.log('[LIST-RECORDINGS] Fetching recordings from Daily.co', {
      limit: parsedLimit,
      starting_after,
      ending_before
    });

    const queryParams = new URLSearchParams({
      limit: parsedLimit.toString()
    });

    // Daily.co pagination parameters
    if (starting_after) {
      queryParams.append('starting_after', starting_after);
    }
    
    if (ending_before) {
      queryParams.append('ending_before', ending_before);
    }

    const recordingsResponse = await fetch(
      `https://api.daily.co/v1/recordings?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!recordingsResponse.ok) {
      const errorData = await recordingsResponse.text();
      console.error('❌ [LIST-RECORDINGS] Failed to fetch recordings:', {
        status: recordingsResponse.status,
        error: errorData
      });
      return res.status(recordingsResponse.status).json({ 
        error: 'Failed to fetch recordings',
        details: errorData 
      });
    }

    const recordingsData = await recordingsResponse.json();
    
    // Process and enhance recordings data with ALL Daily.co fields
    const enhancedRecordings = recordingsData.data.map(recording => {
      // Extract document ID from room name if possible
      const roomName = recording.room_name;
      let documentId = null;
      let sessionType = 'unknown';
      
      if (roomName) {
        if (roomName.startsWith('consultation-')) {
          documentId = roomName.replace('consultation-', '');
          sessionType = 'consultation';
        } else if (roomName.startsWith('conference-')) {
          documentId = roomName.replace('conference-', '');
          sessionType = 'conference';
        }
      }

      // Format timestamps (Daily.co uses unix timestamps)
      const startTs = recording.start_ts;
      const startDate = startTs ? new Date(startTs * 1000) : null;
      const startedAt = startDate ? startDate.toLocaleString('ro-RO') : null;
      const startDateISO = startDate ? startDate.toISOString() : null;
      
      const finishedAt = recording.finished_at ? new Date(recording.finished_at).toLocaleString('ro-RO') : null;
      
      // Calculate duration in a readable format
      const durationFormatted = recording.duration ? 
        `${Math.floor(recording.duration / 60)}m ${recording.duration % 60}s` : 
        'Unknown';

      // Process tracks information
      const tracksInfo = recording.tracks ? {
        count: Array.isArray(recording.tracks) ? recording.tracks.length : 0,
        types: Array.isArray(recording.tracks) ? recording.tracks.map(track => track.type).join(', ') : 'N/A'
      } : null;

      return {
        // Basic info
        id: recording.id,
        roomName: roomName,
        documentId: documentId,
        sessionType: sessionType,
        status: recording.status,
        
        // Timing info
        startTs: startTs,
        startDate: startDateISO,
        startedAt: startedAt,
        finishedAt: finishedAt,
        duration: recording.duration,
        durationFormatted: durationFormatted,
        
        // Session info
        maxParticipants: recording.max_participants,
        mtgSessionId: recording.mtgSessionId || recording.meeting_session_id || null,
        
        // Storage info
        sizeBytes: recording.size_bytes,
        sizeMB: recording.size_bytes ? (recording.size_bytes / (1024 * 1024)).toFixed(2) : null,
        s3key: recording.s3key || recording.s3_key || null,
        
        // Media info
        downloadUrl: recording.download_url || null,
        playbackUrl: recording.playback_url || null,
        tracks: tracksInfo,
        
        // Raw Daily.co data for debugging
        rawData: {
          composed_by: recording.composed_by,
          creation_timestamp: recording.creation_timestamp,
          domain_name: recording.domain_name,
          output_settings: recording.output_settings
        }
      };
    });

    console.log('[LIST-RECORDINGS] Successfully fetched recordings:', {
      total: recordingsData.total_count,
      returned: enhancedRecordings.length,
      hasNextPage: recordingsData.has_next_page,
      hasPrevPage: recordingsData.has_prev_page
    });

    res.status(200).json({
      success: true,
      data: enhancedRecordings,
      pagination: {
        total: recordingsData.total_count,
        returned: enhancedRecordings.length,
        limit: parsedLimit,
        hasNextPage: recordingsData.has_next_page || false,
        hasPrevPage: recordingsData.has_prev_page || false,
        firstRecordingId: enhancedRecordings.length > 0 ? enhancedRecordings[0].id : null,
        lastRecordingId: enhancedRecordings.length > 0 ? enhancedRecordings[enhancedRecordings.length - 1].id : null
      },
      stats: {
        consultations: enhancedRecordings.filter(r => r.sessionType === 'consultation').length,
        conferences: enhancedRecordings.filter(r => r.sessionType === 'conference').length,
        finished: enhancedRecordings.filter(r => r.status === 'finished').length,
        processing: enhancedRecordings.filter(r => r.status === 'processing').length,
        totalOnPage: enhancedRecordings.length
      }
    });

  } catch (error) {
    console.error('💥 [LIST-RECORDINGS] Error fetching recordings:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error while fetching recordings',
      details: error.message 
    });
  }
} 