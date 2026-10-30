const { put, list } = require('@vercel/blob');

const BOARD_PATH = 'data/board.json';
const MAX_POSTS = 200;

async function readBoard() {
  const { blobs } = await list({ prefix: BOARD_PATH });
  const match = blobs.find((b) => b.pathname === BOARD_PATH);
  if (!match) return [];
  const res = await fetch(match.url, { cache: 'no-store' });
  if (!res.ok) return [];
  try {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const posts = await readBoard();
      res.status(200).json({ posts });
    } catch (err) {
      console.error('read board failed', err);
      res.status(500).json({ error: 'Failed to read board' });
    }
    return;
  }

  if (req.method === 'POST') {
    const { name, text } = req.body || {};
    const trimmedName = typeof name === 'string' ? name.trim().slice(0, 20) : '';
    const trimmedText = typeof text === 'string' ? text.trim().slice(0, 300) : '';

    if (!trimmedText) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const post = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName || '名無しサポーター',
      text: trimmedText,
      createdAt: new Date().toISOString(),
    };

    try {
      const posts = await readBoard();
      posts.push(post);
      while (posts.length > MAX_POSTS) posts.shift();
      await put(BOARD_PATH, JSON.stringify(posts), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      res.status(200).json({ ok: true, post });
    } catch (err) {
      console.error('write board failed', err);
      res.status(500).json({ error: 'Failed to save post' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
