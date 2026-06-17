# Chapter 01 (Bologna) — implementation overview

**Purpose:** High-level screen map for review before JSON authoring. Source: `docs/content_raw/chapter-1.md`.  
**Not in scope here:** Final Italian polish for new transition scenes, full task payloads, final reward tuning. **Draft scoring** below is a starting point for JSON.

**Next implementation phase (planned):** Build the **JSON skeleton** (catalog tree + `background` keys). PNGs can follow later — keys may be renamed when art is uploaded (`public/content-assets/README.md`).

**Authoring rules (story copy, NPC layout, game hints):** [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md) §1.

**Conventions**

| Source | Catalog |
| ------ | ------- |
| Akt (1.0, 1.1, …) | One **main** quest folder (`quest-01` …) |
| Bonus block at end | `quest-01-bonus` (`kind: "bonus"`) |
| `[Narratore]` | `story` + `info` — **one beat per scene**; `content.text` = narrator body only (no speaker line) |
| `[Info di gioco]` | Same as narrator — **one beat per scene**; hint copy only in `content.text` (no special screen type) |
| NPC dialogue | `story` + `info` — **one beat per scene**; `content.text` = line 1: NPC name, line 2: dialogue (`\n` between) |
| `[Monologo interiore]` / player line | `story` + `info` — line 1: `Tu`, line 2: text |
| Exercise | `task` + implemented `screen_type` only |
| Broschüre / long reading text | `referenceDocument` on **task** scenes that need it (documento button); optional short `info` “read first” before tasks |

**Web progression (today):** Quests unlock **in chapter order** (`requiresQuestId`). Play is **quest-linear** (chapter hub between quests only).

### Story text — two-line layout (`\n`)

