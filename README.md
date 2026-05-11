# LLM-Supported Language Game

Hybrid repository: a **Unity 6** 2D learning game and a **Next.js** backend for structured **LLM task evaluation** (`POST /api/tasks/evaluate`). Unity holds gameplay and content; API keys and model calls stay on the server.

## Repository layout

| Path | Purpose |
|------|---------|
| `apps/unity/` | Unity project (URP 2D, runtime under `Assets/_Project/`) |
| `apps/web/` | Next.js 16 app — evaluate API, minimal UI, local WebGL shell |
| `AGENTS.md` | Detailed guidance for tooling, architecture, and conventions |

## Requirements

- **Node.js** (LTS) and **npm** — for `apps/web`
- **Unity Hub** + **Unity Editor** matching `apps/unity/ProjectSettings/ProjectVersion.txt` (e.g. `6000.4.2f1`) with **WebGL Build Support** if you ship browser builds

## Web app (Next.js)

From the repository root:

```bash
npm install
npm run dev:web
```

- App: `http://localhost:3000`
- Task evaluation: `POST http://localhost:3000/api/tasks/evaluate`
- Environment: copy `apps/web/.env.example` to `apps/web/.env.local` and set at least `NVIDIA_API_KEY` for LLM-backed tasks.

Other scripts:

```bash
npm run lint:web
npm run test:web
```

## Play the game in the browser (local)

1. In Unity: **File → Build Settings → WebGL → Build** into `apps/web/public/unity-webgl/` (must contain `index.html` and `Build/`).
2. `npm run dev:web`
3. Open `http://localhost:3000/game` (same origin as the API).

Non-LLM tasks run fully in Unity. LLM tasks need the Next server and valid env. Build output under `public/unity-webgl/` is gitignored except `.gitkeep`.

## Unity

Open the project folder `apps/unity` in Unity Hub. Game code and scenes live under `Assets/_Project/`. Level content is JSON under `Assets/_Project/Content/`; for WebGL, mirror levels needed at runtime as `TextAsset` under a `Resources` folder (see `AGENTS.md`).

Optional (macOS): `npm run unity:open` opens the project in Unity Hub if Hub is installed.

## Documentation

- [AGENTS.md](AGENTS.md) — stack, boundaries, directory map, persistence and config
- [apps/web/docs/task-evaluation-error-contract.md](apps/web/docs/task-evaluation-error-contract.md) — HTTP / error codes vs. Unity behavior
