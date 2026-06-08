# VCodic Stack Setup

This document is the execution order for the VCodic MVP stack.

## 1. GitHub

Target:

- create a GitHub repository named `VCodic`
- connect this local repo to the remote

Manual steps:

1. Create a new empty GitHub repository called `VCodic`.
2. Run:

```bash
git remote add origin git@github.com:<your-account>/VCodic.git
git add .
git commit -m "Initial VCodic launch site"
git push -u origin main
```

Note:

- `gh` CLI is not installed on this machine, so repository creation should be done in the GitHub web UI.

## 2. Supabase

Target:

- create the VCodic backend project
- prepare database and image storage for `/submit`

Recommended defaults:

- project name: `VCodic`
- region: `Southeast Asia (Singapore)`

Open in Supabase Dashboard:

1. Create the project.
2. Copy these values into `.env.local` from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Run the SQL from:
   - `supabase/schema.sql`
   - `supabase/storage-policies.sql`

## 3. Supabase Storage

Target:

- receive screenshots and cover images from submissions

Recommended bucket:

- bucket name: `submission-images`
- public: `false`
- allowed mime types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- file size limit: `5 MB`

Create the bucket in Supabase Dashboard first, then apply the storage policies SQL.

## 4. Cloudflare Web Analytics

Target:

- start collecting traffic data on `vcodic.com`

Official path:

1. Cloudflare Dashboard
2. `Workers & Pages`
3. Select `vcodic-public`
4. Open `Metrics`
5. Enable `Web Analytics`

Important:

- Cloudflare injects the analytics beacon on the next deployment.
- After enabling analytics, redeploy the site once.

## 5. Google Search Console

Target:

- verify `vcodic.com`
- submit sitemap

Recommended verification:

- use a **Domain property**
- verify with a DNS TXT record in Cloudflare

Then submit:

- `https://vcodic.com/sitemap.xml`

## 6. Bing Webmaster Tools

Target:

- verify `vcodic.com`
- submit sitemap

Recommended verification:

- use DNS verification in Cloudflare

Then submit:

- `https://vcodic.com/sitemap.xml`

## 7. MVP coding phase

Do this only after the 6 items above are complete.

Build order:

1. migrate the static site into `Next.js`
2. build `/submit`
3. store submissions in Supabase
4. upload images to `submission-images`
5. add success page
6. add simple review/admin shell

## 8. Later tools

Add only after real users and real submissions exist:

- `Resend`
- `PostHog`
- `Notion` or `Google Sheets`
- `Figma`
