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

## Drag-drop (blocks v1)

| Problem | Fix |
| ------- | --- |
| Item bank scrolls away on long category lists | Bank in `TaskBodyLayout` **`beforeScroll`**; only target blocks in scrollable `children`. |
| Drag breaks while scrolling zones | Pointer listeners on **`document`**, not only the scroll root. |
| Ghost tile offset from finger/cursor | Portal preview on `document.body` with grab offset from pointer down. |
| Controlla blocked with empty zones or bank tiles | Do **not** require filled zones or `requireBankEmpty` on client — POST partial layout; server scores. |

## Do not

- Put `correct*` fields in client components.
- Toast per wrong answer.
- Duplicate Zod as authority on client (optional UX checks only).
- Add global client store for run progress.
