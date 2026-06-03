# Content assets

Raster backgrounds for the web client. Keys are lowercase path segments (no file extension in code). The client resolves them via `lib/game/content/resolve-asset-url.ts` to **`/content-assets/{key}.png`** under this directory.

## Hub screens (`hubs/`)

Static keys live in **`lib/game/content/hub-background-keys.ts`** and are passed to `GameBackground` from hub/auth pages.

| Screen | Asset key | File |
| ------ | --------- | ---- |
| Login | `hubs/auth/bg-login` | `public/content-assets/hubs/auth/bg-login.png` |
| Register | `hubs/auth/bg-register` | `public/content-assets/hubs/auth/bg-register.png` |

Future examples: `hubs/menu/bg-main` → `public/content-assets/hubs/menu/bg-main.png`.

## Chapter / quest scenes (`chapters/`)

Background keys in `lib/content/` scene JSON (e.g. `chapters/01/quests/01/bg-story-arrivo`) mirror path segments under `chapters/`:

`public/content-assets/chapters/01/quests/01/bg-story-arrivo.png`

Story scenes may use backgrounds that include character artwork; no separate avatar asset id in JSON.

## Reference document figures (`referenceDocument.figures[]`)

Keys in scene JSON (no `.png` suffix) map to **`public/content-assets/{key}.png`**. They power the **documento** overlay (image grid), not scene backgrounds.

| Chapter | Path on disk | Used for |
| ------- | ------------ | -------- |
| **00** (fixtures) | `public/content-assets/chapters/00/quests/01/ref-fixture-*.png` | Sandbox: 6-face gallery (scene 04), single figure (scene 12) |
| **02** (Lezione 2) | `public/content-assets/chapters/02/quests/03/ref-quiz-*.png` | Quiz gallery (6 persons) |
| **02** | `public/content-assets/chapters/02/quests/02/ref-prof-*.png` | Nutelleria freetext (4 professions) |
| **02** | `public/content-assets/chapters/02/quests/04/ref-menu-*.png` | Trattoria menù freetext (5 categories) |

## Chapter backgrounds (`chapters/03/`)

Scene and quest `background` keys only (no reference-document figures in ch.3). Place PNGs next to `.gitkeep` under e.g. `chapters/03/quests/02/bg-museum-hall.png`. Regenerate JSON from `scripts/generate-chapter-03-catalog.mjs` if keys change.

## Chapter asset checklists (`ASSET_KEYS.txt`)

For chapters whose generator syncs placeholders (today: **04** via `scripts/generate-chapter-04-catalog.mjs`), each run rewrites:

`public/content-assets/chapters/NN/ASSET_KEYS.txt`

— one line per expected `{key}.png` (backgrounds + documento figure keys). Create parent dirs + `.gitkeep` until PNGs exist. **New chapter generators:** copy the `ensureChapter04AssetPlaceholders` pattern from chapter 04 when the chapter has many asset keys.

## Chapter 04 (`chapters/04/`) — Lezione 4

Regenerate JSON and asset placeholders from `scripts/generate-chapter-04-catalog.mjs` if keys change. Full PNG path list: `public/content-assets/chapters/04/ASSET_KEYS.txt` (rewritten on each generator run).

### Scene backgrounds (full-screen behind play)

Drop PNGs next to `.gitkeep`; key in JSON has no `.png` suffix.

| Key | File |
| --- | ---- |
| `chapters/04/chapter/bg-missions` | `public/content-assets/chapters/04/chapter/bg-missions.png` |
| `chapters/04/quests/01/bg-room-morning` | `…/chapters/04/quests/01/bg-room-morning.png` |
| `chapters/04/quests/02/bg-giardini-margherita` | `…/chapters/04/quests/02/bg-giardini-margherita.png` |
| `chapters/04/quests/03/bg-room-evening` | `…/chapters/04/quests/03/bg-room-evening.png` |
| `chapters/04/quests/04/bg-room-morning-phone` | `…/chapters/04/quests/04/bg-room-morning-phone.png` |
| `chapters/04/quests/bonus/bg-overview` (or reuse morning) | `…/chapters/04/quests/bonus/bg-overview.png` |

### Reference document figures — Sara’s Sicily photos (`quest-02` scene 07)

Shown in the **documento** overlay (button on the freetext task), not as the scene background. Four images in a gallery; captions A–C include Sara’s sample descriptions, D is “da descrivere”.

| Key | File |
| --- | ---- |
| `chapters/04/quests/02/ref-foto-acqua-verde` | `public/content-assets/chapters/04/quests/02/ref-foto-acqua-verde.png` |
| `chapters/04/quests/02/ref-foto-mercato-palermo` | `…/ref-foto-mercato-palermo.png` |
| `chapters/04/quests/02/ref-foto-vucciria` | `…/ref-foto-vucciria.png` |
| `chapters/04/quests/02/ref-foto-cattedrale` | `…/ref-foto-cattedrale.png` |

No code change when art is ready — add/replace the PNG at the path above.

Replace a file in place (same key in JSON) when art is ready; no code change required.

## Format and fallbacks

- Store **PNG** files (keys in code omit `.png`).
- If a file is missing or fails to load, `GameBackground` falls back to CSS gradients (`--game-hub-bg` / `--game-play-bg`).
- Route changes use preload + crossfade (`lib/game/content/preload-asset-url.ts`). Auth: shared layout in `app/(auth)/layout.tsx`. Play: `run.nextSceneBackground` from API for next-scene warmup.
