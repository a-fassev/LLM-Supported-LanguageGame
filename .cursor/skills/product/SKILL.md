---
name: product
description: |
  Use when work should stay aligned with the product’s purpose: an LLM-supported game that teaches
  and checks Italian for children in a gifted-education (Hochbegabten) school context, as part of the
  TUM IT-based learning course. Triggers: product intent, UX, learning goals, tone for kids, what we
  are building for users (not implementation).
---

# Product context (user perspective)

## Who is behind this

The project comes from the **IT-based learning course at TUM (Technical University of Munich)**. The team is building a **learning game**, not a generic chat app or admin dashboard.

## Who it is for

- **Primary users:** **Children** in a **gifted-education school** (*Hochbegabten-Schule*) setting.
- **Subject:** **Italian** — the experience should help them **learn** the language and/or **check what they already know** (practice and assessment woven into play).

## What we are building (in plain language)

A **game** that uses **large language models** as part of the experience so that Italian teaching and quizzing feel **interactive, varied, and responsive**—like something you play, not a dry vocabulary sheet.

From the **learner’s point of view**, success means:

- They **play** and **stay motivated**.
- They **encounter Italian** in situations that make sense for children (clear, respectful, age-appropriate).
- They get **feedback** that helps them understand whether they are right or wrong and what to try next.
- The experience supports both **building new knowledge** and **showing what they know** (not only one or the other).

## What this skill is for (for agents)

When you plan features, copy, difficulty, or flows:

1. **Anchor on children and Italian learning** — not on the tech stack.
2. **Prefer clarity and encouragement** over complexity; gifted learners still deserve accessible UX.
3. **Treat the LLM as invisible support** for pedagogy and interaction unless the product explicitly surfaces it to the child.
4. If a decision would only make sense for a **generic enterprise app**, it is probably **wrong for this product** unless the user says otherwise.

## Out of scope for this skill

This file does **not** prescribe Unity vs. Next.js, APIs, or hosting. Use `AGENTS.md` and codebase conventions for that. Here we only hold **who we serve** and **why the product exists**.
