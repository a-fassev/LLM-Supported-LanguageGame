# Long-term TODOs

> **Purpose:** Work intentionally deferred from the Unity 2D foundation milestone; tackle iteratively in later phases.  
> **Reference:** *Out of Scope* in [unity-2d-grundgeruest-foundation.md](unity-2d-grundgeruest-foundation.md).

---

## Gameplay and task design

- [ ] **Per-task-type mechanics** — Rules, interaction patterns, and win/lose conditions for each level type (e.g. error spotting, drag-and-drop, cloze, matching, multiple choice, free text, relative clauses — final list per product spec).
- [ ] **Content pipeline** — Authoring format, loading, localization (Italian learning goals), and validation so designers can add tasks without code churn.

## Assessment and feedback

- [ ] **Scoring model** — Decide and document deterministic checks vs. LLM-assisted evaluation per task type.
- [ ] **LLM integration (if used)** — Server-side API only; prompt/contract, timeouts, fallbacks, and child-appropriate tone for hints and feedback.
- [ ] **Player-facing feedback** — Clear correctness signals, retries, and optional explanations without overwhelming young learners.

## Progression and the city map

- [ ] **Unlock rules** — Which pins or levels appear when; optional chapter or topic grouping.
- [ ] **Progress storage** — What to persist locally vs. server-side; conflict handling if multi-device.
- [ ] **Map UX** — Visual state for locked/unlocked/completed; optional star ratings or replay affordances.

## Identity, backend, and data

- [ ] **Authentication** — Whether login is required; roles (learner, teacher) if applicable.
- [ ] **Backend and APIs** — Progress sync, assignments, or class context as needed.
- [ ] **Data and compliance** — Privacy (school context), retention, and consent flows.
- [ ] **Telemetry and analytics** — Event schema, dashboards, opt-out; no secrets in the client.

## Audio, animation, and polish

- [ ] **Audio** — Music, UI SFX, and feedback sounds; mixing and accessibility (levels, mute).
- [ ] **Animation** — Character and UI motion for clarity and delight without distraction.
- [ ] **UX polish** — Typography, spacing, loading/empty/error states, and input accessibility.
- [ ] **Cosmetics** — Optional skins or unlockables tied to progression or achievements.

---

*Reorder or group by milestone when planning releases.*
