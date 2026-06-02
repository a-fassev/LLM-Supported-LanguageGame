# Agent guidance

**Git branch for agent work:** `web-based-implementation` (create from `main` when needed). Do not use legacy `unity-implementation` for new work.

## Repository overview

Next.js **App Router** API for the language-learning game: auth (`/api/auth/*`) and game progress (`/api/game/*`), backed by **Supabase Postgres** (schema and content live in your Supabase project—not in this repo).

| Area | Path | Role |
|------|------|------|
| **Routes** | `app/api/` | HTTP API handlers |
| **Domain logic** | `lib/` | Auth, game progress, scoring, LLM evaluate, Supabase clients |
| **Agent conventions** | `AGENTS.md`, `LEARNINGS.md`, `.cursor/commands/`, `.cursor/skills/` | Workflow and domain skills |

Run locally: `npm run dev` (secrets in `.env.local` only; see `.env.example`).

## Layout (Next.js)

```text
app/              # App Router (root page + app/api/*)
lib/              # Shared server modules (@/lib/...)
middleware.ts
next.config.ts
package.json
```

## Tech stack

- **Next.js 15** App Router, TypeScript, Zod
- **Supabase** via `@supabase/supabase-js` and server-only `SUPABASE_SECRET_KEY`
- **Postgres RPC / RLS** in the linked Supabase project
- **LangChain + OpenAI-compatible API** for FreitextLlm evaluate (keys server-side only)

### Key modules

- **Progress:** `lib/game/services/game-progress-service.ts`, `lib/game/repositories/game-progress-repository.ts`
- **Step payloads:** `lib/game/stepContentValidation.ts`, `lib/game/schemas/`
- **Scoring:** `lib/game/scoring/`
- **Auth:** `app/api/auth/*`, `lib/require-session.ts`

### Adding a task type

1. Zod schema under `lib/game/schemas/`
2. Register in `lib/game/stepContentValidation.ts`
3. Extend `lib/game/scoring/evaluateTaskAttempt.ts` if scored

### Tests

```bash
npm test
```

---

## Core principle

**UNDERSTAND → CLARIFY → CODE**

---

## Key rules

- **Language:** Code and committed docs in **English**; conversation with the user may be in **German**.
- Ground changes in this repo layout; wait for confirmation before large scope.
- Do not create documentation files unless the user asks.
- **Secrets:** Never commit `.env.local` or API keys.
