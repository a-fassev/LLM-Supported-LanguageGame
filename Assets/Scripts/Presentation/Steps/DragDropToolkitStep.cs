using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Drag-and-drop task UI (UI Toolkit).</summary>
    public sealed class DragDropToolkitStep : IStepView, ISubmitFromShell
    {
        private const string DefaultBlocksSourceLabel = "Parole da spostare";
        private const string DefaultBlocksTargetLabel = "Trascina qui sotto nella categoria giusta";
        private const string DefaultBlocksInstruction =
            "Tocca una carta e trascinala nella zona della categoria corretta. Puoi spostarle di nuovo se sbagli.";
        private const string DropZoneHintText = "Trascina qui";

        private readonly VisualElement _root;
        private readonly VisualElement _bankHost;
        private readonly VisualElement _targetsHost;
        /// <summary>Last sibling under step root; holds the tile while dragging so it paints above bank + drop zones.</summary>
        private readonly VisualElement _dragLayer;
        private readonly MonoBehaviour _coroutineHost;
        private readonly List<Coroutine> _imageLoads = new();
        private readonly List<Texture2D> _remoteTileTextures = new();
        private readonly Dictionary<string, VisualElement> _itemTiles = new(StringComparer.Ordinal);
        private readonly Dictionary<string, VisualElement> _targetInnerHosts = new(StringComparer.Ordinal);
        private readonly Dictionary<string, HashSet<string>> _occupant = new(StringComparer.Ordinal);
        private readonly List<VisualElement> _pickupZones = new();

        private DragDropContentDto _dto;
        private bool _blocksMode;
        private bool _contentReady;
        private bool _dragsEnabled = true;

        private StepContext _context;
        private Action<StepCompletionRequest> _onRequest;

        public DragDropToolkitStep(VisualElement host, MonoBehaviour coroutineHost)
        {
            _coroutineHost = coroutineHost;
            _root = new VisualElement();
            _root.style.flexGrow = 1;
            _root.AddToClassList("lg-muted-panel");
            _root.style.paddingTop = 12;
            _root.style.paddingBottom = 12;
            _root.style.paddingLeft = 12;
            _root.style.paddingRight = 12;

            _bankHost = new VisualElement();
            _bankHost.style.flexDirection = FlexDirection.Row;
            _bankHost.style.flexWrap = Wrap.Wrap;
            _bankHost.style.marginBottom = 12;

            _targetsHost = new VisualElement();
            _targetsHost.style.flexGrow = 1;
            _targetsHost.style.flexDirection = FlexDirection.Column;

            _dragLayer = new VisualElement { name = "drag-drop-float-layer" };
            _dragLayer.pickingMode = PickingMode.Ignore;
            _dragLayer.style.position = Position.Absolute;
            _dragLayer.style.left = 0;
            _dragLayer.style.right = 0;
            _dragLayer.style.top = 0;
            _dragLayer.style.bottom = 0;

            _root.Add(_bankHost);
            _root.Add(_targetsHost);
            _root.Add(_dragLayer);

            host.Add(_root);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context;
            _onRequest = onRequest;
            StopImageLoads();
            _bankHost.Clear();
            _targetsHost.Clear();
            _dragLayer.Clear();
            _itemTiles.Clear();
            _targetInnerHosts.Clear();
            _occupant.Clear();
            _pickupZones.Clear();
            _dto = null;
            _contentReady = false;

            if (!TryDeserialize(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[DragDropToolkitStep] Invalid contentJson: {error ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(error) ? "Invalid drag-and-drop content." : error);
                return;
            }

            _dto = dto;

            var presentation = dto.presentation ?? new DragDropPresentationDto();
            var mode = (presentation.targetMode ?? string.Empty).Trim();
            var isLines = string.Equals(mode, "lines", StringComparison.OrdinalIgnoreCase);
            _blocksMode = !isLines;

            if (!string.IsNullOrWhiteSpace(dto.prompt))
            {
                var title = new Label(dto.prompt.Trim());
                title.AddToClassList("lg-heading-screen");
                title.style.marginBottom = 8;
                title.style.whiteSpace = WhiteSpace.Normal;
                _root.Insert(0, title);
            }

            var sub = dto.subtitle?.Trim() ?? string.Empty;
            if (sub.Length == 0 && !isLines)
                sub = DefaultBlocksInstruction;
            if (sub.Length > 0)
            {
                var subLbl = new Label(sub);
                subLbl.AddToClassList("lg-text-body");
                subLbl.AddToClassList("lg-text-muted");
                subLbl.style.whiteSpace = WhiteSpace.Normal;
                subLbl.style.marginBottom = 8;
                _root.Insert(_root.childCount >= 2 ? 1 : 0, subLbl);
            }

            if (isLines)
            {
                var bw = new VisualElement();
                bw.name = "bank-wrap";
                bw.style.flexDirection = FlexDirection.Row;
                bw.style.flexWrap = Wrap.Wrap;
                _bankHost.Add(bw);
            }

            if (!isLines)
            {
                var srcLabel = presentation.sourceLabel?.Trim() ?? string.Empty;
                if (srcLabel.Length == 0)
                    srcLabel = DefaultBlocksSourceLabel;
                var sl = new Label(srcLabel);
                sl.AddToClassList("lg-text-caption");
                _bankHost.Add(sl);
                var wrap = new VisualElement();
                wrap.style.flexDirection = FlexDirection.Row;
                wrap.style.flexWrap = Wrap.Wrap;
                wrap.name = "bank-wrap";
                _bankHost.Add(wrap);

                var tgtLabel = presentation.targetLabel?.Trim() ?? string.Empty;
                if (tgtLabel.Length == 0)
                    tgtLabel = DefaultBlocksTargetLabel;
                var tl = new Label(tgtLabel);
                tl.AddToClassList("lg-text-caption");
                tl.style.marginBottom = 6;
                _targetsHost.Add(tl);
            }

            VisualElement bankWrap = _bankHost.Q<VisualElement>("bank-wrap") ?? _bankHost;

            if (!isLines)
                foreach (var t in dto.targets)
                    BuildBlockTarget(t);
            else
                BuildLinesLayout(dto);

            foreach (var tid in _targetInnerHosts.Keys)
                _occupant[tid] = new HashSet<string>(StringComparer.Ordinal);

            var order = BuildItemOrder(dto);
            foreach (var id in order)
            {
                var def = FindItem(dto, id);
                if (def != null)
                    CreateBankTile(def, bankWrap);
            }

            _contentReady = _itemTiles.Count > 0 && _targetInnerHosts.Count > 0;
            if (!_contentReady)
                context?.presentValidationMessage?.Invoke("Drag-and-drop task is incomplete.");

            _root.Add(_dragLayer);
        }

        public void SetInteractable(bool interactable)
        {
            _dragsEnabled = interactable;
            foreach (var kv in _itemTiles)
            {
                if (kv.Value != null)
                    kv.Value.SetEnabled(interactable);
            }
        }

        public void SubmitFromShell()
        {
            if (!Validate())
                return;
            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        public void Teardown()
        {
            StopImageLoads();
            _context = null;
            _onRequest = null;
            _root?.RemoveFromHierarchy();
        }

        private bool Validate()
        {
            if (!_contentReady || _dto == null)
            {
                _context?.presentValidationMessage?.Invoke("This task is not ready yet. Check the lesson content.");
                return false;
            }

            foreach (var t in _dto.targets)
            {
                if (t == null || string.IsNullOrWhiteSpace(t.id))
                    continue;
                var tid = t.id.Trim();
                if (!_occupant.TryGetValue(tid, out var placed) || placed == null)
                {
                    _context?.presentValidationMessage?.Invoke("Fill every drop zone.");
                    return false;
                }

                if (_blocksMode)
                {
                    var expected = BuildExpectedItemSet(t.correctItemIds);
                    if (expected.Count > 0 && placed.Count == 0)
                    {
                        _context?.presentValidationMessage?.Invoke("Fill every drop zone.");
                        return false;
                    }

                    if (!placed.SetEquals(expected))
                    {
                        _context?.presentValidationMessage?.Invoke("Not quite — check your matches.");
                        return false;
                    }
                }
                else
                {
                    if (placed.Count == 0)
                    {
                        _context?.presentValidationMessage?.Invoke("Fill every drop zone.");
                        return false;
                    }

                    if (placed.Count != 1)
                    {
                        _context?.presentValidationMessage?.Invoke("Not quite — check your matches.");
                        return false;
                    }

                    var only = FirstOf(placed);
                    if (string.IsNullOrEmpty(only) || !MatchesCorrect(only, t.correctItemIds))
                    {
                        _context?.presentValidationMessage?.Invoke("Not quite — check your matches.");
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
                        _context?.presentValidationMessage?.Invoke("Place every card.");
                        return false;
                    }
                }
            }

            return true;
        }

        private void BuildBlockTarget(DragDropTargetDto t)
        {
            if (t == null || string.IsNullOrWhiteSpace(t.id))
                return;
            var tid = t.id.Trim();

            var block = new VisualElement();
            block.AddToClassList("lg-muted-panel");
            block.style.marginBottom = 10;
            block.style.paddingLeft = 8;
            block.style.paddingRight = 8;
            block.style.paddingTop = 8;
            block.style.paddingBottom = 8;

            var title = new Label(string.IsNullOrWhiteSpace(t.title) ? "Categoria" : t.title.Trim());
            title.AddToClassList("lg-text-body");
            title.style.unityFontStyleAndWeight = FontStyle.Bold;
            title.style.marginBottom = 6;
            block.Add(title);

            var dropZone = new VisualElement();
            dropZone.AddToClassList("lg-list-row-button");
            dropZone.style.minHeight = 100;
            dropZone.style.backgroundColor = new Color(0.55f, 0.62f, 0.85f, 0.35f);
            dropZone.userData = tid;
            _pickupZones.Add(dropZone);

            var inner = new VisualElement();
            if (_blocksMode)
                inner.style.flexDirection = FlexDirection.Row;
            else
                inner.style.flexDirection = FlexDirection.Row;
            inner.style.flexWrap = Wrap.Wrap;
            inner.style.flexGrow = 1;
            inner.style.minHeight = 60;
            inner.style.alignItems = Align.Center;
            inner.style.justifyContent = _blocksMode ? Justify.FlexStart : Justify.Center;

            var hint = new Label(DropZoneHintText);
            hint.AddToClassList("lg-text-muted");
            hint.name = "hint";
            hint.style.unityFontStyleAndWeight = FontStyle.Italic;
            inner.Add(hint);

            dropZone.Add(inner);
            block.Add(dropZone);
            _targetsHost.Add(block);

            _targetInnerHosts[tid] = inner;
        }

        private void BuildLinesLayout(DragDropContentDto dto)
        {
            if (dto.lines == null)
                return;
            foreach (var line in dto.lines)
            {
                if (line?.segments == null || line.segments.Length == 0)
                    continue;
                var row = new VisualElement();
                row.style.flexDirection = FlexDirection.Row;
                row.style.flexWrap = Wrap.Wrap;
                row.style.alignItems = Align.Center;
                row.style.marginBottom = 10;

                foreach (var seg in line.segments)
                {
                    if (seg == null || string.IsNullOrWhiteSpace(seg.kind))
                        continue;
                    var k = seg.kind.Trim();
                    if (string.Equals(k, "text", StringComparison.OrdinalIgnoreCase))
                    {
                        var lit = new Label(seg.text ?? string.Empty);
                        lit.AddToClassList("lg-text-body");
                        lit.style.marginRight = 6;
                        row.Add(lit);
                        continue;
                    }

                    if (!string.Equals(k, "slot", StringComparison.OrdinalIgnoreCase))
                        continue;
                    var slotId = (seg.targetId ?? string.Empty).Trim();
                    if (string.IsNullOrEmpty(slotId))
                        continue;

                    var slot = new VisualElement();
                    slot.AddToClassList("lg-list-row-button");
                    slot.style.width = 96;
                    slot.style.height = 56;
                    slot.style.marginRight = 6;
                    slot.style.justifyContent = Justify.Center;
                    slot.style.alignItems = Align.Center;
                    slot.userData = slotId;
                    _pickupZones.Add(slot);

                    var inner = new VisualElement();
                    inner.style.flexDirection = FlexDirection.Row;
                    inner.style.alignItems = Align.Center;
                    inner.style.justifyContent = Justify.Center;
                    inner.style.flexGrow = 1;

                    var hint = new Label(DropZoneHintText);
                    hint.name = "hint";
                    hint.AddToClassList("lg-text-muted");
                    hint.style.unityFontStyleAndWeight = FontStyle.Italic;
                    inner.Add(hint);

                    slot.Add(inner);
                    row.Add(slot);
                    _targetInnerHosts[slotId] = inner;
                }

                _targetsHost.Add(row);
            }
        }

        private void CreateBankTile(DragDropItemDto def, VisualElement bankWrap)
        {
            var itemId = def.id.Trim();
            var card = new VisualElement();
            card.name = $"tile_{itemId}";
            card.userData = itemId;
            card.AddToClassList("lg-btn");
            card.AddToClassList("lg-btn--secondary");
            card.style.marginRight = 8;
            card.style.marginBottom = 8;
            card.style.minWidth = 80;
            card.style.minHeight = 44;
            card.style.paddingLeft = 10;
            card.style.paddingRight = 10;
            card.style.paddingTop = 8;
            card.style.paddingBottom = 8;
            card.style.justifyContent = Justify.Center;

            var text = string.IsNullOrWhiteSpace(def.label) ? itemId : def.label.Trim();
            var lbl = new Label(text);
            lbl.AddToClassList("lg-text-body");
            lbl.style.whiteSpace = WhiteSpace.Normal;
            card.Add(lbl);

            var url = (def.imageUrl ?? string.Empty).Trim();
            if (!string.IsNullOrEmpty(url) && ToolkitStepHttpResourceUrl.IsAllowed(url, out _) && _coroutineHost != null)
            {
                var img = new VisualElement();
                img.style.width = 72;
                img.style.height = 72;
                img.style.marginTop = 4;
                img.style.backgroundSize = new BackgroundSize(BackgroundSizeType.Cover);
                card.Add(img);
                _imageLoads.Add(_coroutineHost.StartCoroutine(LoadImg(url, img)));
            }

            card.AddManipulator(new TileDragManipulator(this, card));
            bankWrap.Add(card);
            _itemTiles[itemId] = card;
            RefreshHints();
        }

        private void StopImageLoads()
        {
            if (_coroutineHost == null)
            {
                _imageLoads.Clear();
            }
            else
            {
                foreach (var c in _imageLoads)
                {
                    if (c != null)
                        _coroutineHost.StopCoroutine(c);
                }

                _imageLoads.Clear();
            }

            foreach (var tex in _remoteTileTextures)
            {
                if (tex != null)
                    UnityEngine.Object.Destroy(tex);
            }

            _remoteTileTextures.Clear();
        }

        private IEnumerator LoadImg(string url, VisualElement ve)
        {
            if (!ToolkitStepHttpResourceUrl.TryVerifyForClientFetch(url, out var verr))
            {
                Debug.LogWarning($"[DragDropToolkitStep] Blocked remote image URL: {verr}");
                yield break;
            }

            using var req = UnityWebRequestTexture.GetTexture(url);
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success || ve == null)
                yield break;
            var tex = DownloadHandlerTexture.GetContent(req);
            if (tex != null)
            {
                _remoteTileTextures.Add(tex);
                ve.style.backgroundImage = new StyleBackground(tex);
            }
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

        internal void FinalizeDrag(VisualElement tile, Vector2 panelPosition)
        {
            if (!_dragsEnabled || tile == null)
                return;

            var item_id = tile.userData as string;
            if (string.IsNullOrEmpty(item_id))
                return;

            var hitZone = FindZoneUnder(panelPosition);
            if (hitZone != null && hitZone.userData is string tid && !string.IsNullOrEmpty(tid))
                MoveItemToTarget(item_id, tid);
            else
                MoveItemToBank(item_id);
        }

        /// <summary>
        /// Picks the innermost drop zone under a point (panel coordinates per <see cref="PointerEventBase{T}.position"/>).
        /// Geometric only so the dragged tile does not steal hit-tests.
        /// </summary>
        private VisualElement FindZoneUnder(Vector2 panelPosition)
        {
            VisualElement best = null;
            var bestArea = float.MaxValue;
            foreach (var z in _pickupZones)
            {
                if (z == null || !z.worldBound.Contains(panelPosition))
                    continue;
                var area = z.worldBound.width * z.worldBound.height;
                if (area < bestArea)
                {
                    bestArea = area;
                    best = z;
                }
            }

            return best;
        }

        internal void BeginTileDrag(VisualElement tile)
        {
            if (tile == null)
                return;
            _root.Add(_dragLayer);
            var worldTopLeft = tile.LocalToWorld(Vector2.zero);
            _dragLayer.Add(tile);
            tile.style.position = Position.Absolute;
            var localTopLeft = _dragLayer.WorldToLocal(worldTopLeft);
            tile.style.left = localTopLeft.x;
            tile.style.top = localTopLeft.y;
            tile.style.translate = new StyleTranslate(new Translate(0, 0));
        }

        internal bool TileIsInFloatLayer(VisualElement tile) =>
            tile != null && ReferenceEquals(tile.parent, _dragLayer);

        private static void ClearTileDragPositioning(VisualElement tile)
        {
            if (tile == null)
                return;
            tile.style.position = StyleKeyword.Null;
            tile.style.left = StyleKeyword.Null;
            tile.style.top = StyleKeyword.Null;
            tile.style.right = StyleKeyword.Null;
            tile.style.bottom = StyleKeyword.Null;
            tile.style.translate = new StyleTranslate(new Translate(0, 0));
        }

        private void MoveItemToBank(string itemId)
        {
            if (!_itemTiles.TryGetValue(itemId, out var tile))
                return;
            RemoveFromOccupants(itemId);

            var wrap = _bankHost.Q<VisualElement>("bank-wrap") ?? _bankHost;
            ClearTileDragPositioning(tile);
            wrap.Add(tile);
            RefreshHints();
        }

        private void MoveItemToTarget(string itemId, string targetId)
        {
            if (!_itemTiles.TryGetValue(itemId, out var tile) ||
                !_targetInnerHosts.TryGetValue(targetId, out var inner))
            {
                MoveItemToBank(itemId);
                return;
            }

            RemoveFromOccupants(itemId);

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
            ClearTileDragPositioning(tile);
            inner.Add(tile);
            RefreshHints();
        }

        private void RemoveFromOccupants(string itemId)
        {
            if (string.IsNullOrEmpty(itemId))
                return;
            foreach (var tid in new List<string>(_occupant.Keys))
            {
                if (_occupant.TryGetValue(tid, out var set) && set != null)
                    set.Remove(itemId);
            }
        }

        private void RefreshHints()
        {
            foreach (var kv in _targetInnerHosts)
            {
                if (kv.Value == null)
                    continue;
                var hasTile = false;
                for (var i = 0; i < kv.Value.childCount; i++)
                {
                    var child = kv.Value.ElementAt(i);
                    if (child is Label lab && lab.name == "hint")
                        continue;
                    hasTile = true;
                    break;
                }

                var hint = kv.Value.Q<Label>("hint");
                if (hint != null)
                    hint.style.display = hasTile ? DisplayStyle.None : DisplayStyle.Flex;
            }
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

                if (hasImg && !ToolkitStepHttpResourceUrl.IsAllowed(it.imageUrl, out var urlError))
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

        private sealed class TileDragManipulator : PointerManipulator
        {
            private readonly DragDropToolkitStep _owner;
            private readonly VisualElement _tile;
            private Vector3 _pointerStart;
            private Vector2 _lastPanelPosition;
            private bool _dragging;
            private bool _pointerUpCompletingDrag;

            public TileDragManipulator(DragDropToolkitStep owner, VisualElement tile)
            {
                _owner = owner;
                _tile = tile;
            }

            protected override void RegisterCallbacksOnTarget()
            {
                target.RegisterCallback<PointerDownEvent>(OnDown);
                target.RegisterCallback<PointerMoveEvent>(OnMove);
                target.RegisterCallback<PointerUpEvent>(OnUp);
                target.RegisterCallback<PointerCaptureOutEvent>(OnCaptureOut);
            }

            protected override void UnregisterCallbacksFromTarget()
            {
                target.UnregisterCallback<PointerDownEvent>(OnDown);
                target.UnregisterCallback<PointerMoveEvent>(OnMove);
                target.UnregisterCallback<PointerUpEvent>(OnUp);
                target.UnregisterCallback<PointerCaptureOutEvent>(OnCaptureOut);
            }

            private void OnDown(PointerDownEvent evt)
            {
                if (!_owner._dragsEnabled)
                    return;
                _dragging = true;
                _pointerStart = evt.position;
                _lastPanelPosition = new Vector2(evt.position.x, evt.position.y);
                _owner.BeginTileDrag(_tile);
                target.CapturePointer(evt.pointerId);
                evt.StopPropagation();
            }

            private void OnMove(PointerMoveEvent evt)
            {
                if (!_dragging || !target.HasPointerCapture(evt.pointerId))
                    return;
                _lastPanelPosition = new Vector2(evt.position.x, evt.position.y);
                var delta = evt.position - _pointerStart;
                _tile.style.translate = new StyleTranslate(new Translate(delta.x, delta.y));
                evt.StopPropagation();
            }

            private void OnUp(PointerUpEvent evt)
            {
                if (!_dragging)
                    return;
                _dragging = false;
                _pointerUpCompletingDrag = true;
                if (target.HasPointerCapture(evt.pointerId))
                    target.ReleasePointer(evt.pointerId);
                _lastPanelPosition = new Vector2(evt.position.x, evt.position.y);
                _owner.FinalizeDrag(_tile, _lastPanelPosition);
                _pointerUpCompletingDrag = false;
                evt.StopPropagation();
            }

            private void OnCaptureOut(PointerCaptureOutEvent _)
            {
                if (_pointerUpCompletingDrag)
                    return;
                if (!_dragging && !_owner.TileIsInFloatLayer(_tile))
                    return;

                _dragging = false;
                _owner.FinalizeDrag(_tile, _lastPanelPosition);
            }
        }
    }
}
