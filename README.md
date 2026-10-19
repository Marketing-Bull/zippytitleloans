# Zippy Title Loans

Static site for zippytitleloans.com, built for Cloudflare Pages. No build step. Same stack and design system as [zippytitle.com](https://zippytitle.com).

```
public/                     site files (HTML, CSS, JS, _headers, _redirects)
public/assets/illustrations custom SVG illustrations used across the site
functions/api/              Pages Functions: POST /api/apply, POST /api/contact
lib/form.js                 shared form handling (validation + email via Resend)
wrangler.toml
```

Pages keep the old WordPress URLs (`/about/`, `/apply-now/`, `/contact/`, `/terms-of-use/`, `/thank-you/`). The header and footer are repeated in each HTML file, so edit them everywhere.

## Deploy (Git integration, recommended)

1. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git, pick this repo.
2. Framework preset: **None**. Build command: *(empty)*. Build output directory: `public`.
3. Settings > Variables and Secrets (Production), for the application and contact forms:
   - `RESEND_API_KEY` (secret), `CONTACT_TO`, `CONTACT_FROM`
   - `CONTACT_FROM` must be on a domain verified in Resend.
4. Custom domains > add `zippytitleloans.com` and `www.zippytitleloans.com`. If the domain's DNS is on Cloudflare, records are created automatically.

## Deploy (CLI)

```
npm install
npx wrangler pages deploy
```

## Local dev

```
npm install
printf 'RESEND_API_KEY=...\nCONTACT_TO=you@example.com\nCONTACT_FROM=Zippy Title Loans <noreply@zippytitleloans.com>\n' > .dev.vars
npm run dev
```
