# Chapter 02 (Bologna, Lezione 2) — implementation plan

**Purpose:** Chapter-specific authoring rules and settled skips. Screen map: [chapter-02-implementation-overview.md](./chapter-02-implementation-overview.md).  
**Execution checklist:** [chapter-02-detailed-implementation-plan.md](./chapter-02-detailed-implementation-plan.md).  
**Source copy:** `docs/content_raw/chapter-2.md`.

**Story scene conventions:** Reuse [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md#1-story-scenes-story--info) in full.

---

## 1. Story — chapter-specific

| Raw | Action |
| --- | ------ |
| Map pin illumination (2.0, outros 2.1 / 2.2 / 2.3) | **Replace** with mission-list framing |
| Three profile “Lesetext” as separate playable scenes | **Skip** — `referenceDocument.sections[]` on Steckbrief cloze (scene **04**) |
| `[Narratore]` / NPC / monologue | **Verbatim** per chapter 01 plan |

**New Italian:** quest-01 scene 03; quest outros replacing map copy (see overview).

---

## 2. Chapter metadata (settled)

| Field | Value |
| ----- | ----- |
| `chapter.json` → `title` | `«Bologna — secondo giorno»` |
| `locked` | `false` |
| Main quest `requiresQuestId` | `quest-01` (`null`) → `quest-02` → `quest-03` → `quest-04`; bonus after `quest-04` |

---

## 3. Tasks (settled)

### Steckbrief (cloze, scene 04)

- Option **A:** union `correctAnswers`; one cloze scene.
- `referenceDocument` with **`sections[]`** ×3 (Saviano, Del Piero, Ferragni) — no photos.

### Quiz „Chi sono io?“ (scenes 06–11)

- **Six** `multiple_choice` task scenes (one per book riddle).
- Each scene: **`questions[]` length 2** — (1) grammar MC, (2) person MC (name labels only).
- Footer: **Avanti** after question 1, **Controlla** after question 2 (`SceneRouter` multi-question MC).
- **`referenceDocument`:** identical **6-figure gallery** on **all six** scenes (`documentId: "ch02-quiz-persons"` optional).
- Photos + names in documento only; **no** descriptions on cards (per raw).

Details + JSON examples: [overview § Quiz](./chapter-02-implementation-overview.md#quiz-chi-sono-io-settled).

### Freetext (quest-02 ×4, quest-04 ×5)

- One scene per profession / menù category.
- `referenceDocument`: **`figures[]`** with one image + `caption`; short `body` hint.

### Drag-drop, bonus

- Per overview quest-04 scene **11**, bonus matching pool.

**Draft scoring:** [overview § Draft scoring](./chapter-02-implementation-overview.md#draft-scoring-placeholder-for-json).

---

## 4. Platform prerequisite (before chapter 02 content JSON)

Implement [overview § Reference document contract](./chapter-02-implementation-overview.md#reference-document-contract-planned-json--ui):

- Zod: `figures[]`, `sections[]`, optional `documentId`.
- `ReferenceDocumentOverlay`: 2×3 gallery (md+), single-figure card, section headings for Steckbrief.
- `readReference` / normalize paths pass structured data.
- Update `docs/quest-scene-content-format.md` when code lands.

**Do not** start catalog JSON for chapter 02 freetext/quiz/Steckbrief until this ships (or author text-only stubs only).

---

## 5. Document history

- 2026-06-03 — Settled: quiz 6 scenes × 2 MC questions; documento gallery; referenceDocument JSON/UI spec.
- 2026-06-03 — Settled: Steckbrief A; freetext one scene per item; hub title; sequential unlock; `locked: false`.
