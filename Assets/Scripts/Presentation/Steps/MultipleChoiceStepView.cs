using System;
using System.Collections;
using System.Collections.Generic;
using LanguageGame.Presentation;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Networking;
using UnityEngine.UI;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Multiple-choice tasks from <see cref="StepContext.contentJson"/> (see <see cref="MultipleChoiceContentDto"/>).
    /// </summary>
    public sealed class MultipleChoiceStepView : TaskStepBase
    {
        private const int MinOptions = 2;
        private const int MaxOptions = 8;
        private const int MaxStemImageHeight = 260;

        [SerializeField] private RectTransform stemHost;
        [SerializeField] private RectTransform optionsHost;
        [SerializeField] private Text progressText;
        [SerializeField] private Button prevQuestionButton;
        [SerializeField] private Button nextQuestionButton;

        private MultipleChoiceContentDto _dto;
        private MultipleChoiceQuestionDto[] _questions;
        private readonly List<McOptionDto> _optionsDisplayOrder = new();
        private readonly Dictionary<int, HashSet<string>> _selections = new();
        private readonly List<Toggle> _activeToggles = new();
        private readonly List<Coroutine> _mediaLoads = new();
        private ToggleGroup _toggleGroup;
        private AudioSource _audioSource;
        private int _currentIndex;
        private bool _contentReady;
        private bool _interactable = true;
        private UnityAction _prevClick;
        private UnityAction _nextClick;
        private GameObject _quizProgressRoot;

        protected override void ApplyChromeFromDesignTokens()
        {
            base.ApplyChromeFromDesignTokens();
            if (!UiThemeProvider.TryGet(out var t))
                return;
            if (progressText != null)
            {
                var bg = UiTokenApplier.GetPanelBackgroundNear(progressText.rectTransform, new Color(0.95f, 0.95f, 0.97f, 1f));
                var fg = UiTokenApplier.ResolveReadableOnBackground(t.palette.textSecondary, bg);
                UiTokenApplier.ApplyText(progressText, t.typography.caption, fg);
            }
        }

        protected override void ApplyTaskContent(StepContext context)
        {
            StopMediaLoads();
            ClearUiHosts();
            _selections.Clear();
            _activeToggles.Clear();
            _optionsDisplayOrder.Clear();
            DestroyToggleGroup();
            _questions = null;
            _dto = null;
            _contentReady = false;
            _currentIndex = 0;
            UnwireNav();

            if (!TryDeserialize(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[MultipleChoiceStepView] Invalid contentJson: {error ?? "unknown"}");
                PresentValidationFeedback(string.IsNullOrEmpty(error) ? "Invalid multiple-choice content." : error);
                return;
            }

            _dto = dto;
            _questions = NormalizeQuestions(dto, out error);
            if (!string.IsNullOrEmpty(error) || !ValidateQuestions(_questions, out error))
            {
                Debug.LogWarning($"[MultipleChoiceStepView] Invalid contentJson: {error ?? "unknown"}");
                PresentValidationFeedback(string.IsNullOrEmpty(error) ? "Invalid multiple-choice content." : error);
                _questions = null;
                return;
            }

            if (titleText != null)
            {
                var p = dto.prompt?.Trim() ?? string.Empty;
                titleText.text = p.Length > 0 ? p : "Multiple choice";
            }

            if (bodyText != null)
            {
                var s = dto.subtitle?.Trim() ?? string.Empty;
                bodyText.text = s;
                bodyText.gameObject.SetActive(s.Length > 0);
            }

            EnsureUiHosts();
            for (var i = 0; i < _questions.Length; i++)
                _selections[i] = new HashSet<string>(StringComparer.Ordinal);
            WireNav();
            _contentReady = true;
            ShowCurrentQuestion();
        }

        public override void SetInteractable(bool interactable)
        {
            _interactable = interactable;
            foreach (var t in _activeToggles)
            {
                if (t != null)
                    t.interactable = interactable;
            }

            SetDeepInteractable(stemHost, interactable);
            RefreshNavInteractable();
        }

        private void OnDestroy() => StopMediaLoads();

        private void EnsureUiHosts()
        {
            var root = transform as RectTransform;
            if (root == null)
                root = gameObject.AddComponent<RectTransform>();

            stemHost ??= CreateStretchBand(root, "StemHost", 0.06f, 0.94f, 0.405f, 0.655f, addVerticalLayout: true);
            optionsHost ??= CreateStretchBand(root, "OptionsHost", 0.06f, 0.94f, 0.04f, 0.385f, addVerticalLayout: true);
            if (progressText == null)
            {
                var row = CreateStretchBand(root, "QuizProgressBand", 0.06f, 0.94f, 0.665f, 0.715f, addVerticalLayout: false);
                _quizProgressRoot = row.gameObject;
                var hGo = new GameObject("QuizProgressRow", typeof(RectTransform), typeof(HorizontalLayoutGroup));
                hGo.transform.SetParent(row, false);
                var h = hGo.GetComponent<HorizontalLayoutGroup>();
                h.spacing = 12f;
                h.childAlignment = TextAnchor.MiddleCenter;
                h.childControlHeight = true;
                h.childControlWidth = true;
                h.childForceExpandHeight = true;
                h.childForceExpandWidth = false;

                prevQuestionButton = CreateNavButton(hGo.transform as RectTransform, "Prev", "←");
                var tGo = new GameObject("ProgressText", typeof(RectTransform), typeof(Text), typeof(CanvasRenderer));
                tGo.transform.SetParent(hGo.transform, false);
                var tRt = tGo.GetComponent<RectTransform>();
                var le = tGo.AddComponent<LayoutElement>();
                le.flexibleWidth = 1f;
                le.minHeight = 36f;
                progressText = tGo.GetComponent<Text>();
                progressText.alignment = TextAnchor.MiddleCenter;
                progressText.font = UiTokenApplier.ResolveFallbackFont();
                progressText.fontSize = 20;
                nextQuestionButton = CreateNavButton(hGo.transform as RectTransform, "Next", "→");

                StretchFull(tRt);
            }

            if (_quizProgressRoot == null)
            {
                var found = transform.Find("QuizProgress");
                if (found != null)
                    _quizProgressRoot = found.gameObject;
            }

            if (prevQuestionButton == null || nextQuestionButton == null)
                Debug.LogWarning("[MultipleChoiceStepView] Assign prev/next buttons for multi-question navigation.");
        }

        private static RectTransform CreateStretchBand(RectTransform parent, string name,
            float xmin, float xmax, float ymin, float ymax, bool addVerticalLayout)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(xmin, ymin);
            rt.anchorMax = new Vector2(xmax, ymax);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            if (addVerticalLayout)
            {
                var v = go.AddComponent<VerticalLayoutGroup>();
                v.padding = new RectOffset(12, 12, 10, 10);
                v.spacing = 14f;
                v.childAlignment = TextAnchor.UpperCenter;
                v.childControlHeight = true;
                v.childControlWidth = true;
                v.childForceExpandWidth = true;
                v.childForceExpandHeight = false;
            }

            return rt;
        }

        private static Button CreateNavButton(RectTransform parent, string name, string label)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            var img = go.GetComponent<Image>();
            img.color = new Color(0.85f, 0.88f, 0.92f, 1f);
            img.raycastTarget = true;
            var btn = go.GetComponent<Button>();
            btn.targetGraphic = img;
            var le = go.AddComponent<LayoutElement>();
            le.preferredWidth = 72f;
            le.minHeight = 40f;
            le.preferredHeight = 40f;
            var tGo = new GameObject("Label", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            tGo.transform.SetParent(go.transform, false);
            var txt = tGo.GetComponent<Text>();
            txt.text = label;
            txt.alignment = TextAnchor.MiddleCenter;
            txt.font = UiTokenApplier.ResolveFallbackFont();
            txt.fontSize = 22;
            txt.color = new Color(0.12f, 0.14f, 0.2f, 1f);
            StretchFull(tGo.GetComponent<RectTransform>());
            return btn;
        }

        private static void StretchFull(RectTransform rt)
        {
            if (rt == null)
                return;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        private void WireNav()
        {
            if (_questions == null || _questions.Length <= 1)
                return;
            _prevClick = () =>
            {
                if (!_interactable || _currentIndex <= 0)
                    return;
                _currentIndex--;
                ShowCurrentQuestion();
            };
            _nextClick = () =>
            {
                if (!_interactable || _currentIndex >= _questions.Length - 1)
                    return;
                _currentIndex++;
                ShowCurrentQuestion();
            };
            if (prevQuestionButton != null)
                prevQuestionButton.onClick.AddListener(_prevClick);
            if (nextQuestionButton != null)
                nextQuestionButton.onClick.AddListener(_nextClick);
        }

        private void UnwireNav()
        {
            if (prevQuestionButton != null && _prevClick != null)
                prevQuestionButton.onClick.RemoveListener(_prevClick);
            if (nextQuestionButton != null && _nextClick != null)
                nextQuestionButton.onClick.RemoveListener(_nextClick);
            _prevClick = null;
            _nextClick = null;
        }

        private void ShowCurrentQuestion()
        {
            if (!_contentReady || _questions == null || _currentIndex < 0 || _currentIndex >= _questions.Length)
                return;

            EnsureUiHosts();
            ClearQuestionUi();
            var q = _questions[_currentIndex];
            if (q == null)
            {
                PresentValidationFeedback("Invalid multiple-choice question.");
                return;
            }

            BuildStem(q);
            BuildOptions(q);

            var showNav = _questions.Length > 1;
            if (_quizProgressRoot != null)
                _quizProgressRoot.SetActive(showNav);
            if (progressText != null)
            {
                progressText.gameObject.SetActive(showNav);
                if (showNav)
                    progressText.text = $"{_currentIndex + 1} / {_questions.Length}";
            }

            if (prevQuestionButton != null)
                prevQuestionButton.gameObject.SetActive(showNav);
            if (nextQuestionButton != null)
                nextQuestionButton.gameObject.SetActive(showNav);
            RefreshNavInteractable();
        }

        private void RefreshNavInteractable()
        {
            if (prevQuestionButton != null)
            {
                prevQuestionButton.interactable = _interactable && _questions != null && _questions.Length > 1 &&
                                                  _currentIndex > 0;
            }

            if (nextQuestionButton != null)
            {
                nextQuestionButton.interactable = _interactable && _questions != null && _questions.Length > 1 &&
                                                  _currentIndex < _questions.Length - 1;
            }
        }

        private void ClearQuestionUi()
        {
            _activeToggles.Clear();
            DestroyToggleGroup();
            ClearChildren(stemHost);
            ClearChildren(optionsHost);
        }

        private void ClearUiHosts()
        {
            ClearChildren(stemHost);
            ClearChildren(optionsHost);
        }

        private static void ClearChildren(RectTransform host)
        {
            if (host == null)
                return;
            for (var i = host.childCount - 1; i >= 0; i--)
            {
                var ch = host.GetChild(i);
                if (ch != null)
                    Destroy(ch.gameObject);
            }
        }

        private void DestroyToggleGroup()
        {
            // ToggleGroup is DisallowMultiple on one GameObject. Destroy() queues teardown for end-of-frame,
            // so AddComponent<ToggleGroup>() in the same pass can no-op / fail. DestroyImmediate on the
            // component removes it now; use only for this small UI teardown, not as a general pattern.
            if (optionsHost != null)
            {
                var groups = optionsHost.GetComponents<ToggleGroup>();
                for (var i = 0; i < groups.Length; i++)
                {
                    var g = groups[i];
                    if (g != null)
                        DestroyImmediate(g);
                }
            }

            _toggleGroup = null;
        }

        private void BuildStem(MultipleChoiceQuestionDto q)
        {
            if (q == null || stemHost == null)
                return;
            UiThemeProvider.TryGet(out var tokens);
            var blocks = q.stem;
            if (blocks == null || blocks.Length == 0)
                return;
            foreach (var b in blocks)
            {
                if (b == null || string.IsNullOrWhiteSpace(b.kind))
                    continue;
                var kind = b.kind.Trim();
                if (string.Equals(kind, "text", StringComparison.OrdinalIgnoreCase))
                {
                    var run = b.text?.Trim() ?? string.Empty;
                    if (run.Length == 0)
                        continue;
                    AddStemText(run, tokens);
                    continue;
                }

                if (string.Equals(kind, "image", StringComparison.OrdinalIgnoreCase))
                {
                    var url = (b.imageUrl ?? string.Empty).Trim();
                    if (url.Length == 0 || !IsAllowedHttpMediaUrl(url, out _))
                        continue;
                    AddStemImage(url, tokens);
                    continue;
                }

                if (string.Equals(kind, "audio", StringComparison.OrdinalIgnoreCase))
                {
                    var url = (b.audioUrl ?? string.Empty).Trim();
                    if (url.Length == 0 || !IsAllowedHttpMediaUrl(url, out _))
                        continue;
                    AddStemAudio(url, tokens);
                }
            }
        }

        private void AddStemText(string run, UiDesignTokens tokens)
        {
            var go = new GameObject("StemText", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            go.transform.SetParent(stemHost, false);
            var text = go.GetComponent<Text>();
            text.text = run;
            text.font = UiTokenApplier.ResolveFallbackFont();
            text.fontSize = 24;
            text.alignment = TextAnchor.UpperLeft;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Overflow;
            text.color = new Color(0.12f, 0.14f, 0.2f, 1f);
            if (tokens != null)
            {
                var bg = UiTokenApplier.GetPanelBackgroundNear(text.rectTransform, new Color(0.95f, 0.95f, 0.97f, 1f));
                var fg = UiTokenApplier.ResolveReadableOnBackground(tokens.palette.textPrimary, bg);
                UiTokenApplier.ApplyText(text, tokens.typography.body, fg);
            }

            var fit = go.AddComponent<ContentSizeFitter>();
            fit.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
            fit.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            var le = go.AddComponent<LayoutElement>();
            le.minHeight = 28f;
            le.flexibleWidth = 1f;
        }

        private void AddStemImage(string url, UiDesignTokens _)
        {
            var go = new GameObject("StemImage", typeof(RectTransform), typeof(CanvasRenderer), typeof(RawImage));
            go.transform.SetParent(stemHost, false);
            var raw = go.GetComponent<RawImage>();
            raw.raycastTarget = false;
            var le = go.AddComponent<LayoutElement>();
            le.flexibleWidth = 1f;
            le.preferredHeight = MaxStemImageHeight;
            le.minHeight = 120f;
            _mediaLoads.Add(StartCoroutine(LoadRemoteTexture(url, raw)));
        }

        private void AddStemAudio(string url, UiDesignTokens tokens)
        {
            var row = new GameObject("StemAudio", typeof(RectTransform));
            row.transform.SetParent(stemHost, false);
            var rt = row.GetComponent<RectTransform>();
            var h = row.AddComponent<HorizontalLayoutGroup>();
            h.spacing = 10f;
            h.childAlignment = TextAnchor.MiddleLeft;
            h.childControlHeight = true;
            h.childControlWidth = true;
            h.childForceExpandWidth = false;
            var leRow = row.AddComponent<LayoutElement>();
            leRow.flexibleWidth = 1f;
            leRow.minHeight = 44f;

            var playGo = new GameObject("PlayAudio", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image),
                typeof(Button));
            playGo.transform.SetParent(row.transform, false);
            var playImg = playGo.GetComponent<Image>();
            playImg.color = new Color(0.35f, 0.55f, 0.9f, 1f);
            playImg.raycastTarget = true;
            var playBtn = playGo.GetComponent<Button>();
            playBtn.targetGraphic = playImg;
            var playLe = playGo.AddComponent<LayoutElement>();
            playLe.preferredWidth = 120f;
            playLe.minHeight = 40f;
            var playLabelGo =
                new GameObject("Label", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            playLabelGo.transform.SetParent(playGo.transform, false);
            var playLabel = playLabelGo.GetComponent<Text>();
            playLabel.text = "Play audio";
            playLabel.alignment = TextAnchor.MiddleCenter;
            playLabel.font = UiTokenApplier.ResolveFallbackFont();
            playLabel.fontSize = 18;
            playLabel.color = Color.white;
            StretchFull(playLabelGo.GetComponent<RectTransform>());

            playBtn.onClick.AddListener(() =>
            {
                if (!_interactable)
                    return;
                EnsureAudioSource();
                _mediaLoads.Add(StartCoroutine(LoadAndPlayClip(url)));
            });
            SetDeepInteractable(rt, _interactable);
        }

        private void EnsureAudioSource()
        {
            if (_audioSource != null)
                return;
            _audioSource = gameObject.GetComponent<AudioSource>();
            if (_audioSource == null)
                _audioSource = gameObject.AddComponent<AudioSource>();
            _audioSource.playOnAwake = false;
        }

        private IEnumerator LoadAndPlayClip(string url)
        {
            EnsureAudioSource();
            var type = GuessAudioType(url);
            using var req = UnityWebRequestMultimedia.GetAudioClip(url, type);
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success || _audioSource == null)
                yield break;
            var clip = DownloadHandlerAudioClip.GetContent(req);
            if (clip == null)
                yield break;
            _audioSource.Stop();
            _audioSource.clip = clip;
            _audioSource.Play();
        }

        private static AudioType GuessAudioType(string url)
        {
            var u = url.ToLowerInvariant();
            if (u.Contains(".mp3"))
                return AudioType.MPEG;
            if (u.Contains(".ogg"))
                return AudioType.OGGVORBIS;
            if (u.Contains(".wav"))
                return AudioType.WAV;
            return AudioType.UNKNOWN;
        }

        private void BuildOptions(MultipleChoiceQuestionDto q)
        {
            if (q == null)
            {
                Debug.LogError("[MultipleChoiceStepView] BuildOptions called with a null question.");
                EnsureUiHosts();
                DestroyToggleGroup();
                ClearChildren(stemHost);
                ClearChildren(optionsHost);
                return;
            }

            EnsureUiHosts();
            if (optionsHost == null)
            {
                ClearChildren(stemHost);
                PresentValidationFeedback("UI layout is missing an answer area.");
                return;
            }

            if (q.options == null)
            {
                DestroyToggleGroup();
                ClearChildren(stemHost);
                ClearChildren(optionsHost);
                PresentValidationFeedback("Invalid multiple-choice content.");
                return;
            }
            DestroyToggleGroup();
            if (IsSingleSelect(q))
            {
                _toggleGroup = optionsHost.gameObject.AddComponent<ToggleGroup>();
                if (_toggleGroup == null)
                {
                    Debug.LogError("[MultipleChoiceStepView] Failed to add ToggleGroup; single-select UI may be broken.");
                    ClearChildren(stemHost);
                    PresentValidationFeedback("Could not build answer controls. Try again or reload the quest.");
                    return;
                }

                _toggleGroup.allowSwitchOff = true;
            }

            _optionsDisplayOrder.Clear();
            foreach (var o in q.options)
            {
                if (o != null && !string.IsNullOrWhiteSpace(o.id))
                    _optionsDisplayOrder.Add(o);
            }

            if (_optionsDisplayOrder.Count == 0)
            {
                DestroyToggleGroup();
                ClearChildren(stemHost);
                ClearChildren(optionsHost);
                PresentValidationFeedback("This question has no valid answer choices.");
                return;
            }

            if (!q.preserveOptionOrder)
                ShuffleOptions(_optionsDisplayOrder);

            foreach (var opt in _optionsDisplayOrder)
                CreateOptionRow(q, opt);
        }

        private void CreateOptionRow(MultipleChoiceQuestionDto q, McOptionDto opt)
        {
            if (opt == null)
                return;
            var id = opt.id.Trim();
            var row = new GameObject($"Option_{id}", typeof(RectTransform));
            row.transform.SetParent(optionsHost, false);
            var h = row.AddComponent<HorizontalLayoutGroup>();
            h.spacing = 16f;
            h.padding = new RectOffset(4, 4, 6, 6);
            h.childAlignment = TextAnchor.UpperLeft;
            h.childControlHeight = true;
            h.childControlWidth = true;
            h.childForceExpandHeight = false;
            h.childForceExpandWidth = true;
            var rowLe = row.AddComponent<LayoutElement>();
            rowLe.minHeight = 52f;
            rowLe.flexibleWidth = 1f;

            var toggleGo =
                new GameObject("Toggle", typeof(RectTransform), typeof(CanvasRenderer), typeof(Toggle), typeof(Image));
            toggleGo.transform.SetParent(row.transform, false);
            var bg = toggleGo.GetComponent<Image>();
            bg.color = new Color(0.92f, 0.93f, 0.96f, 1f);
            bg.raycastTarget = true;
            var toggle = toggleGo.GetComponent<Toggle>();
            toggle.targetGraphic = bg;
            var checkGo = new GameObject("Checkmark", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
            checkGo.transform.SetParent(toggleGo.transform, false);
            var chkImg = checkGo.GetComponent<Image>();
            chkImg.color = new Color(0.2f, 0.55f, 0.35f, 1f);
            chkImg.raycastTarget = false;
            StretchFull(checkGo.GetComponent<RectTransform>());
            chkImg.rectTransform.offsetMin = new Vector2(6f, 6f);
            chkImg.rectTransform.offsetMax = new Vector2(-6f, -6f);
            toggle.graphic = chkImg;
            toggle.group = _toggleGroup;
            toggle.isOn = SelectionSetFor(_currentIndex).Contains(id);
            var tLe = toggleGo.AddComponent<LayoutElement>();
            tLe.preferredWidth = 40f;
            tLe.preferredHeight = 40f;
            toggle.onValueChanged.AddListener(on =>
            {
                if (!_interactable)
                    return;
                var set = SelectionSetFor(_currentIndex);
                if (IsSingleSelect(q))
                {
                    if (on)
                    {
                        set.Clear();
                        set.Add(id);
                    }
                    else
                        set.Remove(id);
                }
                else if (on)
                    set.Add(id);
                else
                    set.Remove(id);
            });
            _activeToggles.Add(toggle);

            var labelWrap = new GameObject("LabelWrap", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            labelWrap.transform.SetParent(row.transform, false);
            var label = labelWrap.GetComponent<Text>();
            label.text = (opt.label ?? string.Empty).Trim();
            label.font = UiTokenApplier.ResolveFallbackFont();
            label.fontSize = 22;
            label.alignment = TextAnchor.UpperLeft;
            label.horizontalOverflow = HorizontalWrapMode.Wrap;
            label.verticalOverflow = VerticalWrapMode.Overflow;
            label.color = new Color(0.12f, 0.14f, 0.2f, 1f);
            var lFitter = labelWrap.AddComponent<ContentSizeFitter>();
            lFitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
            lFitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            var lLe = labelWrap.AddComponent<LayoutElement>();
            lLe.flexibleWidth = 1f;
            lLe.minWidth = 40f;
            if (UiThemeProvider.TryGet(out var tokens))
            {
                var bgc = UiTokenApplier.GetPanelBackgroundNear(label.rectTransform, new Color(0.95f, 0.95f, 0.97f, 1f));
                var fg = UiTokenApplier.ResolveReadableOnBackground(tokens.palette.textPrimary, bgc);
                UiTokenApplier.ApplyText(label, tokens.typography.body, fg);
            }

            var imgUrl = (opt.imageUrl ?? string.Empty).Trim();
            if (!string.IsNullOrEmpty(imgUrl) && IsAllowedHttpMediaUrl(imgUrl, out _))
            {
                var imgGo = new GameObject("OptionImage", typeof(RectTransform), typeof(CanvasRenderer), typeof(RawImage));
                imgGo.transform.SetParent(row.transform, false);
                var raw = imgGo.GetComponent<RawImage>();
                raw.raycastTarget = false;
                var iLe = imgGo.AddComponent<LayoutElement>();
                iLe.preferredWidth = 96f;
                iLe.preferredHeight = 96f;
                _mediaLoads.Add(StartCoroutine(LoadRemoteTexture(imgUrl, raw)));
            }
        }

        private static void ShuffleOptions(List<McOptionDto> list)
        {
            var rng = new System.Random(Environment.TickCount ^ (int)(Time.realtimeSinceStartup * 1000f));
            for (var i = list.Count - 1; i > 0; i--)
            {
                var j = rng.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }

        protected override bool ValidateBeforeComplete()
        {
            if (!_contentReady || _questions == null)
            {
                PresentValidationFeedback("Invalid multiple-choice content.");
                return false;
            }

            for (var i = 0; i < _questions.Length; i++)
            {
                if (!_selections.TryGetValue(i, out var sel) || sel == null || sel.Count == 0)
                {
                    PresentValidationFeedback("Please answer every question before checking.");
                    JumpToQuestion(i);
                    return false;
                }

                var q = _questions[i];
                var correct = NormalizeIdSet(q.correctOptionIds);
                if (IsSingleSelect(q))
                {
                    if (sel.Count != 1 || !correct.SetEquals(sel))
                    {
                        PresentValidationFeedback("Not quite — check your answers.");
                        JumpToQuestion(i);
                        return false;
                    }
                }
                else
                {
                    if (!correct.SetEquals(sel))
                    {
                        PresentValidationFeedback("Not quite — check your answers.");
                        JumpToQuestion(i);
                        return false;
                    }
                }
            }

            return true;
        }

        private HashSet<string> SelectionSetFor(int index)
        {
            if (!_selections.TryGetValue(index, out var set) || set == null)
            {
                set = new HashSet<string>(StringComparer.Ordinal);
                _selections[index] = set;
            }

            return set;
        }

        private void JumpToQuestion(int index)
        {
            if (_questions == null || index < 0 || index >= _questions.Length)
                return;
            _currentIndex = index;
            ShowCurrentQuestion();
        }

        private static bool IsSingleSelect(MultipleChoiceQuestionDto q) =>
            !string.Equals((q.selectionMode ?? "single").Trim(), "multiple", StringComparison.OrdinalIgnoreCase);

        private static HashSet<string> NormalizeIdSet(string[] ids)
        {
            var s = new HashSet<string>(StringComparer.Ordinal);
            if (ids == null)
                return s;
            foreach (var id in ids)
            {
                if (!string.IsNullOrWhiteSpace(id))
                    s.Add(id.Trim());
            }

            return s;
        }

        private void StopMediaLoads()
        {
            foreach (var c in _mediaLoads)
            {
                if (c != null)
                    StopCoroutine(c);
            }

            _mediaLoads.Clear();
            if (_audioSource != null)
            {
                _audioSource.Stop();
                _audioSource.clip = null;
            }
        }

        private static IEnumerator LoadRemoteTexture(string url, RawImage raw)
        {
            using var req = UnityWebRequestTexture.GetTexture(url);
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success || raw == null)
                yield break;
            var tex = DownloadHandlerTexture.GetContent(req);
            if (tex != null)
                raw.texture = tex;
        }

        private static void SetDeepInteractable(RectTransform root, bool interactable)
        {
            if (root == null)
                return;
            var buttons = root.GetComponentsInChildren<Button>(true);
            foreach (var b in buttons)
                if (b != null)
                    b.interactable = interactable;
        }

        private static bool IsAllowedHttpMediaUrl(string raw, out string error)
        {
            error = null;
            if (string.IsNullOrWhiteSpace(raw))
                return true;
            var s = raw.Trim();
            if (!Uri.TryCreate(s, UriKind.Absolute, out var uri))
            {
                error = "Media URL must be an absolute URL.";
                return false;
            }

            if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            {
                error = "Media URL must use http or https.";
                return false;
            }

            return true;
        }

        private static MultipleChoiceQuestionDto[] NormalizeQuestions(MultipleChoiceContentDto d, out string error)
        {
            error = null;
            if (d.questions != null && d.questions.Length > 0)
                return d.questions;
            var synthetic = new MultipleChoiceQuestionDto
            {
                id = string.Empty,
                selectionMode = d.selectionMode,
                preserveOptionOrder = d.preserveOptionOrder,
                stem = d.stem,
                options = d.options,
                correctOptionIds = d.correctOptionIds
            };
            return new[] { synthetic };
        }

        private static bool TryDeserialize(string json, out MultipleChoiceContentDto dto, out string error)
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
                error = "Multiple-choice content must be a JSON object.";
                return false;
            }

            dto = JsonUtility.FromJson<MultipleChoiceContentDto>(json);
            if (dto == null)
            {
                error = "Could not parse JSON.";
                return false;
            }

            return true;
        }

        private static bool ValidateQuestions(MultipleChoiceQuestionDto[] qs, out string error)
        {
            error = null;
            if (qs == null || qs.Length == 0)
            {
                error = "At least one question is required.";
                return false;
            }

            foreach (var q in qs)
            {
                if (q == null)
                {
                    error = "Each question must be an object.";
                    return false;
                }

                if (q.options == null || q.options.Length < MinOptions)
                {
                    error =
                        $"Each question needs at least {MinOptions} options.";
                    return false;
                }

                if (q.options.Length > MaxOptions)
                {
                    error = $"Each question may have at most {MaxOptions} options.";
                    return false;
                }

                var optionIds = new HashSet<string>(StringComparer.Ordinal);
                foreach (var o in q.options)
                {
                    if (o == null || string.IsNullOrWhiteSpace(o.id))
                    {
                        error = "Each option needs an id.";
                        return false;
                    }

                    var id = o.id.Trim();
                    if (!optionIds.Add(id))
                    {
                        error = "Duplicate option id.";
                        return false;
                    }

                    var hasLabel = !string.IsNullOrWhiteSpace(o.label);
                    var hasImg = !string.IsNullOrWhiteSpace(o.imageUrl);
                    if (!hasLabel && !hasImg)
                    {
                        error = "Each option needs a label and/or imageUrl.";
                        return false;
                    }

                    if (hasImg && !IsAllowedHttpMediaUrl(o.imageUrl, out var ue))
                    {
                        error = ue ?? "Invalid option imageUrl.";
                        return false;
                    }
                }

                var correct = NormalizeIdSet(q.correctOptionIds);
                if (correct.Count == 0)
                {
                    error = "Each question needs correctOptionIds.";
                    return false;
                }

                foreach (var cid in correct)
                {
                    if (!optionIds.Contains(cid))
                    {
                        error = "correctOptionIds must match option ids.";
                        return false;
                    }
                }

                var single = IsSingleSelect(q);
                if (single)
                {
                    if (correct.Count != 1)
                    {
                        error = "Single-select questions need exactly one correctOptionId.";
                        return false;
                    }
                }
                else
                {
                    if (correct.Count < 2)
                    {
                        error = "Multi-select questions need at least two correctOptionIds.";
                        return false;
                    }
                }

                if (q.stem != null)
                {
                    foreach (var b in q.stem)
                    {
                        if (b == null || string.IsNullOrWhiteSpace(b.kind))
                            continue;
                        var k = b.kind.Trim();
                        if (string.Equals(k, "image", StringComparison.OrdinalIgnoreCase))
                        {
                            if (string.IsNullOrWhiteSpace(b.imageUrl))
                            {
                                error = "Stem image blocks need imageUrl.";
                                return false;
                            }

                            if (!IsAllowedHttpMediaUrl(b.imageUrl, out var ie))
                            {
                                error = ie ?? "Invalid stem imageUrl.";
                                return false;
                            }
                        }
                        else if (string.Equals(k, "audio", StringComparison.OrdinalIgnoreCase))
                        {
                            if (string.IsNullOrWhiteSpace(b.audioUrl))
                            {
                                error = "Stem audio blocks need audioUrl.";
                                return false;
                            }

                            if (!IsAllowedHttpMediaUrl(b.audioUrl, out var ae))
                            {
                                error = ae ?? "Invalid stem audioUrl.";
                                return false;
                            }
                        }
                    }
                }
            }

            return true;
        }
    }

    [Serializable]
    public sealed class MultipleChoiceContentDto
    {
        public string prompt;
        public string subtitle;
        public MultipleChoiceQuestionDto[] questions;
        public string selectionMode;
        /// <summary>Omit or <c>false</c> to shuffle option order per question. <c>true</c> keeps JSON order.</summary>
        public bool preserveOptionOrder;
        public McStemBlockDto[] stem;
        public McOptionDto[] options;
        public string[] correctOptionIds;
    }

    [Serializable]
    public sealed class MultipleChoiceQuestionDto
    {
        public string id;
        public string selectionMode;
        public bool preserveOptionOrder;
        public McStemBlockDto[] stem;
        public McOptionDto[] options;
        public string[] correctOptionIds;
    }

    [Serializable]
    public sealed class McStemBlockDto
    {
        public string kind;
        public string text;
        public string imageUrl;
        public string audioUrl;
    }

    [Serializable]
    public sealed class McOptionDto
    {
        public string id;
        public string label;
        public string imageUrl;
    }
}
