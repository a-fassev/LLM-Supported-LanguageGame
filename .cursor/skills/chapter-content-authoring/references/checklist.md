# Chapter JSON checklist

Run before marking a chapter authoring PR ready.

## Chapter

- [ ] `lib/content/chapters/chapter-NN/chapter.json` — `id`, `title`, `order` (contiguous), `quests[]` order, **`background`**, `locked` if pilot
- [ ] `quests[]` lists every folder under `quests/`
- [ ] `loadContentCatalog({ bypassCache: true })` succeeds
- [ ] `lib/game/content/chapter-NN-catalog.test.ts` added or updated (scene-order assertions when story/task sequence is fragile)

## Per quest (`quest.json`)

- [ ] `id` matches folder name
- [ ] `title` — bonus has **`Extra: `** prefix
- [ ] `kind` — `main` or `bonus`
- [ ] `requiresQuestId` — correct chain
- [ ] **`background`** set
- [ ] No `autoStartQuestId`

## Per scene (`scenes/NN.json`)

- [ ] `id` = `{chapterId}-{questId}-scene-{NN}` matches `NN.json`
- [ ] **`background`** set
- [ ] Story: no `scoring`; `screen_type: "info"`; `content.text` per [raw-mapping.md](raw-mapping.md)
- [ ] Task: valid `screen_type`; `content.title` / `instruction` / task prompt separated
- [ ] Task: `scoring.pizza` + `scoring.backpack` present
- [ ] `referenceDocument` only where documento is needed (task `content`)

## Commands

```bash
npm test
npm run lint
npm run build
```

## Manual (recommended)

- [ ] Full playthrough: chapter hub → each quest → bonus if present
- [ ] Story NPC lines show two lines (`\n` in JSON)
- [ ] Completed quests show **Completata** and do not restart from hub
