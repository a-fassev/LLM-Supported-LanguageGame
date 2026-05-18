using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Host step for <c>SpecialScreen*</c> tasks: shared chrome plus either sequential embedded mechanics in <c>blocks[]</c>
    /// (paged with «←» / «→», shell primary <c>Controlla</c> after the last part), a display-only magazine/book reader layout
    /// via <see cref="SpecialScreenReaderChromeDto"/>, a photo gallery / slideshow via <see cref="SpecialScreenPhotoViewerChromeDto"/>,
    /// or an e-mail / letter editor frame via <see cref="SpecialScreenMailChromeDto"/>.
    /// </summary>
    public sealed class SpecialScreenToolkitStep : IStepView, ISubmitFromShell
    {
        private const string HostUxmlResourcePath = "UI/LearningToolkit/SpecialScreenHost";

        /// <summary>Shown when a message hosts a mechanic for another «part» and no preview <c>text</c> was authored.</summary>
        private const string MessengerDeferredMechanicPlaceholder = "…";

        /// <summary>Delay before firing step completion after mail «send» acknowledgement (milliseconds).</summary>
        private const int MailSendAckDelayMs = 450;

        private readonly VisualElement _host;

        private VisualElement _root;
        private VisualElement _blockArea;
        private VisualElement _navRow;
        private Button _prevButton;
        private Button _nextButton;
        private Label _progressLabel;

        private StepContext _context;
        private Action<StepCompletionRequest> _onRequest;

        private readonly List<ISpecialScreenNestedBlock> _blocks = new();
        private readonly List<VisualElement> _slots = new();
        private readonly List<Coroutine> _readerImageLoads = new();
        private readonly List<Texture2D> _readerRemoteTextures = new();

        private int _currentIndex;
        private bool _contentReady;
        private bool _interactable = true;
        private bool _useMessengerChrome;
        private bool _readerDisplayOnly;
        private bool _usePhotoChrome;
        private bool _photoDisplayOnly;
        private bool _useMailChrome;

        private Button _mailSendButton;
        private Label _mailSendAckLabel;
        private string _mailSendSuccessText;
        private bool _mailCompletionPending;

        private readonly MonoBehaviour _coroutineHost;

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

        /// <summary>Creates the special-screen host bound to the shell <c>step-host</c>.</summary>
        /// <param name="host">Visual container for this step.</param>
        /// <param name="coroutineHost">
        /// MonoBehaviour used to start reader hero image loads (<see cref="BuildReaderLayout"/>).
        /// When null, remote <c>readerChrome.imageUrl</c> is skipped with a logged warning.</param>
        public SpecialScreenToolkitStep(VisualElement host, MonoBehaviour coroutineHost)
        {
            _host = host ?? throw new ArgumentNullException(nameof(host));
            _coroutineHost = coroutineHost;
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
            _readerDisplayOnly = false;
            _usePhotoChrome = false;
            _photoDisplayOnly = false;
            _useMailChrome = false;
            _mailSendButton = null;
            _mailSendAckLabel = null;
            _mailSendSuccessText = null;
            _mailCompletionPending = false;

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

            var tt = context?.taskType ?? string.Empty;
            var useReaderChromeForLayout = ShouldUseReaderChrome(dto, tt);
            _useMailChrome = ShouldUseMailChrome(dto, tt);
            _usePhotoChrome = ShouldUsePhotoViewerChrome(dto, tt) && !useReaderChromeForLayout && !_useMailChrome;
            _useMessengerChrome = ShouldUseMessengerChrome(dto, tt) && !_useMailChrome;
            var readerWithoutMechanicsBlocks = dto.blocks == null || dto.blocks.Length == 0;
            _readerDisplayOnly = useReaderChromeForLayout && readerWithoutMechanicsBlocks;
            _photoDisplayOnly = _usePhotoChrome && readerWithoutMechanicsBlocks &&
                                !PhotoChromeRequiresLearnerCaption(dto.photoViewerChrome);

            if (!TryBuildChrome())
            {
                context?.presentValidationMessage?.Invoke(
                    "Impossibile costruire la cornice della schermata speciale.");
                return;
            }

            ApplyMessengerChromeShell();
            ApplyChromeTitles(dto);

            if (_readerDisplayOnly)
            {
                BuildReaderLayout(dto, context);
            }
            else if (_usePhotoChrome)
            {
                BuildPhotoAndNestedMechanicSlots(dto, context);
            }
            else if (_useMailChrome)
            {
                BuildMailChromeLayout(dto, context);
            }
            else
            {
                var blockList = dto.blocks;
                if (blockList == null)
                {
                    context?.presentValidationMessage?.Invoke("Contenuto della schermata speciale non valido.");
                    return;
                }

                foreach (var blockDto in blockList)
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
            }

            RefreshNavigationChrome();
            _contentReady = true;
        }

        public void SetInteractable(bool interactable)
        {
            _interactable = interactable;
            foreach (var b in _blocks)
                b.SetInteractable(interactable);

            if (_mailSendButton != null)
                _mailSendButton.SetEnabled(_interactable && !_mailCompletionPending);

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

            if (_mailCompletionPending)
            {
                if (Debug.isDebugBuild)
                    Debug.Log("[SpecialScreenToolkitStep] SubmitFromShell skipped: mail completion pending.");
                return;
            }

            if (!_readerDisplayOnly)
            {
                if (_blocks.Count > 0 && _currentIndex != _blocks.Count - 1)
                {
                    var msg = _useMailChrome
                        ? "Completa tutte le parti con «→» prima di premere Controlla o Invia."
                        : "Completa tutte le parti con «→» prima di premere Controlla.";
                    _context?.presentValidationMessage?.Invoke(msg);
                    return;
                }
            }

            foreach (var block in _blocks)
            {
                if (!block.TryValidate(out var msg))
                {
                    _context?.presentValidationMessage?.Invoke(msg);
                    return;
                }
            }

            if (_useMailChrome)
            {
                var ack = _mailSendSuccessText?.Trim() ?? string.Empty;
                if (string.IsNullOrEmpty(ack))
                    ack = "E-mail inviata.";

                if (_mailSendAckLabel != null)
                {
                    _mailSendAckLabel.text = ack;
                    _mailSendAckLabel.style.display = DisplayStyle.Flex;
                }

                if (_mailSendButton != null)
                    _mailSendButton.SetEnabled(false);

                if (_root != null)
                {
                    _mailCompletionPending = true;
                    _root.schedule.Execute(CompleteAfterMailAck).StartingIn(MailSendAckDelayMs);
                    return;
                }
            }

            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        private void CompleteAfterMailAck()
        {
            _mailCompletionPending = false;

            if (!_contentReady || _context == null)
                return;

            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        public void Teardown()
        {
            StopReaderRemoteLoads();
            UnwireMailSendButton();
            foreach (var b in _blocks)
                b.Teardown();
            _blocks.Clear();
            _slots.Clear();
            _host.Clear();
            _context = null;
            _onRequest = null;
            _root = null;
            _blockArea = null;
            _navRow = null;
            _prevButton = null;
            _nextButton = null;
            _progressLabel = null;
            _currentIndex = 0;
            _contentReady = false;
            _useMessengerChrome = false;
            _readerDisplayOnly = false;
            _usePhotoChrome = false;
            _photoDisplayOnly = false;
            _useMailChrome = false;
            _mailSendAckLabel = null;
            _mailSendSuccessText = null;
            _mailCompletionPending = false;
        }

        private void TeardownInner()
        {
            StopReaderRemoteLoads();
            UnwireMailSendButton();
            foreach (var b in _blocks)
                b.Teardown();
            _blocks.Clear();
            _slots.Clear();
            _host.Clear();
            _root = null;
            _blockArea = null;
            _navRow = null;
            _prevButton = null;
            _nextButton = null;
            _progressLabel = null;
            _currentIndex = 0;
            _contentReady = false;
            _useMessengerChrome = false;
            _readerDisplayOnly = false;
            _usePhotoChrome = false;
            _photoDisplayOnly = false;
            _useMailChrome = false;
            _mailSendAckLabel = null;
            _mailSendSuccessText = null;
            _mailCompletionPending = false;
        }

        private void AbortIncompleteBind()
        {
            StopReaderRemoteLoads();
            UnwireMailSendButton();
            foreach (var b in _blocks)
                b.Teardown();
            _blocks.Clear();
            _slots.Clear();
            _host.Clear();
            _root = null;
            _blockArea = null;
            _navRow = null;
            _prevButton = null;
            _nextButton = null;
            _progressLabel = null;
            _currentIndex = 0;
            _contentReady = false;
            _useMessengerChrome = false;
            _readerDisplayOnly = false;
            _usePhotoChrome = false;
            _photoDisplayOnly = false;
            _useMailChrome = false;
            _mailSendAckLabel = null;
            _mailSendSuccessText = null;
            _mailCompletionPending = false;
        }

        private void UnwireMailSendButton()
        {
            if (_mailSendButton == null)
                return;

            _mailSendButton.clicked -= OnMailSendClicked;
            _mailSendButton = null;
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
            _navRow = _root.Q<VisualElement>("special-screen-nav-row");
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

            var blockArea = new VisualElement { name = "special-screen-block-area" };
            blockArea.style.flexGrow = 1;
            blockArea.style.minHeight = 120;
            outer.Add(blockArea);

            var navRow = new VisualElement { name = "special-screen-nav-row" };
            navRow.style.flexDirection = FlexDirection.Row;
            navRow.style.alignItems = Align.Center;
            navRow.style.justifyContent = Justify.Center;
            navRow.style.flexShrink = 0;
            navRow.style.marginTop = 12;

            var prev = new Button { name = "special-screen-prev", text = "\u2190" };
            prev.AddToClassList("lg-btn");
            prev.AddToClassList("lg-btn--secondary");

            var progress = new Label { name = "special-screen-progress" };
            progress.AddToClassList("lg-text-caption");
            progress.style.marginLeft = 12;
            progress.style.marginRight = 12;

            var next = new Button { name = "special-screen-next", text = "\u2192" };
            next.AddToClassList("lg-btn");
            next.AddToClassList("lg-btn--secondary");

            navRow.Add(prev);
            navRow.Add(progress);
            navRow.Add(next);
            outer.Add(navRow);

            _host.Add(outer);
        }

        private void ApplyMessengerChromeShell()
        {
            if (_blockArea == null)
                return;

            _blockArea.RemoveFromClassList("lg-special-screen-block-area");
            _blockArea.RemoveFromClassList("lg-special-screen-reader-area");
            _blockArea.RemoveFromClassList("lg-special-screen-photo-area");
            _blockArea.RemoveFromClassList("lg-special-screen-mail-area");

            if (_useMessengerChrome)
                _blockArea.AddToClassList("lg-special-screen-block-area");
            else if (_readerDisplayOnly)
                _blockArea.AddToClassList("lg-special-screen-reader-area");
            else if (_usePhotoChrome)
                _blockArea.AddToClassList("lg-special-screen-photo-area");
            else if (_useMailChrome)
                _blockArea.AddToClassList("lg-special-screen-mail-area");
        }

        private void ApplyChromeTitles(SpecialScreenContentDto dto)
        {
            var titleLabel = _root.Q<Label>("special-screen-title");
            if (titleLabel != null)
            {
                if (_useMessengerChrome || _readerDisplayOnly || _useMailChrome)
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
                if (_useMessengerChrome || _readerDisplayOnly || _useMailChrome)
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

        private void BuildPhotoAndNestedMechanicSlots(SpecialScreenContentDto dto, StepContext context)
        {
            var photoSlot = new VisualElement();
            photoSlot.style.flexGrow = 1;
            photoSlot.style.display = DisplayStyle.None;
            _blockArea.Add(photoSlot);
            _slots.Add(photoSlot);
            _blocks.Add(new PhotoViewerNestedBlock(dto.photoViewerChrome, _coroutineHost));

            var extra = dto.blocks;
            if (extra != null)
            {
                foreach (var blockDto in extra)
                {
                    var slot = new VisualElement();
                    slot.style.flexGrow = 1;
                    slot.style.display = DisplayStyle.None;
                    _blockArea.Add(slot);
                    _slots.Add(slot);
                    _blocks.Add(CreateNestedBlock(blockDto));
                }
            }

            for (var i = 0; i < _blocks.Count; i++)
                _blocks[i].Bind(_slots[i], context);

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
        }

        /// <summary>
        /// Smartphone mockup + scroll transcript for one «part». The message list repeats for every block index;
        /// only the bubble matching <paramref name="slotBlockIndex"/> receives interactive mechanics.
        /// </summary>
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

            var msgs = dto.smsChrome.messages;
            for (var mi = 0; mi < msgs.Length; mi++)
            {
                var msgDto = msgs[mi];
                if (msgDto == null)
                {
                    Debug.LogWarning(
                        $"[SpecialScreenToolkitStep] smsChrome.messages[{mi}] is null; skipping bubble " +
                        $"(messenger payloads should fail validation — check authoring).");
                    continue;
                }

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
                    else if (msgDto.hostsEmbeddedMechanic)
                    {
                        var deferred = new Label(MessengerDeferredMechanicPlaceholder);
                        deferred.AddToClassList("lg-special-bubble__text");
                        deferred.AddToClassList("lg-text-muted");
                        deferred.style.whiteSpace = WhiteSpace.Normal;
                        bubble.Add(deferred);
                    }
                }

                if (bubble.childCount == 0)
                    continue;

                row.Add(bubble);
                scroll.Add(row);
            }

            phone.Add(scroll);
            slot.Add(phone);
        }

        private void BuildMailChromeLayout(SpecialScreenContentDto dto, StepContext context)
        {
            if (_blockArea == null)
                return;

            var mail = dto.mailChrome ?? new SpecialScreenMailChromeDto();
            _mailSendSuccessText = mail.sendSuccessText;
            _mailSendButton = null;
            _mailSendAckLabel = null;

            var fromVal = MailChromeString(mail.from, mail.fromText);
            var toVal = MailChromeString(mail.to, mail.toText);
            var subjectVal = MailChromeString(mail.subject, mail.subjectText);
            var greetingVal = MailChromeString(mail.greeting, mail.greetingText);
            var closingVal = MailChromeString(mail.closing, mail.closingText);

            var outer = new VisualElement();
            outer.AddToClassList("lg-special-mail");
            outer.style.flexGrow = 1;

            var scroll = new ScrollView(ScrollViewMode.Vertical);
            scroll.AddToClassList("lg-special-mail__scroll");
            scroll.style.flexGrow = 1;
            scroll.style.flexShrink = 1;
            scroll.style.minHeight = 0;

            var panel = new VisualElement();
            panel.AddToClassList("lg-special-mail__panel");

            var showSubject = ShouldShowMailSubjectRow(mail, dto);
            var lf = string.IsNullOrWhiteSpace(mail.rowLabelFrom) ? "Da:" : mail.rowLabelFrom.Trim();
            var lt = string.IsNullOrWhiteSpace(mail.rowLabelTo) ? "A:" : mail.rowLabelTo.Trim();
            var ls = string.IsNullOrWhiteSpace(mail.rowLabelSubject) ? "Oggetto:" : mail.rowLabelSubject.Trim();

            AddMailHeaderRow(panel, lf, fromVal);
            AddMailHeaderRow(panel, lt, toVal);
            if (showSubject)
                AddMailHeaderRow(panel, ls, subjectVal);

            var bodyHost = new VisualElement();
            bodyHost.AddToClassList("lg-special-mail__body");
            bodyHost.style.flexGrow = 0;
            bodyHost.style.flexShrink = 0;
            bodyHost.style.minHeight = 120;
            panel.Add(bodyHost);

            var blockList = dto.blocks ?? Array.Empty<SpecialScreenBlockDto>();
            foreach (var blockDto in blockList)
            {
                var slot = new VisualElement();
                slot.style.flexGrow = 0;
                slot.style.flexShrink = 0;
                slot.style.display = DisplayStyle.None;
                bodyHost.Add(slot);
                _slots.Add(slot);
                _blocks.Add(CreateNestedBlock(blockDto));
            }

            if (!string.IsNullOrEmpty(greetingVal))
            {
                var gLabel = new Label(greetingVal);
                gLabel.AddToClassList("lg-text-body");
                gLabel.AddToClassList("lg-special-mail__greeting");
                gLabel.style.whiteSpace = WhiteSpace.Normal;
                panel.Add(gLabel);
            }

            var closing = closingVal;
            if (!string.IsNullOrEmpty(closing))
            {
                var cLabel = new Label(closing);
                cLabel.AddToClassList("lg-text-body");
                cLabel.AddToClassList("lg-special-mail__closing");
                cLabel.style.whiteSpace = WhiteSpace.Normal;
                panel.Add(cLabel);
            }

            var sendRow = new VisualElement();
            sendRow.AddToClassList("lg-special-mail__send-row");

            var sendBtnText = mail.sendButtonText?.Trim() ?? string.Empty;
            var sendBtn = new Button();
            sendBtn.text = string.IsNullOrEmpty(sendBtnText) ? "Invia" : sendBtnText;
            sendBtn.AddToClassList("lg-btn");
            sendBtn.AddToClassList("lg-btn--primary");
            sendRow.Add(sendBtn);

            var ack = new Label(string.Empty);
            ack.AddToClassList("lg-special-mail__send-ack");
            ack.AddToClassList("lg-text-caption");
            ack.style.display = DisplayStyle.None;
            ack.style.whiteSpace = WhiteSpace.Normal;
            sendRow.Add(ack);

            panel.Add(sendRow);

            scroll.Add(panel);
            outer.Add(scroll);
            _blockArea.Add(outer);

            _mailSendButton = sendBtn;
            _mailSendAckLabel = ack;
            sendBtn.clicked += OnMailSendClicked;

            for (var i = 0; i < _blocks.Count; i++)
                _blocks[i].Bind(_slots[i], context);

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
        }

        private static void AddMailHeaderRow(VisualElement parent, string caption, string value)
        {
            var row = new VisualElement();
            row.AddToClassList("lg-special-mail__row");

            var cap = new Label(caption);
            cap.AddToClassList("lg-special-mail__row-caption");

            var val = new Label(value);
            val.AddToClassList("lg-text-body");
            val.AddToClassList("lg-special-mail__row-value");
            val.style.whiteSpace = WhiteSpace.Normal;

            row.Add(cap);
            row.Add(val);
            parent.Add(row);
        }

        private void OnMailSendClicked()
        {
            SubmitFromShell();
        }

        private void StopReaderRemoteLoads()
        {
            if (_coroutineHost != null)
            {
                foreach (var c in _readerImageLoads)
                {
                    if (c != null)
                        _coroutineHost.StopCoroutine(c);
                }
            }

            _readerImageLoads.Clear();
            foreach (var tex in _readerRemoteTextures)
            {
                if (tex != null)
                    UnityEngine.Object.Destroy(tex);
            }

            _readerRemoteTextures.Clear();
        }

        private void BuildReaderLayout(SpecialScreenContentDto dto, StepContext _)
        {
            StopReaderRemoteLoads();
            _blockArea.Clear();

            var rc = dto.readerChrome ?? new SpecialScreenReaderChromeDto();
            var rawBody = rc.bodyText ?? string.Empty;
            var body = rawBody.Replace("\r\n", "\n").Replace('\r', '\n');

            var scroll = new ScrollView(ScrollViewMode.Vertical);
            scroll.AddToClassList("lg-special-reader-scroll");
            scroll.style.flexGrow = 1;

            var panel = new VisualElement();
            panel.AddToClassList("lg-special-reader-panel");
            scroll.Add(panel);
            _blockArea.Add(scroll);

            var imageUrl = rc.imageUrl?.Trim() ?? string.Empty;
            if (!string.IsNullOrEmpty(imageUrl))
            {
                var hero = new VisualElement();
                hero.AddToClassList("lg-special-reader__image");
                panel.Add(hero);

                if (!ToolkitStepHttpResourceUrl.IsAllowed(imageUrl, out var errImg))
                    Debug.LogWarning($"[SpecialScreenToolkitStep] Reader image URL skipped: {errImg}");
                else if (_coroutineHost != null)
                    _readerImageLoads.Add(_coroutineHost.StartCoroutine(LoadReaderImage(imageUrl, hero)));
                else
                    Debug.LogWarning(
                        "[SpecialScreenToolkitStep] Reader hero image skipped: no coroutine host for remote load.");
            }

            var headline = !(string.IsNullOrWhiteSpace(rc.headline))
                ? rc.headline.Trim()
                : dto.title?.Trim() ?? string.Empty;
            if (!string.IsNullOrEmpty(headline))
            {
                var hl = new Label(headline);
                hl.AddToClassList("lg-heading-screen");
                hl.AddToClassList("lg-special-reader__headline");
                hl.style.whiteSpace = WhiteSpace.Normal;
                panel.Add(hl);
            }

            var sub = !(string.IsNullOrWhiteSpace(rc.subheadline))
                ? rc.subheadline.Trim()
                : dto.subtitle?.Trim() ?? string.Empty;
            if (!string.IsNullOrEmpty(sub))
            {
                var sl = new Label(sub);
                sl.AddToClassList("lg-text-body");
                sl.AddToClassList("lg-text-muted");
                sl.AddToClassList("lg-special-reader__subhead");
                sl.style.whiteSpace = WhiteSpace.Normal;
                panel.Add(sl);
            }

            if (rc.showLineNumbers)
            {
                AddReaderLineNumberBlock(panel, body);
            }
            else if (EffectiveColumnCount(rc) >= 2)
            {
                AddReaderTwoColumns(panel, body);
            }
            else
            {
                var single = new Label(body);
                single.AddToClassList("lg-text-body");
                single.AddToClassList("lg-special-reader__body");
                single.style.whiteSpace = WhiteSpace.Normal;
                panel.Add(single);
            }
        }

        private static int EffectiveColumnCount(SpecialScreenReaderChromeDto rc)
        {
            if (rc == null)
                return 2;

            return rc.columnCount switch
            {
                1 => 1,
                2 => 2,
                _ => 2,
            };
        }

        private static void AddReaderLineNumberBlock(VisualElement panel, string body)
        {
            var lineNo = 1;
            foreach (var line in SplitLinesPreserveTrailing(body))
            {
                var row = new VisualElement();
                row.AddToClassList("lg-special-reader__line-row");

                var num = new Label($"{lineNo}");
                num.AddToClassList("lg-text-caption");
                num.AddToClassList("lg-special-reader__line-num");

                var txt = new Label(line);
                txt.AddToClassList("lg-text-body");
                txt.AddToClassList("lg-special-reader__line-text");
                txt.style.whiteSpace = WhiteSpace.Normal;

                row.Add(num);
                row.Add(txt);
                panel.Add(row);
                lineNo++;
            }
        }

        private static IEnumerable<string> SplitLinesPreserveTrailing(string body)
        {
            if (body.Length == 0)
            {
                yield return string.Empty;
                yield break;
            }

            foreach (var line in body.Split('\n'))
                yield return line;
        }

        /// <remarks>
        /// Prefer paragraph splits on <c>\n\n</c>; for a single block, split on the last space before the midpoint,
        /// or at a character midpoint when there is no suitable space.
        /// </remarks>
        private static void AddReaderTwoColumns(VisualElement panel, string body)
        {
            var trimmed = (body ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(trimmed))
                return;

            var paragraphs = SplitParagraphList(trimmed);
            string leftText;
            string rightText;

            if (paragraphs.Count >= 2)
            {
                var k = Math.Max(1, (paragraphs.Count + 1) / 2);
                leftText = string.Join("\n\n", paragraphs.GetRange(0, k));
                rightText = paragraphs.Count > k
                    ? string.Join("\n\n", paragraphs.GetRange(k, paragraphs.Count - k))
                    : string.Empty;
            }
            else
            {
                leftText = SplitAtApproximateMidpoint(trimmed, out rightText);
            }

            var row = new VisualElement();
            row.AddToClassList("lg-special-reader__columns-row");

            var left = new VisualElement();
            left.AddToClassList("lg-special-reader__column");
            left.AddToClassList("lg-special-reader__column--first");
            var l = new Label(leftText);
            l.AddToClassList("lg-text-body");
            l.AddToClassList("lg-special-reader__body");
            l.style.whiteSpace = WhiteSpace.Normal;
            left.Add(l);

            var right = new VisualElement();
            right.AddToClassList("lg-special-reader__column");
            right.AddToClassList("lg-special-reader__column--second");
            var r = new Label(rightText);
            r.AddToClassList("lg-text-body");
            r.AddToClassList("lg-special-reader__body");
            r.style.whiteSpace = WhiteSpace.Normal;
            right.Add(r);

            row.Add(left);
            row.Add(right);
            panel.Add(row);
        }

        private static string SplitAtApproximateMidpoint(string text, out string right)
        {
            right = string.Empty;
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            if (text.Length < 2)
                return text;

            var mid = text.Length / 2;
            var split = text.LastIndexOf(' ', mid);
            if (split <= 0)
                split = text.IndexOf(' ', mid);
            if (split <= 0)
            {
                right = text.Substring(mid).Trim();
                return text.Substring(0, mid).Trim();
            }

            var left = text.Substring(0, split).Trim();
            right = text.Substring(split).Trim();
            return left;
        }

        private static List<string> SplitParagraphList(string body)
        {
            var trimmed = body.Trim();
            if (string.IsNullOrEmpty(trimmed))
                return new List<string>();

            var parts = trimmed.Split(new[] { "\n\n" }, StringSplitOptions.None);
            var list = new List<string>();
            foreach (var p in parts)
            {
                var t = (p ?? string.Empty).Trim();
                if (!string.IsNullOrEmpty(t))
                    list.Add(t.Trim());
            }

            return list.Count > 0 ? list : new List<string> { trimmed };
        }

        private IEnumerator LoadReaderImage(string url, VisualElement target)
        {
            if (!ToolkitStepHttpResourceUrl.TryVerifyForClientFetch(url, out var verr))
            {
                Debug.LogWarning($"[SpecialScreenToolkitStep] Reader image blocked: {verr}");
                yield break;
            }

            using var req = UnityWebRequestTexture.GetTexture(url);
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success || target == null)
                yield break;

            var tex = DownloadHandlerTexture.GetContent(req);
            if (tex == null)
                yield break;

            _readerRemoteTextures.Add(tex);
            target.style.backgroundImage = new StyleBackground(tex);
        }

        private static bool ShouldUseReaderChrome(SpecialScreenContentDto dto, string taskType)
        {
            if (dto == null)
                return false;

            var readerTask =
                !string.IsNullOrEmpty(taskType) &&
                string.Equals(taskType, "SpecialScreenReader", StringComparison.OrdinalIgnoreCase);

            var v = dto.screenVariant?.Trim() ?? string.Empty;
            var readerVariant = string.Equals(v, "reader", StringComparison.OrdinalIgnoreCase);

            return readerTask || readerVariant;
        }

        private static bool ShouldUsePhotoViewerChrome(SpecialScreenContentDto dto, string taskType)
        {
            if (dto == null)
                return false;

            if (ShouldUseReaderChrome(dto, taskType))
                return false;

            var tt = taskType ?? string.Empty;
            if (!string.IsNullOrEmpty(tt) &&
                string.Equals(tt, "SpecialScreenPhotoViewer", StringComparison.OrdinalIgnoreCase))
                return true;

            var v = dto.screenVariant?.Trim() ?? string.Empty;
            return string.Equals(v, "photo", StringComparison.OrdinalIgnoreCase);
        }

        private static bool ShouldUseMailChrome(SpecialScreenContentDto dto, string taskType)
        {
            if (dto == null)
                return false;

            if (ShouldUseReaderChrome(dto, taskType))
                return false;

            var tt = taskType ?? string.Empty;
            if (!string.IsNullOrEmpty(tt) &&
                string.Equals(tt, "SpecialScreenMailEditor", StringComparison.OrdinalIgnoreCase))
                return true;

            if (ShouldUsePhotoViewerChrome(dto, taskType))
                return false;

            var v = dto.screenVariant?.Trim() ?? string.Empty;
            return string.Equals(v, "mail", StringComparison.OrdinalIgnoreCase)
                   || string.Equals(v, "letter", StringComparison.OrdinalIgnoreCase);
        }

        private static bool ValidateMailChromeAuthoring(SpecialScreenMailChromeDto mail, out string error)
        {
            error = null;
            if (mail == null)
                return true;

            var fmt = mail.format?.Trim() ?? string.Empty;
            if (fmt.Length == 0)
                return true;

            if (!string.Equals(fmt, "email", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(fmt, "letter", StringComparison.OrdinalIgnoreCase))
            {
                error = "mailChrome.format deve essere email o letter.";
                return false;
            }

            return true;
        }

        private static bool ShouldShowMailSubjectRow(SpecialScreenMailChromeDto mail, SpecialScreenContentDto dto)
        {
            var m = mail ?? new SpecialScreenMailChromeDto();
            var fmt = m.format?.Trim() ?? string.Empty;
            if (string.Equals(fmt, "letter", StringComparison.OrdinalIgnoreCase))
                return false;

            var v = dto?.screenVariant?.Trim() ?? string.Empty;
            if (string.Equals(v, "letter", StringComparison.OrdinalIgnoreCase))
                return false;

            return true;
        }

        /// <summary>Picks the first non-empty mail header field; supports alternate JSON keys (e.g. <c>fromText</c>).</summary>
        private static string MailChromeString(string primary, string alternate)
        {
            if (!string.IsNullOrWhiteSpace(primary))
                return primary.Trim();
            return alternate?.Trim() ?? string.Empty;
        }

        private static bool PhotoChromeRequiresLearnerCaption(SpecialScreenPhotoViewerChromeDto pv)
        {
            if (pv?.items == null)
                return false;

            foreach (var it in pv.items)
            {
                if (it != null && it.requireLearnerCaption)
                    return true;
            }

            return false;
        }

        private static bool ValidatePhotoViewerChromeContent(SpecialScreenPhotoViewerChromeDto pv, out string error)
        {
            error = null;
            if (pv == null)
            {
                error = "Serve photoViewerChrome.";
                return false;
            }

            if (pv.items == null || pv.items.Length < 1)
            {
                error = "Serve almeno un elemento in photoViewerChrome.items.";
                return false;
            }

            var dm = pv.displayMode?.Trim() ?? string.Empty;
            if (dm.Length > 0 &&
                !string.Equals(dm, "grid4", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(dm, "slideshow", StringComparison.OrdinalIgnoreCase))
            {
                error = "photoViewerChrome.displayMode deve essere grid4 o slideshow.";
                return false;
            }

            for (var i = 0; i < pv.items.Length; i++)
            {
                var it = pv.items[i];
                if (it == null)
                {
                    error = $"Elemento foto {i + 1}: contenuto mancante.";
                    return false;
                }

                var url = it.imageUrl?.Trim() ?? string.Empty;
                if (string.IsNullOrEmpty(url))
                {
                    error = $"Elemento foto {i + 1}: imageUrl mancante.";
                    return false;
                }

                if (!ToolkitStepHttpResourceUrl.IsAllowed(url, out _))
                {
                    error = $"Elemento foto {i + 1}: URL dell'immagine non consentito (usa https pubblico).";
                    return false;
                }

                if (it.requireLearnerCaption &&
                    (it.acceptedCaptions == null || it.acceptedCaptions.Length == 0))
                {
                    error = $"Elemento foto {i + 1}: serve acceptedCaptions per la didascalia.";
                    return false;
                }
            }

            return true;
        }

        private static bool ShouldUseMessengerChrome(SpecialScreenContentDto dto, string taskType)
        {
            if (ShouldUseReaderChrome(dto, taskType))
                return false;

            if (ShouldUsePhotoViewerChrome(dto, taskType))
                return false;

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
                {
                    error = $"Messaggio {mi + 1}: contenuto mancante.";
                    return false;
                }

                var dir = m.direction?.Trim() ?? string.Empty;
                if (!string.Equals(dir, "incoming", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(dir, "outgoing", StringComparison.OrdinalIgnoreCase))
                {
                    error = $"Messaggio {mi + 1}: «direction» deve essere incoming o outgoing.";
                    return false;
                }

                if (!m.hostsEmbeddedMechanic &&
                    string.IsNullOrWhiteSpace(m.text) &&
                    string.IsNullOrWhiteSpace(m.author))
                {
                    error = $"Messaggio {mi + 1}: serve «text», «author» oppure hostsEmbeddedMechanic.";
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
            if (!_contentReady || !_interactable || _currentIndex <= 0 || _slots.Count == 0)
                return;

            _slots[_currentIndex].style.display = DisplayStyle.None;
            _currentIndex--;
            _slots[_currentIndex].style.display = DisplayStyle.Flex;
            RefreshNavigationChrome();
        }

        private void OnNextClicked()
        {
            if (!_contentReady || !_interactable || _slots.Count == 0 || _currentIndex >= _blocks.Count - 1)
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
            var hidePaging = (_readerDisplayOnly && _slots.Count == 0) ||
                               (_usePhotoChrome && _blocks.Count <= 1);

            if (_navRow != null)
                _navRow.style.display = hidePaging ? DisplayStyle.None : DisplayStyle.Flex;

            if (_progressLabel != null)
            {
                _progressLabel.text =
                    hidePaging || _blocks.Count == 0
                        ? string.Empty
                        : $"Parte {_currentIndex + 1} di {_blocks.Count}";
            }

            var atFirst = hidePaging || _currentIndex <= 0;
            var atLast = hidePaging || _blocks.Count == 0 || _currentIndex >= _blocks.Count - 1;

            if (_prevButton != null)
                _prevButton.SetEnabled(_interactable && !hidePaging && !atFirst && _slots.Count > 0);

            if (_nextButton != null)
                _nextButton.SetEnabled(_interactable && !hidePaging && !atLast && _slots.Count > 0);
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
            if (dto == null)
            {
                error = "Contenuto della schermata speciale non valido.";
                return false;
            }

            var tt = taskType ?? string.Empty;
            var useReader = ShouldUseReaderChrome(dto, tt);
            var useMail = ShouldUseMailChrome(dto, tt);
            var usePhoto = ShouldUsePhotoViewerChrome(dto, tt) && !useReader && !useMail;
            var hasBlocks = dto.blocks != null && dto.blocks.Length > 0;

            if (!useReader && !hasBlocks && !usePhoto)
            {
                error = "Serve almeno un blocco nella schermata speciale.";
                return false;
            }

            if (useMail)
            {
                if (dto.smsChrome?.messages != null && dto.smsChrome.messages.Length > 0)
                {
                    error = "Non combinare smsChrome.messages con la cornice e-mail.";
                    return false;
                }

                if (dto.mailChrome != null && !ValidateMailChromeAuthoring(dto.mailChrome, out error))
                    return false;
            }

            if (useReader)
            {
                var rc = dto.readerChrome;
                if (rc == null)
                {
                    error = string.Equals(tt, "SpecialScreenReader", StringComparison.OrdinalIgnoreCase)
                        ? "Serve readerChrome per SpecialScreenReader."
                        : "Per screenVariant «reader» serve readerChrome.";
                    return false;
                }

                if (string.IsNullOrWhiteSpace(rc.bodyText))
                {
                    error = "readerChrome.bodyText non può essere vuoto.";
                    return false;
                }

                var imgUrl = rc.imageUrl?.Trim() ?? string.Empty;
                if (!string.IsNullOrEmpty(imgUrl) &&
                    !ToolkitStepHttpResourceUrl.IsAllowed(imgUrl, out _))
                {
                    error = "URL dell'immagine nel reader non consentito (usa https pubblico).";
                    return false;
                }

                if (hasBlocks)
                {
                    error =
                        "Modalità lettura: non usare blocchi interattivi. Ometti «blocks» o usa un array vuoto.";
                    return false;
                }
            }

            if (usePhoto)
            {
                if (!ValidatePhotoViewerChromeContent(dto.photoViewerChrome, out error))
                    return false;

                if (dto.smsChrome != null && dto.smsChrome.messages != null && dto.smsChrome.messages.Length > 0)
                {
                    error =
                        "Modalità foto: rimuovi smsChrome.messages o cambia taskType / screenVariant.";
                    return false;
                }

                if (hasBlocks)
                {
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
                }

                error = null;
                return true;
            }

            if (hasBlocks)
            {
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
            }

            if (!useMail && ShouldUseMessengerChrome(dto, tt) &&
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
            private VisualElement _slot;

            public StubNestedBlock(SpecialScreenStubBlockDto dto)
            {
                _dto = dto;
            }

            public bool IsBinderReady => _ready;

            public void Bind(VisualElement slot, StepContext parentContext)
            {
                _ready = false;
                _slot = slot ?? throw new ArgumentNullException(nameof(slot));
                _slot.Clear();

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

                _slot.Add(panel);
                _ready = true;
            }

            public void SetInteractable(bool _) { }

            public void Teardown()
            {
                _ready = false;
                _slot?.Clear();
                _slot = null;
            }

            public bool TryValidate(out string message)
            {
                message = null;
                return true;
            }
        }

        private sealed class PhotoViewerNestedBlock : ISpecialScreenNestedBlock
        {
            private readonly SpecialScreenPhotoViewerChromeDto _dto;
            private readonly MonoBehaviour _coroutineHost;
            private readonly List<Coroutine> _loads = new();
            private readonly List<Texture2D> _textures = new();
            private readonly Dictionary<int, TextField> _learnerFields = new();

            private int _slideshowIndex;
            private int _slideshowLoadGeneration;
            private Texture2D _slideshowHeroTexture;
            private SpecialScreenPhotoItemDto[] _slideshowItems;
            private VisualElement _slideshowImageHost;
            private VisualElement _slideshowCaptionHost;
            private Label _slideshowIndexLabel;
            private Button _slideshowPrev;
            private Button _slideshowNext;

            public PhotoViewerNestedBlock(SpecialScreenPhotoViewerChromeDto dto, MonoBehaviour coroutineHost)
            {
                _dto = dto ?? new SpecialScreenPhotoViewerChromeDto();
                _coroutineHost = coroutineHost;
            }

            public bool IsBinderReady => true;

            public void SetInteractable(bool interactable)
            {
                foreach (var kv in _learnerFields)
                    kv.Value.SetEnabled(interactable);

                if (_slideshowPrev != null)
                    _slideshowPrev.SetEnabled(interactable);
                if (_slideshowNext != null)
                    _slideshowNext.SetEnabled(interactable);
            }

            public void Teardown()
            {
                _slideshowLoadGeneration++;

                if (_slideshowPrev != null)
                {
                    _slideshowPrev.clicked -= OnSlideshowPrev;
                    _slideshowPrev = null;
                }

                if (_slideshowNext != null)
                {
                    _slideshowNext.clicked -= OnSlideshowNext;
                    _slideshowNext = null;
                }

                ReleaseSlideshowHeroTexture();

                foreach (var c in _loads)
                {
                    if (c != null && _coroutineHost != null)
                        _coroutineHost.StopCoroutine(c);
                }

                _loads.Clear();
                foreach (var t in _textures)
                {
                    if (t != null)
                        UnityEngine.Object.Destroy(t);
                }

                _textures.Clear();
                _learnerFields.Clear();
                _slideshowItems = null;
                _slideshowImageHost = null;
                _slideshowCaptionHost = null;
                _slideshowIndexLabel = null;
            }

            public void Bind(VisualElement slot, StepContext _)
            {
                slot.Clear();
                var scroll = new ScrollView(ScrollViewMode.Vertical);
                scroll.AddToClassList("lg-special-photo-scroll");
                scroll.style.flexGrow = 1;

                var pv = _dto;
                if (!string.IsNullOrWhiteSpace(pv.prompt))
                {
                    var p = new Label(pv.prompt.Trim());
                    p.AddToClassList("lg-text-body");
                    p.style.whiteSpace = WhiteSpace.Normal;
                    p.style.marginBottom = 8;
                    scroll.Add(p);
                }

                var items = pv.items;
                if (items == null || items.Length == 0)
                {
                    slot.Add(scroll);
                    return;
                }

                var mode = pv.displayMode?.Trim() ?? string.Empty;
                var slideshow = string.Equals(mode, "slideshow", StringComparison.OrdinalIgnoreCase);
                if (slideshow)
                    BuildSlideshow(scroll, items);
                else
                    BuildGrid(scroll, items);

                slot.Add(scroll);
            }

            private void BuildGrid(ScrollView scroll, SpecialScreenPhotoItemDto[] items)
            {
                var grid = new VisualElement();
                grid.AddToClassList("lg-special-photo-grid");

                for (var i = 0; i < items.Length; i++)
                {
                    var it = items[i];
                    if (it == null)
                        continue;

                    var cell = new VisualElement();
                    cell.AddToClassList("lg-special-photo-cell");

                    var imgHost = new VisualElement();
                    imgHost.AddToClassList("lg-special-photo-cell__image");
                    StartLoad(it.imageUrl, imgHost, null);
                    cell.Add(imgHost);

                    if (it.requireLearnerCaption)
                    {
                        var tf = new TextField();
                        tf.AddToClassList("lg-special-photo-field");
                        _learnerFields[i] = tf;
                        cell.Add(tf);
                    }
                    else if (_dto.showCaptions)
                    {
                        var capText = it.caption?.Trim() ?? string.Empty;
                        var cap = new Label(string.IsNullOrEmpty(capText) ? "\u2014" : capText);
                        cap.AddToClassList("lg-special-photo-caption--fixed");
                        cap.style.whiteSpace = WhiteSpace.Normal;
                        cell.Add(cap);
                    }

                    grid.Add(cell);
                }

                scroll.Add(grid);
            }

            private void BuildSlideshow(ScrollView scroll, SpecialScreenPhotoItemDto[] items)
            {
                _slideshowItems = items;
                _slideshowIndex = 0;

                var stage = new VisualElement();
                stage.AddToClassList("lg-special-photo-slideshow");

                _slideshowImageHost = new VisualElement();
                _slideshowImageHost.AddToClassList("lg-special-photo-slideshow__image");
                stage.Add(_slideshowImageHost);

                _slideshowCaptionHost = new VisualElement();
                _slideshowCaptionHost.AddToClassList("lg-special-photo-slideshow__caption");
                _slideshowCaptionHost.style.flexDirection = FlexDirection.Column;
                stage.Add(_slideshowCaptionHost);

                var nav = new VisualElement();
                nav.AddToClassList("lg-special-photo-slideshow__nav");
                nav.style.flexDirection = FlexDirection.Row;
                nav.style.alignItems = Align.Center;
                nav.style.justifyContent = Justify.SpaceBetween;

                _slideshowPrev = new Button { text = "\u2190" };
                _slideshowPrev.AddToClassList("lg-btn");
                _slideshowPrev.AddToClassList("lg-btn--secondary");
                _slideshowPrev.clicked += OnSlideshowPrev;

                var idxLabel = new Label();
                idxLabel.AddToClassList("lg-text-caption");
                _slideshowIndexLabel = idxLabel;

                _slideshowNext = new Button { text = "\u2192" };
                _slideshowNext.AddToClassList("lg-btn");
                _slideshowNext.AddToClassList("lg-btn--secondary");
                _slideshowNext.clicked += OnSlideshowNext;

                nav.Add(_slideshowPrev);
                nav.Add(idxLabel);
                nav.Add(_slideshowNext);
                stage.Add(nav);

                for (var pi = 0; pi < items.Length; pi++)
                {
                    var pit = items[pi];
                    if (pit != null && pit.requireLearnerCaption && !_learnerFields.ContainsKey(pi))
                    {
                        var tf = new TextField();
                        tf.AddToClassList("lg-special-photo-field");
                        _learnerFields[pi] = tf;
                    }
                }

                scroll.Add(stage);
                RefreshSlideshowSlide();
            }

            private void OnSlideshowPrev()
            {
                if (_slideshowItems == null || _slideshowItems.Length == 0)
                    return;
                _slideshowIndex = (_slideshowIndex - 1 + _slideshowItems.Length) % _slideshowItems.Length;

                RefreshSlideshowSlide();
            }

            private void OnSlideshowNext()
            {
                if (_slideshowItems == null || _slideshowItems.Length == 0)
                    return;
                _slideshowIndex = (_slideshowIndex + 1) % _slideshowItems.Length;

                RefreshSlideshowSlide();
            }

            private void ReleaseSlideshowHeroTexture()
            {
                if (_slideshowHeroTexture == null)
                    return;

                _textures.Remove(_slideshowHeroTexture);
                UnityEngine.Object.Destroy(_slideshowHeroTexture);
                _slideshowHeroTexture = null;
            }

            private void RefreshSlideshowSlide()
            {
                if (_slideshowItems == null || _slideshowImageHost == null || _slideshowCaptionHost == null)
                    return;

                if (_slideshowIndex < 0 || _slideshowIndex >= _slideshowItems.Length)
                    return;

                var it = _slideshowItems[_slideshowIndex];
                if (it == null)
                    return;

                _slideshowLoadGeneration++;
                var gen = _slideshowLoadGeneration;

                ReleaseSlideshowHeroTexture();
                _slideshowImageHost.Clear();
                _slideshowImageHost.style.backgroundImage = StyleKeyword.None;

                StartLoad(it.imageUrl, _slideshowImageHost, gen);

                _slideshowCaptionHost.Clear();
                if (it.requireLearnerCaption)
                {
                    if (!_learnerFields.TryGetValue(_slideshowIndex, out var tf) || tf == null)
                    {
                        tf = new TextField();
                        tf.AddToClassList("lg-special-photo-field");
                        _learnerFields[_slideshowIndex] = tf;
                    }

                    _slideshowCaptionHost.Add(tf);
                }
                else if (_dto.showCaptions)
                {
                    var capText = it.caption?.Trim() ?? string.Empty;
                    var cap = new Label(string.IsNullOrEmpty(capText) ? "\u2014" : capText);
                    cap.AddToClassList("lg-special-photo-caption--fixed");
                    cap.style.whiteSpace = WhiteSpace.Normal;
                    _slideshowCaptionHost.Add(cap);
                }

                if (_slideshowIndexLabel != null)
                    _slideshowIndexLabel.text = $"{_slideshowIndex + 1} / {_slideshowItems.Length}";
            }

            private void ShowLoadErrorOnTarget(VisualElement target)
            {
                if (target == null)
                    return;

                target.Clear();
                target.style.backgroundImage = StyleKeyword.None;

                var err = new Label("Immagine non disponibile.");
                err.AddToClassList("lg-text-caption");
                err.AddToClassList("lg-text-muted");
                err.style.whiteSpace = WhiteSpace.Normal;
                target.Add(err);
            }

            private void StartLoad(string url, VisualElement target, int? slideshowGeneration)
            {
                if (target == null)
                    return;

                var trimmed = url?.Trim() ?? string.Empty;
                if (string.IsNullOrEmpty(trimmed))
                {
                    Debug.LogWarning("[SpecialScreenToolkitStep] Photo image URL is empty.");
                    ShowLoadErrorOnTarget(target);
                    return;
                }

                if (!ToolkitStepHttpResourceUrl.IsAllowed(trimmed, out var allowErr))
                {
                    Debug.LogWarning(
                        $"[SpecialScreenToolkitStep] Photo image URL not allowed '{trimmed}': {allowErr ?? "unknown"}");
                    ShowLoadErrorOnTarget(target);
                    return;
                }

                if (_coroutineHost == null)
                {
                    Debug.LogWarning(
                        "[SpecialScreenToolkitStep] Photo image skipped: no coroutine host for remote load.");
                    ShowLoadErrorOnTarget(target);
                    return;
                }

                _loads.Add(_coroutineHost.StartCoroutine(LoadPhotoTexture(trimmed, target, slideshowGeneration)));
            }

            private IEnumerator LoadPhotoTexture(string url, VisualElement target, int? slideshowGeneration)
            {
                if (!ToolkitStepHttpResourceUrl.TryVerifyForClientFetch(url, out var verr))
                {
                    Debug.LogWarning(
                        $"[SpecialScreenToolkitStep] Photo image fetch blocked for '{url}': {verr}");
                    ShowLoadErrorOnTarget(target);
                    yield break;
                }

                using var req = UnityWebRequestTexture.GetTexture(url);
                yield return req.SendWebRequest();

                if (slideshowGeneration.HasValue && slideshowGeneration.Value != _slideshowLoadGeneration)
                    yield break;

                if (req.result != UnityWebRequest.Result.Success || target == null)
                {
                    if (req.result != UnityWebRequest.Result.Success)
                    {
                        Debug.LogWarning(
                            $"[SpecialScreenToolkitStep] Photo image load failed for '{url}': {req.result} {req.error}");
                        if (target != null)
                            ShowLoadErrorOnTarget(target);
                    }

                    yield break;
                }

                var tex = DownloadHandlerTexture.GetContent(req);
                if (tex == null)
                {
                    Debug.LogWarning(
                        $"[SpecialScreenToolkitStep] Photo image decode failed or empty for '{url}'.");
                    ShowLoadErrorOnTarget(target);
                    yield break;
                }

                if (slideshowGeneration.HasValue && slideshowGeneration.Value != _slideshowLoadGeneration)
                {
                    UnityEngine.Object.Destroy(tex);
                    yield break;
                }

                if (slideshowGeneration.HasValue)
                    _slideshowHeroTexture = tex;

                _textures.Add(tex);
                target.style.backgroundImage = new StyleBackground(tex);
            }

            public bool TryValidate(out string message)
            {
                message = null;
                var items = _dto?.items;
                if (items == null)
                    return true;

                for (var i = 0; i < items.Length; i++)
                {
                    var it = items[i];
                    if (it == null || !it.requireLearnerCaption)
                        continue;

                    if (!_learnerFields.TryGetValue(i, out var field) || field == null)
                    {
                        message = $"Didascalia {i + 1}: campo mancante.";
                        return false;
                    }

                    var raw = field.value?.Trim() ?? string.Empty;
                    if (string.IsNullOrEmpty(raw))
                    {
                        message = "Completa tutte le didascalie richieste.";
                        return false;
                    }

                    var answers = it.acceptedCaptions;
                    if (answers == null || answers.Length == 0)
                    {
                        message = "Configurazione didascalia non valida.";
                        return false;
                    }

                    var comp = it.caseSensitive
                        ? StringComparison.Ordinal
                        : StringComparison.OrdinalIgnoreCase;

                    var matched = false;
                    foreach (var a in answers)
                    {
                        if (string.IsNullOrWhiteSpace(a))
                            continue;
                        if (string.Equals(raw, a.Trim(), comp))
                        {
                            matched = true;
                            break;
                        }
                    }

                    if (!matched)
                    {
                        message = "Controlla le didascalie inserite.";
                        return false;
                    }
                }

                return true;
            }
        }
    }
}
