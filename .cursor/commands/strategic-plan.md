# Strategic Foundation

## Overview
Build a solid requirements foundation through structured conversation before entering planning mode. The output is a **single, decided document** — not a list of options. All trade-offs and approach decisions happen in the conversation. By the time the document is written, the direction is confirmed.

**Purpose**: Capture WHAT needs to be built, WHY, and HOW (the decided approach) — serving as the direct input for Cursor's planning mode.

---

## When to Use

**USE for:**
- Complex features that need thorough requirements analysis
- Ambiguous requests that need clarification
- High-impact changes that touch both Unity and the Next.js app, or multiple subsystems
- Before entering planning mode

**DON'T USE for:**
- Simple bug fixes or obvious single-file changes
- Well-defined tasks where requirements are already clear

---

## Conversation Philosophy

- **Understand first** — read existing code and patterns before asking anything
- **User perspective first** — always frame requirements from what the user sees and does, not only what the system does internally
- **Decide in conversation** — discuss options and trade-offs with the user, reach a decision, then document only the chosen approach
- **No options in the document** — the foundation doc represents confirmed decisions, not a menu of choices
- **Evidence-based** — reference existing code, patterns, and conventions in this repo (`Assets/`, `ProjectSettings/`, `LLM Test Integration/`, `AGENTS.md`)
- **Proportional depth** — match thoroughness to complexity, don't over-document simple work
- **Be concise** — ask focused questions, don't repeat what the user already said

---

## Conversation Phases

### Phase 1: User Problem & Intent
**Goal**: Understand what the user is actually experiencing and why this matters

