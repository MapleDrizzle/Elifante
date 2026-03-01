-- Add emotion text to mood (user's description of how they feel)
alter table public.mood add column if not exists emotion text;
-- Optional context: what's affecting you (Sleep, Baby, Support, etc.)
alter table public.mood add column if not exists mood_context text;

-- Forum posts for community discussion
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_posts_created on public.forum_posts(created_at desc);

alter table public.forum_posts enable row level security;

-- Forum: anyone logged in can read all posts
create policy "Anyone can read forum posts"
  on public.forum_posts for select
  using (auth.uid() is not null);

-- Forum: users can insert their own posts
create policy "Users can insert own forum posts"
  on public.forum_posts for insert
  with check (auth.uid() = profile_id);
