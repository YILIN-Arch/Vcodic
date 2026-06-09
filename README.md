# VCodic

VCodic is a Chinese-first AI product discovery site. The current public entry is:

- `https://vcodic.com`

Current state:

- public static launch is live on Cloudflare Pages
- canonical domain and redirects are working
- `/submit` is live and writes into Supabase
- screenshot uploads are live through Supabase Storage
- homepage public feed can read approved submissions through Supabase anon + RLS
- `/review` is the minimal moderation shell and still requires Cloudflare server-side env

Recommended stack:

- frontend: `Next.js`
- hosting: `Cloudflare Pages`
- database/auth/storage: `Supabase`
- notifications: `Resend`

Setup docs:

- [VCODIC_STACK_SETUP.md](./VCODIC_STACK_SETUP.md)
- [LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md)
- [supabase/README.md](./supabase/README.md)
