# Launch Playbook

VCodic is already live on:

- `https://vcodic.com`

Current public infra:

- domain: `vcodic.com`
- hosting: `Cloudflare Pages`
- aliases:
  - `https://www.vcodic.com` -> `https://vcodic.com`
  - `https://vcodic-public.pages.dev` -> `https://vcodic.com`

## 1. Current baseline

This repo currently represents the public launch site.

What is already done:

- custom domain is active
- SSL is active
- sitemap exists
- privacy/terms/404 exist
- bulk redirects are configured

## 2. Recommended next infra shape

Suggested long-term domain layout:

- `vcodic.com` - public discovery entry
- `app.vcodic.com` - authenticated app
- `api.vcodic.com` - backend API
- `auth.vcodic.com` - auth callbacks or auth custom domain
- `cdn.vcodic.com` - optional asset domain

## 3. Deployment path

### Current

- direct upload to Cloudflare Pages

### Recommended next step

1. Push this repo to GitHub.
2. Connect the GitHub repository to Cloudflare Pages.
3. Keep build command empty while this stays a static site.
4. Move to a `Next.js` build only when the MVP app work starts.

## 4. Domain-sensitive files

Keep these aligned whenever the public brand/site metadata changes:

- `index.html`
- `site.webmanifest`
- `privacy.html`
- `terms.html`
- `robots.txt`
- `sitemap.xml`
- `social-card.svg`
- `favicon.svg`

## 5. Launch checklist

Before sharing publicly:

- `vcodic.com` resolves correctly
- `www.vcodic.com` redirects correctly
- `vcodic-public.pages.dev` redirects correctly
- HTTPS works with no warnings
- favicon loads
- social card preview loads
- privacy and terms pages are reachable
- `robots.txt` is reachable
- `sitemap.xml` is reachable
- analytics is installed
- feedback/contact path is live

## 6. Future app architecture

When submission, moderation, and account features start:

- frontend and edge routing: `Next.js` + `Cloudflare Pages`
- auth / Postgres / Storage: `Supabase`
- notifications: `Resend`

This keeps the public site and the authenticated product separate without changing the public domain.
