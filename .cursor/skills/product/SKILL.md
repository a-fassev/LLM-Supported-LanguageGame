---
name: product
description: |
  Domain knowledge for the language-learning game from the learner and product perspective:
  Italian for children (gifted-education school), city-map quests, task variety (incl. composite
  special screens), mascot rewards, research study context, privacy posture. Use when deciding UX,
  copy, pacing, difficulty, task design, or explaining what players experience—not for implementation
  details (see AGENTS.md).
---

# Product knowledge (user perspective)

## Overview

An **LLM-supported Italian learning game** for **children** in a **gifted-education school**, built as part of the **TUM IT-based learning** course. Unity delivers a **playable, map-based** experience; **large language models** support **a small subset** of interactions so teaching and checking Italian feel **varied and responsive**, while most tasks stay **predictably checkable**.

Canonical **technical** contracts live in `AGENTS.md`; **task-type orientation** is summarized in this skill. Deferred milestones and backlog anchors: `.cursor/plans/long-term-todos.md`. Older root-level requirement markdown files were removed—confirm specifics with the team or meeting notes when needed.

## Who it is for

- **Players:** School-age children learning **Italian** in class (content ties to textbook and teacher-prepared material).
- **Stakeholders:** Teacher and content team align structure and tasks; the product must support **research** (game run plus pre/post measures) with a sound rationale for **task types** and **content**.

## What players experience

### World and flow

- **Main menu** offers **Continue** into the chapter map and a **Leaderboard** entry (rankings are optional motivation, not required to progress).
- **Chapter overview** as the main hub—not a free-roam character hub.
- **Chapter cards/buttons** drive progression visibility via unlock rules.
- **Tap a chapter** to open quest overview, then start a **quest**; quests **chain** (finishing one unlocks the next).
- **Leaderboard:** children can compare progress by **total pizza slices**—**Overall** (all learners) or **Teams** (blue vs red standings). They can **refresh** the list to see updated ranks after playing. Their own row should feel findable (rank / highlight), without shaming low scores.
- **Inside a quest**, children move through **steps** in one **`Quest` scene**, but the UI switches between two modes: **task mode** (exercise chrome: quest title, **pizza/backpack** totals, optional **documento** button, **«Controlla»**) and **story mode** (full-screen narrative: **Pausa** + **«Avanti»** only—no wallet or quest title so the scene feels like one continuous story card). **Task and story steps** can show a **full-scene background image** (authored per step) so city/quest mood stays consistent without rebuilding layout. Cutscenes can show several beats in one row (narrator, NPC speech, inner thoughts, game-info hints) before the next task. **Story beats with characters:** the learner’s thoughts appear as a **thought bubble on the right** with their **avatar on the left**; **NPC dialogue** uses a **speech bubble on the left** and the **NPC portrait on the right** (placeholder art until final portraits ship). **Pausa** is available in both modes; the **documento** appears only during **tasks**, not during pure story beats. **Navigation menus** (main menu, chapters, classifica, login) use the same Italian chrome and background treatment so the app feels like one product, not a prototype mix of languages. Some quests may **block leaving** or **continue straight into the next quest** when the story requires it; otherwise **back to chapters** stays available so children do not feel trapped in homework mode.

### Teams and classroom competition

- On **first account creation**, each learner is placed automatically on **Team Blue** or **Team Red**—they **do not pick** a side; the game keeps teams **roughly equal** in size.
- Copy after signup can name their team once (friendly, not political); leaderboard **Teams** view is where class rivalry should feel visible.
- Team assignment is **not** a gate for quests—children can always continue the story; teams mainly frame **leaderboard** motivation.

### Mascot and motivation

- Mascot can be **lightweight** (e.g. **static in a corner**), not a full controllable avatar.
- **Rewards (reference: Essen project)** — distinct roles for children and copy:
  - **Pizza slices:** **Practice / encouragement** loot—shows **how well the step went** in the moment (often **whole slices**, sometimes **fewer slices** when the child only got part of the exercise right). The **game server** applies the teacher-authored rules so the same answers **always** produce the same slice count—play stays **fair** and predictable. Slices support unlocking **mascot skins** in the avatar shop and can recur on **replay** so repetition still feels supported.
  - **Backpack pieces:** **Milestone / mastery** loot—conceptually tied to **first-time success on a distinct task**, not infinite grinding on repeats. Messaging and tutorials must not imply endless backpack gains from redoing one activity forever.
  - **Where totals appear:** show balances on **ChapterOverview**, during **task steps inside a quest** (not on cutscene/story-only beats), and in **AvatarShop**; keep the **main menu** visually light (players land there to continue—full wallet HUD belongs with exploration/customization flows). **Leaderboard** uses pizza totals as the **ranking score** (not backpack pieces).
  - **Composite special screens:** a step may mix **real exercises** (e.g. gaps, error spotting) with **story-only** pieces; children should still feel **one quest**, but **pizza** should only reflect **actual language work**—**stub** / layout blocks alone should not feel like “jackpot” pizza.
  - Optional **expressions** by situation remain nice-to-have.
