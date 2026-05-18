using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Host step for <c>SpecialScreen*</c> tasks: shared chrome + sequential embedded mechanics (blocks).
    /// Shell <c>Check</c> completes only after every block validates (learners use <c>Next</c> between parts).
    /// </summary>
    public sealed class SpecialScreenToolkitStep : IStepView, ISubmitFromShell
    {
        private const string HostUxmlResourcePath = "UI/LearningToolkit/SpecialScreenHost";

        private readonly VisualElement _host;

        private VisualElement _root;
        private VisualElement _blockArea;
        private Button _prevButton;
        private Button _nextButton;
        private Label _progressLabel;

        private StepContext _context;
        private Action<StepCompletionRequest> _onRequest;

        private readonly List<ISpecialScreenNestedBlock> _blocks = new();
        private readonly List<VisualElement> _slots = new();

        private int _currentIndex;
        private bool _contentReady;
        private bool _interactable = true;

        private enum BlockKind
        {
            Unknown,
            Cloze,
            ErrorSpotting,
            Stub,
        }

        private interface ISpecialScreenNestedBlock
        {
            void Bind(VisualElement slot, StepContext parentContext);
            void SetInteractable(bool interactable);
            void Teardown();

            bool TryValidate(out string message);
        }

        public SpecialScreenToolkitStep(VisualElement host, MonoBehaviour _)
        {
            _host = host ?? throw new ArgumentNullException(nameof(host));
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            TeardownInner();

            _context = context;
            _onRequest = onRequest;
            _currentIndex = 0;
            _contentReady = false;
            _interactable = true;

            _host.Clear();

            if (!TryParseSpecialScreenContent(context?.contentJson, out var dto, out var parseError))
            {
                Debug.LogWarning($"[SpecialScreenToolkitStep] Invalid contentJson: {parseError ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(parseError)
                    ? "Invalid special screen content."
                    : parseError);
                return;
            }

            if (!TryBuildChrome())
            {
                context?.presentValidationMessage?.Invoke("Could not build special screen chrome.");
                return;
            }

            ApplyChromeTitles(dto);

            foreach (var blockDto in dto.blocks)
            {
                var slot = new VisualElement();
                slot.style.flexGrow = 1;
                slot.style.display = DisplayStyle.None;
                _blockArea.Add(slot);
                _slots.Add(slot);

                var nested = CreateNestedBlock(blockDto);
                nested.Bind(slot, context);
                _blocks.Add(nested);
            }

            if (_slots.Count > 0)
                _slots[0].style.display = DisplayStyle.Flex;

            RefreshNavigationChrome();
            _contentReady = true;
        }

        public void SetInteractable(bool interactable)
        {
            _interactable = interactable;
            foreach (var b in _blocks)
                b.SetInteractable(interactable);

            RefreshNavigationChrome();
        }

        public void SubmitFromShell()
        {
            if (!_contentReady)
            {
                _context?.presentValidationMessage?.Invoke("This screen is not ready yet.");
                return;
            }

            if (_currentIndex != _blocks.Count - 1)
            {
                _context?.presentValidationMessage?.Invoke("Continue through all parts before pressing Check.");
                return;
            }

            foreach (var block in _blocks)
            {
                if (!block.TryValidate(out var msg))
                {
                    _context?.presentValidationMessage?.Invoke(msg);
                    return;
                }
            }

            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        public void Teardown()
        {
            foreach (var b in _blocks)
                b.Teardown();
            _blocks.Clear();
            _slots.Clear();
            _host.Clear();
            _context = null;
            _onRequest = null;
            _root = null;
            _blockArea = null;
            _prevButton = null;
            _nextButton = null;
            _progressLabel = null;
            _currentIndex = 0;
            _contentReady = false;
        }

        private void TeardownInner()
        {
            foreach (var b in _blocks)
                b.Teardown();
            _blocks.Clear();
            _slots.Clear();
            _host.Clear();
            _root = null;
            _blockArea = null;
            _prevButton = null;
            _nextButton = null;
            _progressLabel = null;
            _currentIndex = 0;
            _contentReady = false;
        }

        private bool TryBuildChrome()
        {
            var tpl = Resources.Load<VisualTreeAsset>(HostUxmlResourcePath);
            if (tpl != null)
            {
                tpl.CloneTree(_host);
                CacheChromeQueries();
                if (_blockArea != null && _prevButton != null && _nextButton != null)
                {
                    WireNavigationHandlers();
                    return true;
                }

                _host.Clear();
            }

            BuildFallbackChrome();
            CacheChromeQueries();
            if (_blockArea != null && _prevButton != null && _nextButton != null)
            {
                WireNavigationHandlers();
                return true;
            }

            return false;
        }

        private void CacheChromeQueries()
        {
            _root = _host.Q<VisualElement>("special-screen-root") ?? _host;
            _blockArea = _root.Q<VisualElement>("special-screen-block-area");
            _prevButton = _root.Q<Button>("special-screen-prev");
            _nextButton = _root.Q<Button>("special-screen-next");
            _progressLabel = _root.Q<Label>("special-screen-progress");
        }

        private void WireNavigationHandlers()
        {
            _prevButton.clicked -= OnPrevClicked;
            _prevButton.clicked += OnPrevClicked;
            _nextButton.clicked -= OnNextClicked;
            _nextButton.clicked += OnNextClicked;
        }

        private void BuildFallbackChrome()
        {
            var outer = new VisualElement();
            outer.name = "special-screen-root";
            outer.AddToClassList("lg-muted-panel");
            outer.style.flexGrow = 1;
            outer.style.flexDirection = FlexDirection.Column;
            outer.style.paddingTop = 16;
            outer.style.paddingBottom = 16;
            outer.style.paddingLeft = 16;
            outer.style.paddingRight = 16;

            var title = new Label { name = "special-screen-title" };
            title.AddToClassList("lg-heading-screen");
            title.style.whiteSpace = WhiteSpace.Normal;
            title.style.marginBottom = 8;
            outer.Add(title);

            var subtitle = new Label { name = "special-screen-subtitle" };
            subtitle.AddToClassList("lg-text-body");
            subtitle.AddToClassList("lg-text-muted");
            subtitle.style.whiteSpace = WhiteSpace.Normal;
            subtitle.style.marginBottom = 8;
            outer.Add(subtitle);

            var progress = new Label { name = "special-screen-progress" };
            progress.AddToClassList("lg-text-caption");
            progress.style.marginBottom = 12;
            outer.Add(progress);

            var blockArea = new VisualElement { name = "special-screen-block-area" };
            blockArea.style.flexGrow = 1;
            blockArea.style.minHeight = 120;
            outer.Add(blockArea);

            var navRow = new VisualElement();
            navRow.style.flexDirection = FlexDirection.Row;
            navRow.style.justifyContent = Justify.SpaceBetween;
            navRow.style.flexShrink = 0;
            navRow.style.marginTop = 12;

            var prev = new Button { name = "special-screen-prev", text = "Previous" };
            prev.AddToClassList("lg-btn");
            prev.AddToClassList("lg-btn--secondary");

            var next = new Button { name = "special-screen-next", text = "Next" };
            next.AddToClassList("lg-btn");
            next.AddToClassList("lg-btn--primary");

            navRow.Add(prev);
            navRow.Add(next);
            outer.Add(navRow);

            _host.Add(outer);
        }

        private void ApplyChromeTitles(SpecialScreenContentDto dto)
        {
            var titleLabel = _root.Q<Label>("special-screen-title");
            if (titleLabel != null)
            {
                var t = dto.title?.Trim() ?? string.Empty;
                titleLabel.text = t;
                titleLabel.style.display = string.IsNullOrEmpty(t) ? DisplayStyle.None : DisplayStyle.Flex;
            }

            var subtitleLabel = _root.Q<Label>("special-screen-subtitle");
            if (subtitleLabel != null)
            {
                var s = dto.subtitle?.Trim() ?? string.Empty;
                subtitleLabel.text = s;
                subtitleLabel.style.display = string.IsNullOrEmpty(s) ? DisplayStyle.None : DisplayStyle.Flex;
            }
        }

        private void OnPrevClicked()
        {
            if (!_contentReady || !_interactable || _currentIndex <= 0)
                return;

            _slots[_currentIndex].style.display = DisplayStyle.None;
            _currentIndex--;
            _slots[_currentIndex].style.display = DisplayStyle.Flex;
            RefreshNavigationChrome();
        }

        private void OnNextClicked()
        {
            if (!_contentReady || !_interactable || _currentIndex >= _blocks.Count - 1)
                return;

            if (!_blocks[_currentIndex].TryValidate(out var msg))
            {
                _context?.presentValidationMessage?.Invoke(msg);
                return;
            }

            _slots[_currentIndex].style.display = DisplayStyle.None;
            _currentIndex++;
            _slots[_currentIndex].style.display = DisplayStyle.Flex;
            RefreshNavigationChrome();
        }

        private void RefreshNavigationChrome()
        {
            if (_progressLabel != null)
            {
                _progressLabel.text = _blocks.Count > 0
                    ? $"Part {_currentIndex + 1} of {_blocks.Count}"
                    : string.Empty;
            }

            var atFirst = _currentIndex <= 0;
            var atLast = _blocks.Count == 0 || _currentIndex >= _blocks.Count - 1;

            if (_prevButton != null)
                _prevButton.SetEnabled(_interactable && !atFirst);

            if (_nextButton != null)
                _nextButton.SetEnabled(_interactable && !atLast);
        }

        private static BlockKind ClassifyBlock(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
                return BlockKind.Unknown;

            var t = raw.Trim();
            if (string.Equals(t, "cloze_text", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(t, "ClozeText", StringComparison.OrdinalIgnoreCase))
                return BlockKind.Cloze;

            if (string.Equals(t, "error_spotting", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(t, "ErrorSpotting", StringComparison.OrdinalIgnoreCase))
                return BlockKind.ErrorSpotting;

            if (string.Equals(t, "stub", StringComparison.OrdinalIgnoreCase))
                return BlockKind.Stub;

            return BlockKind.Unknown;
        }

        private static ISpecialScreenNestedBlock CreateNestedBlock(SpecialScreenBlockDto dto)
        {
            return ClassifyBlock(dto.blockType) switch
            {
                BlockKind.Cloze => new ClozeNestedBlock(dto.clozeText),
                BlockKind.ErrorSpotting => new ErrorSpottingNestedBlock(dto.errorSpotting),
                BlockKind.Stub => new StubNestedBlock(dto.stub),
                _ => throw new InvalidOperationException($"Unhandled block kind for '{dto.blockType}'.")
            };
        }

        private static bool ValidateBlockPayload(SpecialScreenBlockDto b, out string error)
        {
            error = null;
            switch (ClassifyBlock(b.blockType))
            {
                case BlockKind.Cloze:
                    if (b.clozeText == null)
                    {
                        error = "clozeText payload is missing.";
                        return false;
                    }

                    var jc = JsonUtility.ToJson(b.clozeText);
                    return ClozeTextToolkitStep.TryParseContentDto(jc, out _, out error);

                case BlockKind.ErrorSpotting:
                    if (b.errorSpotting == null)
                    {
                        error = "errorSpotting payload is missing.";
                        return false;
                    }

                    var je = JsonUtility.ToJson(b.errorSpotting);
                    return ErrorSpottingToolkitStep.TryParseContentDto(je, out _, out error);

                case BlockKind.Stub:
                    return true;

                default:
                    error = $"Unsupported block type '{b.blockType}'.";
                    return false;
            }
        }

        private static bool TryParseSpecialScreenContent(string json, out SpecialScreenContentDto dto,
            out string error)
        {
            dto = null;
            error = null;

            if (string.IsNullOrWhiteSpace(json))
            {
                error = "Missing content.";
                return false;
            }

            if (!json.TrimStart().StartsWith("{", StringComparison.Ordinal))
            {
                error = "Special screen content must be a JSON object.";
                return false;
            }

            dto = JsonUtility.FromJson<SpecialScreenContentDto>(json);
            if (dto?.blocks == null || dto.blocks.Length == 0)
            {
                error = "Special screen needs at least one block.";
                return false;
            }

            for (var i = 0; i < dto.blocks.Length; i++)
            {
                var b = dto.blocks[i];
                if (b == null || string.IsNullOrWhiteSpace(b.blockType))
                {
                    error = $"Block {i + 1}: missing blockType.";
                    return false;
                }

                if (!ValidateBlockPayload(b, out var blockError))
                {
                    error = $"Block {i + 1}: {blockError}";
                    return false;
                }
            }

            return true;
        }

        private static StepContext CloneStepContext(StepContext source, string contentJson)
        {
            return new StepContext
            {
                runId = source.runId,
                stepId = source.stepId,
                taskId = source.taskId,
                questId = source.questId,
                questDisplayName = source.questDisplayName,
                stepKind = source.stepKind,
                taskType = source.taskType,
                templateKey = source.templateKey,
                contentJson = contentJson,
                rewardRulesJson = source.rewardRulesJson,
                stepIndexZeroBased = source.stepIndexZeroBased,
                totalSteps = source.totalSteps,
                isLastStep = source.isLastStep,
                totalSlices = source.totalSlices,
                totalBackpackPieces = source.totalBackpackPieces,
                presentValidationMessage = source.presentValidationMessage,
                presentBusyOverlay = source.presentBusyOverlay,
                dismissBusyOverlay = source.dismissBusyOverlay,
                gameProgressApi = source.gameProgressApi,
            };
        }

        private sealed class ClozeNestedBlock : ISpecialScreenNestedBlock
        {
            private readonly ClozeTextContentDto _dto;
            private ClozeTextToolkitStep _step;

            public ClozeNestedBlock(ClozeTextContentDto dto)
            {
                _dto = dto;
            }

            public void Bind(VisualElement slot, StepContext parentContext)
            {
                _step = new ClozeTextToolkitStep(slot);
                var json = JsonUtility.ToJson(_dto);
                var ctx = CloneStepContext(parentContext, json);
                _step.Bind(ctx, _ => { });
            }

            public void SetInteractable(bool interactable)
            {
                _step?.SetInteractable(interactable);
            }

            public void Teardown()
            {
                _step?.Teardown();
                _step = null;
            }

            public bool TryValidate(out string message)
            {
                if (_step == null)
                {
                    message = "Cloze block failed to load.";
                    return false;
                }

                return _step.TryValidateLocally(out message);
            }
        }

        private sealed class ErrorSpottingNestedBlock : ISpecialScreenNestedBlock
        {
            private readonly ErrorSpottingContentDto _dto;
            private ErrorSpottingToolkitStep _step;

            public ErrorSpottingNestedBlock(ErrorSpottingContentDto dto)
            {
                _dto = dto;
            }

            public void Bind(VisualElement slot, StepContext parentContext)
            {
                _step = new ErrorSpottingToolkitStep(slot);
                var json = JsonUtility.ToJson(_dto);
                var ctx = CloneStepContext(parentContext, json);
                _step.Bind(ctx, _ => { });
            }

            public void SetInteractable(bool interactable)
            {
                _step?.SetInteractable(interactable);
            }

            public void Teardown()
            {
                _step?.Teardown();
                _step = null;
            }

            public bool TryValidate(out string message)
            {
                if (_step == null)
                {
                    message = "Error-spotting block failed to load.";
                    return false;
                }

                return _step.TryValidateLocally(out message);
            }
        }

        private sealed class StubNestedBlock : ISpecialScreenNestedBlock
        {
            private readonly SpecialScreenStubBlockDto _dto;

            public StubNestedBlock(SpecialScreenStubBlockDto dto)
            {
                _dto = dto;
            }

            public void Bind(VisualElement slot, StepContext parentContext)
            {
                slot.Clear();

                var panel = new VisualElement();
                panel.AddToClassList("lg-muted-panel");
                panel.style.paddingTop = 12;
                panel.style.paddingBottom = 12;
                panel.style.paddingLeft = 12;
                panel.style.paddingRight = 12;
                panel.style.flexGrow = 1;

                var dto = _dto ?? new SpecialScreenStubBlockDto();

                if (!string.IsNullOrWhiteSpace(dto.headline))
                {
                    var h = new Label(dto.headline.Trim());
                    h.AddToClassList("lg-heading-screen");
                    h.style.whiteSpace = WhiteSpace.Normal;
                    h.style.marginBottom = 8;
                    panel.Add(h);
                }

                var bodyText = string.IsNullOrWhiteSpace(dto.body)
                    ? "Placeholder block — upcoming layout."
                    : dto.body.Trim();

                var body = new Label(bodyText);
                body.AddToClassList("lg-text-body");
                body.style.whiteSpace = WhiteSpace.Normal;
                panel.Add(body);

                slot.Add(panel);
            }

            public void SetInteractable(bool _) { }

            public void Teardown()
            {
                // Slot cleared by host teardown.
            }

            public bool TryValidate(out string message)
            {
                message = null;
                return true;
            }
        }
    }
}
