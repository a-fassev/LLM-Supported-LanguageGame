# LLM-Supported Italian Language Learning Game

Browser-based Italian learning game for school learners: chapter and quest progression, image-driven scenes, pizza rewards, avatar room customization, team leaderboard, and **LLM-assisted evaluation** for open-ended writing tasks.

Built with **Next.js** (App Router). Game logic and narrative content live in `lib/` as JSON catalogs and services; **Supabase Postgres** stores accounts, sessions, quest runs, and wallet progress only.

## Authors

| | | | |
|---|---|---|---|
| **Jannik Endress** | **Timon** | **Amelie** | **Luca** |

## Features

- **Chapters 0–6** with main quests, bonus missions, and narrative scenes
- **Task types:** multiple choice, matching, drag-and-drop, cloze text, error spotting, and freetext (LLM-scored)
- **Server-authoritative** scoring, unlocks, and rewards
- **Italian UI** for learners (login, chapter hub, shop, leaderboard)
- **Room shop** — spend pizza slices to unlock room decorations

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | Supabase (Postgres) |
| LLM evaluation | OpenAI via `@langchain/openai` (freetext tasks only) |
| Validation | Zod |

## Requirements

- **Node.js 22** (`>=22 <23` per `package.json`)
- Supabase project (URL + secret key)
- OpenAI API key (optional locally if you skip freetext scenes or use smoke mode)

## Setup

```bash
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
# Optional: OPENAI_API_KEY for freetext LLM evaluation

npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register a learner account, pick a team, and start from the main menu.

### Environment variables

See [`.env.example`](.env.example). Minimum for local play:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Yes | Server-side DB access |
| `OPENAI_API_KEY` | For freetext | LLM scoring for `free_text` scenes |
| `GAME_SMOKE_AUTO_PASS` | No | Local QA: auto-pass tasks without LLM (never production) |

Apply database schema from [`supabase/migrations/`](supabase/migrations/) to your Supabase project.

## Project layout

```text
app/                    # Next.js routes (auth, game UI, API)
components/game/        # Quest shell, task renderers, screens
lib/content/chapters/   # Chapter / quest / scene JSON (narrative catalog)
lib/game/               # Scoring, progression, services, repositories
lib/llm/                # Freetext LLM evaluation
public/content-assets/  # Backgrounds, stickers, hub art
docs/                   # Content format, UI architecture, LLM notes
supabase/migrations/    # Postgres schema
```

## Documentation

| Doc | Topic |
|-----|--------|
| [`docs/quest-scene-content-format.md`](docs/quest-scene-content-format.md) | Chapter/quest/scene JSON schema |
| [`docs/web-game-ui-architecture.md`](docs/web-game-ui-architecture.md) | UI structure, screens, data flow |
| [`docs/freitext-llm-implementation.md`](docs/freitext-llm-implementation.md) | OpenAI freetext evaluation |
| [`docs/background-transitions-qa.md`](docs/background-transitions-qa.md) | Background transition QA notes |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |

## Player routes

| Path | Purpose |
|------|---------|
| `/login`, `/register` | Session auth |
| `/menu` | Main hub (play, shop, leaderboard) |
| `/chapters` | Chapter selection |
| `/chapters/[chapterId]` | Quest list for a chapter |
| `/play` | Active quest scene |
| `/shop` | Room decoration shop |
| `/leaderboard` | Team and player rankings |

## API routes

**Auth:** `/api/auth/register`, `login`, `logout`, `session`, `suggest-username`

**Game:** `/api/game/bootstrap`, `leaderboard`, `room`, `room/purchase`, `runs/start`, `runs/snapshot`, `runs/[runId]/attempt`, `runs/[runId]/advance`, `runs/[runId]/retreat`
