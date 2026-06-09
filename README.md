# VCodic

VCodic is a Chinese-first AI product discovery site. The current public entry is:

- `https://vcodic.com`

Current state:

- public static launch is live on Cloudflare Pages
- canonical domain and redirects are working
- `/submit` is live and writes into Supabase
- screenshot uploads are live through Supabase Storage
- next milestone is the minimal review flow and replacing the static homepage pool with approved submissions

Recommended stack:

- frontend: `Next.js`
- hosting: `Cloudflare Pages`
- database/auth/storage: `Supabase`
- notifications: `Resend`

Setup docs:

- [VCODIC_STACK_SETUP.md](./VCODIC_STACK_SETUP.md)
- [LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md)
- [supabase/README.md](./supabase/README.md)
