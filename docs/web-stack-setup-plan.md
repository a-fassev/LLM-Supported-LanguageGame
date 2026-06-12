# Web stack setup plan (Option A)

Execution checklist for upgrading this repo to the latest stable stack and adding **shadcn/ui + Tailwind CSS v4** foundations—**without** installing individual UI components yet.

**Status:** Executed on 2026-06-02 (Option A). See [Execution notes](#execution-notes-2026-06-02) below.

**Profile:** Option A — maximize current stable versions (Next 16, TypeScript 6, Vitest 4, Tailwind 4, shadcn init).

**Version snapshot:** 2026-06-02 (verify with `npm view <pkg> version` on the day of execution; patch numbers drift).

---

## Goals

| Goal | Detail |
|------|--------|
| Single Next.js server | Keep App Router at repo root (`app/`, `lib/`, `proxy.ts`) |
| Latest stable core | Next 16, React 19.2.x, TypeScript 6, Vitest 4 |
| UI foundation | Tailwind v4 + shadcn `init` only (no `shadcn add …` yet) |
| API unchanged | Existing `/api/auth/*` and `/api/game/*` routes and `lib/*` logic stay as-is unless upgrades force fixes |
| Verify | `npm run build`, `npm test`, `npm run lint` must pass |

## Non-goals (this pass)

- No game screens, routing groups, or client state
- No `shadcn add button` (or any other component)
- No Figma / design implementation
- No monorepo move to `apps/web`
- No Supabase schema changes

---

## Prerequisites

### Node.js

| Environment | Target |
|-------------|--------|
| **CI** (`.github/workflows/deploy-azure.yml`) | Already **Node 22.x** — keep aligned |
| **Local / team** | **Node 22.22.3** (latest 22.x LTS line) — avoid mixing Node 23 locally with Node 22 in CI |

Optional but recommended when executing:

```text
.nvmrc          → 22
package.json    → "engines": { "node": ">=22 <23" }
```

### Clean working tree

```bash
git status   # commit or stash unrelated work
```

### Secrets

`.env.local` unchanged; never commit secrets.

---

## Target versions (npm `latest` on 2026-06-02)

### Core framework & language

| Package | Current (`package.json` / lock) | Target |
|---------|----------------------------------|--------|
| `next` | ^15.5.18 (installed 15.5.18) | **16.2.7** |
| `eslint-config-next` | ^15.5.18 | **16.2.7** (must match `next` major) |
| `react` | ^19.0.0 (installed 19.2.6) | **19.2.7** |
| `react-dom` | ^19.0.0 | **19.2.7** |
| `typescript` | ^5 (installed 5.9.3) | **6.0.3** |
| `eslint` | ^9 | **10.4.1** |
| `vitest` | ^3.2.4 | **4.1.8** |

### Existing backend / API dependencies (bump to latest patch/minor)

| Package | Current | Target |
|---------|---------|--------|
| `zod` | ^4.4.3 | **4.4.3** (already latest) |
| `@supabase/supabase-js` | ^2.105.4 | **2.107.0** |
| `@langchain/core` | ^1.1.46 | **1.1.48** |
| `@langchain/openai` | ^1.4.5 | **1.4.7** |

### Type definitions (align with Node 22 + React 19)

| Package | Current | Target |
|---------|---------|--------|
| `@types/node` | ^20 | **22.19.19** (`@types/node@22`) |
| `@types/react` | ^19 | **19.2.16** |
| `@types/react-dom` | ^19 | **19.2.3** |
| `@eslint/eslintrc` | ^3 | **3.3.5** |

### New — Tailwind v4 (dev)

| Package | Target |
|---------|--------|
| `tailwindcss` | **4.3.0** |
| `@tailwindcss/postcss` | **4.3.0** |
| `postcss` | **8.5.15** (dev; reconcile with existing `overrides`) |

### New — shadcn/ui foundation (via `shadcn init`, typical versions)

Installed by the CLI into `package.json` (exact pins resolved at init time):

| Package | Expected `latest` (2026-06-02) |
|---------|--------------------------------|
| `class-variance-authority` | 0.7.1 |
| `clsx` | 2.1.1 |
| `tailwind-merge` | 3.6.0 |
| `tw-animate-css` | 1.4.0 |
| `lucide-react` | 1.17.0 (if icons enabled at init) |

**CLI:** `shadcn` npm package **4.10.0** via `npx shadcn@latest init`.

**Not installed in this pass:** Radix primitives, `sonner`, `next-themes` (only when adding components or enabling dark mode explicitly).

---

## shadcn/ui init choices (fixed before running)

| Setting | Value | Rationale |
|---------|-------|-----------|
| Framework | Next.js (App Router) | Matches repo |
| `src/` directory | **No** | Keeps `@/*` → `./*` in `tsconfig.json` |
| Style | **new-york** | Default for new shadcn projects (Tailwind v4) |
| Base color | **neutral** or **stone** | Team preference; stone slightly warmer for child-facing UI |
| CSS variables | **Yes** | Theming |
| CSS file | `app/globals.css` | Standard App Router location |
| Tailwind | **v4** | Required for new shadcn stack |
| React Server Components | **Yes** | Next App Router default |
| Icon library | **lucide-react** | shadcn default |
| Dark mode | **class** on `<html>` | Standard pattern; optional `next-themes` later |

**Do not run:** `npx shadcn@latest add <component>` in this pass.

---

## Execution plan (ordered)

### Phase 0 — Baseline

```bash
node -v                    # should become 22.x before install
npm run build
npm test
npm run lint
```

Record failures only if they already exist; new failures after upgrade are regressions.

---

### Phase 1 — Upgrade existing npm dependencies

From repo root:

```bash
npm install \
  next@16.2.7 \
  react@19.2.7 \
  react-dom@19.2.7 \
  zod@4.4.3 \
  @supabase/supabase-js@2.107.0 \
  @langchain/core@1.1.48 \
  @langchain/openai@1.4.7

npm install -D \
  typescript@6.0.3 \
  eslint@10.4.1 \
  eslint-config-next@16.2.7 \
  vitest@4.1.8 \
  @types/node@22.19.19 \
  @types/react@19.2.16 \
  @types/react-dom@19.2.3 \
  @eslint/eslintrc@3.3.5
```

Then refresh the lockfile:

```bash
rm -rf node_modules
npm ci
```

**Alternative:** set exact versions in `package.json` first, then `npm ci` (preferred for reproducibility).

**Target `package.json` dependency block (illustrative):**

```json
{
  "dependencies": {
    "@langchain/core": "^1.1.48",
    "@langchain/openai": "^1.4.7",
    "@supabase/supabase-js": "^2.107.0",
    "next": "^16.2.7",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.5",
    "@types/node": "^22.19.19",
    "@types/react": "^19.2.16",
    "@types/react-dom": "^19.2.3",
    "eslint": "^10.4.1",
    "eslint-config-next": "^16.2.7",
    "typescript": "^6.0.3",
    "vitest": "^4.1.8"
  }
}
```

#### Phase 1 — Expected follow-up fixes

| Area | Action |
|------|--------|
| **Next 16** | Read [Next.js upgrade guide](https://nextjs.org/docs/app/building-your-application/upgrading); fix breaking changes in `proxy.ts`, route handlers, or `next.config.ts` if the build reports them |
| **TypeScript 6** | Run `tsc` / `next build`; remove or update deprecated `tsconfig` options flagged by TS 6 |
| **ESLint 10** | Adjust `eslint.config.mjs` if `next lint` fails (flat config + `eslint-config-next@16` compatibility) |
| **Vitest 4** | Check [Vitest migration guide](https://vitest.dev/guide/migration); update `vitest.config.ts` only if `npm test` fails |

---

### Phase 2 — Tailwind CSS v4 (manual, before or merged with shadcn init)

If `shadcn init` is run with Tailwind v4 support, it may create overlapping files—prefer **one** path:

**Recommended:** run `shadcn init` (Phase 3) and let it wire Tailwind v4; only add manual steps if the CLI skips something.

**Manual fallback** (if needed):

1. Install dev dependencies:

   ```bash
   npm install -D tailwindcss@4.3.0 @tailwindcss/postcss@4.3.0 postcss@8.5.15
   ```

2. Create `postcss.config.mjs`:

   ```js
   const config = {
     plugins: {
       "@tailwindcss/postcss": {},
     },
   };
   export default config;
   ```

3. Create `app/globals.css` (minimal; shadcn init will extend):

   ```css
   @import "tailwindcss";
   ```

4. Update `app/layout.tsx`:

   ```tsx
   import "./globals.css";
   ```

5. Review `package.json` `overrides.postcss` — bump to `^8.5.15` or remove if redundant after explicit `postcss` devDependency.

---

### Phase 3 — shadcn/ui init (foundation only)

From repo root, non-interactive if supported:

```bash
npx shadcn@latest init
```

Use CLI defaults aligned with the table in [shadcn/ui init choices](#shadcnui-init-choices-fixed-before-running). If the CLI offers `--defaults` or flags for base color / style, use them to avoid interactive prompts in CI-like runs.

**Expected new/updated artifacts:**

| Path | Purpose |
|------|---------|
| `components.json` | shadcn CLI config (aliases, style, Tailwind paths) |
| `lib/utils.ts` | `cn()` helper (`clsx` + `tailwind-merge`) |
| `app/globals.css` | Tailwind import + OKLCH/CSS variables (`@theme inline`) |
| `components/ui/` | Empty or placeholder — **no components added** |

**Optional:** add `components/ui/.gitkeep` if the folder is not created until first `add`.

---

### Phase 4 — Minimal app shell tweaks

| File | Change |
|------|--------|
| `app/layout.tsx` | `import "./globals.css"`; optional `suppressHydrationWarning` on `<html>` for future `class="dark"` |
| `app/page.tsx` | Keep API placeholder or add one line using `cn()` to prove Tailwind (optional) |
| `AGENTS.md` | Update tech stack section (Next 16, Tailwind 4, shadcn) after successful verification |
| `README.md` | Mention UI stack foundation if useful for contributors |

**Do not change** `app/api/**` unless required by Next/TS upgrades.

---

### Phase 5 — Tooling alignment

| Item | Action |
|------|--------|
| `.nvmrc` | Add `22` |
| `package.json` `engines` | `"node": ">=22 <23"` |
| `.github/workflows/deploy-azure.yml` | Confirm `node-version: "22.x"` still valid (no change expected) |

---

## Verification checklist (must pass before “done”)

```bash
node -v          # 22.x
npm ci
npm run build
npm test
npm run lint
npm run dev      # smoke: http://localhost:3000 and sample /api/auth/session
```

| Check | Expected |
|-------|----------|
| Production build | Completes without TypeScript errors |
| Vitest | All existing `**/*.test.ts` pass |
| ESLint | No new errors (warnings acceptable if pre-existing) |
| API routes | Unauthenticated/authenticated flows still behave as before |
| `app/globals.css` | Loaded; no missing PostCSS plugin errors |
| `components.json` | Present; `components/ui/` has no business components yet |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| **Next 15 → 16** breaking changes | Fix from build output; consult Next 16 release notes |
| **TypeScript 6** deprecations | Address `tsconfig` / type errors incrementally |
| **Vitest 4** config API changes | Adjust `vitest.config.ts` per migration guide |
| **ESLint 10** + flat config | Tune `eslint.config.mjs` |
| **Tailwind v4 browser support** | Confirm minimum browsers for school devices (Safari 16.4+, Chrome 111+, Firefox 128+) |
| **shadcn init overwrites `globals.css`** | Commit before init; review diff |
| **Version drift** | Re-run `npm view` on execution day; pin exact versions in `package.json` |

---

## Rollback

If the upgrade fails mid-way:

```bash
git checkout -- package.json package-lock.json
git clean -fd   # careful: removes untracked new files (e.g. components.json)
npm ci
```

Or revert the whole commit if already committed.

---

## After this plan (separate tasks)

1. `npx shadcn@latest add button` (and others) when UI work starts  
2. App route groups, e.g. `app/(game)/…`  
3. Client data fetching / session UX  
4. Dependabot or Renovate for ongoing patch updates  
5. Optional: TypeScript 7 native preview (not part of Option A)

---

## Quick reference — one-page command summary

```bash
# 0. Node 22, clean tree, baseline tests

# 1. Core upgrades
npm install next@16.2.7 react@19.2.7 react-dom@19.2.7 zod@4.4.3 \
  @supabase/supabase-js@2.107.0 @langchain/core@1.1.48 @langchain/openai@1.4.7
npm install -D typescript@6.0.3 eslint@10.4.1 eslint-config-next@16.2.7 vitest@4.1.8 \
  @types/node@22.19.19 @types/react@19.2.16 @types/react-dom@19.2.3 @eslint/eslintrc@3.3.5

# 2. shadcn init (Tailwind v4 + utils; NO components)
npx shadcn@latest init

# 3. Fix breakages from build / test / lint

# 4. Optional: .nvmrc, engines, doc updates

npm run build && npm test && npm run lint
```

---

## Execution notes (2026-06-02)

**Prerequisite:** Commit `0dc10f9` — Unity Cursor skills removed; review commands updated for web-only repo.

**Decisions applied:**

| Topic | Choice |
| ----- | ------ |
| Design tokens | **`app/globals.css` only** (no separate `tokens.css`) |
| Sonner | **Not** in this pass |
| shadcn base color | **stone** in `components.json` (CLI default preset was radix-nova / neutral CSS; `baseColor` set to stone for future `add`) |
| shadcn style | **radix-nova** (shadcn CLI v4 default with `-d`) |
| UI components | Init auto-added `button`; **removed** — `components/ui/.gitkeep` only |

**Versions installed (representative):** `next@16.2.7`, `react@19.2.7`, `typescript@6.0.3`, `vitest@4.1.8`, `tailwindcss@4.3.0`, `@tailwindcss/postcss@4.3.0`.

**Follow-up fixes during execution:**

- **ESLint:** Next 16 removed `next lint`; `package.json` uses `eslint .` with flat config (`eslint-config-next/core-web-vitals` + `typescript`). **ESLint 10** broke `eslint-plugin-react`; pinned **ESLint 9.39.4** until plugins catch up.
- **Fonts:** `shadcn init` added **Geist** via `next/font` in `app/layout.tsx`.
- **Node:** `.nvmrc` → `22`, `engines` → `>=22 <23` (CI already on 22.x).
- **Verification:** `npm run build`, `npm test` (82 tests), `npm run lint` — all pass.

**Runtime dependency:** `app/globals.css` imports `shadcn/tailwind.css` — the **`shadcn` npm package** (not only the CLI) must stay in `dependencies`. It was briefly removed with `radix-ui`; restored in follow-up fix.

**Deferred (separate PRs):** `shadcn add sonner`, `lib/api-client.ts`, game route groups, brand token tuning in `globals.css`.

---

## Approval

When the team says **go**, execute phases in order, pin versions in `package.json`, commit with a message focused on *why* (e.g. “Upgrade to Next 16 and add shadcn/Tailwind v4 foundation for web UI”), and attach this checklist to the PR test plan.
