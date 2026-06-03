# Chapter 01 (Bologna) — implementation plan

**Purpose:** Authoring rules and workflow for Lezione 1 JSON. Screen-by-screen map: [chapter-01-implementation-overview.md](./chapter-01-implementation-overview.md).  
**Source copy:** `docs/content_raw/chapter-1.md`.

---

## 1. Story scenes (`story` + `info`)

All narrative beats use the same catalog shape: `scene_type: "story"`, `screen_type: "info"`, `content.text` (plain string). No speaker field in JSON — formatting is **inside `text`**.

**One beat per scene file** (one `[Narratore]` / NPC / monologue / `[Info di gioco]` block from the raw doc → one `scenes/NN.json`). Player advances with **Avanti**.

### 1.1 How `content.text` is formatted

| Raw label | Lines in `content.text` | Line 1 | Line 2+ |
| --------- | ---------------------- | ------ | ------- |
| `[Narratore]` | **Body only** | — | Full narrator copy (no „Narratore“ prefix) |
| `[Info di gioco]` | **Body only** | — | Game-hint copy verbatim (same UI as narrator; no extra chrome in v1) |
| NPC (e.g. `[Prof.ssa Ricci]`, `[Tonio]`, `[Chiara]`, SMS speaker) | **Two lines** | Speaker name as shown to the player (e.g. `Prof.ssa Ricci`, `Tonio`, `Matteo`) | Dialogue or message body |
| `[Monologo interiore]` / player speech | **Two lines** | `Tu` | Inner monologue or player line |
| Long read-through (e.g. brochure title + body in story) | **Body only** | — | Full passage (may be long; same narrator-style panel) |

**Separator:** One newline character (`\n`) between line 1 and line 2 when the two-line layout applies.

**Examples (conceptual):**

```text
# Narrator — scene 01 quest-01
Benvenuto/a a Bologna.

# Game info — scene 05 quest-01
Durante il gioco completerai diversi compiti per la scuola…

# NPC — scene 02 quest-02
Prof.ssa Ricci
"Buongiorno a tutti! Bentornati! …"

# Player monologue — scene 04 quest-02
Tu
Tutti mi guardano. Devo raccontare qualcosa anch'io delle mie vacanze...

# Player reply (was [Risposta del giocatore]) — scene 03 quest-04
Tu
Sì, sono appena arrivato/a. Studio al Liceo Galvani.
```

**Italian copy:** Task and story wording from the raw file stays **verbatim** (spelling, punctuation, o/a variants).

### 1.2 Web display

- `StoryPanel` renders `content.text` in the story panel (same component for all `info` scenes).
- Authors encode line breaks with `\n` in JSON — **catalog/API: OK**.
- **Current gap:** a single `<p>` collapses `\n` in the browser; two-line NPC / `Tu` copy does not show as intended until `StoryPanel` gets `whitespace-pre-line` (or a two-`<p>` split). See overview [§ Story text — two-line layout](./chapter-01-implementation-overview.md#story-text--two-line-layout-n).

### 1.3 Mapping from raw tags

| Raw | → Scenes | Text format |
| --- | -------- | ------------- |
| `[Narratore]` | 1 scene per block | Body only |
| `[Info di gioco]` | 1 scene per block | Body only |
| `[Prof.ssa Ricci]`, `[Chiara]`, `[Tonio]`, … | 1 scene per block | Name + `\n` + dialogue |
| `[SMS — Matteo, …]` | 1+ scenes as needed | `Matteo` (or agreed short label) + `\n` + SMS prose |
| `[Monologo interiore]` | 1 scene per block | `Tu` + `\n` + text |
| `[Risposta del giocatore]` | 1 scene per block | `Tu` + `\n` + line |

Do **not** put raw bracket tags (`[Narratore]`, etc.) into `content.text` unless the content team wants them visible.

---

## 2. Task scenes

Unchanged from overview: `scene_type: "task"` + implemented `screen_type`; exercise copy **verbatim** in `content.task` (and `referenceDocument` where used). See overview § task mapping.

**`referenceDocument`:** Brochure (bar act) — full brochure in `body`; tasks keep documento while exercising.

---

## 3. Quest structure & progression

See [overview § Chapter structure](./chapter-01-implementation-overview.md#chapter-structure-proposed).

**Chapter 01 quests:** `quest-01` … `quest-04` (acts 1.0–1.3) + `quest-01-bonus`.

**Map outros (raw):** Not used — see overview [§ Settled decisions](./chapter-01-implementation-overview.md#settled-decisions) (`quest-03` scene 06, `quest-04` scene 16 = new Italian transitions).

**Draft task scoring:** overview [Draft scoring](./chapter-01-implementation-overview.md#draft-scoring-placeholder-for-json) (team rebalance later).

**JSON skeleton (next):** overview [§ JSON skeleton & background assets](./chapter-01-implementation-overview.md#json-skeleton--background-assets-next-step) — chapter + quest + scene `background` keys; PNGs optional until art pass.

Bar EN–IT matching (quest-04 scene 10) is **in scope** — see overview quest-04 table.

---

## 4. JSON authoring checklist (per story scene)

1. Correct `id`: `chapter-01-{questId}-scene-{NN}` matching filename.
2. `content.text` follows §1.1 for that beat type.
3. `background` key placeholder until art pass.
4. No `scoring` on story scenes.

---

## 5. Document history

- 2026-06-03 — Links to map-outro reminder + draft scoring in overview.
- 2026-06-03 — Four main quests + bonus only.
- 2026-06-03 — Story `content.text` conventions (narrator / NPC+name / Tu / game info).
- 2026-06-03 — Initial plan stub; screen map in overview.