| Layer | Status |
| ----- | ------ |
| **JSON / catalog** | Supported — `content.text` may contain `\n` between speaker line and dialogue (see [implementation plan §1](./chapter-01-implementation-plan.md#1-story-scenes-story--info)). |
| **Web UI (today)** | **Not visible yet** — `StoryPanel` renders a single `<p>`; HTML collapses `\n` to a space, so NPC / `Tu` lines appear on one line. |
| **Fix (small)** | Add `whitespace-pre-line` on the story text in `components/game/shell/StoryPanel.tsx` (or split on `\n` into two `<p>` if the first line should be bold later). No schema or API change. |

Author JSON with `\n` as planned; ship the `StoryPanel` tweak before playtesting chapter 01 dialogue scenes.

---

## Spiellogik (kurz, Stand Codebase)

- **Katalog:** `lib/content/chapters/chapter-01/` — `chapter.json` → ordered `quests` → `scenes/01.json`, `02.json`, …
- **Scene types:** `story` (`info` + `text` only) or `task` (Controlla + server scoring).
- **Task types in production:** `cloze`, `error_spotting`, `drag_drop`, `free_text` (LLM), `matching`, `multiple_choice`. Bonus = `quest.kind: "bonus"` + `matching` with `poolPairs` / `sampleSize`.
- **Progression:** Sequential quests; chapter completes when all **main** quests done; bonus optional (`requiresQuestId` on bonus). After each quest, learner returns to chapter mission list.
- **Story copy:** Formatting lives in `content.text` per [implementation plan §1](./chapter-01-implementation-plan.md#1-story-scenes-story--info) (narrator vs `Name\ndialogue` vs `Tu\n…`).
- **Visuals:** One **`background` asset key per scene** only (no avatar/NPC/SMS UI/sounds in JSON). Art pass defines keys later.
- **Quest chain:** `quest-02` → `quest-03` is **seamless** (no return to chapter hub between Akt 1.1 and 1.2) — normal `requiresQuestId` only.
- **Current `chapter-01` catalog:** Legacy placeholder/fixture files under `lib/content/chapters/chapter-01/` — **delete entirely** when implementing JSON; rebuild only from this overview (see [§ Catalog cleanup](#catalog-cleanup-before-json)).

---

## Chapter structure (proposed)

| Quest ID | Source act | Working title (IT, TBD) | Main tasks | Notes |
| -------- | ---------- | ------------------------- | ---------- | ----- |
| `quest-01` | 1.0 Camera | La tua camera | 0 | Opening + game hints |
| `quest-02` | 1.1 Liceo | Il primo giorno | 2 | Cloze + error spotting |
| `quest-03` | 1.2 Davanti alla scuola | Il messaggio di Matteo | 1 | Starts right after `quest-02` (no hub break) |
| `quest-04` | 1.3 Bar | Il bar di Tonio | 3 | Brochure + word families + EN–IT matching + numbers |
| `quest-01-bonus` | Fine Akt 1 + bonus pool | Sfida vocabolario | 1 | Matching `sampleSize: 10` from large pool |

**Target `chapter.json` quest order:**

`["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"]`

**Unlock chain:** each main `requiresQuestId` = previous main. Bonus `requiresQuestId: "quest-04"`.

---

## Catalog cleanup (before JSON)

When the chapter is wired to JSON, **remove the old `chapter-01` tree completely** (placeholder copy, leftover sandbox-style scenes, unused quest folders such as any legacy `quest-02` not listed above). **Do not** patch or reuse those files.

Then create a **fresh** catalog:

- `chapter.json` with the five quest ids in order
- Per quest: `quest.json` + `scenes/01.json` … per tables below

---

## JSON skeleton & background assets (next step)

**Goal:** Stand up the **full catalog shape** so loaders and routes can resolve chapters, quests, and scenes. Use **placeholder** `content.text` / minimal `task` stubs where copy is not ready yet; set every **`background`** key up front.

**PNG files are not required yet.** Keys resolve to `public/content-assets/{key}.png` (`resolveAssetUrl`); missing files fall back to gradients until art lands. Adjust key strings when files are uploaded — keep JSON and filenames in sync.

### Catalog files (per level)

| Level | File | Required fields (skeleton) |
| ----- | ---- | --------------------------- |
| Chapter | `chapter.json` | `id`, `title`, `order`, `quests[]`, **`background`** (chapter **mission list** / quest overview hub at `/chapters/chapter-01`) |
| Quest | `quest.json` | `id`, `title`, `order`, `kind`, `requiresQuestId`, **`background`** (quest **overview** — card / mission entry; used when hub shows per-quest art) |
| Scene | `scenes/NN.json` | Envelope per [quest-scene format](../docs/quest-scene-content-format.md): `id`, `scene_type`, `screen_type`, **`background`**, `content` (minimal ok), `scoring` on tasks |

**Note:** Today’s Zod `chapterFileSchema` / `questFileSchema` only list quests and metadata — **no `background` yet**. Adding `background` on `chapter.json` and `quest.json` is part of the skeleton pass (schema + loader + chapter hub wiring), not only scene files.

### Target tree (`lib/content/`)

```text
lib/content/chapters/chapter-01/
├── chapter.json                 # + background (chapter missions hub)
└── quests/
    ├── quest-01/
    │   ├── quest.json           # + background (quest overview)
    │   └── scenes/01.json … 07.json
    ├── quest-02/
    │   ├── quest.json
    │   └── scenes/01.json … 10.json
    ├── quest-03/
    │   ├── quest.json
    │   └── scenes/01.json … 06.json
    ├── quest-04/
    │   ├── quest.json
    │   └── scenes/01.json … 16.json
    └── quest-01-bonus/
        ├── quest.json
        └── scenes/01.json … 04.json
```

### Asset key convention

Path-style keys, lowercase, **no** `.png` in JSON. Mirror under `public/content-assets/`:

```text
public/content-assets/
└── chapters/
    └── 01/
        ├── chapter/
        │   └── bg-missions.png          ← chapter.json → chapters/01/chapter/bg-missions
        └── quests/
            ├── 01/ … 04/
            │   ├── bg-overview.png      ← quest.json → chapters/01/quests/01/bg-overview
            │   └── bg-info-01.png …     ← scene keys (same folder as quest id)
            └── bonus/
                ├── bg-overview.png
                └── bg-info-01.png …
```

| Key pattern | Used in | Example |
| ----------- | ------- | ------- |
| `chapters/01/chapter/{name}` | `chapter.json` → `background` | `chapters/01/chapter/bg-missions` |
| `chapters/01/quests/{questFolder}/{name}` | `quest.json` → `background` | `chapters/01/quests/02/bg-overview` |
| `chapters/01/quests/{questFolder}/{name}` | each `scenes/NN.json` | `chapters/01/quests/04/bg-bar-task-01` |
| `chapters/01/quests/bonus/{name}` | bonus quest + scenes | `chapters/01/quests/bonus/bg-overview` |

**Scene naming hints** (same quest folder, reuse keys when one art fits multiple beats):

| Suffix | Typical use |
| ------ | ------------- |
| `bg-overview` | Quest hub only (`quest.json`) |
| `bg-info-NN` | Story (`info`) scenes, ordered |
| `bg-task-NN` or `bg-task-{type}` | Task scenes (cloze, matching, …) |
| `bg-{place}` | Shared location (e.g. `bg-room`, `bg-class`, `bg-bar`) when one image covers several scenes |

Use **`01`–`04`** for main quest folders and **`bonus`** for `quest-01-bonus` (matches existing `chapter-00` bonus paths).

### Chapter 01 — planned hub keys (draft)

| File | Draft `background` key |
| ---- | ---------------------- |
| `chapter.json` | `chapters/01/chapter/bg-missions` |
| `quests/quest-01/quest.json` | `chapters/01/quests/01/bg-overview` |
| `quests/quest-02/quest.json` | `chapters/01/quests/02/bg-overview` |
| `quests/quest-03/quest.json` | `chapters/01/quests/03/bg-overview` |
| `quests/quest-04/quest.json` | `chapters/01/quests/04/bg-overview` |
| `quests/quest-01-bonus/quest.json` | `chapters/01/quests/bonus/bg-overview` |

Per-scene keys: author per quest when filling `scenes/*.json` (e.g. quest-01 room `bg-info-01` … `bg-info-07`; quest-04 bar `bg-bar-info` / `bg-bar-task` variants). Reuse one key on multiple scene files when the beat shares the same art.

---

## Quest `quest-01` — Akt 1.0 (Opening)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: welcome Bologna |
| 02 | story | info | Narrator: Toni, exchange year |
| 03 | story | info | Narrator: Sunday eve, first school day |
| 04 | story | info | Narrator: empty room / future souvenirs |
| 05 | story | info | Game info — backpack / compiti (body-only `text`) |
| 06 | story | info | Game info — pizza / avatar shop (body-only) |
| 07 | story | info | Game info — chapter hub / gated chapters (body-only; not an in-quest location map) |

**Backgrounds (draft):** Scene keys under `chapters/01/quests/01/` — e.g. shared `bg-room` or `bg-info-01` … `bg-info-07`; see [§ JSON skeleton & background assets](#json-skeleton--background-assets-next-step).

---

## Quest `quest-02` — Akt 1.1 (Classroom)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: first day, enter class |
| 02 | story | info | NPC — Prof.ssa Ricci + dialogue |
| 03 | story | info | NPC — Chiara + dialogue |
| 04 | story | info | Tu — monologo vacanze |
| 05 | task | **cloze** | Esercizio 1 — imperfetto / passato prossimo (14 gaps; multi `correctAnswers` per gap) |
| 06 | story | info | Narrator: prof smiles, article |
| 07 | story | info | NPC — Prof.ssa Ricci + article challenge |
| 08 | task | **error_spotting** | Esercizio 2 — 5 cultural errors in bar/ristorante article (`expectedErrorRange` min/max 5; segment authoring for phrases) |
| 09 | story | info | NPC — Prof.ssa Ricci + closing |
| 10 | story | info | Narrator: bell, leave school |

**Task copy:** Verbatim from raw for cloze passage + article text + accepted fixes.

**Scoring (draft):** See [§ Draft scoring](#draft-scoring-placeholder-for-json) — quest-02 scenes 05 & 08.

---

## Quest `quest-03` — Akt 1.2 (School gate / SMS)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: outside school, phone vibrates |
| 02 | story | info | NPC-style — Matteo + SMS intro (pre-cloze context) |
| 03 | story | info | Tu — monologo cugino Palermo |
| 04 | task | **cloze** | SMS body — pronouns + passato prossimo (gaps per source; verb hints in prompt/instruction, not in gap UI) |
| 05 | story | info | Tu — reply later, explore |
| 06 | story | info | Narrator: transition after SMS — explore / toward bar (new copy; **not** from raw map outro) |

**Scoring (draft):** quest-03 scene 04 (cloze).

---

## Quest `quest-04` — Akt 1.3 (Bar)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: portici, enter bar |
| 02 | story | info | NPC — Tonio + offer / new in Bologna |
| 03 | story | info | Tu — Liceo Galvani reply |
| 04 | story | info | NPC — Tonio + Puglia / grotte |
| 05 | story | info | Narrator: brochure handed over |
| 06 | story | info | **Brochure read-through** (full “Le Grotte…” text) — or skip if tasks use `referenceDocument` only |
| 07 | story | info | NPC — Tonio + word families ask |
| 08 | task | **matching** | Esercizio 1 — 8 lemma → word from brochure (`leftItems` / `rightItems` from “Parole da trascinare”; shuffle right) |
| 09 | story | info | NPC — Tonio + English list mixed up |
| 10 | task | **matching** | Esercizio 2 — EN↔IT (6 pairs) |
| 11 | story | info | NPC — Tonio + numbers ask |
| 12 | task | **drag_drop** | Esercizio 3 — nine **combined** cards (e.g. `1 chilometro`, `50 minuti`, `50 metri`) → meaning rows; no bare duplicate `50` tiles (see [§ Settled decisions](#settled-decisions)) |
| 13 | story | info | NPC — Tonio + thanks / coffee |
| 14 | story | info | Narrator — pizza slice earned |
| 15 | story | info | Tu — Tonio simpatico |
| 16 | story | info | Narrator: leave bar / end of quest (new copy; **not** from raw map outro) |

**`referenceDocument`:** Body = brochure text on scenes **08** and **10–12** (and optionally **06**). Same `title`/`body` across those scenes. **documento** = in-game brochure (not a separate pop-up system).

**Authoring:** Esercizio 1 → **matching** (not cloze).

**Scoring (draft):** quest-04 task scenes 08, 10, 12.

---

## Quest `quest-01-bonus` — Chapter close + vocabulary

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: first day finished |
| 02 | story | info | Narrator: test yourself |
| 03 | story | info | Game info — bonus pizza hint (body-only) |
| 04 | task | **matching** | Bonus — `poolPairs` = full Lezione 1 vocab tables; `sampleSize: 10`; `shuffleRightOrder` |

**Backgrounds (draft):** `chapters/01/quests/bonus/bg-overview` + per-scene keys; pool = all Lezione 1 vocab tables (`sampleSize: 10`) per `docs/bonus-quest-implementation-plan.md`.

**Unlock:** `requiresQuestId: "quest-04"`; auto-start from **`quest-04`** on complete.

**Scoring (draft):** quest-01-bonus scene 04.

---

## Task-type mapping summary

| Source exercise | `screen_type` | Notes |
| ----------------- | --------------- | ----- |
| Lückentext (vacanze) | `cloze` | Free-text gaps per line (not dropdown); many gaps; multi `correctAnswers` |
| Fehlersuche (5 errors) | `error_spotting` | Phrase-level segments; false taps ignored; success overlay; pizza scales with ratio |
| SMS Lückentext | `cloze` | Same free-text gaps; verb hints in instruction only |
| Famiglie di parole | `matching` | 8 pairs, brochure as `referenceDocument` |
| EN–IT (Tonio) | `matching` | 6 pairs (scene 10) |
| Numeri + unità | `drag_drop` | One draggable card per number+unit pair (e.g. `50 minuti` vs `50 metri`); 9 targets |
| Bonus vocab | `matching` | `poolPairs` + `sampleSize: 10` |

**Not used for Ch.1 (per team agreement):** legacy `screen_type: "bonus"`, Special-Screens, MC unless added later. **Steckbriefe** do not appear in Lezione 1 — no action for Ch.1.

---

## Draft scoring (placeholder for JSON)

**Status:** Team will rebalance later; use these values for first JSON pass. Pattern matches `chapter-00` / `chapter-03` fixtures (`docs/quest-scene-content-format.md` §6). Every task scene: `"backpack": { "pieces": 1 }`. Story scenes: **no** `scoring`.

| Scene | Quest | Task | Pizza (draft) | Rationale |
| ----- | ----- | ---- | ------------- | --------- |
| 05 | quest-02 | cloze (14 gaps) | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| 08 | quest-02 | error_spotting (5 errors) | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio can pass; slices scale with ratio |
| 04 | quest-03 | cloze (SMS, ~12 gaps) | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| 08 | quest-04 | matching (8 pairs) | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio matches to pass |
| 10 | quest-04 | matching (6 pairs) | `flat`, `slices: 2` | EN–IT cognates |
| 12 | quest-04 | drag_drop (9 targets) | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| 04 | quest-01-bonus | matching pool ×10 | `scored`, `maxSlices: 3`, `linear`, `floor` | Bonus — pizza scales with ratio |

**Chapter pizza (rough):** ~15–18 slices if player passes all tasks (+ variable slices from scored mapping). Bonus optional on top.

Narrator line “Hai guadagnato una fetta di pizza!” (quest-04 scene 14) stays **story**; actual slices come from **task** `scoring` on preceding scenes.

---

## Settled decisions

| Topic | Decision |
| ----- | -------- |
| Old `chapter-01` files | **Remove** full tree; rebuild from overview ([§ Catalog cleanup](#catalog-cleanup-before-json)) |
| Cloze | **Free-text** gaps in web (raw “dropdown” idea dropped) |
| Error spotting | Wrong taps **ignored**; pizza scales with ratio; success overlay always (matches product) |
| Drag & drop numbers (scene 12) | Author **combined** labels only — e.g. `50 minuti` and `50 metri` as **two cards**, not two bare `50` tiles; drop unused numbers from raw if not needed for any row |
| Steckbriefe | **Not in Ch.1** — ignore for this chapter |
| Raw **map outros** (1.2 / 1.3) | **Do not use** — legacy raw narrator lines about map pins / multiple locations are **omitted**; no in-chapter map. Author fresh Italian for `quest-03` scene **06** and `quest-04` scene **16** (short quest transitions only) |

---

## Scene count estimate (for JSON planning)

| Quest | Story (`info`) | Task | Total ≈ |
| ----- | -------------- | ---- | ------- |
| quest-01 | 7 | 0 | 7 |
| quest-02 | 8 | 2 | 10 |
| quest-03 | 5 | 1 | 6 |
| quest-04 | 12–13 | 3 | 15–16 |
| quest-01-bonus | 3 | 1 | 4 |
| **Chapter total** | **~35** | **7** | **~42** |

---

## Next steps (after review)

1. **Delete** legacy `lib/content/chapters/chapter-01/` content ([§ Catalog cleanup](#catalog-cleanup-before-json)).
2. **JSON skeleton:** Full tree + `chapter.json` / `quest.json` / all scene files with **`background`** keys ([§ JSON skeleton & background assets](#json-skeleton--background-assets-next-step)); minimal `content` / task stubs OK.
3. **Content pass:** Story per plan §1; verbatim **tasks** from raw; new Italian for quest-03 scene 06 & quest-04 scene 16; [draft scoring](#draft-scoring-placeholder-for-json).
4. **Art pass:** Upload PNGs under `public/content-assets/chapters/01/…` (rename keys in JSON if filenames change).
5. Extend `catalog-chapters` / smoke tests when catalog loads.

---

## Document history

- 2026-06-03 — Next phase: JSON skeleton + background key convention (chapter, quest, scene); asset directory layout.
- 2026-06-03 — Raw map outros dropped; omit legacy lines; new narrator copy for quest-03/04 transition scenes; no open items.
- 2026-06-03 — Settled: remove old catalog tree, cloze/error-spotting/drag 50/Steckbriefe.
- 2026-06-03 — Keep bar EN–IT matching (scene 10); trim resolved open items.
- 2026-06-03 — Story `\n` layout: JSON OK, `StoryPanel` needs `whitespace-pre-line` before QA.
- 2026-06-03 — Map outros reminder section; drop legacy map/avatar/sprite flags; draft scoring; progression clarifications.
- 2026-06-03 — Four main quests + bonus only.
- 2026-06-03 — Story text conventions (narrator / NPC name + dialogue / Tu / game info); link to implementation plan.
- 2026-06-03 — Initial overview from `docs/content_raw/chapter-1.md` (implementation planning only).
