// Helper function to sanitize filename for HTTP headers
function sanitizeFilename(filename) {
  // Remove or replace invalid characters for HTTP headers
  return filename
    .replace(/[^\w\s\-_.]/g, '_') // Replace special chars with underscore
    .replace(/\s+/g, '_')         // Replace spaces with underscore
    .replace(/_{2,}/g, '_')       // Replace multiple underscores with single
    .substring(0, 200);           // Limit length to prevent header size issues
}

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

    // Fetch the file from Firebase Storage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TarrotByAI-DownloadAPI/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('❌ [DOWNLOAD API] Failed to fetch file:', {
        status: response.status,
        statusText: response.statusText,
        url: url.substring(0, 100) + '...'
      });
      return res.status(response.status).json({ 
        message: `Failed to fetch file: ${response.status} ${response.statusText}` 
      });
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

    // Sanitize filename for HTTP header
    const sanitizedFilename = sanitizeFilename(filename || 'recording.webm');
    
    // Set headers to force download with proper encoding
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(sanitizedFilename)}`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    console.log('📦 [DOWNLOAD API] Sending file with headers:', {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(sanitizedFilename)}`,
      'Content-Length': fileBuffer.length,
      'Original-Filename': filename,
      'Sanitized-Filename': sanitizedFilename
    });

    // Send the file
    res.send(fileBuffer);

  } catch (error) {
    console.error('❌ [DOWNLOAD API] Error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return res.status(408).json({ message: 'Download timeout - fișierul este prea mare sau conexiunea este lentă' });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(502).json({ message: 'Nu se poate conecta la serverul de stocare' });
    } else if (error.message.includes('fetch')) {
      return res.status(502).json({ message: 'Eroare la preluarea fișierului de la stocare' });
    }
    
    res.status(500).json({ 
      message: 'Eroare internă de server la descărcare', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contactați suportul'
    });
  }
} 