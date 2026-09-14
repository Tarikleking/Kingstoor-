export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: 'Email service is not configured' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !message) return res.status(400).json({ ok: false, error: 'Missing fields' });
    if (name.length > 80 || email.length > 160 || message.length > 3000) return res.status(400).json({ ok: false, error: 'Invalid field length' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Invalid email' });

    const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    const endpoint = 'https://api.resend.com/emails';

    const notification = await fetch(endpoint, {
      method: 'POST', headers,
      body: JSON.stringify({
        from: 'KingstooR Support <support@kingstoor.com>',
        to: ['support@kingstoor.com'],
        reply_to: email,
        subject: `رسالة دعم جديدة من ${name}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>رسالة دعم جديدة - KingstooR</h2><p><b>الاسم:</b> ${escapeHtml(name)}</p><p><b>البريد:</b> ${escapeHtml(email)}</p><p><b>الرسالة:</b></p><div style="white-space:pre-wrap;background:#f5f5f5;padding:14px;border-radius:10px">${escapeHtml(message)}</div></div>`
      })
    });
    const notificationData = await notification.json().catch(() => ({}));
    if (!notification.ok) {
      console.error('Resend notification error:', notificationData);
      return res.status(502).json({ ok: false, error: 'Failed to send support email' });
    }

    // Automatic acknowledgement to the customer from the official support address.
    const confirmation = await fetch(endpoint, {
      method: 'POST', headers,
      body: JSON.stringify({
        from: 'KingstooR Support <support@kingstoor.com>',
        to: [email],
        subject: 'تم استلام رسالتك - KingstooR',
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>مرحباً ${escapeHtml(name)} 👋</h2><p>تم استلام رسالتك بنجاح لدى دعم <b>KingstooR</b>.</p><p>سنراجع رسالتك ونرد عليك عبر البريد الإلكتروني.</p><hr><p style="color:#666;font-size:13px">KingstooR Support — support@kingstoor.com</p></div>`
      })
    });
    if (!confirmation.ok) console.error('Resend confirmation error:', await confirmation.json().catch(() => ({})));

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Support API error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[ch]));
}
