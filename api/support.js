export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};
  const cleanName = String(name || '').trim().slice(0, 80);
  const cleanEmail = String(email || '').trim().slice(0, 160);
  const cleanMessage = String(message || '').trim().slice(0, 3000);

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  if (!emailOk) {
    return res.status(400).json({ success: false, error: 'Invalid email' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'RESEND_API_KEY is not configured' });
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  try {
    const supportMail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: 'KingstooR Support <support@kingstoor.com>',
        to: ['support@kingstoor.com'],
        reply_to: cleanEmail,
        subject: `رسالة دعم جديدة من ${cleanName}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9"><h2>رسالة دعم جديدة</h2><p><b>الاسم:</b> ${escapeHtml(cleanName)}</p><p><b>البريد:</b> ${escapeHtml(cleanEmail)}</p><hr><p style="white-space:pre-wrap">${escapeHtml(cleanMessage)}</p></div>`
      })
    });

    if (!supportMail.ok) {
      const detail = await supportMail.text();
      console.error('Resend support error:', detail);
      return res.status(502).json({ success: false, error: 'Resend failed' });
    }

    // Automatic acknowledgment to the customer, sent from the professional support address.
    const customerMail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: 'KingstooR Support <support@kingstoor.com>',
        to: [cleanEmail],
        subject: 'تم استلام رسالتك — KingstooR',
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9"><h2>مرحباً ${escapeHtml(cleanName)} 👋</h2><p>تم استلام رسالتك بنجاح من خلال دعم KingstooR.</p><p>سيراجع فريق الدعم رسالتك وسيتم الرد عليك عبر هذا البريد الإلكتروني.</p><hr><p style="color:#666">هذه رسالة تأكيد تلقائية.</p></div>`
      })
    });

    if (!customerMail.ok) {
      console.error('Resend customer acknowledgment error:', await customerMail.text());
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  })[char]);
}
