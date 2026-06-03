---
name: product
description: |
  Domain knowledge for the language-learning game from the learner and product perspective:
  Italian for children (gifted-education school), sequential chapter/quest progression, task variety,
  image-driven UI, mascot rewards, research study context, privacy posture. Use when deciding UX,
  copy, pacing, difficulty, task design, or explaining what players experience—not for implementation
  details (see AGENTS.md).
---

# Product knowledge (user perspective)

## Overview

An **LLM-supported Italian learning game** for **children** in a **gifted-education school**, built as part of the **TUM IT-based learning** course. The experience is a **browser game**: a **sequential** journey through chapters and quests on a **city-map** hub, with **large language models** used only for **a small subset** of tasks (short free-text checks). Most interactions stay **predictably checkable** on the server.

Canonical **technical** contracts live in `AGENTS.md`. The **browser shell** (login, menu, chapter map, leaderboard, quest play with pause/documento) ships on the web branch; **multiple choice**, **matching**, and **drag & drop** have full exercise UIs—other task types still use placeholders until rolled out. UI structure: `docs/web-game-ui-architecture.md`. Deferred milestones: `.cursor/plans/long-term-todos.md`.

## Who it is for

- **Players:** School-age children learning **Italian** in class (content ties to textbook and teacher-prepared material).
- **Stakeholders:** Teacher and content team align structure and tasks; the product must support **research** (game run plus pre/post measures) with a sound rationale for **task types** and **content**.

## Game structure (progression)

Play is **strictly sequential**:

- **Chapters** unlock one after another; a player must **finish a chapter** before the next opens.
- Within a chapter, **quests** unlock in order; quest **N+1** stays locked until quest **N** is complete.
- A **chapter** is an ordered list of **quests**. At the end of a chapter there may be **optional bonus quests**—extra **pizza slices**, but **not required** to unlock the next chapter.

Each **quest** has a story arc and an ordered list of **steps**. A step is the **atomic** unit of play.

### Step model (authoring mental model)

Each step is defined by JSON with:


| Field         | Role                                                                  |
| ------------- | --------------------------------------------------------------------- |
| `scene_type`  | `story` (narrative) or `task` (exercise)                              |
| `screen_type` | `info` for story steps, or a specific **task type** for task steps |
| `content`     | Type-specific payload (story beats, prompts, options, etc.)           |
| `background`  | Background image for this step                                        |
| `scoring`     | How **pizza slices** are awarded for this step (task and bonus steps) |


**Story steps** should feel continuous—minimal chrome, strong background and copy. **Task steps** show exercise UI, **«Controlla»** (check), and reward feedback where appropriate.

## What players experience

### World and flow

- **Main menu** offers **Continue** into the chapter map and a **Leaderboard** entry (rankings are optional motivation, not required to progress).
- **Chapter overview** is the main hub—not a free-roam character world.
- **Chapter tiles** show unlock state; **tap a chapter** for quest overview, then start a **quest**. On chapter and quest lists, **pizza + backpack** stay visible in the header so progress is always in sight.
- **Leaderboard:** compare progress by **total pizza slices**—**Overall** (all learners) or **Teams** (blue vs red). Players can **refresh** after playing; their own row should be easy to find without shaming low scores.
- **Inside a quest**, the UI alternates **story mode** (narrative: **Pausa**, **«Indietro»** when not on the first scene, **«Avanti»**, full-step **background**, no performance HUD) and **task mode** (short **mission title** in the header, **pizza + backpack**, optional **documento** for shared reading text, one exercise surface, **«Indietro»** + **«Controlla»**). When a task has **several questions in one scene**, the same footer uses **«Avanti»** between questions and **«Controlla»** only on the last—children should not see a second row of navigation inside the exercise.
- **Task copy (authoring):** a short **scene instruction** (what to do overall) stays above the exercise; each **question prompt** sits with its options—do not merge both into one long paragraph.
- **«Indietro»** lets children re-read the previous story beat or task setup; rewards already earned stay saved—going back is for clarity, not to undo pizza or backpack progress.
- After **«Controlla»**, a **full-screen success overlay** (not a pop-up toast) shows Italian praise, how much pizza/backpack they earned, and **«Riprova»** when the score was below the step minimum—children stay on the same scene until they pass. On **success**, the **same step background** stays visible behind the overlay until they tap **«Avanti»**—the next scene’s art appears only after they continue, so the reward moment does not jump visually.
- **Chapter and quest lists** show **locked** vs **open** missions from saved progress; locked quests are enforced server-side too, so children do not enter content that should still be closed.
- **Mission names** on lists are **short Italian titles**, not internal act numbers or `Step 2/7` in the shell.
- **Bonus quests** sit in the same list as story quests (often at the bottom), are **optional for chapter unlock**, and may be **offered** after the last main quest—children can still **Pausa** / go back.
- **Navigation menus** (main menu, chapters, classifica, login) share **Italian** chrome and consistent **background** treatment so the app feels like one product.
- **Reading-doc rule:** when one shared text applies across tasks, **documento** reopens the same passage; when tasks need different texts, **documento** follows the **active step**.

