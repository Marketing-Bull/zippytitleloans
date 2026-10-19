# Zippy Title Loans

Static site for zippytitleloans.com, hosted on Cloudflare Workers (static assets). No build step. Same stack and design system as [zippytitle.com](https://zippytitle.com).

```
public/                      site files (HTML, CSS, JS, _headers, _redirects)
public/assets/illustrations  custom SVG illustrations used across the site
src/worker.js                handles POST /api/apply and POST /api/contact (everything else is served as static assets)
src/form.js                  shared form handling (validation + email via Resend)
wrangler.jsonc
```

Pages keep the old WordPress URLs (`/about/`, `/apply-now/`, `/contact/`, `/terms-of-use/`, `/thank-you/`). The header and footer are repeated in each HTML file, so edit them everywhere.

## Deploy (Git integration, recommended)

1. Cloudflare dashboard > Workers & Pages > Create > Import a repository, pick this repo.
2. Project name `zippytitleloans`. Build command: *(empty)*. Deploy command: `npx wrangler deploy`.
3. Settings > Variables and Secrets, for the application and contact forms:
   - `RESEND_API_KEY` (secret). `CONTACT_TO` and `CONTACT_FROM` are already set in `wrangler.jsonc`.
   - `CONTACT_FROM` must be on a domain verified in Resend.
4. Settings > Domains & Routes > add `zippytitleloans.com` and `www.zippytitleloans.com`. The domain's DNS must be on Cloudflare; the records are created for you.

Every push to the production branch redeploys.

## Deploy (CLI)

```
npm install
npx wrangler login
npx wrangler deploy
npx wrangler secret put RESEND_API_KEY
```

`CONTACT_TO` and `CONTACT_FROM` live under `vars` in `wrangler.jsonc`.

## Local dev

```
npm install
printf 'RESEND_API_KEY=...\nCONTACT_TO=you@example.com\nCONTACT_FROM=Zippy Title Loans <noreply@zippytitleloans.com>\n' > .dev.vars
npm run dev
```
