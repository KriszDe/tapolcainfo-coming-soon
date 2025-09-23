module.exports = async (req, res) => {
  try {
    const origin = process.env.METRICS_ORIGIN; // pl. http://79.122.55.187
    const user = process.env.METRICS_USER;     // Dell
    const pass = process.env.METRICS_PASS;     // kovacs
    const auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

    const r = await fetch(`${origin}/metrics`, {
      headers: { Authorization: auth },
      cache: 'no-store'
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: `Upstream error ${r.status}` });
    }

    const data = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Internal error' });
  }
};
