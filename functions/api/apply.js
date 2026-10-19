// Cloudflare Pages Function: POST /api/apply (loan application form on /apply-now/)
import { handleForm, clean, isEmail, methodNotAllowed } from '../../lib/form.js';

export const onRequestPost = ({ request, env }) =>
  handleForm(request, env, (d) => {
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
  });

export const onRequest = methodNotAllowed;
