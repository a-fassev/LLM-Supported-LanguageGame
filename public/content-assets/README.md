# Content assets (placeholders)

Background keys in `lib/content/` scene JSON (e.g. `chapters/01/quests/01/bg-story-arrivo`) resolve to files under this tree once art exists.

**v1:** No image files yet — the client may show a solid placeholder. Mirror path segments from the `background` field (lowercase).

Example target path for key `chapters/01/quests/01/bg-story-arrivo`:

`public/content-assets/chapters/01/quests/01/bg-story-arrivo.png`

Story scenes may use backgrounds that include character artwork; no separate avatar asset id in JSON.
