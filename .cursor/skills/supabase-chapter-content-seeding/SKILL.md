---
name: supabase-chapter-content-seeding
description: >-
  Seeds narrative chapter content from markdown Akte/Act files into Supabase
  (game_chapters, game_quests, game_quest_steps), GameArt placeholder keys,
  idempotent migrations, payload validation, and dev DB apply. Use when authoring
  chapter-2.md+, seeding quests/steps, writing chapter content SQL, GameArt keys
  for a chapter, or fixing chapter payload/migration drift.
---

# Supabase chapter content seeding

Turn **story markdown** (e.g. `chapter-N.md`, Akte segments) into **DB-first** game content the Unity client loads via `/api/game/*`. Canonical output lives in **`supabase/migrations/`**; **`AGENTS.md`** (Supabase / narrative seeding bullets) is the repo-wide index.

**Reference:** [checklist.md](references/checklist.md) (end-to-end gates), [edge-cases.md](references/edge-cases.md) (known pitfalls from Chapter 1).

**Chapter 1 exemplar:** `supabase/migrations/20260527160000_chapter_01_act1_content.sql`, follow-up `20260527170000_chapter_01_review_fixes.sql`, test `apps/web/lib/game/chapter01MigrationPayloads.test.ts`, placeholders in `scripts/populate-gameart-placeholders.py`.

---

## When to use

- User provides or points at **`chapter-*.md`** and wants quests/steps in Supabase
- Adding a new chapter row, quest chain, cutscene beats, or task payloads
- Fixing content already deployed (follow-up migration + sync test)
- Inventorying **GameArt** keys before art swap

**Branch:** `unity-implementation` only (see `AGENTS.md`).

---

## Phase 0 — Clarify scope (before coding)

Confirm with the user:

| Decision | Example (Ch. 1) |
|----------|-------------------|
| Which **Akte** become **quests** | Akt 1.0+1.1 → Q1; 1.2 → Q2; 1.3 → Q3 |
| **Excluded** quests/steps | No Akt 1.4/1.5 rows; no bonus task |
| **Auto-start chain** | Q1→Q2→Q3; last quest returns to overview (no `autoStartQuestSlug`) |
| **Placeholder tasks** | Matching exercise kept though marked optional in source |
| Target Supabase project | e.g. `language-game-dev` |

Map **one spoken scene** ≠ one DB row: multi-line dialog in one scene = **`beats[]`** inside **one cutscene step** (see `AGENTS.md` Chapter 1 convention).

---

## Phase 1 — Content blueprint

Produce a table (in chat or plan, not a new doc unless asked):

- **`game_chapters`:** `slug`, `display_name`, `order_index`, `theme_payload` (`background` = GameArt nav key or default, `paletteKey` → `Resources/UI/{paletteKey}.asset`)
- **`game_quests`:** slug pattern `chapter-NN-quest-XX-{short-name}`, `unlock_rules.prerequisiteQuestSlugs`, `meta_payload.flow` (`blockBack`, `autoStartQuestSlug`), optional shared **`referenceDocument`** (task-shell brochure fallback)
- **`game_quest_steps`:** per row: `order_index`, `step_kind`, `task_type`, `template_key`, **`logical_task_key`** (globally unique), task/cutscene JSON shape, `reward_rules`, **`sceneBackgroundAsset`**
- **Reference documents authoring rule:** if one reading doc is shared intentionally across several task steps, keep it at quest meta (`meta_payload.referenceDocument`). If different steps need different docs in one quest, author step-level **`content_payload.referenceDocument`** on those task rows (same shape: `documentId?`, `title`, `bodyText`, `buttonLabel?`) and avoid a mixed quest relying on only quest-level meta.

Validate each task type against:

- `apps/web/lib/game/stepContentValidation.ts` + schema under `apps/web/lib/game/schemas/`
- Unity: `ToolkitStepFactory`, `ToolkitStepContentDtos.cs`

Flag **non-schema** items in a gap report (client-only UX, future map pins, SMS vibration) — do not block seeding.

---

## Phase 2 — GameArt inventory & placeholders

List every key referenced in payloads:

| Kind | Path pattern |
|------|----------------|
| Cutscene BG | `static/cutscene-backgrounds/chapter-NN/ph-cs-{scene}` |
| Task BG | `static/task-scene-backgrounds/chapter-NN/ph-ts-{scene}` |
| NPC portraits | `portraits/npc/{id}` (lowercase `portraitId` in `npcCast`) |

1. Add copy targets to **`scripts/populate-gameart-placeholders.py`**
2. Run `python3 scripts/populate-gameart-placeholders.py`
3. Run `python3 scripts/generate-gameart-meta.py` for new PNGs
4. Keys in JSON must be **lowercase** segments after `GameArt/` (Zod normalizes; Unity `GameArtAssetKeys.TryNormalizeGameArtKey`)