### Teams and classroom competition

- On **first account creation**, each learner is assigned **Squadra Blu** or **Squadra Rossa** automatically (balanced team sizes)—they do not pick a side.
- Teams mainly frame **leaderboard** rivalry; they do **not** gate story progress.

### Scoring and motivation (two currencies)


| Currency         | What it means for the child                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pizza slices** | **Performance**—how well they did on a **task** (or **bonus**) step. Awarded **variably** from authored **scoring** rules (e.g. more correct answers → more slices). Same answers should always yield the same slices (**fair**, server-side). Used for **leaderboard** rank and optional rewards (e.g. mascot skins). |
| **Backpack %**   | **Completion**—**0–100%** progress through the **whole game**. Increments by a **fixed** amount per **completed step**, regardless of exercise score. Reaches **100%** when everything required is done.                                                                                                               |


When a scene is authored as **scored**, rewards should come from real evaluation (no hidden auto-pass shortcuts). If a task is still placeholder-only, use **flat** rewards so feedback stays deterministic and honest for learners.

Show **pizza** and **backpack** where progress matters (chapter/quest hubs, **task** steps—not pure story beats). Keep the **main menu** visually light.

### Visual design (product framing)

The look is **image-driven**: backgrounds and UI chrome often use **sprites on buttons and panels**, not only flat color blocks. **Typography, colour, spacing, radii, shadows** stay consistent via a **central design system** and **tokens**.

**Backgrounds:**

- **Static** — hub screens (main menu, dashboard-style navigation); login and register use distinct art; switching between them should feel smooth (no flash of a blank or wrong image).
- **Dynamic** — chapter/quest overviews, story, and tasks; each screen pulls the right image from **context**. Scene-to-scene changes should crossfade gently, not cut abruptly.

Image references live throughout **content config**—chapter tiles, quest tiles, buttons, and steps—not only a single hero per screen.

### Tasks (what kids do)


| Task type                  | Player action (short)                                                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Error spotting             | Find/fix deliberate mistakes; confirm corrections.                                                                                                                                             |
| Drag & drop                | Drag word tiles from a bank into category zones (tap or drag). Several tiles can sit in one zone while sorting; **«Controlla»** works even if some zones or the bank are still empty—feedback comes from the check, not a “fill everything first” block. |
| Free text                  | Brief **Italian** answer; **language model** checks against **authored criteria**—set expectations for a short **checking** moment; failures/timeouts mean **try again**, not “almost passed”. |
| Matching                   | Pair two columns (tap a left card then a right card, or drag a line). Extra options on the right are distractors. × on a paired left card removes the link. |
| Multiple choice / gap fill | Choose options or fill gaps in readable lines (prefer **sentence-like** rows, not broken chips).                                                                                               |
| Bonus                      | Optional chapter-end activities for **extra pizza**; not required to advance.                                                                                                                  |


**Pedagogical preference:** **little free-text** where possible, for clearer scoring and control.

**Matching copy (authors):** One scene-level **instruction** in the task chrome; a distinct **prompt** above the columns if needed—avoid saying the same thing twice. The short tap/drag hint is built into the UI, not per-scene JSON.

**Drag-drop copy (authors):** Same instruction / prompt split as matching. Do not tell children they must place every card before **«Controlla»** unless pedagogy truly requires it—they may check a partial sort and get **«Riprova»** if the score is too low.

## Access and platform

- **Browser-playable**; students **log in** with **generated username + password** (teacher/org provisioning).
- UI is **click/tap-friendly** for map navigation and tasks.

## Privacy and school context (product framing)

- **No personal student data** stored; **random/generated** player names.
- Research metrics stay **non-identifying**; schools and parents need **clear information** and consent—**EU hosting** does not replace that communication.

## Research and timeline (orientation only)

- Field run and milestones may appear in `.cursor/plans/long-term-todos.md` or meeting notes; treat dates as **planning signals**, not agent-implemented schedules.
- Content process: agree **skeleton** (story, structure, categories) with teacher, then ship **task packs** aligned to the book.

## Principles for agents

When you design flows, wording, difficulty, or task presentation:

1. **Child-first, Italian-first**—clarity, encouragement, age-appropriate tone.
2. **Game feel over admin feel**—progression and feedback matter as much as correctness.
3. **Prefer deterministic UX** where the product promises a **fair, repeatable** outcome; surface LLM tasks only when the design owns softer scoring tradeoffs.
4. **LLM as backstage support** unless the experience intentionally exposes it; shell copy stays **school-trip / lesson** tone.
5. If an idea only fits a **generic enterprise app**, it is likely **wrong** here unless the user says otherwise.

## Out of scope for this skill

Implementation stack (Next.js routes, Supabase, Zod schemas, component library)—use `AGENTS.md` and the codebase.