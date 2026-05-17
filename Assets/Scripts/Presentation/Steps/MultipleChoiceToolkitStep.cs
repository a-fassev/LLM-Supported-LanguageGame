using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Multiple-choice task UI (UI Toolkit) — behavior aligned with <see cref="MultipleChoiceStepView"/>.</summary>
    public sealed class MultipleChoiceToolkitStep : IStepView, ISubmitFromShell
    {
        private const int MinOptions = 2;
        private const int MaxOptions = 8;
        private const int MaxStemImageHeight = 260;

        private readonly VisualElement _root;
        private readonly VisualElement _headerHost;
        private readonly VisualElement _stemHost;
        private readonly VisualElement _optionsHost;
        private readonly VisualElement _navHost;
        private readonly Button _prevButton;
        private readonly Button _nextButton;
        private readonly Label _progressLabel;
        private readonly MonoBehaviour _coroutineHost;
        private readonly List<Coroutine> _mediaLoads = new();
        private readonly List<Texture2D> _remoteImageTextures = new();
        private readonly List<Toggle> _activeToggles = new();
        private readonly Dictionary<int, HashSet<string>> _selections = new();

        private MultipleChoiceContentDto _dto;
        private MultipleChoiceQuestionDto[] _questions;
        private readonly List<McOptionDto> _optionsDisplayOrder = new();
        private int _currentIndex;
        private bool _contentReady;
        private bool _interactable = true;
        private bool _suppressToggle;
        private AudioSource _audioSource;

        private StepContext _context;
        private Action<StepCompletionRequest> _onRequest;

        public MultipleChoiceToolkitStep(VisualElement host, MonoBehaviour coroutineHost)
        {
            _coroutineHost = coroutineHost;
            _root = new VisualElement();
            _root.style.flexGrow = 1;
            _root.AddToClassList("lg-muted-panel");
            _root.style.paddingTop = 16;
            _root.style.paddingBottom = 16;
            _root.style.paddingLeft = 16;
            _root.style.paddingRight = 16;

            _headerHost = new VisualElement();
            _headerHost.style.flexGrow = 0;
            _root.Add(_headerHost);

            _stemHost = new VisualElement();
            _stemHost.style.flexGrow = 0;
            _stemHost.style.marginBottom = 12;
            _root.Add(_stemHost);

            _optionsHost = new VisualElement();
            _optionsHost.style.flexGrow = 1;
            _root.Add(_optionsHost);

            _navHost = new VisualElement();
            _navHost.style.flexDirection = FlexDirection.Row;
            _navHost.style.alignItems = Align.Center;
            _navHost.style.justifyContent = Justify.Center;
            _navHost.style.marginTop = 12;
            _prevButton = new Button { text = "←" };
            _prevButton.AddToClassList("lg-btn");
            _prevButton.AddToClassList("lg-btn--secondary");
            _progressLabel = new Label();
            _progressLabel.AddToClassList("lg-text-caption");
            _progressLabel.style.marginLeft = 12;
            _progressLabel.style.marginRight = 12;
            _nextButton = new Button { text = "→" };
            _nextButton.AddToClassList("lg-btn");
            _nextButton.AddToClassList("lg-btn--secondary");
            _navHost.Add(_prevButton);
            _navHost.Add(_progressLabel);
            _navHost.Add(_nextButton);
            _root.Add(_navHost);

            _prevButton.clicked += OnPrevClicked;
            _nextButton.clicked += OnNextClicked;

            host.Add(_root);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context;
            _onRequest = onRequest;
            StopMediaLoads();
            _headerHost.Clear();
            _stemHost.Clear();
            _optionsHost.Clear();
            _activeToggles.Clear();
            _selections.Clear();
            _optionsDisplayOrder.Clear();
            _questions = null;
            _dto = null;
            _contentReady = false;
            _currentIndex = 0;

            if (!TryDeserialize(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[MultipleChoiceToolkitStep] Invalid contentJson: {error ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(error) ? "Invalid multiple-choice content." : error);
                return;
            }

            _dto = dto;
            _questions = NormalizeQuestions(dto, out error);
            if (!string.IsNullOrEmpty(error) || !ValidateQuestions(_questions, out error))
            {
                Debug.LogWarning($"[MultipleChoiceToolkitStep] Invalid contentJson: {error ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(error) ? "Invalid multiple-choice content." : error);
                _questions = null;
                return;
            }

            if (!string.IsNullOrEmpty(dto.prompt?.Trim()))
            {
                var title = new Label(dto.prompt.Trim());
                title.AddToClassList("lg-heading-screen");
                title.style.marginBottom = 8;
                title.style.whiteSpace = WhiteSpace.Normal;
                _headerHost.Add(title);
            }

            if (!string.IsNullOrEmpty(dto.subtitle?.Trim()))
            {
                var sub = new Label(dto.subtitle.Trim());
                sub.AddToClassList("lg-text-body");
                sub.AddToClassList("lg-text-muted");
                sub.style.marginBottom = 12;
                sub.style.whiteSpace = WhiteSpace.Normal;
                _headerHost.Add(sub);
            }

            for (var i = 0; i < _questions.Length; i++)
                _selections[i] = new HashSet<string>(StringComparer.Ordinal);

            _contentReady = true;
            ShowCurrentQuestion();
        }

        public void SetInteractable(bool interactable)
        {
            _interactable = interactable;
            foreach (var tg in _activeToggles)
            {
                if (tg != null)
                    tg.SetEnabled(interactable);
            }

            RefreshNavInteractable();
        }

        public void SubmitFromShell()
        {
            if (!_contentReady || _questions == null)
            {
                _context?.presentValidationMessage?.Invoke("Invalid multiple-choice content.");
                return;
            }

            for (var i = 0; i < _questions.Length; i++)
            {
                if (!_selections.TryGetValue(i, out var sel) || sel == null || sel.Count == 0)
                {
                    _context?.presentValidationMessage?.Invoke("Please answer every question before checking.");
                    JumpToQuestion(i);
                    return;
                }

                var q = _questions[i];
                var correct = NormalizeIdSet(q.correctOptionIds);
                if (IsSingleSelect(q))
                {
                    if (sel.Count != 1 || !correct.SetEquals(sel))
                    {
                        _context?.presentValidationMessage?.Invoke("Not quite — check your answers.");
                        JumpToQuestion(i);
                        return;
                    }
                }
                else if (!correct.SetEquals(sel))
                {
                    _context?.presentValidationMessage?.Invoke("Not quite — check your answers.");
                    JumpToQuestion(i);
                    return;
                }
            }

            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        public void Teardown()
        {
            StopMediaLoads();
            _context = null;
            _onRequest = null;
            _root?.RemoveFromHierarchy();
        }

        private void OnPrevClicked()
        {
            if (!_interactable || _questions == null || _currentIndex <= 0)
                return;
            _currentIndex--;
            ShowCurrentQuestion();
        }

        private void OnNextClicked()
        {
            if (!_interactable || _questions == null || _currentIndex >= _questions.Length - 1)
                return;
            _currentIndex++;
            ShowCurrentQuestion();
        }

        private void ShowCurrentQuestion()
        {
            if (!_contentReady || _questions == null || _currentIndex < 0 || _currentIndex >= _questions.Length)
                return;

            _stemHost.Clear();
            _optionsHost.Clear();
            _activeToggles.Clear();
            StopMediaLoads();

            var q = _questions[_currentIndex];
            if (q == null)
            {
                _context?.presentValidationMessage?.Invoke("Invalid multiple-choice question.");
                return;
            }

            BuildStem(q);
            BuildOptions(q);

            var showNav = _questions.Length > 1;
            _navHost.style.display = showNav ? DisplayStyle.Flex : DisplayStyle.None;
            if (showNav)
                _progressLabel.text = $"{_currentIndex + 1} / {_questions.Length}";

            RefreshNavInteractable();
        }

        private void RefreshNavInteractable()
        {
            if (_prevButton != null)
                _prevButton.SetEnabled(_interactable && _questions != null && _questions.Length > 1 && _currentIndex > 0);
            if (_nextButton != null)
                _nextButton.SetEnabled(_interactable && _questions != null && _questions.Length > 1 &&
                                        _currentIndex < _questions.Length - 1);
        }

        private void BuildStem(MultipleChoiceQuestionDto q)
        {
            if (q?.stem == null || q.stem.Length == 0)
                return;
            foreach (var b in q.stem)
            {
                if (b == null || string.IsNullOrWhiteSpace(b.kind))
                    continue;
                var kind = b.kind.Trim();
                if (string.Equals(kind, "text", StringComparison.OrdinalIgnoreCase))
                {
                    var run = b.text?.Trim() ?? string.Empty;
                    if (run.Length == 0)
                        continue;
                    var lbl = new Label(run);
                    lbl.AddToClassList("lg-text-body");
                    lbl.style.whiteSpace = WhiteSpace.Normal;
                    lbl.style.marginBottom = 8;
                    _stemHost.Add(lbl);
                    continue;
                }

                if (string.Equals(kind, "image", StringComparison.OrdinalIgnoreCase))
                {
                    var url = (b.imageUrl ?? string.Empty).Trim();
                    if (url.Length == 0 || !IsAllowedHttpMediaUrl(url, out _))
                        continue;
                    var imgVe = new VisualElement();
                    imgVe.style.height = MaxStemImageHeight;
                    imgVe.style.minHeight = 120;
                    imgVe.style.marginBottom = 8;
                    imgVe.style.backgroundSize = new BackgroundSize(BackgroundSizeType.Contain);
                    if (_coroutineHost != null)
                        _mediaLoads.Add(_coroutineHost.StartCoroutine(LoadRemoteTextureBg(url, imgVe)));
                    _stemHost.Add(imgVe);
                    continue;
                }

                if (string.Equals(kind, "audio", StringComparison.OrdinalIgnoreCase))
                {
                    var url = (b.audioUrl ?? string.Empty).Trim();
                    if (url.Length == 0 || !IsAllowedHttpMediaUrl(url, out _))
                        continue;
                    var play = new Button { text = "Play audio" };
                    play.AddToClassList("lg-btn");
                    play.AddToClassList("lg-btn--secondary");
                    play.style.marginBottom = 8;
                    play.clicked += () =>
                    {
                        if (!_interactable || _coroutineHost == null)
                            return;
                        _mediaLoads.Add(_coroutineHost.StartCoroutine(LoadAndPlayClip(url)));
                    };
                    _stemHost.Add(play);
                }
            }
        }

        private void BuildOptions(MultipleChoiceQuestionDto q)
        {
            if (q?.options == null)
            {
                _context?.presentValidationMessage?.Invoke("Invalid multiple-choice content.");
                return;
            }

            _optionsDisplayOrder.Clear();
            foreach (var o in q.options)
            {
                if (o != null && !string.IsNullOrWhiteSpace(o.id))
                    _optionsDisplayOrder.Add(o);
            }

            if (_optionsDisplayOrder.Count == 0)
            {
                _context?.presentValidationMessage?.Invoke("This question has no valid answer choices.");
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

            var row = new VisualElement();
            row.style.flexDirection = FlexDirection.Row;
            row.style.alignItems = Align.Center;
            row.style.marginBottom = 10;
            row.AddToClassList("lg-list-row-button");
            row.style.paddingTop = 8;
            row.style.paddingBottom = 8;
            row.style.paddingLeft = 8;
            row.style.paddingRight = 8;

            var toggle = new Toggle();
            toggle.value = SelectionSetFor(_currentIndex).Contains(id);
            toggle.SetEnabled(_interactable);

            toggle.RegisterValueChangedCallback(evt =>
            {
                if (!_interactable || _suppressToggle)
                    return;
                var set = SelectionSetFor(_currentIndex);
                if (IsSingleSelect(q))
                {
                    if (evt.newValue)
                    {
                        _suppressToggle = true;
                        foreach (var t in _activeToggles)
                        {
                            if (t != null && t != toggle)
                                t.SetValueWithoutNotify(false);
                        }

                        _suppressToggle = false;
                        set.Clear();
                        set.Add(id);
                    }
                    else
                        set.Remove(id);
                }
                else if (evt.newValue)
                    set.Add(id);
                else
                    set.Remove(id);
            });

            _activeToggles.Add(toggle);
            row.Add(toggle);

            var label = new Label((opt.label ?? string.Empty).Trim());
            label.AddToClassList("lg-text-body");
            label.style.whiteSpace = WhiteSpace.Normal;
            label.style.flexGrow = 1;
            label.style.marginLeft = 8;
            row.Add(label);

            var imgUrl = (opt.imageUrl ?? string.Empty).Trim();
            if (!string.IsNullOrEmpty(imgUrl) && IsAllowedHttpMediaUrl(imgUrl, out _) && _coroutineHost != null)
            {
                var imgVe = new VisualElement();
                imgVe.style.width = 96;
                imgVe.style.height = 96;
                imgVe.style.marginLeft = 8;
                imgVe.style.backgroundSize = new BackgroundSize(BackgroundSizeType.Cover);
                _mediaLoads.Add(_coroutineHost.StartCoroutine(LoadRemoteTextureBg(imgUrl, imgVe)));
                row.Add(imgVe);
            }

            _optionsHost.Add(row);
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

        private void StopMediaLoads()
        {
            if (_coroutineHost == null)
            {
                _mediaLoads.Clear();
                foreach (var tex in _remoteImageTextures)
                {
                    if (tex != null)
                        UnityEngine.Object.Destroy(tex);
                }

                _remoteImageTextures.Clear();
                StopAndDestroyLoadedAudioClip();
                return;
            }

            foreach (var c in _mediaLoads)
            {
                if (c != null)
                    _coroutineHost.StopCoroutine(c);
            }

            _mediaLoads.Clear();
            foreach (var tex in _remoteImageTextures)
            {
                if (tex != null)
                    UnityEngine.Object.Destroy(tex);
            }

            _remoteImageTextures.Clear();
            StopAndDestroyLoadedAudioClip();
        }

        private void StopAndDestroyLoadedAudioClip()
        {
            if (_audioSource == null)
                return;
            _audioSource.Stop();
            var clip = _audioSource.clip;
            _audioSource.clip = null;
            if (clip != null)
                UnityEngine.Object.Destroy(clip);
        }

        private IEnumerator LoadRemoteTextureBg(string url, VisualElement target)
        {
            using var req = UnityWebRequestTexture.GetTexture(url);
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success || target == null)
                yield break;
            var tex = DownloadHandlerTexture.GetContent(req);
            if (tex != null)
            {
                _remoteImageTextures.Add(tex);
                target.style.backgroundImage = new StyleBackground(tex);
            }
        }

        private void EnsureAudioSource()
        {
            if (_audioSource != null || _coroutineHost == null)
                return;
            _audioSource = _coroutineHost.gameObject.GetComponent<AudioSource>();
            if (_audioSource == null)
                _audioSource = _coroutineHost.gameObject.AddComponent<AudioSource>();
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
            var previous = _audioSource.clip;
            _audioSource.clip = clip;
            if (previous != null)
                UnityEngine.Object.Destroy(previous);
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

        private static void ShuffleOptions(List<McOptionDto> list)
        {
            var rng = new System.Random(Environment.TickCount ^ (int)(Time.realtimeSinceStartup * 1000f));
            for (var i = list.Count - 1; i > 0; i--)
            {
                var j = rng.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
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
                correctOptionIds = d.correctOptionIds,
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
                    error = $"Each question needs at least {MinOptions} options.";
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
                else if (correct.Count < 2)
                {
                    error = "Multi-select questions need at least two correctOptionIds.";
                    return false;
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
    }
}
