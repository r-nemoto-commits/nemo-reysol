const { del } = require('@vercel/blob');

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

  const url = req.body && req.body.url;

  if (!url || typeof url !== 'string' || !url.includes('/gallery/')) {
    res.status(400).json({ error: 'Invalid url' });
    return;
  }

  try {
    await del(url);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('delete failed', err);
    res.status(500).json({ error: 'Delete failed' });
  }
};