Ask:
- What problem does the user face today? (what's broken, missing, or frustrating)
- What does the user expect to happen instead?
- What triggers this need right now?
- How does this fit into broader goals for the game or the integration app?
- What's the core requirement vs a nice-to-have?

**Frame everything from the user's perspective** — not only the system's. "The player can't …" or "The web screen doesn't …" is more useful than jumping to implementation.

---

### Phase 2: User Experience & Flows
**Goal**: Define what the user will see, do, and feel

Explore:
- Which user flows are affected or created? (in-game, in-browser, or both)
- What does the happy path look like step by step?
- What do users expect when things go wrong? (errors, empty states, loading)
- Input methods: keyboard, gamepad, pointer — what matters for this work?
- What makes this feel fast and natural vs slow and clunky?

**Produce**: A clear description of the user journey — the document's UX section comes from this.

---

### Phase 3: Scope & Constraints
**Goal**: Define hard boundaries so planning mode doesn't over-build

Clarify:
- What is explicitly IN scope?
- What is explicitly OUT of scope?
- What existing patterns and conventions must this follow? (`AGENTS.md`, Unity project layout, Next app structure)
- What are the dependencies on other features or in-progress work?
- What are the timeline or effort constraints?

---

### Phase 4: Engineering Pillars Analysis
**Goal**: Identify which parts of this repo are touched and what each needs

Before documenting, walk through each pillar and assess whether it's relevant. For relevant pillars, explore the specific requirements and decisions needed. **Skip pillars that do not apply** and say so briefly in the foundation doc.

**Unity (game client)**
- Scenes, prefabs, ScriptableObjects, or new C# scripts under `Assets/`?
- Input (`InputSystem_Actions.inputactions`) or gameplay loop changes?
- Rendering/URP settings, layers, sorting, or camera behavior?
- Build settings or platform constraints (`ProjectSettings/`)?

**Next.js (`LLM Test Integration/`)**
- App Router routes, layouts, or server/client components?
- New UI, forms, or client-side behavior?
- Styling approach (`app/globals.css` and any new styles)?
- Environment variables or calls to external HTTP APIs?

**Integration between game and web**
- Is data exchanged (REST, deep links, files, manual copy-paste)? Who owns the contract?

**Data & persistence** *(only if relevant)*
- Player prefs, local files, cloud saves, or server-backed state — what is stored where?

**Error Handling**
- What can go wrong at each layer (network, validation, Unity exceptions, missing assets)?
- What does the user see for each failure mode?

**Security** *(only if relevant)*
- Untrusted input, tokens, or user-generated content — what must be validated or isolated?

**Performance**
- Frame budget / Unity performance expectations?
- Web: initial load, interaction latency, large assets?

---

### Phase 5: Approach Decision
**Goal**: Reach a single confirmed direction before writing the document

- Present viable approaches only if there is genuine ambiguity
- Discuss trade-offs directly with the user
- **Reach a decision** — the document records the chosen approach only
- Surface and validate any critical assumptions
- Identify known risks and their mitigations

---

## Output Document

**Only create a foundation document for complex work** that will use planning mode next. Simple or well-scoped tasks don't need a file.

**Filename**: `.cursor/plans/{feature-name}-foundation.md`  
(Create the `.cursor/plans/` folder if it does not exist.)

---

### Document Structure

```markdown
# [Feature Name] — Requirements Foundation

> **Purpose**: [One sentence — what this feature does for the user and why it's being built]

## Problem Statement
[What the user experiences today that this fixes. Framed from the user's perspective.]

---

## Confirmed Decisions
| Question | Decision |
|----------|----------|
| [Key decision 1] | [What was decided and brief rationale] |
| [Key decision 2] | [What was decided and brief rationale] |

---

## User Experience

### User Flows
[Step-by-step description of the key user journeys — what they see and do]

### Empty / Loading / Error States
[What the user sees in each non-happy-path situation]

### User Expectations
[What users expect — speed, feedback, confirmation, etc.]

---

## Scope

### In Scope
- [Explicitly what will be built]

### Out of Scope
- [Explicitly what will NOT be built]

---

## Engineering Design

### Unity
[Scenes, scripts, input, rendering — only if applicable; otherwise "N/A"]

### Next.js app
[Routes, components, styling, env — only if applicable; otherwise "N/A"]

### Integration
[How game and web relate for this feature — only if applicable; otherwise "N/A"]

### Data & persistence
[Only if applicable; otherwise "N/A"]

### Error Handling
[Failure modes at each layer, what the user sees, fallbacks]

### Security
[Only if applicable; otherwise "N/A"]

### Performance
[Targets and risks for Unity and/or web — only what matters for this feature]

---

## Validated Assumptions
| Assumption | Status | Fallback |
|-----------|--------|----------|
| [Assumption] | ✅ Validated / ⚠️ Needs check / ❌ Invalid | [Plan if wrong] |

---

## Identified Risks
| Risk | Mitigation |
|------|------------|
| [Risk] | [Strategy] |

---

## Success Criteria
- [ ] [User-facing outcome — what the user can now do]
- [ ] [Stability or performance bar, if relevant]
- [ ] [Edge case handled]

---

## Implementation Areas (for planning mode)
[Ordered list of areas that need work — scope signal for planning mode, not full implementation detail]
1. [Area 1]
2. [Area 2]
```

---

## Guidelines

**DO:**
- Read existing code before asking questions — don't ask what you can look up
- Frame everything from the user's perspective first, then translate to technical requirements
- Discuss and decide approach in conversation — document only the chosen direction
- Walk through each engineering pillar and consciously include or skip each one
- Reference existing patterns in this codebase
- State assumptions explicitly and validate them during the conversation
- Be concise — one focused question beats five generic ones

**DON'T:**
- Put multiple solution options in the document — decide first, document after
- Skip the pillars assessment — even pillars that don't apply should be consciously marked N/A
- Focus on HOW to implement before confirming WHAT and WHY
- Over-document simple work — if requirements are clear, go straight to planning mode
- Repeat information the user already provided
- Let assumptions stay hidden — surface and validate them

---

## Transition to Planning Mode

Once the foundation document is complete, confirm:

> "This foundation is ready for planning mode. The approach is confirmed, the touched areas of this repo are mapped, and the document can be used directly as input. Would you like to proceed to Cursor's planning mode?"
