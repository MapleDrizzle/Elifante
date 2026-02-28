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

## Project structure

- `src/` – app source
  - `App.jsx` – root component
  - `main.jsx` – entry point
  - `index.css` – global styles
- `public/` – static assets

Add `src/components/` and `src/pages/` as you build out features.

## Environment

Copy `.env.example` to `.env` and fill in any API keys or config when you add a backend or services.
