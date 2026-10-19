// Cloudflare Pages Function: POST /api/contact (contact form on /contact/)
import { handleForm, clean, isEmail, methodNotAllowed } from '../../lib/form.js';

export const onRequestPost = ({ request, env }) =>
  handleForm(request, env, (d) => {
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
  });

export const onRequest = methodNotAllowed;
