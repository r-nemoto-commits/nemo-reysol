const { put } = require('@vercel/blob');

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const requiredSecret = process.env.GALLERY_SECRET;
  if (requiredSecret && req.headers['x-gallery-secret'] !== requiredSecret) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.startsWith('image/')) {
    res.status(400).json({ error: 'Invalid content type' });
    return;
  }

  try {
    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
      total += chunk.length;
      if (total > 8 * 1024 * 1024) {
        res.status(413).json({ error: 'Image too large' });
        return;
      }
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const ext = (contentType.split('/')[1] || 'jpg').split('+')[0];
    const filename = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
    });

    res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('upload failed', err);
    res.status(500).json({ error: 'Upload failed' });
  }
};
