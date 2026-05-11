using System;
using ITBL.LanguageGame.Runtime.Game.Content;
using ITBL.LanguageGame.Runtime.UI.Common;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace ITBL.LanguageGame.Runtime.UI.Screens
{
    public sealed class LevelHudView : MonoBehaviour
    {
        public sealed class Data
        {
            public string ActiveLevelId;
            public string StatusMessage;
            public string UxStateText;
            public bool IsSubmitting;
            public bool IsRuntimeReady;
            public bool IsFinished;
            public int TotalScoreEarned;
            public int TotalScoreMax;
            public int CurrentTaskIndex;
            public LevelTaskDefinition Task;
            public bool ShowRetry;

            public Action OnBackToHub;
            public Action OnRetry;
            public Action<string> OnSubmitMultipleChoice;
            public Func<string, string> GetMatchingInput;
            public Action<string, string> SetMatchingInput;
            public Action OnSubmitMatching;
            public Func<string, string> GetClozeInput;
            public Action<string, string> SetClozeInput;
            public Action OnSubmitCloze;
            public string FreeTextInput;
            public Action<string> SetFreeTextInput;
            public Action OnSubmitFreeText;
            public string DragDropInput;
            public Action<string> SetDragDropInput;
            public Action OnSubmitDragDrop;
            public Action OnSubmitUnsupported;
        }

        private TextMeshProUGUI _activeLevelLabel;
        private TextMeshProUGUI _statusLabel;
        private TextMeshProUGUI _uxStateLabel;
        private TextMeshProUGUI _submittingLabel;
        private RectTransform _contentRoot;
        private Button _retryButton;
        private Button _backButton;
        private string _currentContentKey = string.Empty;

        public static LevelHudView Create(Transform parent)
        {
            return UiRuntimeBootstrap.CreateViewOrFallback("UI/Screens/LevelHudView", () =>
            {
                Canvas canvas = UiRuntimeBootstrap.CreateScreenCanvas("LevelHudCanvas", parent);
                LevelHudView view = canvas.gameObject.AddComponent<LevelHudView>();
                view.BuildDefaultUi(canvas.transform);
                return view;
            });
        }

        public void Refresh(Data data)
        {
            _activeLevelLabel.text = $"Aktives Level: {data.ActiveLevelId}";
            _statusLabel.text = $"Status: {data.StatusMessage}";
            _uxStateLabel.text = $"UI-Zustand: {data.UxStateText}";
            _submittingLabel.gameObject.SetActive(data.IsSubmitting);

            string key = BuildContentKey(data);
            if (_currentContentKey != key)
            {
                RebuildContent(data);
                _currentContentKey = key;
            }

            _retryButton.gameObject.SetActive(data.ShowRetry);
            _retryButton.onClick.RemoveAllListeners();
            _retryButton.onClick.AddListener(() => data.OnRetry?.Invoke());
            _backButton.onClick.RemoveAllListeners();
            _backButton.onClick.AddListener(() => data.OnBackToHub?.Invoke());
        }

        private static string BuildContentKey(Data data)
        {
            if (!data.IsRuntimeReady)
            {
                return "not-ready";
            }

            if (data.IsFinished)
            {
                return "finished";
            }

            if (data.Task == null)
            {
                return "no-task";
            }

            return $"{data.Task.taskId}-{data.Task.taskType}";
        }

        private void BuildDefaultUi(Transform root)
        {
            RectTransform panel = UiPrimitives.CreatePanel(
                "Panel",
                root,
                new Vector2(0f, 0f),
                new Vector2(1f, 1f),
                new Vector2(20f, 20f),
                new Vector2(-20f, -20f),
                new Color(1f, 1f, 1f, 0.93f));

            UiPrimitives.AddVerticalLayout(panel, spacing: 8f, forceExpandHeight: false);
            panel.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.Unconstrained;

            UiPrimitives.CreateLabel("Title", panel, "Level Runtime (WP3)", 30, TextAlignmentOptions.Left);
            _activeLevelLabel = UiPrimitives.CreateLabel("ActiveLevel", panel, string.Empty, 18, TextAlignmentOptions.Left);
            _statusLabel = UiPrimitives.CreateLabel("Status", panel, string.Empty, 18, TextAlignmentOptions.Left);
            _uxStateLabel = UiPrimitives.CreateLabel("UxState", panel, string.Empty, 18, TextAlignmentOptions.Left);
            _submittingLabel = UiPrimitives.CreateLabel("Submitting", panel, "Bitte warten: Antwort wird bewertet ...", 18, TextAlignmentOptions.Left);

            _contentRoot = new GameObject("Content").AddComponent<RectTransform>();
            _contentRoot.SetParent(panel, false);
            UiPrimitives.AddVerticalLayout(_contentRoot, spacing: 8f);
            LayoutElement contentLayout = _contentRoot.gameObject.AddComponent<LayoutElement>();
            contentLayout.flexibleHeight = 1f;
            contentLayout.minHeight = 320f;

            RectTransform footer = new GameObject("Footer").AddComponent<RectTransform>();
            footer.SetParent(panel, false);
            HorizontalLayoutGroup footerLayout = footer.gameObject.AddComponent<HorizontalLayoutGroup>();
            footerLayout.spacing = 8f;
            footerLayout.childControlHeight = false;
            footerLayout.childControlWidth = false;
            footerLayout.childAlignment = TextAnchor.MiddleRight;

            _retryButton = UiPrimitives.CreateButton("RetryButton", footer, "Erneut versuchen", null);
            _backButton = UiPrimitives.CreateButton("BackButton", footer, "Zurueck zum Hub", null);
        }

        private void RebuildContent(Data data)
        {
            foreach (Transform child in _contentRoot)
            {
                Destroy(child.gameObject);
            }

            if (!data.IsRuntimeReady)
            {
                UiPrimitives.CreateLabel("NotReady", _contentRoot, "Runtime ist noch nicht bereit.", 20, TextAlignmentOptions.Left);
                return;
            }

            if (data.IsFinished)
            {
                UiPrimitives.CreateLabel(
                    "Finished",
                    _contentRoot,
                    $"Level abgeschlossen. Score: {data.TotalScoreEarned}/{data.TotalScoreMax}",
                    20,
                    TextAlignmentOptions.Left);
                return;
            }

            if (data.Task == null)
            {
                UiPrimitives.CreateLabel("MissingTask", _contentRoot, "Keine aktive Aufgabe gefunden.", 20, TextAlignmentOptions.Left);
                return;
            }

            UiPrimitives.CreateLabel(
                "TaskTitle",
                _contentRoot,
                $"Task {data.CurrentTaskIndex + 1}: {data.Task.taskId} ({data.Task.taskType})",
                21,
                TextAlignmentOptions.Left);
            UiPrimitives.CreateLabel("Prompt", _contentRoot, data.Task.prompt, 19, TextAlignmentOptions.Left);

            switch (data.Task.ResolveTaskType())
            {
                case TaskType.MultipleChoice:
                    BuildMultipleChoice(data);
                    break;
                case TaskType.Matching:
                    BuildMatching(data);
                    break;
                case TaskType.ClozeText:
                    BuildCloze(data);
                    break;
                case TaskType.ErrorHunt:
                    BuildErrorHunt(data);
                    break;
                case TaskType.DragDrop:
                    BuildDragDrop(data);
                    break;
                case TaskType.LlmFreeText:
                    BuildLlmFreeText(data);
                    break;
                case TaskType.LlmWordGuess:
                    BuildLlmWordGuess(data);
                    break;
                default:
                    BuildUnsupported(data);
                    break;
            }
        }

        private void BuildMultipleChoice(Data data)
        {
            UiPrimitives.CreateLabel("Question", _contentRoot, data.Task.question, 18, TextAlignmentOptions.Left);
            foreach (MultipleChoiceOption option in data.Task.choices)
            {
                string optionId = option.id;
                UiPrimitives.CreateButton($"Choice_{optionId}", _contentRoot, option.label, () => data.OnSubmitMultipleChoice?.Invoke(optionId));
            }
        }

        private void BuildMatching(Data data)
        {
            UiPrimitives.CreateLabel("Hint", _contentRoot, "Format pro Zeile: linker Begriff => rechter Begriff", 18, TextAlignmentOptions.Left);
            foreach (string left in data.Task.leftItems)
            {
                RectTransform row = new GameObject($"Match_{left}").AddComponent<RectTransform>();
                row.SetParent(_contentRoot, false);
                HorizontalLayoutGroup rowLayout = row.gameObject.AddComponent<HorizontalLayoutGroup>();
                rowLayout.spacing = 6f;
                rowLayout.childControlHeight = false;
                rowLayout.childControlWidth = false;
                rowLayout.childAlignment = TextAnchor.MiddleLeft;

                UiPrimitives.CreateLabel("Left", row, left, 18, TextAlignmentOptions.Left);
                TMP_InputField input = UiPrimitives.CreateInputField(
                    $"Input_{left}",
                    row,
                    "Antwort",
                    data.GetMatchingInput?.Invoke(left) ?? string.Empty,
                    value => data.SetMatchingInput?.Invoke(left, value));
                input.GetComponent<RectTransform>().sizeDelta = new Vector2(260f, 34f);
            }

            UiPrimitives.CreateButton("SubmitMatching", _contentRoot, "Matching pruefen", () => data.OnSubmitMatching?.Invoke());
        }

        private void BuildCloze(Data data)
        {
            UiPrimitives.CreateLabel("Template", _contentRoot, data.Task.templateText, 18, TextAlignmentOptions.Left);
            foreach (ClozeGapDefinition gap in data.Task.gaps)
            {
                string gapId = gap.gapId;
                RectTransform row = new GameObject($"Gap_{gapId}").AddComponent<RectTransform>();
                row.SetParent(_contentRoot, false);
                HorizontalLayoutGroup rowLayout = row.gameObject.AddComponent<HorizontalLayoutGroup>();
                rowLayout.spacing = 6f;
                rowLayout.childControlHeight = false;
                rowLayout.childControlWidth = false;
                rowLayout.childAlignment = TextAnchor.MiddleLeft;

                UiPrimitives.CreateLabel("GapLabel", row, gapId, 18, TextAlignmentOptions.Left);
                TMP_InputField input = UiPrimitives.CreateInputField(
                    $"GapInput_{gapId}",
                    row,
                    "Antwort",
                    data.GetClozeInput?.Invoke(gapId) ?? string.Empty,
                    value => data.SetClozeInput?.Invoke(gapId, value));
                input.GetComponent<RectTransform>().sizeDelta = new Vector2(260f, 34f);
            }

            UiPrimitives.CreateButton("SubmitCloze", _contentRoot, "Luecken pruefen", () => data.OnSubmitCloze?.Invoke());
        }

        private void BuildErrorHunt(Data data)
        {
            UiPrimitives.CreateLabel("TextWithError", _contentRoot, data.Task.textWithError, 18, TextAlignmentOptions.Left);
            UiPrimitives.CreateInputField(
                "ErrorInput",
                _contentRoot,
                "Korrektur eingeben",
                data.FreeTextInput,
                value => data.SetFreeTextInput?.Invoke(value));
            UiPrimitives.CreateButton("SubmitErrorHunt", _contentRoot, "Korrektur pruefen", () => data.OnSubmitFreeText?.Invoke());
        }

        private void BuildDragDrop(Data data)
        {
            UiPrimitives.CreateLabel("Hint", _contentRoot, "Gib die Reihenfolge als CSV ein (z. B. io,mangio,pane)", 18, TextAlignmentOptions.Left);
            UiPrimitives.CreateLabel("Tokens", _contentRoot, $"Tokens: {string.Join(", ", data.Task.tokens)}", 18, TextAlignmentOptions.Left);
            UiPrimitives.CreateInputField(
                "DragDropInput",
                _contentRoot,
                "token1,token2,token3",
                data.DragDropInput,
                value => data.SetDragDropInput?.Invoke(value));
            UiPrimitives.CreateButton("SubmitDragDrop", _contentRoot, "Reihenfolge pruefen", () => data.OnSubmitDragDrop?.Invoke());
        }

        private void BuildLlmFreeText(Data data)
        {
            UiPrimitives.CreateLabel("Hint", _contentRoot, "Schreibe deine Antwort frei auf Italienisch:", 18, TextAlignmentOptions.Left);
            UiPrimitives.CreateInputField(
                "FreeTextInput",
                _contentRoot,
                "Antwort",
                data.FreeTextInput,
                value => data.SetFreeTextInput?.Invoke(value));
            UiPrimitives.CreateButton("SubmitLlm", _contentRoot, "Antwort bewerten", () => data.OnSubmitFreeText?.Invoke());
        }

        private void BuildLlmWordGuess(Data data)
        {
            UiPrimitives.CreateLabel("Hint", _contentRoot, "Beschreibe das Zielwort auf Italienisch:", 18, TextAlignmentOptions.Left);
            UiPrimitives.CreateInputField(
                "WordGuessInput",
                _contentRoot,
                "Beschreibung",
                data.FreeTextInput,
                value => data.SetFreeTextInput?.Invoke(value));
            UiPrimitives.CreateLabel("Attempts", _contentRoot, $"Max. Versuche: {data.Task.maxGuessAttempts}", 18, TextAlignmentOptions.Left);
            UiPrimitives.CreateButton("SubmitWordGuess", _contentRoot, "Beschreibung pruefen", () => data.OnSubmitFreeText?.Invoke());
        }

        private void BuildUnsupported(Data data)
        {
            UiPrimitives.CreateLabel("UnsupportedHint", _contentRoot, "Dieser Modus wird aktuell nicht ausgewertet.", 18, TextAlignmentOptions.Left);
            UiPrimitives.CreateInputField(
                "UnsupportedInput",
                _contentRoot,
                "Antwort",
                data.FreeTextInput,
                value => data.SetFreeTextInput?.Invoke(value));
            UiPrimitives.CreateButton("SubmitUnsupported", _contentRoot, "Als nicht unterstuetzt markieren", () => data.OnSubmitUnsupported?.Invoke());
        }
    }
}
