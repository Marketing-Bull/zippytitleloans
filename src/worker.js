// Cloudflare Worker: serves /public as static assets (handled by the platform)
// and handles the two forms, which are emailed via Resend (see form.js):
//   POST /api/apply    loan application on /apply-now/
//   POST /api/contact  contact form on /contact/
import { handleForm, clean, isEmail, methodNotAllowed } from './form.js';

const apply = (d) => {
  const f = {
    first: clean(d.first, 100),
    last: clean(d.last, 100),
    phone: clean(d.phone, 50),
    email: clean(d.email, 200),
    street: clean(d.street, 200),
    street2: clean(d.street2, 200),
    city: clean(d.city, 100),
    state: clean(d.state, 50),
    zip: clean(d.zip, 10),
    amount: clean(d.amount, 50),
    message: clean(d.message, 5000),
  };
  const required = ['first', 'last', 'phone', 'email', 'street', 'city', 'state', 'zip', 'amount', 'message'];
  if (required.some((k) => !f[k])) return { error: 'Please fill in all required fields.' };
  if (!isEmail(f.email)) return { error: 'Please enter a valid email address.' };

  const amount = f.amount.replace(/^\$/, '');
  return {
    replyTo: f.email,
    subject: `New loan application: ${f.first} ${f.last} ($${amount})`,
    rows: [
      ['Name', `${f.first} ${f.last}`],
      ['Phone', f.phone],
      ['Email', f.email],
      ['Address', [f.street, f.street2, `${f.city}, ${f.state} ${f.zip}`].filter(Boolean).join('\n')],
      ['Loan amount', `$${amount}`],
      ['Comments', f.message],
    ],
  };
};

const contact = (d) => {
  const name = clean(d.name, 200);
  const email = clean(d.email, 200);
  const subject = clean(d.subject, 100);
  const message = clean(d.message, 5000);

  if (!name || !email || !subject || !message) return { error: 'Please fill in all fields.' };
  if (!isEmail(email)) return { error: 'Please enter a valid email address.' };

  return {
    replyTo: email,
    subject: `Website message (${subject}) from ${name}`,
    rows: [
      ['Name', name],
      ['Email', email],
      ['Subject', subject],
      ['Message', message],
    ],
  };
};

const forms = { '/api/apply': apply, '/api/contact': contact };

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const validate = forms[pathname];
    if (validate) return request.method === 'POST' ? handleForm(request, env, validate) : methodNotAllowed();
    // Only /api/* reaches the Worker (see run_worker_first); anything else is a safety net.
    return env.ASSETS.fetch(request);
  },
};
