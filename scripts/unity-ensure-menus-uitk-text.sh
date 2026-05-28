#!/usr/bin/env bash
# Regenerate LearningMenusUIFont + PanelTextSettings wiring (CI / headless).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNITY="${UNITY_PATH:-/Applications/Unity/Hub/Editor/6000.4.6f1/Unity.app/Contents/MacOS/Unity}"

if [[ ! -x "$UNITY" ]]; then
  echo "Unity editor not found at: $UNITY" >&2
  echo "Set UNITY_PATH to your Unity 6000.4.6f1 editor binary." >&2
  exit 1
fi

"$UNITY" \
  -batchmode \
  -nographics \
  -quit \
  -projectPath "$ROOT" \
  -executeMethod LanguageGame.EditorTools.LearningMenusToolkitTextBootstrap.RunBatchModeEnsureMenusText \
  -logFile -
