# Elifante

A web app to help mothers during postpartum keep track of what matters.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the dev server**

   ```bash
   npm run dev
   ```

   The app will open at [http://localhost:3000](http://localhost:3000).

3. **Build for production**

   ```bash
   npm run build
   ```

   Output is in the `dist/` folder. Preview with `npm run preview`.

## Tech stack

- **React 18** – UI
- **Vite** – dev server and build
- **Supabase** – auth, PostgreSQL database, optional real-time

## Database

The app uses **Supabase** (PostgreSQL) for users, moms, babies, and tracking data.

- **Schema:** `supabase/migrations/00001_initial_schema.sql`
- **Overview:** See [supabase/README.md](supabase/README.md) for tables (profiles, moms, babies, mood, mother_diet, baby_diet, sleep, development) and how to run the migration.
- **Types:** `src/types/database.ts` – TypeScript types that mirror the schema.

To use the database: create a Supabase project, run the migration in the SQL Editor, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.

## Project structure

- `src/` – app source
  - `App.tsx` – root component
  - `main.tsx` – entry point
  - `index.css` – global styles
  - `types/database.ts` – DB types for Supabase
- `supabase/migrations/` – SQL schema
- `public/` – static assets

Add `src/components/` and `src/pages/` as you build out features.

## Environment

Copy `.env.example` to `.env` and fill in any API keys or config when you add a backend or services.

### Tips feature (Baby Development)

The **Tips** button in the Milestones section uses **Google Gemini** to generate personalized development steps based on the baby's age, weight, height, and milestones. To enable it:

1. Create an API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Add to `.env`:
   ```
   VITE_GOOGLE_GEMINI_API_KEY=your-gemini-api-key
   ```
3. Restart the dev server

Without the API key, Tips will show an error when you try to generate.
