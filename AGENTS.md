# Agent guidance

## Repository overview

This workspace is a **hybrid repo**:


| Area                 | Path                                       | Role                                                                                                                                    |
| -------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Unity (2D / URP)** | `Assets/`, `ProjectSettings/`, `Packages/` | Game client — scenes, input actions, render pipeline settings (Unity 6, editor `6000.4.2f1` per `ProjectSettings/ProjectVersion.txt`).  |
| **Next.js app**      | `LLM Test Integration/`                    | Web stack for LLM-related integration — React 19, Next.js 16, TypeScript; entry under `app/` (`layout.tsx`, `page.tsx`, `globals.css`). |
| **Repo meta**        | `.gitignore`, `.gitattributes`             | Version control conventions.                                                                                                            |


Anything outside these folders in your clone may appear as new worktrees or local-only files; treat the table above as the committed project skeleton.

---

## Tech stack

### Game client (Unity)

- **Engine:** Unity 6 (`6000.4.2f1` per `ProjectSettings/ProjectVersion.txt`)
- **Rendering:** 2D **Universal Render Pipeline (URP)** — assets and pipeline settings under `Assets/Settings/` and `ProjectSettings/`
- **Input:** New Input System (`Assets/InputSystem_Actions.inputactions`)
- **Language:** C# — Unity scripts and gameplay code live under `Assets/`

### Web app (`LLM Test Integration/`)

- **Framework:** Next.js **16.x** (App Router)
- **UI:** React **19**, **TypeScript**
- **Tooling:** ESLint with `eslint-config-next`
- **Styling:** Plain CSS via `app/globals.css`

---

## Architecture principles

- **Clean separation:** Unity game client vs. Next.js integration app; avoid coupling unless there is an explicit integration contract (API, build step, shared types).
- **Composition:** Prefer small, focused React components and Unity scripts with a single clear responsibility.
- **Type safety:** Strict TypeScript for the web app; consistent C# patterns in Unity scripts.
- **State:** Prefer React’s built-in `useState` / `useReducer` and context where shared UI state is needed; keep state as local as is practical.
- **Errors and UX:** Graceful handling and clear user feedback on the web; sensible logging in Unity.

---

## Directory structure

Repository layout today (high level):

```text
LLM-Supported-LanguageGame/
├── AGENTS.md                 # Agent guidance (this file)
├── Assets/                   # Unity project content
│   ├── Scenes/               # e.g. SampleScene
│   ├── Settings/             # URP, renderer, scene templates
│   ├── InputSystem_Actions.inputactions
│   └── *.asset / *.meta      # Profiles, pipeline, volumes
├── Packages/                 # Unity package manifest + lock
│   ├── manifest.json
│   └── packages-lock.json
├── ProjectSettings/          # Unity editor and build settings
├── LLM Test Integration/     # Next.js app (LLM-related integration)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── next-env.d.ts
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── .gitignore
└── .gitattributes
```

Update this tree when the repository layout changes so it stays accurate.

---

## Core principle

**UNDERSTAND → CLARIFY → CODE** — Understand the current situation first, ask questions and suggest options, and only start coding after the user confirms the approach.

---

## 3-phase response protocol

### Phase 1: Understand current state

- Analyze existing code, setup, and tools
- Identify the problem, constraints, and non-negotiables
- Map what already exists vs. what’s missing

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
- Do not create documentation files unless the user explicitly asks (no unsolicited `*_SUMMARY.md`, `*_GUIDE.md`, `TODO.md`, etc.). Prefer answering in chat unless they asked for a doc or you’re adding real implementation that requires a file
- Before adding a file: *“Did the user ask for this file?”* If not, keep it in the reply

---

## Debugging

- Prefer existing dev surfaces: app terminal logs, test output, and browser DevTools
- Do not spin up extra servers whose only purpose is ad-hoc logging or debugging

---

## Skills, MCP, and project conventions

When the repo provides skills, rules, or MCP tools, use the ones that match the task (DB, CI, analytics, design system, etc.) instead of guessing.

**Mapping for this repo:**

- **Unity / game client:** follow Unity and C# conventions under `Assets/`; respect `ProjectSettings` and `Packages/manifest.json` when changing engine behavior or dependencies.
- **Next.js / LLM integration:** work in `LLM Test Integration/`; use `npm run dev`, `build`, `lint` as defined in that folder’s `package.json`.
- **Cross-cutting:** prefer small, reviewable changes; don’t mix unrelated Unity and web changes in one step unless the user ties them together.

---

## CLI tools (optional)

Prefer each vendor’s official CLI for local workflows (webhooks, auth, cloud resources) when it’s faster or clearer than doing everything through a UI or brittle one-off scripts.

**In use here (from the repo):**

- **npm** / **npx** — dependency install and scripts for `LLM Test Integration/` (Next.js, ESLint).

---

## Most important

- Favor simple, maintainable solutions
- Be concise; avoid long essays unless the user wants depth

