using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Host step for <c>SpecialScreen*</c> tasks: shared chrome + sequential embedded mechanics (blocks).
    /// Learners move between parts with <c>Indietro</c> / <c>Avanti</c>; shell primary <c>Controlla</c> completes only after every block validates (must be on the last part).
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
        private bool _useMessengerChrome;

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

            /// <summary>True when embedded <see cref="Bind"/> produced a usable mechanic.</summary>
            bool IsBinderReady { get; }
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
            _useMessengerChrome = false;

            _host.Clear();

            if (!TryParseSpecialScreenContent(context?.contentJson, context?.taskType ?? string.Empty, out var dto,
                    out var parseError))
            {
                Debug.LogWarning($"[SpecialScreenToolkitStep] Invalid contentJson: {parseError ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(parseError)
                    ? "Contenuto della schermata speciale non valido."
                    : parseError);
                return;
            }

            _useMessengerChrome = ShouldUseMessengerChrome(dto, context?.taskType ?? string.Empty);

            if (!TryBuildChrome())
            {
                context?.presentValidationMessage?.Invoke(
                    "Impossibile costruire la cornice della schermata speciale.");
                return;
            }

            ApplyMessengerChromeShell();
            ApplyChromeTitles(dto);

            foreach (var blockDto in dto.blocks)
            {
                var slot = new VisualElement();
                slot.style.flexGrow = 1;
                slot.style.display = DisplayStyle.None;
                _blockArea.Add(slot);
                _slots.Add(slot);
                _blocks.Add(CreateNestedBlock(blockDto));
            }

            for (var i = 0; i < _blocks.Count; i++)
            {
                if (_useMessengerChrome)
                    BuildMessengerChromeInSlot(_slots[i], dto, i, _blocks[i], context);
                else
                    _blocks[i].Bind(_slots[i], context);
            }

            for (var i = 0; i < _blocks.Count; i++)
            {
                if (_blocks[i].IsBinderReady)
                    continue;

                context?.presentValidationMessage?.Invoke(
                    $"La parte {i + 1} non è stata caricata correttamente.");
                AbortIncompleteBind();
                return;
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
                _context?.presentValidationMessage?.Invoke(
                    "Questa schermata non è ancora pronta.");
                return;
            }

            if (_currentIndex != _blocks.Count - 1)
            {
                _context?.presentValidationMessage?.Invoke(
                    "Completa tutte le parti con «Avanti» prima di premere Controlla.");
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
            _useMessengerChrome = false;
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
            _useMessengerChrome = false;
        }

        private void AbortIncompleteBind()
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
            _useMessengerChrome = false;
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

            var prev = new Button { name = "special-screen-prev", text = "Indietro" };
            prev.AddToClassList("lg-btn");
            prev.AddToClassList("lg-btn--secondary");

            var next = new Button { name = "special-screen-next", text = "Avanti" };
            next.AddToClassList("lg-btn");
            next.AddToClassList("lg-btn--primary");

            navRow.Add(prev);
            navRow.Add(next);
            outer.Add(navRow);

            _host.Add(outer);
        }

        private void ApplyMessengerChromeShell()
        {
            if (_blockArea == null)
                return;

            if (_useMessengerChrome)
                _blockArea.AddToClassList("lg-special-screen-block-area");
            else
                _blockArea.RemoveFromClassList("lg-special-screen-block-area");
        }

        private void ApplyChromeTitles(SpecialScreenContentDto dto)
        {
            var titleLabel = _root.Q<Label>("special-screen-title");
            if (titleLabel != null)
            {
                if (_useMessengerChrome)
                {
                    titleLabel.style.display = DisplayStyle.None;
                }
                else
                {
                    var t = dto.title?.Trim() ?? string.Empty;
                    titleLabel.text = t;
                    titleLabel.style.display = string.IsNullOrEmpty(t) ? DisplayStyle.None : DisplayStyle.Flex;
                }
            }

            var subtitleLabel = _root.Q<Label>("special-screen-subtitle");
            if (subtitleLabel != null)
            {
                if (_useMessengerChrome)
                {
                    subtitleLabel.style.display = DisplayStyle.None;
                }
                else
                {
                    var s = dto.subtitle?.Trim() ?? string.Empty;
                    subtitleLabel.text = s;
                    subtitleLabel.style.display = string.IsNullOrEmpty(s) ? DisplayStyle.None : DisplayStyle.Flex;
                }
            }
        }

        private void BuildMessengerChromeInSlot(
            VisualElement slot,
            SpecialScreenContentDto dto,
            int slotBlockIndex,
            ISpecialScreenNestedBlock nested,
            StepContext parentContext)
        {
            slot.Clear();

            var phone = new VisualElement();
            phone.AddToClassList("lg-special-phone");
            if (IsWhatsAppSkin(dto.screenVariant))
                phone.AddToClassList("lg-special-phone--whatsapp");

            var sbDto = dto.smsChrome.statusBar ?? new SpecialScreenSmsStatusBarDto();
            var statusRow = new VisualElement();
            statusRow.AddToClassList("lg-special-phone__status");

            var timeText = string.IsNullOrWhiteSpace(sbDto.timeText) ? "9:41" : sbDto.timeText.Trim();
            var timeLbl = new Label(timeText);
            timeLbl.AddToClassList("lg-special-phone__status-time");

            var signalText = string.IsNullOrWhiteSpace(sbDto.signalHint) ? "●●●●●" : sbDto.signalHint.Trim();
            var sigLbl = new Label(signalText);
            sigLbl.AddToClassList("lg-special-phone__status-signal");

            statusRow.Add(timeLbl);
            statusRow.Add(sigLbl);
            phone.Add(statusRow);

            var header = dto.smsChrome.chatHeaderTitle?.Trim();
            if (!string.IsNullOrEmpty(header))
            {
                var headerRow = new VisualElement();
                headerRow.AddToClassList("lg-special-phone__header");
                var ht = new Label(header);
                ht.AddToClassList("lg-special-phone__header-title");
                headerRow.Add(ht);
                phone.Add(headerRow);
            }

            var scroll = new ScrollView(ScrollViewMode.Vertical);
            scroll.AddToClassList("lg-special-phone__scroll");
            scroll.style.flexGrow = 1;

            foreach (var msgDto in dto.smsChrome.messages)
            {
                if (msgDto == null)
                    continue;

                var incoming = IsIncomingDirection(msgDto.direction);
                var embedHere = msgDto.hostsEmbeddedMechanic &&
                                msgDto.embeddedMechanicBlockIndex == slotBlockIndex;

                var row = new VisualElement();
                row.AddToClassList("lg-special-chat-row");
                row.style.flexDirection = FlexDirection.Row;
                row.style.width = Length.Percent(100);
                row.style.justifyContent = incoming ? Justify.FlexStart : Justify.FlexEnd;

                var bubble = new VisualElement();
                bubble.AddToClassList(incoming ? "lg-special-bubble--in" : "lg-special-bubble--out");

                if (!string.IsNullOrWhiteSpace(msgDto.author))
                {
                    var auth = new Label(msgDto.author.Trim());
                    auth.AddToClassList("lg-special-bubble__author");
                    bubble.Add(auth);
                }

                if (embedHere)
                {
                    var mechanicHost = new VisualElement();
                    mechanicHost.AddToClassList("lg-special-bubble__mechanic");
                    mechanicHost.style.flexGrow = 1;
                    mechanicHost.style.flexShrink = 0;
                    bubble.Add(mechanicHost);
                    nested.Bind(mechanicHost, parentContext);
                }
                else
                {
                    var txt = msgDto.text?.Trim() ?? string.Empty;
                    if (!string.IsNullOrEmpty(txt))
                    {
                        var body = new Label(txt);
                        body.AddToClassList("lg-special-bubble__text");
                        body.style.whiteSpace = WhiteSpace.Normal;
                        bubble.Add(body);
                    }
                }

                row.Add(bubble);
                scroll.Add(row);
            }

            phone.Add(scroll);
            slot.Add(phone);
        }

        private static bool ShouldUseMessengerChrome(SpecialScreenContentDto dto, string taskType)
        {
            if (dto?.smsChrome?.messages == null || dto.smsChrome.messages.Length == 0)
                return false;

            if (!string.IsNullOrEmpty(taskType) &&
                string.Equals(taskType, "SpecialScreenSms", StringComparison.OrdinalIgnoreCase))
                return true;

            return IsMessengerScreenVariant(dto.screenVariant);
        }

        private static bool IsMessengerScreenVariant(string screenVariant)
        {
            var v = screenVariant?.Trim() ?? string.Empty;
            return string.Equals(v, "sms", StringComparison.OrdinalIgnoreCase)
                   || string.Equals(v, "whatsapp", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsWhatsAppSkin(string screenVariant)
        {
            var v = screenVariant?.Trim() ?? string.Empty;
            return string.Equals(v, "whatsapp", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsIncomingDirection(string direction)
        {
            var d = direction?.Trim() ?? string.Empty;
            return string.Equals(d, "incoming", StringComparison.OrdinalIgnoreCase);
        }

        private static bool ValidateMessengerChrome(SpecialScreenContentDto dto, out string error)
        {
            error = null;
            var messages = dto.smsChrome.messages;
            var embedded = new HashSet<int>();

            for (var mi = 0; mi < messages.Length; mi++)
            {
                var m = messages[mi];
                if (m == null)
                    continue;

                var dir = m.direction?.Trim() ?? string.Empty;
                if (!string.Equals(dir, "incoming", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(dir, "outgoing", StringComparison.OrdinalIgnoreCase))
                {
                    error = $"Messaggio {mi + 1}: «direction» deve essere incoming o outgoing.";
                    return false;
                }

                if (!m.hostsEmbeddedMechanic)
                    continue;

                var idx = m.embeddedMechanicBlockIndex;
                if (idx < 0 || idx >= dto.blocks.Length)
                {
                    error = $"Messaggio {mi + 1}: embeddedMechanicBlockIndex non valido.";
                    return false;
                }

                if (!embedded.Add(idx))
                {
                    error = $"Il blocco {idx + 1} è referenziato da più messaggi.";
                    return false;
                }
            }

            for (var bi = 0; bi < dto.blocks.Length; bi++)
            {
                if (embedded.Contains(bi))
                    continue;

                error =
                    $"Aggiungi un messaggio con hostsEmbeddedMechanic per il blocco {bi + 1} (embeddedMechanicBlockIndex).";
                return false;
            }

            return true;
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
                    ? $"Parte {_currentIndex + 1} di {_blocks.Count}"
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
                _ => throw new InvalidOperationException(
                    $"Tipo di blocco interno non gestito per «{dto.blockType}».")
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
                        error = "Manca il campo clozeText.";
                        return false;
                    }

                    var jc = JsonUtility.ToJson(b.clozeText);
                    return ClozeTextToolkitStep.TryParseContentDto(jc, out _, out error);

                case BlockKind.ErrorSpotting:
                    if (b.errorSpotting == null)
                    {
                        error = "Manca il campo errorSpotting.";
                        return false;
                    }

                    var je = JsonUtility.ToJson(b.errorSpotting);
                    return ErrorSpottingToolkitStep.TryParseContentDto(je, out _, out error);

                case BlockKind.Stub:
                    return true;

                default:
                    error = $"Tipo di blocco non supportato: «{b.blockType}».";
                    return false;
            }
        }

        private static bool TryParseSpecialScreenContent(string json, string taskType,
            out SpecialScreenContentDto dto,
            out string error)
        {
            dto = null;
            error = null;

            if (string.IsNullOrWhiteSpace(json))
            {
                error = "Contenuto mancante.";
                return false;
            }

            if (!json.TrimStart().StartsWith("{", StringComparison.Ordinal))
            {
                error = "Il contenuto deve essere un oggetto JSON.";
                return false;
            }

            dto = JsonUtility.FromJson<SpecialScreenContentDto>(json);
            if (dto?.blocks == null || dto.blocks.Length == 0)
            {
                error = "Serve almeno un blocco nella schermata speciale.";
                return false;
            }

            for (var i = 0; i < dto.blocks.Length; i++)
            {
                var b = dto.blocks[i];
                if (b == null || string.IsNullOrWhiteSpace(b.blockType))
                {
                    error = $"Blocco {i + 1}: manca blockType.";
                    return false;
                }

                if (!ValidateBlockPayload(b, out var blockError))
                {
                    error = $"Blocco {i + 1}: {blockError}";
                    return false;
                }
            }

            if (ShouldUseMessengerChrome(dto, taskType ?? string.Empty) &&
                !ValidateMessengerChrome(dto, out error))
                return false;

            error = null;
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
                _step = new ClozeTextToolkitStep(slot, useMutedChrome: false);
                var json = JsonUtility.ToJson(_dto);
                var ctx = CloneStepContext(parentContext, json);
                _step.Bind(ctx, _ => { });
            }

            public bool IsBinderReady => _step != null && _step.IsBinderReady;

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
                    message = "Il blocco testo a buchi non è stato caricato.";
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
                _step = new ErrorSpottingToolkitStep(slot, useMutedChrome: false);
                var json = JsonUtility.ToJson(_dto);
                var ctx = CloneStepContext(parentContext, json);
                _step.Bind(ctx, _ => { });
            }

            public bool IsBinderReady => _step != null && _step.IsBinderReady;

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
                    message = "Il blocco «trova gli errori» non è stato caricato.";
                    return false;
                }

                return _step.TryValidateLocally(out message);
            }
        }

        private sealed class StubNestedBlock : ISpecialScreenNestedBlock
        {
            private readonly SpecialScreenStubBlockDto _dto;
            private bool _ready;

            public StubNestedBlock(SpecialScreenStubBlockDto dto)
            {
                _dto = dto;
            }

            public bool IsBinderReady => _ready;

            public void Bind(VisualElement slot, StepContext parentContext)
            {
                _ready = false;
                slot.Clear();

                var panel = new VisualElement();
                panel.style.paddingTop = 8;
                panel.style.paddingBottom = 8;
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
                    ? "Segnaposto — layout in arrivo."
                    : dto.body.Trim();

                var body = new Label(bodyText);
                body.AddToClassList("lg-text-body");
                body.style.whiteSpace = WhiteSpace.Normal;
                panel.Add(body);

                slot.Add(panel);
                _ready = true;
            }

            public void SetInteractable(bool _) { }

            public void Teardown()
            {
                _ready = false;
            }

            public bool TryValidate(out string message)
            {
                message = null;
                return true;
            }
        }
    }
}
