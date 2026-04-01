const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ARKESEL_URL = 'https://sms.arkesel.com/sms/api';

// ── CHECK BALANCE ─────────────────────────────────────────────────
app.post('/api/balance', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ ok: false, message: 'API key required' });

  try {
    const url = `${ARKESEL_URL}?action=check-balance&api_key=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url);
    const data = await r.json();
    const ok = data.status === 'ok' || data.status === 'OK';
    res.json({ ok, balance: data.balance ?? data.data ?? '—', raw: data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── SEND SINGLE SMS ───────────────────────────────────────────────
app.post('/api/send', async (req, res) => {
  const { apiKey, senderId, phone, message } = req.body;
  if (!apiKey || !senderId || !phone || !message) {
    return res.status(400).json({ ok: false, message: 'Missing required fields' });
  }

  const params = new URLSearchParams({
    action: 'send-sms',
    api_key: apiKey,
    to: phone,
    from: senderId,
    sms: message
  });

  try {
    const r = await fetch(`${ARKESEL_URL}?${params.toString()}`);
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { status: 'error', message: text }; }
    const ok = data.status === 'ok' || data.status === 'OK' || r.ok;
    res.json({ ok, raw: data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── HEALTH CHECK ──────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`BulkSend server running on port ${PORT}`));
