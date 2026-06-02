# Language game API

Next.js App Router backend for session auth, game progress, task scoring, and Freitext LLM evaluation. Data lives in **Supabase Postgres** (configure credentials locally; schema is not shipped in this repo).

## Setup

```bash
cp .env.example .env.local
# Edit .env.local (Supabase URL, SUPABASE_SECRET_KEY, optional LLM keys)

npm ci
npm run dev
```

API base: [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint (`eslint .`) |
| `npm test` | Vitest unit tests |

## API routes

- **Auth:** `/api/auth/register`, `login`, `logout`, `session`, `suggest-username`
- **Game:** `/api/game/bootstrap`, quest start, run/step complete and advance, leaderboard

Agent conventions: [`AGENTS.md`](AGENTS.md).
