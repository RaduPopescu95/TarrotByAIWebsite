export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY;

  if (!DAILY_API_KEY) {
    console.error('DAILY_API_KEY not found in environment variables');
    return res.status(500).json({ error: 'Daily.co API key not configured' });
  }

  const { recordingId } = req.body;

  if (!recordingId) {
    return res.status(400).json({ error: 'Missing recordingId' });
  }

  try {
    console.log('🔗 [DOWNLOAD-LINK] Generating temporary download link for recording:', recordingId);

    // Generate temporary download link (12 hours = 43200 seconds)
    const linkResponse = await fetch(
      `https://api.daily.co/v1/recordings/${recordingId}/access-link?valid_for_secs=43200`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!linkResponse.ok) {
      const errorData = await linkResponse.text();
      console.error('❌ [DOWNLOAD-LINK] Failed to generate download link:', {
        recordingId,
        status: linkResponse.status,
        error: errorData
      });
      return res.status(linkResponse.status).json({ 
        error: 'Failed to generate download link',
        details: errorData 
      });
    }

    const linkData = await linkResponse.json();
    
    console.log('✅ [DOWNLOAD-LINK] Successfully generated download link:', {
      recordingId,
      downloadLink: linkData.download_link ? 'GENERATED' : 'MISSING',
      expires: linkData.expires ? new Date(linkData.expires * 1000).toISOString() : 'UNKNOWN'
    });

    // Return the download link and expiration info
    res.status(200).json({
      success: true,
      downloadLink: linkData.download_link,
      expires: linkData.expires,
      expiresAt: linkData.expires ? new Date(linkData.expires * 1000).toISOString() : null,
      validForHours: 12,
      recordingId: recordingId
    });

  } catch (error) {
    console.error('💥 [DOWNLOAD-LINK] Error generating download link:', {
      recordingId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error while generating download link',
      details: error.message 
    });
  }
} 