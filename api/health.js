module.exports = async (req, res) => {
  try {
    const origin = process.env.ORIGIN;    // pl. http://79.122.55.187
    const user = process.env.BASIC_USER;  // Dell
    const pass = process.env.BASIC_PASS;  // Kovacs
    const auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

    const r = await fetch(`${origin}/health`, { headers: { Authorization: auth }, cache: 'no-store' });
    const data = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(r.ok ? 200 : r.status).json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