---

## Phase 3 — Migration SQL (canonical)

**One primary migration** per chapter batch: `supabase/migrations/YYYYMMDDHHMMSS_chapter_NN_act_content.sql`

### Required patterns

```sql
-- Idempotent upserts:
-- game_chapters ON CONFLICT (slug)
-- game_quests ON CONFLICT (chapter_id, slug)
-- game_quest_steps ON CONFLICT (quest_id, order_index)

-- Step JSON: dollar-quoted tags ($q1s0${ ... }$q1s0$) for Italian apostrophes
-- Every task AND cutscene step: "sceneBackgroundAsset": "static/..."

-- End of migration: retire greenfield demo quests in SAME chapter slug
UPDATE game_quest_steps SET is_active = false ... q.slug IN ('quest-01', 'quest-02');
UPDATE game_quests SET is_active = false ...;
```

**Cutscenes:** `beats[]` only; `presentationMode`: `narrator` | `npcDialog` | `innerMonologue` | `gameInfo`; optional `npcCast[]`.

**ClozeText / embedded cloze:** segment `kind`: **`text`** (Unity accepts this; not only `literal`).

**VALUES row shape:** cutscene uses `null::text` for `task_type`; tasks use `'ClozeText',` **without** `::text`.

**Rewards (placeholder until content team):** `'{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'`

### Do not

- Commit ad-hoc **`supabase/scripts/chapter*`** chunk files
- Seed production content via many MCP **`execute_sql`** chunks (orphan `schema_migrations` names)
- Leave greenfield **`quest-01` / `quest-02`** active under the same `chapter-NN` slug

---

## Phase 4 — Apply to Supabase

**Preferred:** `supabase db push` or CLI against the target project.

**MCP:** at most **one** `apply_migration` **per repo migration file**. Chunked MCP applies are dev rescue only; delete temp scripts after.

---

## Phase 5 — Post-deploy fixes

If the main migration may already be applied:

1. Add **`YYYYMMDDHHMMSS_chapter_NN_review_fixes.sql`** with delta upserts only
2. Header: **`KEEP IN SYNC`** — list duplicated dollar-quote tags
3. Extend or clone **`chapter01MigrationPayloads.test.ts`**:
   - Zod-validate all steps in main migration
   - Validate follow-up payloads
   - **`toEqual`** shared tags between both SQL files
4. Run `cd apps/web && npm run test:chapter01-migration` (generalize script name per chapter when Ch. 2 lands)

---

## Phase 6 — Validation gates

Before calling done:

- [ ] Step count and `order_index` contiguous per quest
- [ ] All active steps have `sceneBackgroundAsset`
- [ ] `autoStartQuestSlug` chain + `prerequisiteQuestSlugs` match blueprint
- [ ] Q with brochure has `meta_payload.referenceDocument`
- [ ] `logical_task_key` unique across chapter
- [ ] Only narrative quests **`is_active`** (no duplicate demo quests in chapter overview)
- [ ] `npm run test:chapter01-migration` (or chapter-specific test) passes
- [ ] Gap report: fully covered | placeholder | needs schema/client extension

SQL sanity query (adjust slug):

```sql
SELECT q.slug, q.is_active, count(s.id) AS steps
FROM game_quests q
JOIN game_chapters c ON c.id = q.chapter_id
LEFT JOIN game_quest_steps s ON s.quest_id = q.id AND s.is_active
WHERE c.slug = 'chapter-01'
GROUP BY q.slug, q.is_active ORDER BY q.slug;
```

---

## Phase 7 — Deliverables checklist

| Artifact | Location |
|----------|----------|
| Primary migration | `supabase/migrations/*_chapter_NN_*_content.sql` |
| Follow-up (if needed) | `supabase/migrations/*_review_fixes.sql` |
| Placeholder PNGs | `Assets/Resources/UI/GameArt/.../chapter-NN/` |
| Placeholder script entries | `scripts/populate-gameart-placeholders.py` |
| Payload CI test | `apps/web/lib/game/chapterNNMigrationPayloads.test.ts` |
| npm script | `apps/web/package.json` → `test:chapterNN-migration` |

Do **not** edit plan files unless the user asks. Do **not** create unsolicited `*_SUMMARY.md`.

---

## Quick gap-report template

```markdown
### Fully in schema
- [task types, flow flags, meta_payload features used]

### Placeholder / workaround
- [master PNGs, flat rewards, combined drag labels, narrative teasing unbuilt quests]

### Needs client or future content
- [SMS sound, map animation, avatar in scene, Akt X.Y not seeded]
```

See [edge-cases.md](references/edge-cases.md) for the Chapter 1 catalog.
