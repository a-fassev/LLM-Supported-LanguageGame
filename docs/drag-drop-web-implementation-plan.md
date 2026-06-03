# Drag & drop web — implementation checklist

**Status:** Implemented (2026-06-03).  
**Spec:** [drag-drop-task-integration-plan.md](./drag-drop-task-integration-plan.md)

This file tracks the concrete web rollout. Do not duplicate product decisions here; use the integration plan for scope and UX locks.

## Completed

- [x] Strict `dragDropContentSchema` + `parseDragDropContent` in catalog loader
- [x] Schema tests (`lib/game/schemas/dragDropContentSchema.test.ts`)
- [x] Quest-01 fixtures `scenes/09.json`–`11.json`
- [x] Legacy minimal stubs (chapter 02/04/05/06 quest-02 scene 02)
- [x] `lib/game/tasks/drag-drop/*` helpers + unit tests
- [x] `components/game/tasks/types/drag-drop/*` UI (drag, tap, × unpair)
- [x] `TaskPanel` / `SceneRouter` / `play/page.tsx` attempt flow
- [x] `docs/quest-scene-content-format.md` drag_drop subsection
- [x] Smoke tests (11-scene quest-01 chain)

## Verification

```bash
npm test
npm run lint   # pre-existing warnings in unrelated files may remain
```

Manual QA: chapter-01 → quest-01 → scenes 09–11 (after 01–08).

## Out of scope (later)

- `lines` presentation mode UI + server scoring
- Tile images (`assetId` / `imageUrl`)
