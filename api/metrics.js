module.exports = async (req, res) => {
  try {
    const origin = process.env.ORIGIN; // pl. http://79.122.55.187:3000  (az otthoni publikus:port)
    if (!origin) return res.status(500).json({ error: "NO_ORIGIN" });
    const r = await fetch(`${origin}/metrics`, { cache: 'no-store' });
    const text = await r.text();
    if (!r.ok) return res.status(502).json({ error: 'upstream', status: r.status, body: text });
    const data = JSON.parse(text);
    res.setHeader('Cache-Control','no-store');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
