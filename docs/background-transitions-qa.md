# Background transitions — manual QA

Use after changes to `GameBackground`, auth layout, or run snapshot backgrounds.

## Hub routes (menu, chapters, shop, leaderboard)

| Step | Action | Expected |
| ---- | ------ | -------- |
| H1 | Navigate menu → chapters → chapter detail → back | One shared hub background host; no full remount flash between hub pages |
| H2 | Open shop (Negozio) and back | Same |
| H3 | Open leaderboard and back | Same |

## Auth (static)

| Step | Action | Expected |
| ---- | ------ | -------- |
| A1 | Open `/login` on iPad Safari (network URL) | Login background visible; form tappable |
| A2 | Tap **Registrati** 10× quickly | Smooth crossfade; no flash of wrong/old gradient-only frame |
| A3 | Tap back to login 10× quickly | Same as A2 |
| A4 | Hard refresh on `/register` | Register background; no long blank gradient |

## Play (dynamic)

| Step | Action | Expected |
| ---- | ------ | -------- |
| P1 | Start a quest with multiple scenes | Scene background loads; no broken image icon |
| P2 | Story **Avanti** through scenes | Crossfade between backgrounds; UI stays interactive |
| P3 | Task success (when implemented with art) | Background may change; preload should limit flash |
| P4 | **Indietro** (retreat) | Previous scene background returns smoothly |
| P5 | DevTools → Slow 3G, repeat P2 | Gradient fallback acceptable; no stuck overlay blocking taps |

## Negative

| Step | Action | Expected |
| ---- | ------ | -------- |
| N1 | Rename/remove a background PNG | Hub/play gradient fallback; no broken-image icon |
