# Apply Learnings

## Overview
Reads accumulated learnings from `LEARNINGS.md` at the repository root and applies them to update skills, commands, and project documentation. Run this periodically (for example when several learnings have accumulated) so guidance stays aligned with what the team has learned.

---

## Target Files Reference

Before applying, know where each category lands in **this** repo:

| Category | Primary Target | Secondary Target |
|----------|----------------|------------------|
| Product Feature | `AGENTS.md` (Repository overview / Tech stack — short, scannable notes) | — |
| Skills | `.cursor/skills/{skill}/SKILL.md` | `.cursor/skills/{skill}/references/` (if present) |
| Commands | `.cursor/commands/{command}.md` | — |
| Architecture | `AGENTS.md` (Architecture principles) | Relevant skill `SKILL.md` if domain-specific |
| Patterns | `AGENTS.md` (Development philosophy / key rules — only if such a section exists or you add a concise bullet there) | Relevant skill `SKILL.md` if domain-specific |
| Agent Behavior | `AGENTS.md` (Key rules, protocol sections) | — |

If `.cursor/skills/` does not exist yet, **Skills** learnings still inform you: create the skill folder only when the learning explicitly asks for a skill file, or apply the insight to `AGENTS.md` instead.

---

## Process

### Step 1: Read and Analyze Learnings
1. Read `LEARNINGS.md` — entries present are pending application (remove each entry entirely once applied; see Step 5)
2. Group learnings by category:
   - **Product Feature**: User-facing behavior or capability worth indexing
   - **Skills**: Guidance that belongs in a specific skill
   - **Commands**: Behavior or structure of a slash command in `.cursor/commands/`
   - **Architecture**: Structural decisions about Unity vs Next.js, integration, layers
   - **Patterns**: Conventions to follow consistently
   - **Agent Behavior**: Rules for how the agent should act in a class of situations

### Step 2: Present Summary
```
Found X pending learnings:

Product Features (N):
- [title] → AGENTS.md

Architecture (N):
- [title] → AGENTS.md [+ skill if applicable]

Patterns (N):
- [title] → AGENTS.md [+ skill if applicable]

Skills (N):
- [title] → .cursor/skills/[skill]/SKILL.md

Commands (N):
- [title] → .cursor/commands/[command].md

Agent Behavior (N):
- [title] → AGENTS.md
```

### Step 3: Ask for Selection
"Which would you like to apply? (all / product-features / skills / commands / architecture / patterns / agent-behavior)"

### Step 4: Apply by Category

#### Product Feature
1. Read `AGENTS.md`
2. Add a short, scannable note under **Repository overview** or **Tech stack** — what exists, where it lives (`Assets/...`, `LLM Test Integration/...`), and non-obvious behavior
3. Avoid long prose; this is an index for agents, not a user manual unless the user asks for one
4. Show what was added

#### Skills
1. Read the learning's **Action** field to identify which skill
2. Read `.cursor/skills/{skill}/SKILL.md` and any relevant `references/` files — create the skill folder only if warranted
3. Apply updates: quick-start and rules in `SKILL.md`; long material in `references/`
4. Show what was changed

#### Commands
1. Identify the target command from the learning's **Action** field
2. Read `.cursor/commands/{command}.md`
3. Update or add sections, guidance, examples, rules
4. Show what was changed

#### Architecture
1. Read `AGENTS.md` — update **Architecture principles** (or the closest matching section)
2. Capture the decision and rationale briefly
3. If the learning is domain-specific and a skill exists, also update `.cursor/skills/{skill}/SKILL.md`
4. Show what was changed

#### Patterns
1. Read `AGENTS.md` — add or refine a concrete, actionable convention (keep it short)
2. If a domain skill exists (e.g. Unity-specific), mirror there when helpful
3. Show what was changed

#### Agent Behavior
1. Read `AGENTS.md` — **Key rules** or **3-phase response protocol** as appropriate
2. Add or update a specific rule tied to a class of situations
3. Show what was changed

---

### Step 5: Remove Applied Learnings
After applying, **remove each applied entry entirely from `LEARNINGS.md`**. The knowledge should live in the target files so one source stays authoritative.

### Step 6: Confirm and Summarize
```
Applied X learnings:

✅ AGENTS.md — [what changed]
✅ .cursor/skills/.../SKILL.md — [what changed]
✅ .cursor/commands/....md — [what changed]

Removed X entries from LEARNINGS.md.
```

---

## Guidelines

**Before applying:**
- Read the full learning — understand context and intent, not only the title
- Check if the target already contains equivalent content — don't duplicate
- Check for conflicts with existing rules — flag conflicts to the user before proceeding

**When applying:**
- Be precise — update exactly what the learning specifies, nothing more
- Preserve existing content — add or refine, don't remove unrelated material
- Keep entries concise — docs should stay readable

**After applying:**
- Remove every applied entry from `LEARNINGS.md`

---

## Notes
- Some learnings span multiple categories — update every relevant target
- If **Action** points to a path that does not exist yet, create it only when clearly warranted
- If a learning is ambiguous, ask the user for clarification before applying
- An empty `LEARNINGS.md` after applying is fine — it means pending items were absorbed
