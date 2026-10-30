const { put, list } = require('@vercel/blob');

const ATTENDANCE_PATH = 'data/attendance.json';

async function readAttendance() {
  const { blobs } = await list({ prefix: ATTENDANCE_PATH });
  const match = blobs.find((b) => b.pathname === ATTENDANCE_PATH);
  if (!match) return {};
  const res = await fetch(match.url, { cache: 'no-store' });
  if (!res.ok) return {};
  try {
    return await res.json();
  } catch {
    return {};
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = await readAttendance();
      res.status(200).json(data);
    } catch (err) {
      console.error('read attendance failed', err);
      res.status(500).json({ error: 'Failed to read attendance' });
    }
    return;
  }

  if (req.method === 'POST') {
    const { matchKey, attendance } = req.body || {};
    if (!matchKey || typeof matchKey !== 'string' || ![0, 1, 2].includes(attendance)) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    try {
      const current = await readAttendance();
      current[matchKey] = attendance;
      await put(ATTENDANCE_PATH, JSON.stringify(current), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('write attendance failed', err);
      res.status(500).json({ error: 'Failed to save attendance' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
