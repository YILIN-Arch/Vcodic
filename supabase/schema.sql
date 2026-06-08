create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  product_url text not null,
  tagline text not null,
  description text,
  creator_name text,
  contact_email text not null,
  screenshot_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  published_at timestamptz
);

create index if not exists submissions_status_idx on public.submissions (status);
create index if not exists submissions_created_at_idx on public.submissions (created_at desc);

grant insert on public.submissions to anon;
grant select, insert, update, delete on public.submissions to service_role;

alter table public.submissions enable row level security;

drop policy if exists "anon can insert submissions" on public.submissions;
create policy "anon can insert submissions"
on public.submissions
for insert
to anon
with check (
  status = 'pending'
  and review_notes is null
  and reviewed_at is null
  and published_at is null
);

drop policy if exists "service role can read submissions" on public.submissions;
create policy "service role can read submissions"
on public.submissions
for select
to service_role
using (true);

drop policy if exists "service role can update submissions" on public.submissions;
create policy "service role can update submissions"
on public.submissions
for update
to service_role
using (true)
with check (true);
