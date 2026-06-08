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
