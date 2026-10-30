const { list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { blobs } = await list({ prefix: 'gallery/' });
    const photos = blobs
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .map((b) => ({ url: b.url, uploadedAt: b.uploadedAt }));
    res.status(200).json({ photos });
  } catch (err) {
    console.error('list photos failed', err);
    res.status(500).json({ error: 'Failed to list photos' });
  }
};
