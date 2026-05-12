# Agent guidance

**Git branch for agent work:** Implement and commit **only** on `unity-implementation`. Do **not** do agent work on `main` or any other branch. Create this branch from `main` when needed (`git checkout main && git pull && git checkout -b unity-implementation`). At the start of every session, confirm you are on it: `git checkout unity-implementation`.

## Repository overview

The **committed** repository is a **Unity 6.4** project at the **repository root** (not under `apps/`). `git ls-files` is the source of truth for what ships in version control; extra folders in a local clone (for example `apps/` with leftover `node_modules` / build output) may be **untracked** and must not be treated as the canonical layout.


| Area | Path | Role |
| -------------------- | -------------------------------------------------------------------- | ---- |
| **Unity (2D / URP)** | `Assets/`, `Packages/`, `ProjectSettings/` | Game client — template URP 2D setup, sample scene, New Input System assets. Editor version: `6000.4.6f1` per `ProjectSettings/ProjectVersion.txt`. |
| **Repo meta** | `.gitignore`, `.gitattributes`, `AGENTS.md` | Version control and agent conventions. |

**Deprecated layout (do not document as current):** An older monorepo placed Unity under `apps/unity/` and a Next.js app under `apps/web/`. **Open the Unity editor from this repository root** (folder containing `Assets` + `ProjectSettings`). Do not assume `apps/unity/` exists or is the project to open.

When you reintroduce a web stack (e.g. Next.js) or shared packages, update this file and the directory tree below so paths stay accurate.

---

## Tech stack (current tree)

### Unity (repository root)

- **Engine:** Unity 6.4 (`6000.4.6f1` per `ProjectSettings/ProjectVersion.txt`).
- **Rendering:** 2D **Universal Render Pipeline (URP)** — settings under `Assets/Settings/` and `ProjectSettings/` (e.g. `URPProjectSettings.asset`).
- **Input:** New Input System — `Assets/InputSystem_Actions.inputactions`.
- **Language:** C# — gameplay and editor scripts go under `Assets/` (no project-specific `_Project` namespace in the committed skeleton yet).

### Web / LLM (optional, not in current `git` tree)

If you add a Next.js (or similar) server again for LLM task evaluation or tooling:

- Keep **API keys and provider SDK usage on the server** only; do not embed secrets in Unity or ship them to the browser client.
- Prefer a clear integration contract (HTTP API, env vars) rather than tight coupling between Unity and the web project.

---

## Directory structure

Repository layout **as committed today**:

```text
LLM-Supported-LanguageGame/
├── AGENTS.md
├── Assets/
│ ├── InputSystem_Actions.inputactions
│ ├── Scenes/ # e.g. SampleScene
│ └── Settings/ # URP 2D render assets and template scenes
├── Packages/
│ ├── manifest.json
│ └── packages-lock.json
├── ProjectSettings/
├── .gitignore
└── .gitattributes
```

Update this tree when the repository layout changes.

---

## Core principle

**UNDERSTAND → CLARIFY → CODE** — Understand the current situation first, ask questions and suggest options, and only start coding after the user confirms the approach.

---

## 3-phase response protocol

### Phase 1: Understand current state

- Analyze existing code, setup, and tools
- Identify the problem, constraints, and non-negotiables
- Map what already exists vs. what's missing

### Phase 2: Clarify and suggest (before coding)

- Ask clarifying questions (spec gaps, scope, integrations)
- Offer focused suggestions (tradeoffs, risks, simpler alternatives)
- No coding yet — wait for explicit confirmation

### Phase 3: Implement after confirmation

- Build what was agreed
- Follow the chosen approach
- No scope creep or unrequested extras

---

## Development philosophy

- **Clean and simple:** avoid over-engineering; minimal dependencies; clear names
- **Modern and modular:** single responsibility, separation of concerns, reusable pieces

---

## Key rules

- Do not jump straight to code; ground changes in the current codebase
- Questions and suggestions should fit **this** project, not generic lectures
- Wait for confirmation; do not assume unstated requirements
- Do not create documentation files unless the user explicitly asks (no unsolicited `*_SUMMARY.md`, `*_GUIDE.md`, `TODO.md`, etc.). Prefer answering in chat unless they asked for a doc or you're adding real implementation that requires a file
- Before adding a file: *"Did the user ask for this file?"* If not, keep it in the reply

---

## Debugging

- Prefer existing dev surfaces: Unity Console, test output, and (when a web app exists) browser DevTools
- Do not spin up extra servers whose only purpose is ad-hoc logging or debugging

---

## Skills, MCP, and project conventions

When the repo provides skills, rules, or MCP tools, use the ones that match the task (DB, CI, analytics, design system, etc.) instead of guessing.

**Mapping for this repo:**

- **Unity / game client:** follow Unity and C# conventions under `Assets/`; respect `ProjectSettings/` and `Packages/manifest.json` when changing engine behavior or dependencies.
- **Future web / LLM integration:** when present, use that app's `package.json` scripts (`dev`, `build`, `lint`); keep secrets server-side.

---

## CLI tools (optional)

Prefer each vendor's official CLI for local workflows (webhooks, auth, cloud resources) when it's faster or clearer than doing everything through a UI or brittle one-off scripts.

**In use here (from the repo):**

- **Unity Editor** — primary client for this tree
- **npm** / **npx** — only when a `package.json` exists for a web or tooling subfolder

---

## Most important

- Favor simple, maintainable solutions
- Be concise; avoid long essays unless the user wants depth
