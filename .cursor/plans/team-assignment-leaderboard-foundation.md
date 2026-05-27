# Team assignment + leaderboard — requirements foundation

> **Purpose:** Automatically place each newly registered learner into a balanced red/blue team and provide a new leaderboard screen (overall + team mode) from the main menu so learners can compare progress in a clear, stylable UI Toolkit flow.

---

## Problem statement

Today, registration creates an account but no team identity, so the classroom cannot run fair team-based competition. Players also cannot see a ranking view from the game menus, which removes motivation loops ("How am I doing vs everyone / my team?").

Learners should be assigned to **Blue** or **Red** automatically at account creation, with team sizes kept as even as possible. From the main menu, they should be able to open a leaderboard with:

- **Overall mode** (all players),
- **Team mode** (team-centric ranking context),
- menu-like navigation and pause/back handling aligned with existing UI Toolkit scene patterns.

---

## Confirmed decisions

| Question | Decision |
|----------|----------|
| Where team assignment happens | In the backend data layer at account creation time (DB-backed logic), not in Unity client code. |
| Balancing rule | Assign to the currently smaller team; on tie, choose randomly (50/50) to keep long-term balance. |
| Concurrency safety | Team assignment is treated as atomic server-side work (single transaction/RPC/trigger path) to avoid race conditions during simultaneous registrations. |
| Team model | Persist team on `student_accounts` as a constrained value (`blue` or `red`), returned where needed by auth/leaderboard APIs. |
| Leaderboard metric | Rank by authoritative server `totalSlices` (pizza) descending; deterministic tie-breaker follows stable secondary keys. |
| Leaderboard entry point | Add a new main-menu button below `Continue` (`play-button`) that opens a dedicated leaderboard screen/flow. |
| API crawl / fetch timing | Leaderboard data is fetched on screen open (initial load) and can be fetched again via explicit manual refresh. |
| Manual refresh control | Add a visible `Refresh` action on the leaderboard screen to trigger a fresh API read on demand. |
| UI authoring style | Use the existing UI Toolkit + UI Builder pattern with prefilled fixture rows in UXML for styling previews, then runtime clears/rebinds named hosts with live API data. |
| Pause/navigation behavior | Leaderboard screen includes standard overlay/back controls consistent with current overlay/template approach; returning to main menu is always possible. |

---

## User experience

### User flows

1. **Registration + team assignment**
   1. Learner creates a new account in `Auth`.
   2. Backend creates account and assigns team automatically (`Blue`/`Red`).
   3. Registration success message can include team identity (or it is visible after login on leaderboard/profile context).

2. **Open leaderboard from main menu**
   1. Learner enters `MainMenu`.
   2. Learner taps new `Leaderboard` button placed under `Continue`.
   3. App navigates to leaderboard screen with loading overlay while the initial leaderboard fetch runs.

3. **Leaderboard interaction**
   1. Default tab opens (Overall).
   2. Learner switches between:
      - **Overall**: all players ranked globally.
      - **Team**: team-oriented view (team standings and/or members grouped by team with own-team emphasis).
   3. Learner can tap `Refresh` to manually re-fetch leaderboard data without leaving the screen.
   4. Learner can open pause menu, resume, or return to main menu.

### Empty / loading / error states

- **Loading:** full-screen overlay pattern already used in menu flows (`Loading game data…` style).
- **Manual refresh in progress:** refresh control is temporarily disabled and/or shows busy feedback while existing rows stay visible.
- **No data yet:** friendly empty-state card (e.g., no ranked players yet).
- **API failure/network/session issue:** existing error banner/modal pattern; retry option; session errors route back to `Auth`.
- **Unexpected team value:** row excluded or mapped to safe fallback in UI and logged server-side (should not happen after constrained schema).

### User expectations

- Team assignment feels instant and fair.
- Leaderboard opens quickly from main menu and remains readable with many rows.
- Tab switching is immediate and clearly indicates active mode.
- Dummy fixture content is visible in UI Builder without running backend, while runtime still shows real data.

---

## Scope

### In scope

- Add automatic balanced team assignment for new registrations.
- Add persistent team field/contract support in auth + backend domain where required.
- Add leaderboard API contract and query logic for overall/team modes.
- Add Unity leaderboard screen flow from main menu (button, scene/controller/view wiring).
- Add explicit manual refresh control and in-flight request handling on leaderboard screen.
- Add UI Toolkit UXML/USS + fixture sample content for UI Builder styling workflow.
- Add pause/back overlays on leaderboard flow aligned with existing template/overlay patterns.
- Add tests for assignment logic and leaderboard ordering/filtering at backend service level.

### Out of scope

- Matchmaking/gameplay mechanics that depend on team (quests, rewards, unlock rules).
- Historical backfill strategy beyond deterministic default migration for existing accounts.
- Real-time/push leaderboard updates; initial version is fetch-on-open/refresh.
- New web frontend page in `apps/web`; Unity is the consuming client.
- Additional currencies/ranking formulas beyond `totalSlices` in this milestone.

---

## Engineering design

### Unity

- **Navigation/scene flow**
  - Extend `GameFlowController` with leaderboard route.
  - Add new `Leaderboard` scene to `Assets/Scenes` and `ProjectSettings/EditorBuildSettings.asset`.
  - Add `leaderboard-button` to `MainMenuScreen.uxml` under `play-button`, wire in `MainMenuView`.

- **Screen implementation**
  - Add `LeaderboardView` using UI Toolkit bootstrap pattern (`LearningToolkitBootstrap.SpawnUiDocument`).
  - Reuse overlay-plane patterns for loading + error + pause/back modal behavior.
  - Add API call in `GameProgressApiClient` (or dedicated leaderboard client) to fetch leaderboard envelope.

