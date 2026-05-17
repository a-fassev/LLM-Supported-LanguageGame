using System;
using System.Collections;
using System.Collections.Generic;
using LanguageGame.Presentation;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Networking;
using UnityEngine.UI;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Drop zone marker; <see cref="targetId"/> is set at runtime when UI is built from JSON.</summary>
    public sealed class DragDropSlotHandle : MonoBehaviour
    {
        public string targetId;
    }

    /// <summary>Draggable tile; wired by <see cref="DragDropStepView"/> after instantiation.</summary>
    public sealed class DragDropItemHandle : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler
    {
        private DragDropStepView _owner;
        private string _itemId;
        private RectTransform _rect;
        private CanvasGroup _canvasGroup;
        private Canvas _canvas;
        private Vector2 _grabOffset;

        public string ItemId => _itemId;

        public void Wire(DragDropStepView owner, string itemId)
        {
            _owner = owner;
            _itemId = itemId;
            _rect = GetComponent<RectTransform>();
            EnsureCanvasGroup();
        }

        private void EnsureCanvasGroup()
        {
            if (_canvasGroup != null)
                return;
            _canvasGroup = GetComponent<CanvasGroup>();
            if (_canvasGroup == null)
                _canvasGroup = gameObject.AddComponent<CanvasGroup>();
        }

        public void OnBeginDrag(PointerEventData eventData)
        {
            if (_owner == null || !_owner.DragsEnabled)
                return;

            _canvas ??= GetComponentInParent<Canvas>();
            if (_canvas == null)
                return;

            EnsureCanvasGroup();
            if (_canvasGroup == null)
                return;

            _rect ??= GetComponent<RectTransform>();
            if (_rect == null)
                return;

            var canvasRt = _canvas.transform as RectTransform;
            if (canvasRt == null)
                return;

            // Reparent first so anchoredPosition is in canvas space; then match pointer → tile in that space.
            _rect.SetParent(canvasRt, true);
            _rect.SetAsLastSibling();

            if (RectTransformUtility.ScreenPointToLocalPointInRectangle(
                    canvasRt,
                    eventData.position,
                    eventData.pressEventCamera,
                    out var localPointer))
                _grabOffset = _rect.anchoredPosition - localPointer;
            else
                _grabOffset = Vector2.zero;

            _canvasGroup.blocksRaycasts = false;
            _canvasGroup.alpha = 0.88f;
        }

        public void OnDrag(PointerEventData eventData)
        {
            if (_canvas == null || _rect == null || _rect.parent == null)
                return;

            var canvasRt = _canvas.transform as RectTransform;
            if (canvasRt == null)
                return;

            if (RectTransformUtility.ScreenPointToLocalPointInRectangle(
                    canvasRt,
                    eventData.position,
                    eventData.pressEventCamera,
                    out var local))
            {
                _rect.anchoredPosition = local + _grabOffset;
            }
        }

        public void OnEndDrag(PointerEventData eventData)
        {
            if (_owner == null)
                return;

            // Keep blocksRaycasts false until after drop raycast so slots under the tile are detected.
            _owner.FinalizeItemDrag(_itemId, eventData);
            EnsureCanvasGroup();
            if (_canvasGroup == null)
                return;
            _canvasGroup.blocksRaycasts = true;
            _canvasGroup.alpha = 1f;
        }
    }

    /// <summary>
    /// Drag-and-drop tasks from <see cref="StepContext.contentJson"/> (see <see cref="DragDropContentDto"/>).
    /// </summary>
    public sealed class DragDropStepView : TaskStepBase
    {
        [SerializeField] private RectTransform sourcesHost;
        [SerializeField] private RectTransform targetsHost;
        [SerializeField] private Text sourceSectionLabel;
        [SerializeField] private Text targetSectionLabel;

        [Tooltip("Inactive tile: Image + CanvasGroup + LayoutElement + DragDropItemHandle; child Text; optional child RawImage 'ItemImage'.")]
        [SerializeField] private GameObject draggableTileTemplate;

        [Tooltip("Inactive block: VLG root, child Title Text, child DropPanel (Image + DragDropSlotHandle + LayoutElement) with child Content RectTransform.")]
        [SerializeField] private GameObject targetBlockTemplate;

        [Tooltip("Inactive row with HorizontalLayoutGroup (lines mode).")]
        [SerializeField] private GameObject lineRowTemplate;

        [Tooltip("Inactive literal segment (Text + optional ContentSizeFitter), like Cloze literal.")]
        [SerializeField] private GameObject literalSegmentTemplate;

        [Tooltip("Inactive slot: Image (raycast) + DragDropSlotHandle + LayoutElement; child Content stretch Rect.")]
        [SerializeField] private GameObject slotTemplate;

        private const string DropHintChildName = "DropHint";
        private const string DefaultBlocksSourceLabel = "Parole da spostare";
        private const string DefaultBlocksTargetLabel = "Trascina qui sotto nella categoria giusta";
        private const string DefaultBlocksInstruction =
            "Tocca una carta e trascinala nella zona della categoria corretta. Puoi spostarle di nuovo se sbagli.";
        private const string DropZoneHintText = "Trascina qui";

        private DragDropContentDto _dto;
        private bool _contentReady;
        /// <summary>True for category blocks (many cards per target). False for <c>lines</c> slots (one card per slot).</summary>
        private bool _blocksMode;
        internal bool DragsEnabled { get; private set; } = true;

        private readonly Dictionary<string, RectTransform> _itemTiles = new();
        private readonly Dictionary<string, RectTransform> _targetHosts = new();

        /// <summary>targetId → item ids currently in that zone (set; each item id appears in at most one target).</summary>
        private readonly Dictionary<string, HashSet<string>> _occupant = new(StringComparer.Ordinal);

        private readonly List<Coroutine> _imageLoads = new();

        /// <summary>Reuse for drop hit-testing (main-thread only — pointer drag end).</summary>
        private readonly List<RaycastResult> _raycastResults = new(32);

        protected override void ApplyChromeFromDesignTokens()
        {
            base.ApplyChromeFromDesignTokens();
            if (!UiThemeProvider.TryGet(out var t))
                return;
            if (sourceSectionLabel != null)
            {
                var bg = UiTokenApplier.GetPanelBackgroundNear(sourceSectionLabel.rectTransform, new Color(0.95f, 0.95f, 0.97f, 1f));
                var fg = UiTokenApplier.ResolveReadableOnBackground(t.palette.textSecondary, bg);
                UiTokenApplier.ApplyText(sourceSectionLabel, t.typography.caption, fg);
            }

            if (targetSectionLabel != null)
            {
                var bg = UiTokenApplier.GetPanelBackgroundNear(targetSectionLabel.rectTransform, new Color(0.95f, 0.95f, 0.97f, 1f));
                var fg = UiTokenApplier.ResolveReadableOnBackground(t.palette.textSecondary, bg);
                UiTokenApplier.ApplyText(targetSectionLabel, t.typography.caption, fg);
            }
        }

        protected override void ApplyTaskContent(StepContext context)
        {
            StopImageLoads();
            ClearHosts();
            _contentReady = false;
            _dto = null;
            _blocksMode = false;
            _itemTiles.Clear();
            _targetHosts.Clear();
            _occupant.Clear();

            if (!TryDeserialize(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[DragDropStepView] Invalid contentJson: {error ?? "unknown"}");
                PresentValidationFeedback(string.IsNullOrEmpty(error) ? "Invalid drag-and-drop content." : error);
                return;
            }

            _dto = dto;

            if (titleText != null)
            {
                titleText.text = string.IsNullOrWhiteSpace(dto.prompt)
                    ? "Drag and drop"
                    : dto.prompt.Trim();
            }

            EnsureHosts();

            var presentation = dto.presentation ?? new DragDropPresentationDto();
            var mode = (presentation.targetMode ?? string.Empty).Trim();
            var isLines = string.Equals(mode, "lines", StringComparison.OrdinalIgnoreCase);
            _blocksMode = !isLines;

            if (bodyText != null)
            {
                var sub = dto.subtitle?.Trim() ?? string.Empty;
                if (sub.Length == 0 && !isLines)
                    sub = DefaultBlocksInstruction;
                bodyText.text = sub;
                bodyText.gameObject.SetActive(sub.Length > 0);
            }

            if (sourceSectionLabel != null)
            {
                var sl = presentation.sourceLabel?.Trim() ?? string.Empty;
                if (!isLines && sl.Length == 0)
                    sl = DefaultBlocksSourceLabel;
                var showSource = !isLines || sl.Length > 0;
                sourceSectionLabel.gameObject.SetActive(showSource);
                if (showSource)
                    sourceSectionLabel.text = sl;
            }

            if (targetSectionLabel != null)
            {
                var tl = presentation.targetLabel?.Trim() ?? string.Empty;
                if (!isLines && tl.Length == 0)
                    tl = DefaultBlocksTargetLabel;
                var showTarget = !isLines || tl.Length > 0;
                targetSectionLabel.gameObject.SetActive(showTarget);
                if (showTarget)
                    targetSectionLabel.text = tl;
            }

            if (!HasTemplateForMode(isLines))
            {
                Debug.LogError("[DragDropStepView] Missing required templates on prefab.");
                PresentValidationFeedback("Drag-and-drop layout is not configured.");
                return;
            }

            UiThemeProvider.TryGet(out var tokens);
            if (!isLines)
                ApplyBlocksStagingUi(tokens);

            RegisterTargetsFromDto(isLines, tokens);
            foreach (var tid in _targetHosts.Keys)
                _occupant[tid] = new HashSet<string>(StringComparer.Ordinal);

            var itemOrder = BuildItemOrder(dto);
            foreach (var id in itemOrder)
            {
                var def = FindItem(dto, id);
                if (def == null)
                    continue;
                CreateBankTile(def, tokens);
            }

            _contentReady = _itemTiles.Count > 0 && _targetHosts.Count > 0;
            if (!_contentReady)
            {
                PresentValidationFeedback("Drag-and-drop task is incomplete.");
                return;
            }

            if (!isLines)
                RefreshAllDropZoneHints();

            if (sourcesHost != null)
                LayoutRebuilder.ForceRebuildLayoutImmediate(sourcesHost);
            if (targetsHost != null)
                LayoutRebuilder.ForceRebuildLayoutImmediate(targetsHost);
        }

        private void ApplyBlocksStagingUi(UiDesignTokens tokens)
        {
            if (sourcesHost != null)
                EnsureHostBackdrop(sourcesHost, new Color(0.22f, 0.38f, 0.62f, 0.1f));
            if (targetsHost != null)
                EnsureHostBackdrop(targetsHost, new Color(0.18f, 0.22f, 0.32f, 0.08f));

            if (tokens == null)
                return;
            void StyleSectionLabel(Text label)
            {
                if (label == null)
                    return;
                var bg = UiTokenApplier.GetPanelBackgroundNear(label.rectTransform, new Color(0.96f, 0.96f, 0.98f, 1f));
                var fg = UiTokenApplier.ResolveReadableOnBackground(tokens.palette.textPrimary, bg);
                UiTokenApplier.ApplyText(label, tokens.typography.body, fg);
                label.fontStyle = FontStyle.Bold;
            }

            StyleSectionLabel(sourceSectionLabel);
            StyleSectionLabel(targetSectionLabel);
        }

        private static void EnsureHostBackdrop(RectTransform rt, Color color)
        {
            if (rt == null)
                return;
            var img = rt.gameObject.GetComponent<Image>();
            if (img == null)
                img = rt.gameObject.AddComponent<Image>();
            img.sprite = null;
            img.type = Image.Type.Simple;
            img.color = color;
            img.raycastTarget = false;
        }

        private void RefreshAllDropZoneHints()
        {
            foreach (var kv in _targetHosts)
                RefreshDropZoneHint(kv.Value);
        }

        private static void RefreshDropZoneHint(RectTransform host)
        {
            if (host == null)
                return;
            var hintTr = host.Find(DropHintChildName);
            if (hintTr == null)
                return;
            var hasTile = false;
            for (var i = 0; i < host.childCount; i++)
            {
                var c = host.GetChild(i);
                if (c.name == DropHintChildName)
                    continue;
                if (c.GetComponentInChildren<DragDropItemHandle>(true) != null)
                {
                    hasTile = true;
                    break;
                }
            }

            hintTr.gameObject.SetActive(!hasTile);
        }

        /// <summary>Stack several tiles in block categories; keep a single row in line slots.</summary>
        private static void EnsureSlotContentLayout(RectTransform content, bool blocksMode)
        {
            if (content == null)
                return;

            if (blocksMode)
            {
                var h = content.GetComponent<HorizontalLayoutGroup>();
                if (h != null)
                    UnityEngine.Object.Destroy(h);

                var v = content.GetComponent<VerticalLayoutGroup>();
                if (v == null)
                    v = content.gameObject.AddComponent<VerticalLayoutGroup>();
                v.spacing = 8f;
                v.padding = new RectOffset(8, 8, 8, 8);
                v.childAlignment = TextAnchor.UpperCenter;
                v.childControlHeight = true;
                v.childControlWidth = true;
                v.childForceExpandHeight = false;
                v.childForceExpandWidth = true;
            }
            else
            {
                var v = content.GetComponent<VerticalLayoutGroup>();
                if (v != null)
                    UnityEngine.Object.Destroy(v);

                var h = content.GetComponent<HorizontalLayoutGroup>();
                if (h == null)
                    h = content.gameObject.AddComponent<HorizontalLayoutGroup>();
                h.spacing = 8f;
                h.padding = new RectOffset(8, 8, 8, 8);
                h.childAlignment = TextAnchor.MiddleCenter;
                h.childControlHeight = true;
                h.childControlWidth = true;
                h.childForceExpandHeight = false;
                h.childForceExpandWidth = false;
            }
        }

        private static void EnsureDropZoneHint(RectTransform host, UiDesignTokens tokens)
        {
            if (host == null)
                return;
            if (host.Find(DropHintChildName) != null)
            {
                RefreshDropZoneHint(host);
                return;
            }

            var go = new GameObject(DropHintChildName, typeof(RectTransform));
            go.transform.SetParent(host, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = new Vector2(8, 8);
            rt.offsetMax = new Vector2(-8, -8);
            var tx = go.AddComponent<Text>();
            tx.raycastTarget = false;
            tx.alignment = TextAnchor.MiddleCenter;
            tx.text = DropZoneHintText;
            if (tokens != null)
            {
                var bg = UiTokenApplier.GetPanelBackgroundNear(host, new Color(0.9f, 0.91f, 0.94f, 1f));
                var fg = UiTokenApplier.ResolveReadableOnBackground(
                    new Color(0.42f, 0.46f, 0.54f, 1f), bg);
                UiTokenApplier.ApplyText(tx, tokens.typography.caption, fg);
            }
            else
            {
                tx.font = UiTokenApplier.ResolveFallbackFont();
                tx.fontSize = 18;
                tx.color = new Color(0.42f, 0.46f, 0.54f, 1f);
            }

            tx.fontStyle = FontStyle.Italic;
            go.transform.SetAsFirstSibling();
        }

        private bool HasTemplateForMode(bool isLines)
        {
            if (draggableTileTemplate == null)
                return false;
            if (isLines)
                return lineRowTemplate != null && literalSegmentTemplate != null && slotTemplate != null;
            return targetBlockTemplate != null;
        }

        private static DragDropItemDto FindItem(DragDropContentDto dto, string id)
        {
            foreach (var it in dto.items)
            {
                if (it != null && string.Equals(it.id?.Trim(), id, StringComparison.Ordinal))
                    return it;
            }

            return null;
        }

        private List<string> BuildItemOrder(DragDropContentDto dto)
        {
            var order = new List<string>();
            foreach (var it in dto.items)
            {
                if (it?.id != null && !string.IsNullOrWhiteSpace(it.id))
                    order.Add(it.id.Trim());
            }

            if (dto.shuffleItemOrder && order.Count > 1)
            {
                var rng = new System.Random();
                for (var i = order.Count - 1; i > 0; i--)
                {
                    var j = rng.Next(i + 1);
                    (order[i], order[j]) = (order[j], order[i]);
                }
            }

            return order;
        }

        private void RegisterTargetsFromDto(bool isLines, UiDesignTokens tokens)
        {
            if (isLines)
                BuildLinesLayout(tokens);
            else
                BuildBlocksLayout(tokens);
        }

        private void BuildBlocksLayout(UiDesignTokens tokens)
        {
            foreach (var t in _dto.targets)
            {
                if (t == null || string.IsNullOrWhiteSpace(t.id))
                    continue;
                var tid = t.id.Trim();
                var go = Instantiate(targetBlockTemplate, targetsHost, false);
                go.name = $"Target_{tid}";
                go.SetActive(true);

                var titleGo = FindDeepChild(go.transform, "Title");
                if (titleGo != null)
                {
                    var tx = titleGo.GetComponent<Text>();
                    if (tx != null)
                    {
                        var titleStr = (t.title ?? string.Empty).Trim();
                        if (string.IsNullOrEmpty(titleStr))
                            titleStr = "Categoria";
                        tx.text = titleStr;
                        tx.alignment = TextAnchor.MiddleLeft;
                        if (tokens != null)
                        {
                            var bg = UiTokenApplier.GetPanelBackgroundNear(tx.rectTransform, new Color(0.94f, 0.95f, 0.97f, 1f));
                            var fg = UiTokenApplier.ResolveReadableOnBackground(tokens.palette.textPrimary, bg);
                            UiTokenApplier.ApplyText(tx, tokens.typography.title, fg);
                            tx.fontStyle = FontStyle.Bold;
                            tx.fontSize = Mathf.Max(tx.fontSize, 24);
                        }
                        else
                            ApplySegmentTextStyle(tx, tokens);
                    }
                }

                var drop = FindDeepChild(go.transform, "DropPanel");
                if (drop == null)
                {
                    Debug.LogError("[DragDropStepView] targetBlockTemplate must include DropPanel.");
                    Destroy(go);
                    continue;
                }

                var slot = drop.GetComponent<DragDropSlotHandle>() ?? drop.gameObject.AddComponent<DragDropSlotHandle>();
                slot.targetId = tid;

                var dropImg = drop.GetComponent<Image>();
                if (dropImg != null)
                {
                    dropImg.color = new Color(0.7f, 0.74f, 0.88f, 1f);
                }

                var content = drop.Find("Content")?.GetComponent<RectTransform>();
                if (content == null)
                {
                    Debug.LogError("[DragDropStepView] DropPanel must have child RectTransform 'Content'.");
                    Destroy(go);
                    continue;
                }

                _targetHosts[tid] = content;
                EnsureSlotContentLayout(content, blocksMode: true);
                EnsureDropZoneHint(content, tokens);
            }
        }

        private void BuildLinesLayout(UiDesignTokens tokens)
        {
            if (_dto.lines == null)
                return;

            var seenSlotTargets = new HashSet<string>(StringComparer.Ordinal);
            foreach (var line in _dto.lines)
            {
                if (line?.segments == null || line.segments.Length == 0)
                    continue;

                var rowGo = Instantiate(lineRowTemplate, targetsHost, false);
                rowGo.name = "DragDropLine";
                rowGo.SetActive(true);
                var rowRt = rowGo.GetComponent<RectTransform>();
                var rowHasWidgets = false;

                foreach (var seg in line.segments)
                {
                    if (seg == null || string.IsNullOrWhiteSpace(seg.kind))
                        continue;
                    var k = seg.kind.Trim();
                    if (string.Equals(k, "text", StringComparison.OrdinalIgnoreCase))
                    {
                        var go = Instantiate(literalSegmentTemplate, rowRt, false);
                        go.SetActive(true);
                        var text = go.GetComponent<Text>() ?? go.GetComponentInChildren<Text>(true);
                        if (text != null)
                        {
                            text.text = seg.text ?? string.Empty;
                            ApplySegmentTextStyle(text, tokens);
                        }

                        rowHasWidgets = true;
                        continue;
                    }

                    if (!string.Equals(k, "slot", StringComparison.OrdinalIgnoreCase))
                        continue;

                    var slotId = (seg.targetId ?? string.Empty).Trim();
                    if (string.IsNullOrEmpty(slotId))
                        continue;
                    if (!seenSlotTargets.Add(slotId))
                    {
                        Debug.LogWarning($"[DragDropStepView] Duplicate slot for target '{slotId}' — skipping duplicate.");
                        continue;
                    }

                    var slotGo = Instantiate(slotTemplate, rowRt, false);
                    slotGo.name = $"Slot_{slotId}";
                    slotGo.SetActive(true);
                    var handle = slotGo.GetComponent<DragDropSlotHandle>() ?? slotGo.gameObject.AddComponent<DragDropSlotHandle>();
                    handle.targetId = slotId;
                    var content = slotGo.transform.Find("Content")?.GetComponent<RectTransform>() ??
                                  slotGo.GetComponent<RectTransform>();
                    _targetHosts[slotId] = content;
                    EnsureSlotContentLayout(content, blocksMode: false);
                    rowHasWidgets = true;
                }

                if (!rowHasWidgets && rowRt != null)
                    Destroy(rowGo);
            }
        }

        private void CreateBankTile(DragDropItemDto def, UiDesignTokens tokens)
        {
            var id = def.id.Trim();
            var go = Instantiate(draggableTileTemplate, sourcesHost, false);
            go.name = $"Item_{id}";
            go.SetActive(true);

            var rt = go.GetComponent<RectTransform>();
            var raw = go.transform.Find("ItemImage")?.GetComponent<RawImage>();
            var url = (def.imageUrl ?? string.Empty).Trim();
            var useImage = raw != null && !string.IsNullOrEmpty(url);

            var label = go.transform.Find("Label")?.GetComponent<Text>()
                        ?? go.GetComponentInChildren<Text>(true);
            if (label != null)
            {
                label.text = (def.label ?? string.Empty).Trim();
                label.gameObject.SetActive(!string.IsNullOrEmpty(label.text));
                ApplySegmentTextStyle(label, tokens);
                label.alignment = TextAnchor.MiddleCenter;
                label.horizontalOverflow = HorizontalWrapMode.Wrap;
                label.verticalOverflow = VerticalWrapMode.Overflow;
                var labelRt = label.rectTransform;
                if (labelRt != null)
                {
                    if (!useImage)
                    {
                        labelRt.anchorMin = new Vector2(0.06f, 0.08f);
                        labelRt.anchorMax = new Vector2(0.94f, 0.92f);
                    }
                    else
                    {
                        labelRt.anchorMin = new Vector2(0.05f, 0.08f);
                        labelRt.anchorMax = new Vector2(0.95f, 0.42f);
                    }

                    labelRt.offsetMin = Vector2.zero;
                    labelRt.offsetMax = Vector2.zero;
                }
            }

            if (raw != null)
            {
                if (!useImage)
                {
                    raw.gameObject.SetActive(false);
                }
                else
                {
                    raw.gameObject.SetActive(true);
                    _imageLoads.Add(StartCoroutine(LoadRemoteTexture(url, raw)));
                }
            }

            var handles = go.GetComponents<DragDropItemHandle>();
            DragDropItemHandle handle;
            if (handles.Length == 0)
            {
                handle = go.AddComponent<DragDropItemHandle>();
            }
            else
            {
                handle = handles[0];
                for (var i = 1; i < handles.Length; i++)
                {
                    if (handles[i] != null)
                        Destroy(handles[i]);
                }
            }

            handle.Wire(this, id);

            _itemTiles[id] = rt;
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

        private void StopImageLoads()
        {
            foreach (var c in _imageLoads)
            {
                if (c != null)
                    StopCoroutine(c);
            }

            _imageLoads.Clear();
        }

        private static void ApplySegmentTextStyle(Text text, UiDesignTokens tokens)
        {
            if (text == null)
                return;
            var fontSize = tokens?.typography.body.fontSize ?? 22;
            var panelColor = UiTokenApplier.GetPanelBackgroundNear(text.rectTransform, new Color(0.95f, 0.95f, 0.97f, 1f));
            var color = UiTokenApplier.ResolveReadableOnBackground(tokens?.palette.textPrimary ?? new Color(0.12f, 0.14f, 0.2f, 1f), panelColor);
            if (tokens != null)
                UiTokenApplier.ApplyText(text, tokens.typography.body, color);
            else
            {
                text.font = UiTokenApplier.ResolveFallbackFont();
                text.fontSize = fontSize;
                text.color = color;
            }
        }

        private static Transform FindDeepChild(Transform root, string name)
        {
            if (root == null || string.IsNullOrEmpty(name))
                return null;
            if (string.Equals(root.name, name, StringComparison.Ordinal))
                return root;
            for (var i = 0; i < root.childCount; i++)
            {
                var found = FindDeepChild(root.GetChild(i), name);
                if (found != null)
                    return found;
            }

            return null;
        }

        private void EnsureHosts()
        {
            var root = GetComponent<RectTransform>();
            if (sourcesHost == null)
            {
                var go = new GameObject("SourcesHost", typeof(RectTransform));
                go.transform.SetParent(root, false);
                sourcesHost = go.GetComponent<RectTransform>();
                sourcesHost.anchorMin = new Vector2(0.08f, 0.58f);
                sourcesHost.anchorMax = new Vector2(0.92f, 0.72f);
                sourcesHost.offsetMin = Vector2.zero;
                sourcesHost.offsetMax = Vector2.zero;
                var h = go.AddComponent<HorizontalLayoutGroup>();
                h.spacing = 10f;
                h.childAlignment = TextAnchor.MiddleCenter;
                h.childControlHeight = true;
                h.childControlWidth = true;
                h.childForceExpandHeight = false;
                h.childForceExpandWidth = false;
            }

            if (targetsHost == null)
            {
                var go = new GameObject("TargetsHost", typeof(RectTransform));
                go.transform.SetParent(root, false);
                targetsHost = go.GetComponent<RectTransform>();
                targetsHost.anchorMin = new Vector2(0.08f, 0.08f);
                targetsHost.anchorMax = new Vector2(0.92f, 0.56f);
                targetsHost.offsetMin = Vector2.zero;
                targetsHost.offsetMax = Vector2.zero;
                var v = go.AddComponent<VerticalLayoutGroup>();
                v.spacing = 12f;
                v.childAlignment = TextAnchor.UpperCenter;
                v.childControlHeight = true;
                v.childControlWidth = true;
                v.childForceExpandHeight = false;
                v.childForceExpandWidth = true;
            }
        }

        private void ClearHosts()
        {
            ClearChildren(sourcesHost);
            ClearChildren(targetsHost);
        }

        private static void ClearChildren(RectTransform host)
        {
            if (host == null)
                return;
            for (var i = host.childCount - 1; i >= 0; i--)
                Destroy(host.GetChild(i).gameObject);
        }

        public override void SetInteractable(bool interactable)
        {
            base.SetInteractable(interactable);
            DragsEnabled = interactable;
            foreach (var kv in _itemTiles)
            {
                if (kv.Value == null)
                    continue;
                var cg = kv.Value.GetComponent<CanvasGroup>();
                if (cg != null)
                    cg.interactable = interactable;
            }
        }

        /// <summary>Called from <see cref="DragDropItemHandle"/> after a drag ends.</summary>
        internal void FinalizeItemDrag(string itemId, PointerEventData eventData)
        {
            if (!_itemTiles.TryGetValue(itemId, out var tile) || tile == null)
                return;

            var slot = FindSlotUnderPointer(eventData);
            if (slot != null && !string.IsNullOrEmpty(slot.targetId))
                MoveItemToTarget(itemId, slot.targetId);
            else
                MoveItemToBank(itemId);

            if (sourcesHost != null)
                LayoutRebuilder.ForceRebuildLayoutImmediate(sourcesHost);
            if (targetsHost != null)
                LayoutRebuilder.ForceRebuildLayoutImmediate(targetsHost);
        }

        private DragDropSlotHandle FindSlotUnderPointer(PointerEventData eventData)
        {
            if (EventSystem.current == null)
                return null;
            _raycastResults.Clear();
            EventSystem.current.RaycastAll(eventData, _raycastResults);
            foreach (var r in _raycastResults)
            {
                if (r.gameObject.GetComponentInParent<DragDropItemHandle>() != null)
                    continue;
                var s = r.gameObject.GetComponent<DragDropSlotHandle>()
                        ?? r.gameObject.GetComponentInParent<DragDropSlotHandle>();
                if (s != null && !string.IsNullOrEmpty(s.targetId))
                    return s;
            }

            return null;
        }

        private void MoveItemToBank(string itemId)
        {
            if (!_itemTiles.TryGetValue(itemId, out var tile) || sourcesHost == null)
                return;

            RemoveItemFromOccupants(itemId);

            tile.SetParent(sourcesHost, false);
            ResetTileForLayout(tile);
            RefreshAllDropZoneHints();
        }

        /// <summary>
        /// Clears this item from every slot. Uses a key snapshot because changing values still
        /// invalidates live <see cref="Dictionary{TKey,TValue}.KeyCollection"/> enumerators, and
        /// <see cref="MoveItemToTarget"/> may call <see cref="MoveItemToBank"/> while clearing.
        /// </summary>
        private void RemoveItemFromOccupants(string itemId)
        {
            if (string.IsNullOrEmpty(itemId) || _occupant.Count == 0)
                return;
            var keys = new List<string>(_occupant.Keys);
            foreach (var tid in keys)
            {
                if (_occupant.TryGetValue(tid, out var set) && set != null)
                    set.Remove(itemId);
            }
        }

        private void MoveItemToTarget(string itemId, string targetId)
        {
            if (!_itemTiles.TryGetValue(itemId, out var tile) || !_targetHosts.TryGetValue(targetId, out var host))
            {
                MoveItemToBank(itemId);
                return;
            }

            RemoveItemFromOccupants(itemId);

            if (!_blocksMode)
            {
                if (_occupant.TryGetValue(targetId, out var existing) && existing != null && existing.Count > 0)
                {
                    var toBank = new List<string>(existing);
                    foreach (var oid in toBank)
                        MoveItemToBank(oid);
                }
            }

            if (!_occupant.TryGetValue(targetId, out var placedSet) || placedSet == null)
            {
                placedSet = new HashSet<string>(StringComparer.Ordinal);
                _occupant[targetId] = placedSet;
            }

            placedSet.Add(itemId);
            tile.SetParent(host, false);
            ResetTileForSlot(tile, host);
            RefreshAllDropZoneHints();
        }

        private static void ResetTileForLayout(RectTransform tile)
        {
            tile.anchorMin = new Vector2(0, 0);
            tile.anchorMax = new Vector2(0, 0);
            tile.pivot = new Vector2(0.5f, 0.5f);
            tile.anchoredPosition = Vector2.zero;
            tile.localScale = Vector3.one;
        }

        private static void ResetTileForSlot(RectTransform tile, RectTransform host)
        {
            tile.localScale = Vector3.one;
            var le = tile.GetComponent<LayoutElement>();
            if (host != null && host.GetComponent<VerticalLayoutGroup>() != null)
            {
                tile.anchorMin = new Vector2(0f, 1f);
                tile.anchorMax = new Vector2(1f, 1f);
                tile.pivot = new Vector2(0.5f, 1f);
                tile.anchoredPosition = Vector2.zero;
                var h = le != null && le.preferredHeight > 0 ? le.preferredHeight : 44f;
                tile.sizeDelta = new Vector2(0f, h);
                return;
            }

            tile.anchorMin = new Vector2(0.5f, 0.5f);
            tile.anchorMax = new Vector2(0.5f, 0.5f);
            tile.pivot = new Vector2(0.5f, 0.5f);
            tile.anchoredPosition = Vector2.zero;
            if (le != null && host != null)
            {
                var w = le.preferredWidth > 0 ? le.preferredWidth : 120f;
                var h = le.preferredHeight > 0 ? le.preferredHeight : 44f;
                tile.sizeDelta = new Vector2(w, h);
            }
        }

        protected override bool ValidateBeforeComplete()
        {
            if (!_contentReady || _dto == null)
            {
                PresentValidationFeedback("This task is not ready yet. Check the lesson content.");
                return false;
            }

            foreach (var t in _dto.targets)
            {
                if (t == null || string.IsNullOrWhiteSpace(t.id))
                    continue;
                var tid = t.id.Trim();
                if (!_occupant.TryGetValue(tid, out var placed) || placed == null)
                {
                    PresentValidationFeedback("Fill every drop zone.");
                    return false;
                }

                if (_blocksMode)
                {
                    var expected = BuildExpectedItemSet(t.correctItemIds);
                    if (expected.Count > 0 && placed.Count == 0)
                    {
                        PresentValidationFeedback("Fill every drop zone.");
                        return false;
                    }

                    if (!placed.SetEquals(expected))
                    {
                        PresentValidationFeedback("Not quite — check your matches.");
                        return false;
                    }
                }
                else
                {
                    if (placed.Count == 0)
                    {
                        PresentValidationFeedback("Fill every drop zone.");
                        return false;
                    }

                    if (placed.Count != 1)
                    {
                        PresentValidationFeedback("Not quite — check your matches.");
                        return false;
                    }

                    var only = FirstOf(placed);
                    if (string.IsNullOrEmpty(only) || !MatchesCorrect(only, t.correctItemIds))
                    {
                        PresentValidationFeedback("Not quite — check your matches.");
                        return false;
                    }
                }
            }

            if (_dto.requireBankEmpty)
            {
                foreach (var itemId in _itemTiles.Keys)
                {
                    var placedAnywhere = false;
                    foreach (var occSet in _occupant.Values)
                    {
                        if (occSet != null && occSet.Contains(itemId))
                        {
                            placedAnywhere = true;
                            break;
                        }
                    }

                    if (!placedAnywhere)
                    {
                        PresentValidationFeedback("Place every card.");
                        return false;
                    }
                }
            }

            return true;
        }

        private static HashSet<string> BuildExpectedItemSet(string[] correctItemIds)
        {
            var s = new HashSet<string>(StringComparer.Ordinal);
            if (correctItemIds == null)
                return s;
            foreach (var c in correctItemIds)
            {
                if (!string.IsNullOrWhiteSpace(c))
                    s.Add(c.Trim());
            }

            return s;
        }

        private static string FirstOf(HashSet<string> set)
        {
            if (set == null)
                return null;
            foreach (var x in set)
                return x;
            return null;
        }

        private static bool MatchesCorrect(string itemId, string[] correct)
        {
            if (correct == null || correct.Length == 0)
                return false;
            foreach (var c in correct)
            {
                if (!string.IsNullOrWhiteSpace(c) && string.Equals(c.Trim(), itemId, StringComparison.Ordinal))
                    return true;
            }

            return false;
        }

        private static bool IsAllowedHttpImageUrl(string raw, out string error)
        {
            error = null;
            if (string.IsNullOrWhiteSpace(raw))
                return true;
            var s = raw.Trim();
            if (!Uri.TryCreate(s, UriKind.Absolute, out var uri))
            {
                error = "Each imageUrl must be an absolute http or https URL.";
                return false;
            }

            if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            {
                error = "Each imageUrl must use http or https.";
                return false;
            }

            return true;
        }

        private static bool TryDeserialize(string json, out DragDropContentDto dto, out string error)
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
                error = "Drag-drop content must be a JSON object.";
                return false;
            }

            dto = JsonUtility.FromJson<DragDropContentDto>(json);
            if (dto?.items == null || dto.items.Length == 0)
            {
                error = "At least one item is required.";
                return false;
            }

            if (dto.targets == null || dto.targets.Length == 0)
            {
                error = "At least one target is required.";
                return false;
            }

            var itemIds = new HashSet<string>(StringComparer.Ordinal);
            foreach (var it in dto.items)
            {
                if (it == null || string.IsNullOrWhiteSpace(it.id))
                {
                    error = "Each item needs an id.";
                    return false;
                }

                var id = it.id.Trim();
                if (!itemIds.Add(id))
                {
                    error = "Duplicate item id.";
                    return false;
                }

                var hasText = !string.IsNullOrWhiteSpace(it.label);
                var hasImg = !string.IsNullOrWhiteSpace(it.imageUrl);
                if (!hasText && !hasImg)
                {
                    error = "Each item needs a label and/or imageUrl.";
                    return false;
                }

                if (hasImg && !IsAllowedHttpImageUrl(it.imageUrl, out var urlError))
                {
                    error = urlError;
                    return false;
                }
            }

            var targetIds = new HashSet<string>(StringComparer.Ordinal);
            foreach (var t in dto.targets)
            {
                if (t == null || string.IsNullOrWhiteSpace(t.id))
                {
                    error = "Each target needs an id.";
                    return false;
                }

                var tid = t.id.Trim();
                if (!targetIds.Add(tid))
                {
                    error = "Duplicate target id.";
                    return false;
                }

                if (!HasAnyCorrect(t.correctItemIds))
                {
                    error = "Each target needs correctItemIds.";
                    return false;
                }

                foreach (var c in t.correctItemIds)
                {
                    if (string.IsNullOrWhiteSpace(c))
                        continue;
                    if (!itemIds.Contains(c.Trim()))
                    {
                        error = $"Unknown item id in correctItemIds: {c.Trim()}";
                        return false;
                    }
                }
            }

            var mode = (dto.presentation?.targetMode ?? string.Empty).Trim();
            var isLines = string.Equals(mode, "lines", StringComparison.OrdinalIgnoreCase);
            if (isLines)
            {
                if (dto.lines == null || dto.lines.Length == 0)
                {
                    error = "Lines mode requires non-empty lines.";
                    return false;
                }

                var slotTargets = new HashSet<string>(StringComparer.Ordinal);
                foreach (var line in dto.lines)
                {
                    if (line?.segments == null || line.segments.Length == 0)
                    {
                        error = "Each line needs segments.";
                        return false;
                    }

                    foreach (var seg in line.segments)
                    {
                        if (seg == null || string.IsNullOrWhiteSpace(seg.kind))
                            continue;
                        if (!string.Equals(seg.kind.Trim(), "slot", StringComparison.OrdinalIgnoreCase))
                            continue;
                        var sid = (seg.targetId ?? string.Empty).Trim();
                        if (string.IsNullOrEmpty(sid) || !targetIds.Contains(sid))
                        {
                            error = "Each slot segment needs a valid targetId.";
                            return false;
                        }

                        if (!slotTargets.Add(sid))
                        {
                            error = "Lines mode: each target may only appear in one slot.";
                            return false;
                        }
                    }
                }

                if (slotTargets.Count != targetIds.Count)
                {
                    error = "Lines mode requires exactly one slot per target.";
                    return false;
                }
            }

            return true;
        }

        private static bool HasAnyCorrect(string[] ids)
        {
            if (ids == null || ids.Length == 0)
                return false;
            foreach (var id in ids)
            {
                if (!string.IsNullOrWhiteSpace(id))
                    return true;
            }

            return false;
        }
    }

    [Serializable]
    public class DragDropContentDto
    {
        public string prompt;
        public string subtitle;
        public bool shuffleItemOrder;
        public bool requireBankEmpty;
        public DragDropItemDto[] items;
        public DragDropTargetDto[] targets;
        public DragDropPresentationDto presentation;
        public DragDropLineDto[] lines;
    }

    [Serializable]
    public class DragDropItemDto
    {
        public string id;
        public string label;
        public string imageUrl;
    }

    [Serializable]
    public class DragDropTargetDto
    {
        public string id;
        public string title;
        public string[] correctItemIds;
    }

    [Serializable]
    public class DragDropPresentationDto
    {
        public string targetMode;
        public string sourceLabel;
        public string targetLabel;
    }

    [Serializable]
    public class DragDropLineDto
    {
        public DragDropSegmentDto[] segments;
    }

    [Serializable]
    public class DragDropSegmentDto
    {
        public string kind;
        public string text;
        public string targetId;
    }
}
