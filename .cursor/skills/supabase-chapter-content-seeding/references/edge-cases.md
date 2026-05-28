# Edge cases & pitfalls (Chapter 1 learnings)

Catalog of issues encountered seeding `chapter-01`. Re-check when seeding `chapter-02+`.

## Database & migrations

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| Greenfield demo quests coexist | Chapter overview shows `quest-01` + narrative quests | `is_active = false` on demo quests/steps in same `chapter-NN` slug (end of migration) |
| MCP chunk applies | Orphan names in `schema_migrations`, not in git | Prefer `supabase db push`; one MCP apply per repo file max |
| Duplicate helper SQL | Drift between `supabase/scripts/chapter*` and migration | Do not commit chunk scripts; migration is source of truth |
| Main migration already applied | Fixes won't re-run | Follow-up migration + sync test |
| Follow-up payload drift | Dev differs from git | `toEqual` shared tags in CI test; `KEEP IN SYNC` comment |
| Full migration chain on fresh DB | Both main + follow-up run | Idempotent upserts; deactivation safe to repeat |

## SQL authoring

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| Italian apostrophes in JSON | SQL string escape errors | Dollar-quoting `$tag${ ... }$tag$` |
| task_type in VALUES | Cutscene: `null::text`; task: `'ClozeText',` without `::text` | Match greenfield pattern; tests parsing SQL must allow optional `::text` |
| Invalid JSON in MCP hand-minify | Insert fails | Copy from migration file verbatim |
| Large payloads via MCP | Truncation / timeout | Apply full migration file, not pasted fragments |
| `WITH quest_ref` once, many statements | `relation "quest_ref" does not exist` on 2nd statement | Repeat the same `with quest_ref as (...)` before **each** `UPDATE`/`INSERT` |
| Monolithic profile SpecialScreen | Triple placeholder captions, 7-part paging, `/complete` risk on scored | Split: photo-only screen + `ClozeText` + `referenceDocument` per person (`20260629120000_chapter_02_q3_split_profiles.sql`) |

## Payload & schema

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| Missing sceneBackgroundAsset | Default/backfill only; wrong art | Set on every task and cutscene in authoring migration |
| Cloze `kind: "literal"` vs `"text"` | Unity only maps `text` and `gap` in ClozeTextToolkitStep | Author `"text"` (Zod accepts any kind string) |
| Wrong cloze accepted answers | `"son andato"` marked correct | Content QA on gap answers |
| SpecialScreenSms | Nested `blocks[].clozeText` | Route via `parseSpecialScreenContent`; validate in stepContentValidation |
| ErrorSpotting corrections | Phrase-level segments vs full-sentence corrections | Keep `acceptedCorrections` aligned with segment granularity |
| DragDrop pedagogy | Source says `(prep.) durante` → `la durata` | Prefer label matching answer POS `(sost.) durata` when schema allows |
| Combined drag labels | Number+unit as one tile (`1 chilometro`) | Document as placeholder when schema lacks split tiles |
| logical_task_key reuse | Backpack credit dedup breaks | Unique keys per exercise across DB |
| Unknown task_type | Bootstrap 502 | Add Zod schema + stepContentValidation case + Unity step |

## Quest flow & meta

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| autoStartQuestSlug on last quest | Skips chapter overview | Omit on final quest in chain |
| referenceDocument | Bar tasks need brochure | `meta_payload` on quest, not step JSON |
| blockBack | Learner backs out of story | `meta_payload.flow.blockBack`; cutscene steps may also set `navigation.blockBack` |
| theme_payload.background | Unused legacy key `chapter1-bg` | Use GameArt nav key or document; `paletteKey` drives `ChapterThemeRuntime` |

## Narrative vs playable scope

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| Map unlock mentions 3 pins, only 1 quest exists | Player confusion | Soften narrator copy (“bar available now; others later”) |
| Outro teases museum/Ferrari home | No quest rows yet | Gap report: client/future content; optional copy alignment |
| gameInfo false pizza claim | Mismatch with reward overlay | Use completion copy, not slice count |
| Opening avatar in room | Source spec; not cutscene schema | Gap report: Unity presenter work |
| SMS vibration | Source spec | Client presentation; not DB |

## GameArt

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| Missing portrait PNG | Placeholder slot in cutscene | Add to `populate-gameart-placeholders.py` + generate meta |
| Mixed-case keys in JSON | Load fail on device | Lowercase keys; web Zod normalizes |
| Placeholder masters only | All scenes look identical | Expected until art swap; keys stable for PNG-only replace |

## Rewards (placeholder policy)

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| flat pizza everywhere | No performance differentiation | OK for first narrative batch; document in gap report |
| Scored tasks later | Need attempt payload + RPC | Switch `reward_rules.pizza.mode` to `scored` when content ready |

## CI & tests

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| Test parses only main migration | Follow-up drift undetected | Compare shared tags + validate follow-up payloads |
| Regex row parser | Misses task rows without `::text` | `(?:::text)?` optional on task_type |
| Test path from apps/web | Wrong relative path to SQL | Resolve from repo root (`../../../../supabase/...`) |

## API runtime

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| Inactive quests in DB | Still visible? | Repository filters `.eq('is_active', true)` — deactivation sufficient |
| payload_invalid 502 | Malformed step JSON | Run migration payload test before apply |
