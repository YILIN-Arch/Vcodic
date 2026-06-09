# Supabase setup for VCodic

Use this folder when preparing the `/submit` MVP.

Recommended order:

1. Create the Supabase project in `Southeast Asia (Singapore)`.
2. Create a private bucket named `submission-images`.
3. Run `schema.sql` in the SQL editor.
4. Run `storage-policies.sql` in the SQL editor.
5. Fill `site-config.js` with:
   - `supabaseUrl`
   - `supabaseAnonKey`
6. In Cloudflare Pages, set server-side environment variables for the review/feed functions:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VCODIC_REVIEW_TOKEN`

Public homepage note:

- homepage public feed can fall back to the browser-side anon key
- this depends on the `anon can read approved submissions` policy in `schema.sql`
- anon only gets column-level select on public fields; `contact_email`, `review_notes`, `screenshot_path` and other review fields remain non-readable
7. If you later migrate the site to Next.js, copy the same values into `.env.local`.

Files:

- `schema.sql`: submissions table and indexes
- `storage-policies.sql`: storage access rules for submission images