- **Visual direction** (not final): e.g. **lion** (Bologna) or neutral **boy/girl** school-trip style.

### Tasks (modularity)

- Task types are **modular** (e.g. drag-and-drop): swap **texts and content** without rebuilding core mechanics.
- **Pedagogical preference:** **little free-text** input where possible, for clearer scoring and control.
- **LLM use** is **intentionally narrow**—today that means **short Italian writing checked against clear criteria**; most tasks are **fixed, deterministic** checks on the server.
- **Special screens** dress several small mechanics inside **one believable frame** (e.g. **phone chat**, **email/letter**, **photo strip**, **magazine-style reader**). Learners may tap **«→»** to move between parts, then **«Controlla»** (and sometimes an in-frame **send** on mail) so pacing still feels like **one quest**, not a pile of worksheets.

## Task categories (what kids do)

**Implemented today — mostly deterministic (no LLM scoring):**

| Category | Player action (short) |
|----------|------------------------|
| Error spotting | Find/fix a deliberate mistake; mark segments and confirm corrections. |
| Drag & drop | Order fragments, fill gaps, match pronouns/referents, sort into categories. |
| Cloze | Fill gaps; typically **closed answers** / accepted solutions (incl. pickers where authored). |
| Matching | Pair columns (words/meanings, clauses, pictures/terms, etc.). |
| Multiple choice | Choose correct option(s) from stems that can mix **text**, **image**, and **audio**. |
| Special screen (composite) | **Chat**, **mail/letter**, **photo gallery/slideshow**, or **reader** chrome wrapping the same core mechanics (e.g. cloze / error spotting) in a story context; often **multi-part** with clear arrows between parts. |

**LLM-assisted (use sparingly; copy must set expectations):**

| Category | Player action (short) |
|----------|------------------------|
| Short free writing (scored) | Brief **Italian** answer; server-backed check against **authored criteria** (learners should understand there can be a short **“checking”** moment before feedback—avoid implying instant magic). |
| Relative-clause puzzle *(planned / not shipped as a dedicated screen yet)* | Describe a target **without naming it**, using relative clauses; model-guided guessing—**teacher sign-off** before exposing widely. |

The **final menu** of task types may still change with **feasibility** and **teacher sign-off**.

## Access and platform

- Target: **browser-playable** build; students **log in** with **generated username + password**—align login UX with teacher/org provisioning flows agreed outside the codebase.
- UI should be **click/tap-friendly** for map navigation and tasks.

## Privacy and school context (product framing)

- **No personal student data** stored; **random/generated** player names.
- Metrics may exist for research but must stay **non-identifying**; schools and parents need **clear information** and consent—**EU hosting** does not replace that communication.

## Research and timeline (orientation only)

- Field run and milestones (e.g. school week, “feature-complete” target) may appear in `.cursor/plans/long-term-todos.md` or meeting notes; treat dates as **planning signals**, not agent-implemented schedules.
- Content process: agree **skeleton** (story, structure, categories) with teacher, then ship **task packs** aligned to the book.

## Principles for agents

When you design flows, wording, difficulty, or task presentation:

1. **Child-first, Italian-first**—clarity, encouragement, age-appropriate tone; gifted learners still need **accessible** UI.
2. **Game feel over admin feel**—motivation, progression, and feedback matter as much as correctness.
3. **Prefer deterministic UX** where the product promises a **fair, repeatable** outcome; surface LLM-based tasks only when the design **owns** the softer scoring tradeoffs (and when **Controlla** feedback can stay **encouraging** even if wording is model-shaped).
4. **LLM as backstage support** unless the experience intentionally exposes it to the child; **Italian shell copy** and **special-screen fiction** (chat, mail, reader) should still read as **school-trip / lesson** tone, not generic chatbot.
5. If an idea only fits a **generic enterprise app**, it is likely **wrong** here unless the user says otherwise.

## Out of scope for this skill

Implementation stack (Unity scenes, Next.js auth API, Azure, etc.)—use `AGENTS.md` and the codebase.
