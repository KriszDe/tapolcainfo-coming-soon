module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const origin = process.env.ORIGIN;     // pl. http://79.122.55.187
    const user = process.env.BASIC_USER;   // Dell
    const pass = process.env.BASIC_PASS;   // Kovacs
    const token = process.env.RESTART_TOKEN; // UGYANAZ mint a szerveren!

    const auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

    const r = await fetch(`${origin}/restart?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const data = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(r.ok ? 200 : r.status).json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
