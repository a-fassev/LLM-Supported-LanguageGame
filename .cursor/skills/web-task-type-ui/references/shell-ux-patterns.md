# Task shell UX — patterns from MC rollout

Use when layout or copy feedback sounds like “buttons scroll”, “text too big”, or “two boxes for the same text”.

## Layout

| Problem | Fix |
| ------- | --- |
| Footer buttons scroll away | `TaskChrome`: `overflow-hidden` column; footer `shrink-0`; only middle `children` scroll via `TaskBodyLayout`. |
| Huge gap between prompt and options | Avoid `flex-1` between prompt and list without need; use `TaskBodyLayout` scroll region for options only. |
| `<legend>` extra spacing | Prefer `<p id={…}>` for visible prompt; `role="group"` + `aria-labelledby`. |
| Header title wraps | `.game-hub-header__title`: `white-space: nowrap`, `text-overflow: ellipsis`, `title` attribute for full text. |

## Copy

| Problem | Fix |
| ------- | --- |
| Instruction + prompt in one giant chrome paragraph | Split: `readTaskChromeInstructions` vs prompt in `TaskBodyLayout`. |
| Prompt inside rounded “card” + instruction above | Remove extra wrapper; plain `text-sm` paragraphs, unified `gap-2`. |
| Instruction looks larger than options | Both `text-sm`; instruction `font-semibold` only. |

## Multi-question

- Shell **Avanti** / **Indietro**, not in-task nav rows (`SceneRouter` + `getMcQuestionNavState`).
- Scene instruction shown once (first question only if it differs from prompts — MC shows instruction every scene, prompts per question).
- Draft state on `/play` (`mcQuestionIndex`, selections, validation error); reset on every scene change via `sync*DraftForScene` after snapshot/advance/retreat/attempt.
- Validate all items on **Controlla**; jump to first empty; error under prompt.

## Cloze (inline gaps)

| Problem | Fix |
| ------- | --- |
| Placeholder dots in empty gaps | Do not pass `placeholder` to gap `Input`; optional `segment.placeholder` is catalog-only. |
| Focus ring dominates small inline fields | `focus-visible:ring-0` (match freetext textarea). |
| Browser/password manager “Ausfüllen” on many fields | `autoComplete="off"`, neutral `name` per gap (`cloze-${sceneId}-g${index}`), `data-1p-ignore`, `data-lpignore="true"`. |
| Short example does not test scroll | Long passage fixtures (e.g. same Bologna narrative as error_spotting scene 14); smoke test `joinedText.length > 2000`. |

## Drag-drop (blocks v1)

| Problem | Fix |
| ------- | --- |
| Bank + targets clipped on small screens | Bank and target blocks together in scrollable `TaskBodyLayout` **`children`**; validation + drag hint stay in **`beforeScroll`**. |
| Drag breaks while scrolling zones | Pointer listeners on **`document`**, not only the scroll root. |
| Ghost tile offset from finger/cursor | Portal preview on `document.body` with grab offset from pointer down. |
| Controlla blocked with empty zones or bank tiles | Do **not** require filled zones or `requireBankEmpty` on client — POST partial layout; server scores. |

## Success overlay (task pass / quest complete)

| Problem | Fix |
| ------- | --- |
| Next scene’s task visible behind overlay | Hold **display** on submitted scene: `chromeHoldScene` + `backgroundHoldKey` on `/play`; `SceneRouter` uses `displayScene`, MC index clamped on `displayScene`. |
| Empty drafts for next scene while overlay open | Defer `syncTaskDraftsForScene` until overlay dismiss (`pendingDraftSyncSceneRef`). |
| Retry 409 loses answers | Do **not** sync drafts on failed attempt — only on success after dismiss (or immediate sync when no overlay). |

## Do not

- Put `correct*` fields in client components.
- Toast per wrong answer.
- Duplicate Zod as authority on client (optional UX checks only).
- Add global client store for run progress.
