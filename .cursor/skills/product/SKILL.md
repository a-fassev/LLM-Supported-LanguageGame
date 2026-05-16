---
name: product
description: |
  Domain knowledge for the language-learning game from the learner and product perspective:
  Italian for children (gifted-education school), city-map quests, task variety, mascot rewards,
  research study context, privacy posture. Use when deciding UX, copy, pacing, difficulty, task
  design, or explaining what players experience—not for implementation details (see AGENTS.md).
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

- **Chapter overview** as the main hub—not a free-roam character hub.
- **Chapter cards/buttons** drive progression visibility via unlock rules.
- **Tap a chapter** to open quest overview, then start a **quest**; quests **chain** (finishing one unlocks the next).

### Mascot and motivation

- Mascot can be **lightweight** (e.g. **static in a corner**), not a full controllable avatar.
- **Rewards (reference: Essen project)** — distinct roles for children and copy:
  - **Pizza slices (~0–3 per task outcome):** **Practice / encouragement** loot—shows performance in the moment, supports unlocking **mascot skins** in the avatar shop, and can recur when learners **replay** the same tasks so repetition still feels supported.
  - **Backpack pieces:** **Milestone / mastery** loot—conceptually tied to **first-time success on a distinct task**, not infinite grinding on repeats. Messaging and tutorials must not imply endless backpack gains from redoing one activity forever.
  - **Where totals appear:** show balances on **ChapterOverview**, inside **quests (quest shell)**, and in **AvatarShop**; keep the **main menu** visually light (players land there to continue—full wallet HUD belongs with exploration/customization flows).
  - Optional **expressions** by situation remain nice-to-have.
- **Visual direction** (not final): e.g. **lion** (Bologna) or neutral **boy/girl** school-trip style.

### Tasks (modularity)

- Task types are **modular** (e.g. drag-and-drop): swap **texts and content** without rebuilding core mechanics.
- **Pedagogical preference:** **little free-text** input where possible, for clearer scoring and control.
- **LLM use** is **intentionally narrow** at first—expand only where justified; many types are **fixed, deterministic** checks on the backend.

## Task categories (what kids do)

**Mostly deterministic (no LLM):**

| Category        | Player action (short) |
|----------------|------------------------|
| Error spotting | Find/fix a deliberate mistake in a sentence or short text. |
| Drag & drop    | Order fragments, fill gaps, match pronouns/referents, sort into categories. |
| Cloze          | Fill gaps; often **multiple choice** or **closed answers** against accepted solutions. |
| Matching       | Pair columns (words/meanings, clauses, pictures/terms, etc.). |
| Multiple choice | Choose correct option (reading, listening, grammar, culture). |

**LLM-assisted (use sparingly, higher evaluation risk):**

| Category              | Player action (short) |
|-----------------------|------------------------|
| Free text (scored)    | Short open answer; model scores vs **predefined criteria** (e.g. target structure present). |
| Relative-clause puzzle | Describe a target **without naming it**, using relative clauses; model guesses within **1–3 tries**. |

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
3. **Prefer deterministic UX** where the product promises a **fair, repeatable** outcome; surface LLM-based tasks only when the design **owns** the softer scoring tradeoffs.
4. **LLM as backstage support** unless the experience intentionally exposes it to the child.
5. If an idea only fits a **generic enterprise app**, it is likely **wrong** here unless the user says otherwise.

## Out of scope for this skill

Implementation stack (Unity scenes, Next.js auth API, Azure, etc.)—use `AGENTS.md` and the codebase.
