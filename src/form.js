// Form handling for the endpoints in src/worker.js.
// Forms are emailed to Zippy Title Loans using Resend (https://resend.com).
//
// Required variables (Workers > zippytitleloans > Settings > Variables and Secrets):
//   RESEND_API_KEY  (secret)  API key from Resend
//   CONTACT_TO                inbox that receives submissions, e.g. leads@getmarketingbull.com
//   CONTACT_FROM              verified sender, e.g. "Zippy Title Loans <noreply@getmarketingbull.com>"
//   TURNSTILE_SECRET_KEY (secret)  secret key of the Cloudflare Turnstile widget on the forms

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const esc = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Checks the Cloudflare Turnstile token the widget adds to each form.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not set');
    return false;
  }
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const result = await res.json();
    if (!result.success) console.warn('Turnstile failed', result['error-codes']);
    return result.success === true;
  } catch (err) {
    console.error('Turnstile error', err);
    return false;
  }
}

// Accepts JSON (fetch from main.js) or a regular form post (no JS).
// `validate(data)` returns { error } or { replyTo, subject, rows: [[label, value], ...] }.
export async function handleForm(request, env, validate) {
  const isJson = (request.headers.get('Content-Type') || '').includes('application/json');
  const reply = (ok, error, status) => {
    if (isJson) return ok ? json({ ok: true }) : json({ error }, status);
    if (ok) return Response.redirect(new URL('/thank-you/', request.url), 303);
    return new Response(`<!doctype html><meta charset="utf-8"><title>Error</title><p>${esc(error)}</p><p><a href="javascript:history.back()">Go back</a></p>`,
      { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  };

  let data;
  try {
    data = isJson ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return reply(false, 'Invalid request.', 400);
  }

  // Honeypot: bots fill this in, people don't. Pretend success.
  if (data.website) return reply(true);

  if (!(await verifyTurnstile(data['cf-turnstile-response'], request, env))) {
    return reply(false, 'Please complete the security check and try again, or call us at (561) 782-7724.', 403);
  }

  const result = validate(data);
  if (result.error) return reply(false, result.error, 400);

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return reply(false, 'This form is not configured yet. Please call us at (561) 782-7724.', 503);
  }

  const html = result.rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<p><strong>${esc(k)}:</strong><br>${esc(v).replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: result.replyTo,
      subject: result.subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return reply(false, 'We could not send your submission. Please try again or call us at (561) 782-7724.', 502);
  }
  return reply(true);
}

export const methodNotAllowed = () => json({ error: 'Method not allowed.' }, 405);
