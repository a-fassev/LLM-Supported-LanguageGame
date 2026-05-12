# Create Skill

## Overview
This command guides you through creating effective Cursor skills: focused instruction files that extend the agent with project- or domain-specific workflows.

## Core Principles

**Concise is Key**: Only add context the agent does not already have. Challenge each piece: "Does the agent really need this?"

**Progressive Disclosure**: Prefer a short main skill body and link or attach deeper detail only when needed.

**Appropriate Freedom Levels**:
- **High freedom** (text instructions): Multiple approaches valid
- **Medium freedom** (pseudocode/parameters): A preferred pattern exists
- **Low freedom** (specific scripts): Operations fragile, consistency critical

## Skill Creation Process

### Step 1: Understand with Concrete Examples

Ask the user:
- What functionality should the skill support?
- Can you give examples of how this skill would be used?
- What would a user say that should trigger this skill?

**Skip only if**: Usage patterns are already clearly understood.

**Conclude when**: There is a clear sense of what the skill should cover.

### Step 2: Plan Reusable Contents

Analyze each example to identify what would be helpful when executing repeatedly:

**Scripts** (`scripts/` in the skill folder, optional): Executable code for repeatable tasks — only when the same code would otherwise be rewritten often.

**References** (`references/`, optional): Extra markdown or specs loaded when needed — schemas, policies, long examples — so the main skill file stays short.

**Assets** (`assets/`, optional): Templates, boilerplate, or static files used in outputs.

### Step 3: Initialize the Skill Layout

**Skip only if**: The skill already exists and only needs edits.

Create a folder for the skill (project-local under `.cursor/skills/<skill-name>/` or follow your team's standard location). At minimum include:

- `SKILL.md` — main instructions (see Step 4)
- Optional: `scripts/`, `references/`, `assets/`

Do not add README, CHANGELOG, or other noise files unless the user explicitly wants them.

### Step 4: Edit the Skill

#### Start with Reusable Resources

1. Add any scripts, references, and assets you planned
2. Run or sanity-check scripts on representative inputs when they exist
3. Remove placeholder files that are not used

#### Update SKILL.md

**Writing Guidelines**: Use imperative, direct instructions.

**Frontmatter** (YAML), when used:
```yaml
---
name: skill-name
description: |
  What the skill does AND when to use it.
  Put triggering phrases here so the body loads only when relevant.
---
```

**Body** (Markdown):
- How to use the skill and any bundled files
- Keep the primary file short; push depth into `references/` when needed
- **Guidelines**:
  - Avoid deep chains of references (one hop from `SKILL.md` is usually enough)
  - Long reference files: table of contents at the top
  - Do not duplicate the same facts in `SKILL.md` and a reference — pick one home

### Step 5: Validate

- Naming and paths are consistent
- Frontmatter (if any) matches the skill folder name
- No broken internal links
- The description accurately lists when to load this skill

### Step 6: Iterate

1. Use the skill on real tasks
2. Note friction or missing steps
3. Update `SKILL.md` or references
4. Repeat

## Checklist

- [ ] Step 1: Concrete examples and scope are clear
- [ ] Step 2: Optional `scripts/`, `references/`, `assets/` are justified
- [ ] Step 3: Skill folder and `SKILL.md` exist
- [ ] Step 4: Body is actionable; references stay separate when long
- [ ] Step 5: Links and frontmatter validated
- [ ] Step 6: Ready to refine from real use

## Notes

- Skills are onboarding condensed for the agent — not a second README for humans unless intended
- Context window is shared — keep `SKILL.md` lean
- Optional directories are truly optional; a single `SKILL.md` is valid
