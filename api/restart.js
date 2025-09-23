module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'method_not_allowed' });
  try {
    const origin = process.env.ORIGIN;
    const token = process.env.RESTART_TOKEN;
    if (!origin || !token) return res.status(500).json({ error: 'CONFIG_MISSING' });

    const r = await fetch(`${origin}/restart?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const text = await r.text();
    const body = text ? JSON.parse(text) : {};
    res.setHeader('Cache-Control','no-store');
    res.status(r.ok ? 200 : r.status).json(body);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
