// Footer year
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Two-step application form. Without JS both steps show and the form posts normally.
const stepped = document.querySelector('form[data-steps]');
if (stepped) {
  const steps = [...stepped.querySelectorAll('[data-step]')];
  const prev = stepped.querySelector('[data-prev]');
  const next = stepped.querySelector('[data-next]');
  const submit = stepped.querySelector('[data-submit]');
  const label = stepped.querySelector('[data-step-label]');
  const pct = stepped.querySelector('[data-step-pct]');
  const bar = stepped.querySelector('.progress-bar span');
  let current = 0;

  const show = (i) => {
    current = i;
    steps.forEach((s, n) => { s.hidden = n !== i; });
    prev.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    const done = Math.round(((i + 1) / steps.length) * 100);
    label.textContent = `Step ${i + 1} of ${steps.length}`;
    pct.textContent = `${done}%`;
    bar.style.width = `${done}%`;
  };
  const valid = (step) => [...step.querySelectorAll('input, select, textarea')].every((f) => f.reportValidity());

  next.addEventListener('click', () => {
    if (!valid(steps[current])) return;
    show(current + 1);
    steps[current].querySelector('input, select, textarea')?.focus();
  });
  prev.addEventListener('click', () => show(current - 1));
  show(0);
}

// Forms -> /api/* (Cloudflare Pages Functions), then the thank-you page
document.querySelectorAll('form[action^="/api/"]').forEach((form) => {
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = 'Sending…';
    button.disabled = true;
    try {
      const res = await fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      window.location.assign('/thank-you/');
    } catch (err) {
      status.className = 'form-status err';
      status.textContent = err.message;
      button.disabled = false;
    }
  });
});
