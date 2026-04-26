# Which is More? — Backend + Web Game

Next.js 16 app that serves the API for the "Which is More?" iOS app and hosts the shareable web game at `/play`. Questions authored by Alan Katz.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4
- Drizzle ORM + Neon Postgres (via Vercel Marketplace)
- Vitest for tests

## Local setup

1. Install deps:
   ```bash
   npm install
   ```

2. Provision a database via the Vercel Marketplace (Neon Postgres) and link this directory to the Vercel project:
   ```bash
   vercel link
   vercel env pull .env.local
   ```

3. Push the schema and seed the questions:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

   Visit http://localhost:3000 for the landing page or http://localhost:3000/play for the game.

## API

- `GET /api/health` → `{ ok: true }`
- `GET /api/questions` → `{ questions: Question[] }` (optional `?category=science` filter)
- `GET /api/questions/random` → `{ question: Question }` (uncached)
- `GET /api/questions/[slug]` → `{ question: Question }` or 404

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build + start |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run db:generate` | Generate SQL migrations from schema |
| `npm run db:push` | Push schema to Neon (no migration files) |
| `npm run db:migrate` | Run generated migrations |
| `npm run db:seed` | Seed the `questions` table from `../data/questions.json` (idempotent) |
