export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  }

  res.setHeader('Cache-Control', 'no-store');

  // =========================================================
  // 1) Check API key
  // =========================================================
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('SUPPORT ERROR [1]: RESEND_API_KEY is missing');

    return res.status(500).json({
      ok: false,
      error: 'Email service is not configured',
      debug: 'RESEND_API_KEY is missing in Production Environment'
    });
  }

  console.log('SUPPORT [1]: RESEND_API_KEY detected');
  console.log('SUPPORT [1]: API key length:', apiKey.length);

  // =========================================================
  // 2) Read request body
  // =========================================================
  let body;

  try {
    body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : (req.body || {});
  } catch (error) {
    console.error('SUPPORT ERROR [2]: Invalid JSON body', error);

    return res.status(400).json({
      ok: false,
      error: 'Invalid request body',
      debug: 'Request body is not valid JSON'
    });
  }

  console.log('SUPPORT [2]: Request body received');
  console.log('SUPPORT [2]: Body keys:', Object.keys(body));

  // =========================================================
  // 3) Extract fields
  // =========================================================
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();

  console.log('SUPPORT [3]: Name received:', !!name);
  console.log('SUPPORT [3]: Email received:', !!email);
  console.log('SUPPORT [3]: Message received:', !!message);

  // =========================================================
  // 4) Validate fields
  // =========================================================
  if (!name || !email || !message) {
    console.error('SUPPORT ERROR [4]: Missing fields', {
      hasName: !!name,
      hasEmail: !!email,
      hasMessage: !!message
    });

    return res.status(400).json({
      ok: false,
      error: 'Missing fields',
      debug: {
        name: !!name,
        email: !!email,
        message: !!message
      }
    });
  }

  if (
    name.length > 80 ||
    email.length > 160 ||
    message.length > 3000
  ) {
    console.error('SUPPORT ERROR [4]: Invalid field length');

    return res.status(400).json({
      ok: false,
      error: 'Invalid field length'
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('SUPPORT ERROR [4]: Invalid email format');

    return res.status(400).json({
      ok: false,
      error: 'Invalid email'
    });
  }

  console.log('SUPPORT [4]: Validation passed');

  // =========================================================
  // 5) Prepare Resend request
  // =========================================================
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const endpoint = 'https://api.resend.com/emails';

  console.log('SUPPORT [5]: Preparing Resend request');
  console.log('SUPPORT [5]: Endpoint:', endpoint);
  console.log('SUPPORT [5]: From: support@kingstoor.com');
  console.log('SUPPORT [5]: To: support@kingstoor.com');

  // =========================================================
  // 6) Send notification to support
  // =========================================================
  let notification;

  try {
    console.log('SUPPORT [6]: Calling Resend notification...');

    notification = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: 'KingstooR Support <support@kingstoor.com>',
        to: ['support@kingstoor.com'],
        reply_to: email,
        subject: `رسالة دعم جديدة من ${name}`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
            <h2>رسالة دعم جديدة - KingstooR</h2>

            <p>
              <b>الاسم:</b>
              ${escapeHtml(name)}
            </p>

            <p>
              <b>البريد:</b>
              ${escapeHtml(email)}
            </p>

            <p>
              <b>الرسالة:</b>
            </p>

            <div style="
              white-space:pre-wrap;
              background:#f5f5f5;
              padding:14px;
              border-radius:10px;
            ">
              ${escapeHtml(message)}
            </div>
          </div>
        `
      })
    });

    console.log(
      'SUPPORT [6]: Resend notification response status:',
      notification.status
    );

  } catch (error) {
    console.error('SUPPORT ERROR [6]: Resend fetch failed');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);

    return res.status(502).json({
      ok: false,
      error: 'Resend connection failed',
      debug: {
        stage: 'notification_fetch',
        name: error?.name || 'UnknownError',
        message: error?.message || 'Unknown fetch error'
      }
    });
  }

  // =========================================================
  // 7) Read Resend response
  // =========================================================
  let notificationData = {};

  try {
    notificationData = await notification.json();
  } catch (error) {
    console.error(
      'SUPPORT ERROR [7]: Could not parse Resend response',
      error
    );
  }

  console.log(
    'SUPPORT [7]: Resend notification response:',
    notificationData
  );

  // =========================================================
  // 8) Resend rejected notification
  // =========================================================
  if (!notification.ok) {
    console.error('SUPPORT ERROR [8]: Resend rejected notification');
    console.error('HTTP status:', notification.status);
    console.error('Resend response:', notificationData);

    return res.status(502).json({
      ok: false,
      error: 'Failed to send support email',
      debug: {
        stage: 'notification_response',
        resendStatus: notification.status,
        resendResponse: notificationData
      }
    });
  }

  console.log('SUPPORT [8]: Notification email sent successfully');

  // =========================================================
  // 9) Send automatic confirmation to customer
  // =========================================================
  let confirmation;

  try {
    console.log('SUPPORT [9]: Sending customer confirmation...');

    confirmation = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: 'KingstooR Support <support@kingstoor.com>',
        to: [email],
        subject: 'تم استلام رسالتك - KingstooR',
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
            <h2>
              مرحباً ${escapeHtml(name)} 👋
            </h2>

            <p>
              تم استلام رسالتك بنجاح لدى دعم
              <b>KingstooR</b>.
            </p>

            <p>
              سنراجع رسالتك ونرد عليك عبر البريد الإلكتروني.
            </p>

            <hr>

            <p style="color:#666;font-size:13px">
              KingstooR Support — support@kingstoor.com
            </p>
          </div>
        `
      })
    });

    console.log(
      'SUPPORT [9]: Confirmation response status:',
      confirmation.status
    );

  } catch (error) {
    console.error('SUPPORT ERROR [9]: Confirmation fetch failed');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);

    // The support email was already sent successfully,
    // so we don't fail the whole request.
    return res.status(200).json({
      ok: true,
      notificationSent: true,
      confirmationSent: false
    });
  }

  // =========================================================
  // 10) Read confirmation response
  // =========================================================
  let confirmationData = {};

  try {
    confirmationData = await confirmation.json();
  } catch (error) {
    console.error(
      'SUPPORT ERROR [10]: Could not parse confirmation response',
      error
    );
  }

  console.log(
    'SUPPORT [10]: Confirmation response:',
    confirmationData
  );

  // =========================================================
  // 11) Confirmation rejected
  // =========================================================
  if (!confirmation.ok) {
    console.error('SUPPORT ERROR [11]: Confirmation rejected');
    console.error('HTTP status:', confirmation.status);
    console.error('Resend response:', confirmationData);

    // Notification was successful, so the main operation succeeded.
    return res.status(200).json({
      ok: true,
      notificationSent: true,
      confirmationSent: false
    });
  }

  console.log('SUPPORT [11]: Confirmation email sent successfully');

  // =========================================================
  // 12) Everything succeeded
  // =========================================================
  console.log('SUPPORT [12]: COMPLETE - support email sent');

  return res.status(200).json({
    ok: true,
    notificationSent: true,
    confirmationSent: true
  });
}


// =========================================================
// HTML escaping
// =========================================================
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    ch =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[ch]
  );
}