- **UI Builder fixtures**
  - `LeaderboardScreen.uxml` contains representative sample rows/cards in named hosts (`overall-list-host`, `team-list-host`, etc.) with `lg-preview-sample` style classes.
  - Runtime clears hosts before binding live rows, preserving designer-first styling workflow.
  - Styling lives in LearningToolkit USS files (`components-cards-lists.uss` and/or dedicated leaderboard stylesheet).

### Next.js app

- **Auth registration (`/api/auth/register`)**
  - Registration path creates account with auto-assigned `team`.
  - Keep existing username/password behavior and error contracts; extend success payload only if needed.

- **Leaderboard API**
  - Add endpoint under `/api/game/*` (session-protected via existing bearer/session pattern).
  - Return DTO designed for Unity `JsonUtility` parsing with both modes available via query/filter or single envelope.
  - Include caller context (own username/team/rank) when useful for highlighting in UI.
  - Keep endpoint idempotent for repeated manual refresh calls with same contract as initial load.

- **Service/repository**
  - Add leaderboard query helpers in `game-progress-repository.ts`.
  - Add service layer orchestration/order normalization in `game-progress-service.ts`.

### Integration

- Unity consumes leaderboard via existing local HTTP API (`http://127.0.0.1:3000`).
- Contract is explicit and version-safe for `JsonUtility` (flat DTO fields, predictable arrays).
- Team assignment is backend-owned; Unity only displays assigned team/ranking context.

### Data & persistence

- Extend `student_accounts` with `team` (`blue|red`) plus migration for existing rows.
- Team assignment logic implemented in DB-safe path (function/trigger or equivalent atomic insert strategy).
- Leaderboard reads from `player_wallets.total_slices` joined with `student_accounts.username/team`.
- Existing accounts get deterministic fallback assignment during migration to preserve balance.
- Supabase migrations for this feature can be executed via the Supabase MCP server tooling as the preferred workflow.

### Error handling

- Registration:
  - If assignment fails, account creation fails with safe generic error (no partial/unknown team rows).
- Leaderboard:
  - Session invalid -> `401/403` existing handling -> Unity returns to auth.
  - Data/query failure -> retryable error surface via existing overlay banner patterns.

### Security

- Team value is server-controlled; client cannot choose/override.
- Leaderboard exposes only safe public fields (username, team, score/rank), no secrets/password/session info.
- Validate mode/team query parameters strictly.

### Performance

- Leaderboard query should be index-friendly (`total_slices` ordering + account join).
- Limit payload size (top N + optional caller row) to keep menu transitions responsive.
- UI list rendering should avoid heavy per-frame rebuilds; bind once on fetch.
- Manual refresh should rebind lists in place (no scene reload).

---

## Validated assumptions

| Assumption | Status | Fallback |
|-----------|--------|----------|
| `student_accounts` can be safely extended with a `team` field in migrations | ⚠️ Needs check | Add nullable column first, backfill, then enforce constraint |
| Existing account volume is small enough for one-time balanced backfill migration | ⚠️ Needs check | Deterministic split by created order/id hash if volume is large |
| Ranking by `player_wallets.total_slices` matches product expectation for "Overall" | ✅ Validated for current game economy | Add configurable metric in follow-up if product changes |
| Main menu can add one additional action without layout regressions | ✅ Validated by current flexible action stack | Move to scrollable action area if needed |
| Dedicated leaderboard scene is preferable to embedding in main menu for maintainability | ✅ Validated against current scene-per-screen navigation pattern | Convert to overlay panel if scene overhead proves unnecessary |

---

## Identified risks

| Risk | Mitigation |
|------|------------|
| Race condition during parallel registrations causes imbalance | Keep assignment atomic in DB transaction/function path |
| Ambiguous "team mode" interpretation leads to wrong UX | Keep API/UI contract explicit: team-oriented ranking with clear labels and own-team emphasis |
| UI Builder fixture sample diverges from runtime structure | Use named hosts and shared part templates/classes; clear + rebuild only inside hosts |
| Leaderboard sorting ties appear unstable | Define deterministic secondary ordering in backend query |
| Existing users without team break leaderboard | Backfill migration before enabling endpoint in client flow |

---

## Success criteria

- [ ] New account registration always stores exactly one valid team (`blue` or `red`).
- [ ] Team distribution stays as balanced as possible over time (difference never exceeds one under sequential registrations).
- [ ] Main menu includes a new leaderboard entry point beneath `Continue`.
- [ ] Leaderboard supports two user-visible modes: Overall and Team.
- [ ] Leaderboard fetch runs on first screen open and can be manually triggered via visible `Refresh` action.
- [ ] UI Toolkit screen is fully stylable in UI Builder with prefilled fixture data visible at design time.
- [ ] Runtime correctly replaces fixture content with API data and handles loading/empty/error states.
- [ ] Pause/back flow on leaderboard works consistently and always allows return to main menu.

---

## Implementation areas (for planning mode)

1. **Supabase migration**: `student_accounts.team` field + backfill + constraints/indexes + assignment function/trigger.
2. **Auth backend**: integrate automatic team assignment into register flow and contracts.
3. **Leaderboard backend**: repository + service + `/api/game` route(s) + validation/tests.
4. **Unity contracts/client**: add leaderboard DTOs + HTTP call(s) + session/error handling integration.
5. **Unity navigation**: `GameFlowController`, new scene registration, main menu button wiring.
6. **Leaderboard UI Toolkit**: UXML/USS screen, fixture sample rows, runtime binding, mode toggle behavior.
7. **Overlay behavior**: loading/error/pause modal integration for leaderboard screen.
8. **Refresh behavior**: initial load + manual refresh action, busy state, and in-place rebind.
