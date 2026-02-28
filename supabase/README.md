# Elifante – Database schema

Schema for **Supabase** (PostgreSQL). Run the migration in the Supabase SQL editor or via `supabase db push` if you use the Supabase CLI.

## Entity relationship (from your whiteboard)

```
User (auth.users) → Profile → Mom → Baby
                    ↓    ↓     ↓
                 Diet  Mood  Sleep  Development
                  ↓     ↓     ↓
                 Mother Diet, Baby Diet, Sleep (mom or baby), Development (baby)
```

## Tables

| Table | Purpose |
|-------|--------|
| **profiles** | One per user (Synced from Supabase Auth). `username`, `avatar_url`. |
| **moms** | One per profile. Links profile to all mom-specific data. |
| **babies** | One or more per mom. `name`, `birth_date`. |
| **mood** | Mother’s mental state: `mood` 1–5 (smiley rating), `recorded_at`. |
| **mother_diet** | Mom’s nutrition: `food`, `meal`, optional `food_quality` 1–5 (for color gradient), `date`/`recorded_at`. |
| **baby_diet** | Baby feeding: `food`, `bottle`, `date`/`recorded_at`. |
| **sleep** | One row per sleep segment. Either `mom_id` or `baby_id`. `start_time`, `end_time`, `duration_minutes` (auto). |
| **development** | Baby growth: `weight_kg`, `height_cm`, `milestone`, `recorded_at`. Age comes from `baby.birth_date` + `recorded_at`. |

## Row Level Security (RLS)

- All tables use RLS.
- Users only see/edit data for their own profile → mom → babies (and related mood, diet, sleep, development).

## Applying the migration

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard: **SQL Editor** → New query → paste contents of `supabase/migrations/00001_initial_schema.sql` → Run.
3. In the app, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` (see `.env.example`).

TypeScript types that mirror these tables live in `src/types/database.ts`.
