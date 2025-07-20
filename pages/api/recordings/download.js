export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { url, filename } = req.query;

    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    console.log('🔗 [DOWNLOAD API] Proxying download for:', { url, filename });

    // Fetch the file from Firebase Storage
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ [DOWNLOAD API] Failed to fetch file:', response.status);
      return res.status(response.status).json({ message: 'Failed to fetch file' });
    }

    // Get the file content
    const buffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Determine content type
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Override content type for video files to ensure download
    if (filename) {
      if (filename.endsWith('.webm')) {
        contentType = 'video/webm';
      } else if (filename.endsWith('.mp4')) {
        contentType = 'video/mp4';
      } else if (filename.endsWith('.mov')) {
        contentType = 'video/quicktime';
      }
    }

    // Set headers to force download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'recording.webm'}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    console.log('📦 [DOWNLOAD API] Sending file with headers:', {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename || 'recording.webm'}"`,
      'Content-Length': fileBuffer.length
    });

    // Send the file
    res.send(fileBuffer);

  } catch (error) {
    console.error('❌ [DOWNLOAD API] Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 