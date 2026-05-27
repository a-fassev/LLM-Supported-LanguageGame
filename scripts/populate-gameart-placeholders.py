#!/usr/bin/env python3
"""Copy master placeholder PNGs into GameArt paths referenced by Unity loaders."""
from __future__ import annotations

import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
GAME_ART = REPO / "Assets/Resources/UI/GameArt"
MASTERS = {
    "light": GAME_ART / "_MasterPlaceholders/ph-master-surface-light.png",
    "dark": GAME_ART / "_MasterPlaceholders/ph-master-surface-dark.png",
    "accent": GAME_ART / "_MasterPlaceholders/ph-master-accent.png",
}

# (master_key, relative path under GameArt without extension — file is .png)
TARGETS: list[tuple[str, str]] = [
    ("light", "static/navigation/backgrounds/ph-st-nav-auth-bg"),
    ("dark", "static/navigation/backgrounds/ph-st-nav-auth-login-panel"),
    ("dark", "static/navigation/backgrounds/ph-st-nav-auth-register-panel"),
    ("light", "static/navigation/backgrounds/ph-st-nav-mainmenu-bg"),
    ("light", "static/navigation/backgrounds/ph-st-nav-leaderboard-bg"),
    ("accent", "static/navigation/buttons/ph-st-nav-refresh-btn"),
    ("light", "static/navigation/backgrounds/ph-st-nav-chapter-bg"),
    ("light", "static/navigation/backgrounds/ph-st-nav-quest-bg"),
    ("light", "static/navigation/backgrounds/ph-st-nav-avatar-shop-bg"),
    ("light", "static/task-scene-backgrounds/ph-st-task-bg-default"),
    ("dark", "static/cutscene-backgrounds/ph-st-cutscene-bg-default"),
    ("accent", "static/hud/ph-st-hud-pizza-icon"),
    ("accent", "static/hud/ph-st-hud-backpack-icon"),
    ("accent", "portraits/player/current"),
    ("light", "portraits/npc/ricci"),
    ("light", "portraits/npc/chiara"),
    ("light", "portraits/npc/tonio"),
    # Chapter 1 — cutscene backgrounds (replace PNG only; keep DB asset keys)
    ("dark", "static/cutscene-backgrounds/chapter-01/ph-cs-bedroom"),
    ("light", "static/cutscene-backgrounds/chapter-01/ph-cs-classroom"),
    ("light", "static/cutscene-backgrounds/chapter-01/ph-cs-school-exterior"),
    ("light", "static/cutscene-backgrounds/chapter-01/ph-cs-bar-interior"),
    # Chapter 1 — task backgrounds
    ("light", "static/task-scene-backgrounds/chapter-01/ph-ts-classroom"),
    ("light", "static/task-scene-backgrounds/chapter-01/ph-ts-school-exterior"),
    ("light", "static/task-scene-backgrounds/chapter-01/ph-ts-bar-interior"),
]


def main() -> None:
    for key, master in MASTERS.items():
        if not master.is_file():
            raise SystemExit(f"Missing master: {master}")

    created = 0
    for master_key, rel in TARGETS:
        dest = GAME_ART / f"{rel}.png"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(MASTERS[master_key], dest)
        created += 1
        print(f"  {rel}.png <- {MASTERS[master_key].name}")

    print(f"Created/updated {created} placeholder sprites under {GAME_ART.relative_to(REPO)}")
    print("Run scripts/generate-gameart-meta.py to create Unity .meta files for new PNGs.")


if __name__ == "__main__":
    main()
