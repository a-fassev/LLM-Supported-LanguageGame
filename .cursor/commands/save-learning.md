# Save Learning

## Overview
Extract high-value learnings from the current conversation and save them to `LEARNINGS.md` at the repository root. Learnings are later applied via `/apply-learnings` to update skills, commands, and `AGENTS.md`.

**This command has a high bar.** Not every conversation produces a learning worth saving. Only save things that are relevant to the whole codebase, architectural decisions, or meaningful capabilities — not small corrections or one-off fixes.

---

## Relevance Gate — Do This First

Before saving anything, ask: **Would this be useful to know months from now when working on a different part of this repo?**

**Save if:**
- A meaningful capability was added that others need to discover (Unity, Next.js, or how they relate)
- An architectural decision was made that affects how later work should be done
- A pattern was established that should be followed consistently
- A non-obvious constraint, integration behavior, or limitation was discovered
- A skill, command, or agent behavior was corrected in a way that affects future work broadly
- A significant technical approach was chosen over alternatives (include the "why")

**Don't save if:**
- It's a small bug fix with no broader implication
- It's a one-time correction that only applies to that specific situation
- It's already documented in `AGENTS.md` or an existing skill
- It's obvious from the code itself
- It's a minor wording or style change
- The conversation produced no lasting insight

**If nothing is worth saving, say so clearly.** Don't pad `LEARNINGS.md` with noise.

---

## Process

### Step 1: Assess What's Worth Saving
Review the conversation and identify:
- Was a notable capability built? → **Product Feature**
- Was an architectural decision made? → **Architecture**
- Was a pattern established or discovered? → **Patterns**
- Was a skill/command/agent behavior corrected in a meaningful way? → **Skills / Commands / Agent Behavior**
- Was a non-obvious technical constraint discovered? → **Architecture** or **Patterns**

If none of the above apply → **do not save; tell the user**

### Step 2: Format the Learning

```markdown
### [Short descriptive title] - [Date: YYYY-MM-DD]

**Category**: [Product Feature | Architecture | Patterns | Skills | Commands | Agent Behavior]

**Context**: [1-2 sentences — what was being built or what problem was encountered]

**Learning**: [2-4 sentences — the key insight, decision, or capability. Enough context to be useful without re-reading the conversation]

**Action**: [What to update when applying — e.g. AGENTS.md section, `.cursor/commands/foo.md`, `.cursor/skills/bar/SKILL.md`]

---
```

**Categories:**
- **Product Feature**: What the user or player gets; where it lives (`Assets/...`, `LLM Test Integration/...`)
- **Architecture**: Responsibilities, boundaries, data flow between Unity and the web app
- **Patterns**: Conventions for C#, TypeScript, scenes, or React components in this repo
- **Skills**: Updates to a specific skill file under `.cursor/skills/`
- **Commands**: Updates to a file under `.cursor/commands/`
- **Agent Behavior**: Repeatable rule for how the agent should act in a class of situations

### Step 3: Append to LEARNINGS.md
- Read the existing `LEARNINGS.md` file at the repo root (create it if missing)
- Add new learnings at the **TOP** (most recent first)
- Preserve existing entries that are not duplicates
- Use the exact format above

### Step 4: Confirm
- Tell the user what was saved (brief preview)
- Or explain why nothing was worth saving

---

## Example Entries

### Product Feature Example:
```markdown
### In-game pause overlay — 2026-04-15

**Category**: Product Feature

**Context**: Added a pause flow triggered from the new Input System action map.

**Learning**: Pause is handled in `Assets/Scripts/...` (example path) and uses Time.timeScale; UI uses a Canvas in `SampleScene`. Other scenes must register the same pause handler or use a persistent bootstrap if we add more levels.

**Action**: When extending pause behavior, follow the same Input System binding and document new scenes in AGENTS.md overview.

---
```

### Architecture Example:
```markdown
### LLM calls only from Next.js route handlers — 2026-04-20

**Category**: Architecture

**Context**: Decided where API keys and model calls may live for the integration app.

**Learning**: Keys and outbound HTTP to the language API stay in `LLM Test Integration` server code (Route Handlers / server actions), not in Unity. The game client should not embed provider secrets.

**Action**: Apply this boundary in AGENTS.md Tech stack / integration notes; any new bridge should keep secrets on the Next.js side.

---
```

### Pattern Example:
```markdown
### TypeScript: prefer explicit return types on exported hooks — 2026-04-10

**Category**: Patterns

**Context**: Several hooks in the Next app had unclear return shapes for callers.

**Learning**: Exported hooks under `LLM Test Integration/app` use explicit return types so call sites and refactors stay safe.

**Action**: Add a short bullet under AGENTS.md or the relevant skill; follow the same pattern for new hooks.

---
```

---

## Notes
- Use today's date in `YYYY-MM-DD` format
- **Product Feature** entries should name real paths in this repo when possible
- **Architecture** entries should capture why a decision was made, not only what was done
- If a learning duplicates `AGENTS.md`, update `AGENTS.md` directly instead of appending to `LEARNINGS.md`
