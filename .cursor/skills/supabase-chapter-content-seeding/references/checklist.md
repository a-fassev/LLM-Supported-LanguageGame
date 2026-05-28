# Chapter content seeding checklist

Use with `.cursor/skills/supabase-chapter-content-seeding/SKILL.md`.

## Pre-coding

- [ ] Scope: which Akte → quests; excluded acts/bonus
- [ ] Auto-start chain and last-quest overview behavior
- [ ] Target Supabase project confirmed
- [ ] On `unity-implementation` branch

## Blueprint

- [ ] Chapter slug (`chapter-NN`) and display name
- [ ] Quest slugs, order_index, unlock_rules
- [ ] meta_payload per quest (flow, shared referenceDocument only when one doc is intentional across steps)
- [ ] step-level `content_payload.referenceDocument` added on task rows where documents differ by step
- [ ] Step list: kind, task_type, template_key, logical_task_key
- [ ] Each payload reviewed against Zod + Unity factory
- [ ] Gap report drafted (schema / placeholder / client)

## GameArt

- [ ] All sceneBackgroundAsset keys listed
- [ ] All portraitId keys exist under `portraits/npc/`
- [ ] `populate-gameart-placeholders.py` updated
- [ ] Placeholders generated + `.meta` for new PNGs

## Migration

- [ ] Single canonical migration file (numbered timestamp)
- [ ] Dollar-quoted JSON for all step payloads
- [ ] sceneBackgroundAsset on every task and cutscene step
- [ ] Demo quest retirement (`quest-01`, `quest-02`) at end of migration
- [ ] No committed `supabase/scripts/chapter*` one-offs

## QA solutions (optional but recommended)

- [ ] `docs/narrative/solutions/chapter-NN-solutions.md` updated from migration JSON (beat counts, exact answers, Freitext samples)

## Apply & verify

- [ ] Applied via `supabase db push` or one MCP apply per repo file
- [ ] Active quest count matches narrative scope only
- [ ] 16 (or expected) active steps; contiguous order_index
- [ ] Payload test passes (`npm run test:chapterNN-migration`)
- [ ] Spot-check: autoStartQuestSlug, prerequisites, quest/shared vs step-specific referenceDocument placement

## Post-deploy fix (if needed)

- [ ] Follow-up migration with KEEP IN SYNC header
- [ ] Sync test compares shared dollar-quote tags
- [ ] Dev DB updated
