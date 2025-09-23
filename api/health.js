module.exports = async (req, res) => {
  try {
    const origin = process.env.METRICS_ORIGIN; // pl. http://79.122.55.187
    const user = process.env.METRICS_USER;
    const pass = process.env.METRICS_PASS;
    const auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

    const r = await fetch(`${origin}/health`, {
      headers: { Authorization: auth },
      cache: 'no-store'
    });

    if (!r.ok) {
      return res.status(r.status).json({ ok: false, error: `Upstream ${r.status}` });
    }

    const data = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message || 'Internal error' });
  }
};
