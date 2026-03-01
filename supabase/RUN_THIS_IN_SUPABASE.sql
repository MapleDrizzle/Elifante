-- Run this in Supabase Dashboard → SQL Editor
-- Creates forum_posts and adds emotion to mood

-- 1. Add emotion to mood (optional - for "How do you feel?" text)
alter table public.mood add column if not exists emotion text;

-- 2. Create forum_posts table
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_posts_created on public.forum_posts(created_at desc);

alter table public.forum_posts enable row level security;

drop policy if exists "Anyone can read forum posts" on public.forum_posts;
create policy "Anyone can read forum posts"
  on public.forum_posts for select
  using (auth.uid() is not null);

drop policy if exists "Users can insert own forum posts" on public.forum_posts;
create policy "Users can insert own forum posts"
  on public.forum_posts for insert
  with check (auth.uid() = profile_id);
