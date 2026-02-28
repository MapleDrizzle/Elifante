-- Elifante – Postpartum companion
-- Initial schema: User → Mom → Baby; Diet, Sleep, Mood, Development

-- =============================================================================
-- Profiles (extends Supabase auth.users – one per logged-in user)
-- =============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- Moms (one profile can be one mom; links to diet, mood, sleep, babies)
-- =============================================================================
create table public.moms (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- Babies (belong to a mom; diet, sleep, development)
-- =============================================================================
create table public.babies (
  id uuid primary key default gen_random_uuid(),
  mom_id uuid not null references public.moms(id) on delete cascade,
  name text not null,
  birth_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- Mood – mother's mental state (smiley face rating 1–5)
-- =============================================================================
create table public.mood (
  id uuid primary key default gen_random_uuid(),
  mom_id uuid not null references public.moms(id) on delete cascade,
  mood smallint not null check (mood >= 1 and mood <= 5),
  recorded_at timestamptz not null default now()
);

comment on table public.mood is 'Visualization of how the mother feels (smiley rating).';

-- =============================================================================
-- Mother's diet – nutrition for milk production & health
-- =============================================================================
create table public.mother_diet (
  id uuid primary key default gen_random_uuid(),
  mom_id uuid not null references public.moms(id) on delete cascade,
  food text not null,
  meal text check (meal in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  food_quality smallint check (food_quality is null or (food_quality >= 1 and food_quality <= 5)),
  recorded_at timestamptz not null default now(),
  date date not null default (current_date)
);

comment on table public.mother_diet is 'Keeps track of the mother''s nutrition to ensure they are healthy enough to produce milk.';
comment on column public.mother_diet.food_quality is 'Optional 1–5 for color gradient / quality visualization.';

-- =============================================================================
-- Baby's diet – feeding times and type (bottle, breast, solids)
-- =============================================================================
create table public.baby_diet (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  food text,
  bottle text,
  recorded_at timestamptz not null default now(),
  date date not null default (current_date)
);

comment on table public.baby_diet is 'Baby needs to eat at specific times to meet nutrition goals.';

-- =============================================================================
-- Sleep – shared concept for mom and baby (one row = one person's sleep)
-- =============================================================================
create table public.sleep (
  id uuid primary key default gen_random_uuid(),
  mom_id uuid references public.moms(id) on delete cascade,
  baby_id uuid references public.babies(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes int generated always as (
    extract(epoch from (end_time - start_time)) / 60
  ) stored,
  constraint sleep_has_owner check (
    (mom_id is not null and baby_id is null) or
    (mom_id is null and baby_id is not null)
  )
);

comment on table public.sleep is 'Mother and baby sleep tracking – ensure both get enough sleep (e.g. bar chart by week).';

-- =============================================================================
-- Development – baby growth and milestones
-- =============================================================================
create table public.development (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 1),
  milestone text,
  recorded_at timestamptz not null default now()
);

comment on table public.development is 'Visualization of how far the baby is in terms of development (age from baby.birth_date + recorded_at).';

-- =============================================================================
-- Indexes for common queries
-- =============================================================================
create index idx_moms_profile_id on public.moms(profile_id);
create index idx_babies_mom_id on public.babies(mom_id);
create index idx_mood_mom_recorded on public.mood(mom_id, recorded_at desc);
create index idx_mother_diet_mom_date on public.mother_diet(mom_id, date desc);
create index idx_baby_diet_baby_date on public.baby_diet(baby_id, date desc);
create index idx_sleep_mom on public.sleep(mom_id) where mom_id is not null;
create index idx_sleep_baby on public.sleep(baby_id) where baby_id is not null;
create index idx_sleep_times on public.sleep(start_time, end_time);
create index idx_development_baby_recorded on public.development(baby_id, recorded_at desc);

-- =============================================================================
-- Trigger: create profile when a new user signs up (Supabase Auth)
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- RLS (Row Level Security) – users see only their own data
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.moms enable row level security;
alter table public.babies enable row level security;
alter table public.mood enable row level security;
alter table public.mother_diet enable row level security;
alter table public.baby_diet enable row level security;
alter table public.sleep enable row level security;
alter table public.development enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Moms: user can manage their own mom row (via profile_id)
create policy "Users can view own mom"
  on public.moms for select
  using (profile_id = auth.uid());

create policy "Users can insert own mom"
  on public.moms for insert
  with check (profile_id = auth.uid());

create policy "Users can update own mom"
  on public.moms for update
  using (profile_id = auth.uid());

-- Babies: mom owner can do everything
create policy "Mom can manage babies"
  on public.babies for all
  using (
    mom_id in (select id from public.moms where profile_id = auth.uid())
  )
  with check (
    mom_id in (select id from public.moms where profile_id = auth.uid())
  );

-- Mood: mom owner
create policy "Mom can manage mood"
  on public.mood for all
  using (
    mom_id in (select id from public.moms where profile_id = auth.uid())
  )
  with check (
    mom_id in (select id from public.moms where profile_id = auth.uid())
  );

-- Mother diet: mom owner
create policy "Mom can manage mother_diet"
  on public.mother_diet for all
  using (
    mom_id in (select id from public.moms where profile_id = auth.uid())
  )
  with check (
    mom_id in (select id from public.moms where profile_id = auth.uid())
  );

-- Baby diet: mom owner (via baby's mom_id)
create policy "Mom can manage baby_diet"
  on public.baby_diet for all
  using (
    baby_id in (
      select id from public.babies
      where mom_id in (select id from public.moms where profile_id = auth.uid())
    )
  )
  with check (
    baby_id in (
      select id from public.babies
      where mom_id in (select id from public.moms where profile_id = auth.uid())
    )
  );

-- Sleep: mom owner (for mom rows) or mom of baby (for baby rows)
create policy "Mom can manage sleep"
  on public.sleep for all
  using (
    mom_id in (select id from public.moms where profile_id = auth.uid())
    or
    baby_id in (
      select id from public.babies
      where mom_id in (select id from public.moms where profile_id = auth.uid())
    )
  )
  with check (
    mom_id in (select id from public.moms where profile_id = auth.uid())
    or
    baby_id in (
      select id from public.babies
      where mom_id in (select id from public.moms where profile_id = auth.uid())
    )
  );

-- Development: mom owner via baby
create policy "Mom can manage development"
  on public.development for all
  using (
    baby_id in (
      select id from public.babies
      where mom_id in (select id from public.moms where profile_id = auth.uid())
    )
  )
  with check (
    baby_id in (
      select id from public.babies
      where mom_id in (select id from public.moms where profile_id = auth.uid())
    )
  );
