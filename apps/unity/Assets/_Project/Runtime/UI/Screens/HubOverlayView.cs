using System;
using System.Collections.Generic;
using ITBL.LanguageGame.Runtime.Game.Hub;
using ITBL.LanguageGame.Runtime.Infrastructure.Persistence;
using ITBL.LanguageGame.Runtime.UI.Common;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace ITBL.LanguageGame.Runtime.UI.Screens
{
    public sealed class HubOverlayView : MonoBehaviour
    {
        private readonly List<TextMeshProUGUI> _gateLabels = new();
        private TextMeshProUGUI _statusLabel;
        private TextMeshProUGUI _scoreLabel;
        private TextMeshProUGUI _levelsCompletedLabel;
        private RectTransform _gatesContainer;
        private Action _onBackToMenu;

        public static HubOverlayView Create(Transform parent)
        {
            return UiRuntimeBootstrap.CreateViewOrFallback("UI/Screens/HubOverlayView", () =>
            {
                Canvas canvas = UiRuntimeBootstrap.CreateScreenCanvas("HubCanvas", parent);
                HubOverlayView view = canvas.gameObject.AddComponent<HubOverlayView>();
                view.BuildDefaultUi(canvas.transform);
                return view;
            });
        }

        public void Bind(Action onBackToMenu)
        {
            _onBackToMenu = onBackToMenu;
        }

        public void Refresh(string statusMessage, PlayerProfile profile, IReadOnlyList<HubLevelGate> gates)
        {
            _statusLabel.text = $"Status: {statusMessage}";
            _scoreLabel.text = $"Score: {profile.score.totalPoints} | Abgeschlossene Tasks: {profile.score.tasksCompleted}";
            _levelsCompletedLabel.text = $"Abgeschlossene Level: {profile.stats.levelsCompleted}";
            EnsureGateRows(gates?.Count ?? 0);
            if (gates == null)
            {
                return;
            }

            for (int i = 0; i < gates.Count; i++)
            {
                HubLevelGate gate = gates[i];
                _gateLabels[i].text = $"{gate.DisplayName} ({gate.LevelId}): {gate.State}";
            }
        }

        private void BuildDefaultUi(Transform root)
        {
            RectTransform panel = UiPrimitives.CreatePanel(
                "Panel",
                root,
                new Vector2(0f, 1f),
                new Vector2(0f, 1f),
                new Vector2(15f, -290f),
                new Vector2(530f, -15f),
                new Color(1f, 1f, 1f, 0.9f));
            UiPrimitives.AddVerticalLayout(panel, spacing: 7f);

            UiPrimitives.CreateLabel("Title", panel, "Main Hub", 30, TextAlignmentOptions.Left);
            UiPrimitives.CreateLabel("Movement", panel, "Bewegung: WASD / Pfeiltasten / Gamepad-Stick", 18, TextAlignmentOptions.Left);
            UiPrimitives.CreateLabel("Interaction", panel, "Interaktion: E / Gamepad (North)", 18, TextAlignmentOptions.Left);
            _statusLabel = UiPrimitives.CreateLabel("Status", panel, "Status: ", 18, TextAlignmentOptions.Left);
            _scoreLabel = UiPrimitives.CreateLabel("Score", panel, "Score: ", 18, TextAlignmentOptions.Left);
            _levelsCompletedLabel = UiPrimitives.CreateLabel("LevelsCompleted", panel, "Abgeschlossene Level: ", 18, TextAlignmentOptions.Left);

            _gatesContainer = new GameObject("Gates").AddComponent<RectTransform>();
            _gatesContainer.SetParent(panel, false);
            VerticalLayoutGroup gatesLayout = _gatesContainer.gameObject.AddComponent<VerticalLayoutGroup>();
            gatesLayout.spacing = 4f;
            gatesLayout.childControlHeight = false;
            gatesLayout.childControlWidth = true;
            gatesLayout.childForceExpandHeight = false;

            UiPrimitives.CreateButton("BackButton", panel, "Zurueck zum Menue", () => _onBackToMenu?.Invoke());
        }

        private void EnsureGateRows(int requiredCount)
        {
            while (_gateLabels.Count < requiredCount)
            {
                TextMeshProUGUI label = UiPrimitives.CreateLabel($"Gate_{_gateLabels.Count}", _gatesContainer, string.Empty, 17, TextAlignmentOptions.Left);
                LayoutElement layout = label.gameObject.AddComponent<LayoutElement>();
                layout.minHeight = 20f;
                _gateLabels.Add(label);
            }

            for (int i = 0; i < _gateLabels.Count; i++)
            {
                _gateLabels[i].gameObject.SetActive(i < requiredCount);
            }
        }
    }
}
