const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables or fallback values
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 't1zs9swp',
  api_key: process.env.CLOUDINARY_API_KEY || '968112335611744',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Rneot_d-y-dt3_PVVyUBzpbUEQU',
  secure: true
});

module.exports = async function handler(req, res) {
  // Set CORS headers for browser requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Send POST request with image data.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // Leave as string if not JSON
      }
    }

    const image = body?.image || body?.file || body?.data;
    const folder = body?.folder || 'vino_makeover';

    if (!image) {
      return res.status(400).json({ error: 'Missing image payload' });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: folder,
      resource_type: 'auto'
    });

    return res.status(200).json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({
      error: 'Cloudinary upload failed',
      details: error.message || error
    });
  }
};
