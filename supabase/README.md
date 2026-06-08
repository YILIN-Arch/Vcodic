# Supabase setup for VCodic

Use this folder when preparing the `/submit` MVP.

Recommended order:

1. Create the Supabase project in `Southeast Asia (Singapore)`.
2. Create a private bucket named `submission-images`.
3. Run `schema.sql` in the SQL editor.
4. Run `storage-policies.sql` in the SQL editor.
5. Copy credentials into `.env.local`.

Files:

- `schema.sql`: submissions table and indexes
- `storage-policies.sql`: storage access rules for submission images
