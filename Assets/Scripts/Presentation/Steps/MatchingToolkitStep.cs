using System;
using System.Collections;
using System.Collections.Generic;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Matching task: pair items from a left column to a right column by dragging a line from left to right,
    /// or by tapping a left item then tapping the matching right item.
    /// </summary>
    public sealed class MatchingToolkitStep : IStepView, ISubmitFromShell, ITaskAttemptPayloadProvider
    {
        private const float DragThresholdPx = 10f;

        private readonly bool _uiReady;
        private readonly VisualElement _root;
        private readonly Label _promptLabel;
        private readonly Label _subtitleLabel;
        private readonly VisualElement _pairingArea;
        private readonly VisualElement _columnsRow;
        private readonly VisualElement _leftColumn;
        private readonly VisualElement _rightColumn;
        private readonly MatchingLineLayer _lineLayer;
        private readonly MonoBehaviour _coroutineHost;

        private readonly List<Coroutine> _imageLoads = new();
        private readonly List<Texture2D> _remoteTextures = new();

        private readonly Dictionary<string, VisualElement> _leftById = new(StringComparer.Ordinal);
        private readonly Dictionary<string, VisualElement> _rightById = new(StringComparer.Ordinal);
        private readonly Dictionary<string, VisualElement> _unlinkByLeftId = new(StringComparer.Ordinal);
        private readonly Dictionary<string, string> _pairingLeftToRight = new(StringComparer.Ordinal);
        private readonly Dictionary<string, string> _expectedLeftToRight = new(StringComparer.Ordinal);

        private MatchingContentDto _dto;
        private StepContext _context;
        private Action<StepCompletionRequest> _onRequest;
        private bool _contentReady;
        private bool _interactable = true;

        private string _selectedLeftId;
        private string _dragLeftId;
        private Vector2 _rubberEndLocal;
        private bool _draggingLine;
        private Vector2 _pointerDownPos;
        private int _activePointerId = -1;

        private readonly EventCallback<GeometryChangedEvent> _onPairingGeometryChanged;
        private uint _geometryRefreshVersion;

        public MatchingToolkitStep(VisualElement host, MonoBehaviour coroutineHost)
        {
            _coroutineHost = coroutineHost;
            _onPairingGeometryChanged = OnPairingGeometryChanged;

            _uiReady = ToolkitStepUx.TryMount(host, ToolkitStepTemplatePaths.MatchingTask, "matching-root", out _root);
            _promptLabel = _uiReady
                ? ToolkitStepUx.Query<Label>(_root, "task-prompt", nameof(MatchingToolkitStep))
                : null;
            _subtitleLabel = _uiReady
                ? ToolkitStepUx.Query<Label>(_root, "task-subtitle", nameof(MatchingToolkitStep))
                : null;
            _pairingArea = _uiReady
                ? ToolkitStepUx.Query<VisualElement>(_root, "matching-pairing-area", nameof(MatchingToolkitStep))
                : null;
            _columnsRow = _uiReady
                ? ToolkitStepUx.Query<VisualElement>(_root, "matching-columns-row", nameof(MatchingToolkitStep))
                : null;
            _leftColumn = _uiReady
                ? ToolkitStepUx.Query<VisualElement>(_root, "matching-left-column", nameof(MatchingToolkitStep))
                : null;
            _rightColumn = _uiReady
                ? ToolkitStepUx.Query<VisualElement>(_root, "matching-right-column", nameof(MatchingToolkitStep))
                : null;

            _lineLayer = new MatchingLineLayer { name = "matching-line-layer" };
            _lineLayer.pickingMode = PickingMode.Ignore;
            _lineLayer.style.position = Position.Absolute;
            _lineLayer.style.left = 0;
            _lineLayer.style.top = 0;
            _lineLayer.style.right = 0;
            _lineLayer.style.bottom = 0;

            if (!_uiReady || _pairingArea == null)
                return;

            var lineHost = ToolkitStepUx.Query<VisualElement>(_root, "matching-line-layer-host", nameof(MatchingToolkitStep));
            if (lineHost != null)
                lineHost.Add(_lineLayer);
            else
                _pairingArea.Add(_lineLayer);

            _pairingArea.RegisterCallback(_onPairingGeometryChanged);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context;
            _onRequest = onRequest;
            StopImageLoads();
            TeardownBindings();

            if (!ToolkitStepUx.GuardTemplateReady(
                    _uiReady && _leftColumn != null && _rightColumn != null && _lineLayer != null,
                    context))
                return;

            ToolkitStepUx.SetOptionalLabel(_promptLabel, null);
            ToolkitStepUx.SetOptionalLabel(_subtitleLabel, null);

            _leftColumn.Clear();
            _rightColumn.Clear();
            _lineLayer.ClearSegments();
            _leftById.Clear();
            _rightById.Clear();
            _unlinkByLeftId.Clear();
            _pairingLeftToRight.Clear();
            _expectedLeftToRight.Clear();
            _dto = null;
            _contentReady = false;
            _selectedLeftId = null;
            EndDragState();

            if (!TryDeserialize(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[MatchingToolkitStep] Invalid contentJson: {error ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(error) ? "Invalid matching content." : error);
                return;
            }

            _dto = dto;
            foreach (var p in dto.correctPairs)
            {
                if (p == null || string.IsNullOrWhiteSpace(p.leftItemId) || string.IsNullOrWhiteSpace(p.rightItemId))
                    continue;
                _expectedLeftToRight[p.leftItemId.Trim()] = p.rightItemId.Trim();
            }

            ToolkitStepUx.SetOptionalLabel(_promptLabel, dto.prompt?.Trim());
            ToolkitStepUx.SetOptionalLabel(_subtitleLabel, dto.subtitle?.Trim());

            var pres = dto.presentation ?? new MatchingPresentationDto();
            var leftHeader = new Label(string.IsNullOrWhiteSpace(pres.leftLabel) ? "Sinistra" : pres.leftLabel.Trim());
            leftHeader.AddToClassList("lg-text-caption");
            leftHeader.style.marginBottom = 6;
            _leftColumn.Add(leftHeader);

            var rightHeader = new Label(string.IsNullOrWhiteSpace(pres.rightLabel) ? "Destra" : pres.rightLabel.Trim());
            rightHeader.AddToClassList("lg-text-caption");
            rightHeader.style.marginBottom = 6;
            _rightColumn.Add(rightHeader);

            var leftOrder = BuildLeftOrder(dto);
            foreach (var id in leftOrder)
            {
                var def = FindItem(dto.leftItems, id);
                if (def != null)
                    AddLeftTile(def);
            }

            var rightOrder = BuildRightOrder(dto, pres.shuffleRightOrder);
            foreach (var id in rightOrder)
            {
                var def = FindItem(dto.rightItems, id);
                if (def != null)
                    AddRightTile(def);
            }

            _contentReady = _leftById.Count > 0 && _rightById.Count > 0 && _expectedLeftToRight.Count > 0;
            if (!_contentReady)
                context?.presentValidationMessage?.Invoke("Matching task is incomplete.");

            RegisterUiEvents();
            RefreshUnpairControls();
            ScheduleRefreshLines();
        }

        public void SetInteractable(bool interactable)
        {
            _interactable = interactable;
        }

        public void SubmitFromShell()
        {
            if (_context != null && QuestScoringPolicy.ServerScoresPizza(_context.rewardRulesJson))
            {
                if (!TryBuildTaskAttemptJson(out var json, out var aerr))
                {
                    if (!string.IsNullOrEmpty(aerr))
                        _context?.presentValidationMessage?.Invoke(aerr);
                    return;
                }

                _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true, taskAttemptJson = json });
                return;
            }

            if (!ValidatePairs())
                return;
            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        public void Teardown()
        {
            TeardownBindings();
            _pairingArea?.UnregisterCallback(_onPairingGeometryChanged);
            StopImageLoads();
            _context = null;
            _onRequest = null;
            _root?.RemoveFromHierarchy();
        }

        private void TeardownBindings()
        {
            if (_root == null)
                return;

            _root.UnregisterCallback<PointerMoveEvent>(OnRootPointerMove);
            _root.UnregisterCallback<PointerUpEvent>(OnRootPointerUp);
            _root.UnregisterCallback<PointerCaptureOutEvent>(OnRootCaptureOut);
        }

        private void OnPairingGeometryChanged(GeometryChangedEvent _)
        {
            var v = ++_geometryRefreshVersion;
            _pairingArea.schedule.Execute(() =>
            {
                if (v != _geometryRefreshVersion)
                    return;
                RefreshCommittedLines();
                if (_draggingLine && !string.IsNullOrEmpty(_dragLeftId))
                    UpdateRubberBand();
            }).ExecuteLater(0);
        }

        private void RegisterUiEvents()
        {
            _root.RegisterCallback<PointerMoveEvent>(OnRootPointerMove, TrickleDown.TrickleDown);
            _root.RegisterCallback<PointerUpEvent>(OnRootPointerUp, TrickleDown.TrickleDown);
            _root.RegisterCallback<PointerCaptureOutEvent>(OnRootCaptureOut, TrickleDown.TrickleDown);

            foreach (var kv in _rightById)
                AttachRightHandlers(kv.Value, kv.Key);
        }

        private void AttachLeftHandlers(VisualElement tile, string leftId)
        {
            tile.RegisterCallback<PointerDownEvent>(evt =>
            {
                if (!_interactable)
                    return;
                evt.StopPropagation();
                _activePointerId = evt.pointerId;
                _pointerDownPos = evt.position;
                _dragLeftId = leftId;
                _draggingLine = false;
            });

            tile.RegisterCallback<PointerUpEvent>(evt =>
            {
                if (!_interactable || evt.pointerId != _activePointerId)
                    return;
                evt.StopPropagation();

                if (_draggingLine)
                    return;

                var moved = Vector2.Distance(_pointerDownPos, evt.position);
                if (moved < DragThresholdPx)
                    ToggleLeftSelect(leftId);

                ResetPointerGesture();
            });
        }

        private void AttachRightHandlers(VisualElement tile, string rightId)
        {
            tile.RegisterCallback<PointerUpEvent>(evt =>
            {
                if (!_interactable)
                    return;

                if (!string.IsNullOrEmpty(_selectedLeftId))
                {
                    evt.StopPropagation();
                    TryPair(_selectedLeftId, rightId);
                    _selectedLeftId = null;
                    RefreshSelectionStyles();
                }
            });
        }

        private void OnRootPointerMove(PointerMoveEvent evt)
        {
            if (!_interactable || evt.pointerId != _activePointerId)
                return;

            if (Vector2.Distance(_pointerDownPos, evt.position) >= DragThresholdPx)
            {
                if (!_draggingLine)
                {
                    _draggingLine = true;
                    _root.CapturePointer(evt.pointerId);
                }
            }

            if (!_draggingLine || string.IsNullOrEmpty(_dragLeftId))
                return;

            _rubberEndLocal = _lineLayer.WorldToLocal(evt.position);
            UpdateRubberBand();
        }

        private void OnRootPointerUp(PointerUpEvent evt)
        {
            if (!_interactable)
                return;

            if (_root.HasPointerCapture(evt.pointerId))
                _root.ReleasePointer(evt.pointerId);

            var wasActivePointer = evt.pointerId == _activePointerId;

            if (wasActivePointer &&
                _draggingLine &&
                !string.IsNullOrEmpty(_dragLeftId))
            {
                var hitRight = FindRightIdUnder(evt.position);
                if (!string.IsNullOrEmpty(hitRight))
                    TryPair(_dragLeftId, hitRight);
            }

            if (wasActivePointer)
            {
                EndDragState();
                ResetPointerGesture();
            }
        }

        private void OnRootCaptureOut(PointerCaptureOutEvent evt)
        {
            if (evt.pointerId != _activePointerId)
                return;
            if (_root.HasPointerCapture(evt.pointerId))
                _root.ReleasePointer(evt.pointerId);
            EndDragState();
            ResetPointerGesture();
        }

        private void ResetPointerGesture()
        {
            _activePointerId = -1;
            _dragLeftId = null;
            _draggingLine = false;
            _lineLayer.SetRubberBand(null, null);
        }

        private void EndDragState()
        {
            _draggingLine = false;
            _dragLeftId = null;
            _lineLayer.SetRubberBand(null, null);
        }

        private void ToggleLeftSelect(string leftId)
        {
            if (string.Equals(_selectedLeftId, leftId, StringComparison.Ordinal))
                _selectedLeftId = null;
            else
                _selectedLeftId = leftId;
            RefreshSelectionStyles();
        }

        private void RefreshSelectionStyles()
        {
            foreach (var kv in _leftById)
            {
                var sel = string.Equals(kv.Key, _selectedLeftId, StringComparison.Ordinal);
                ApplySelectStyle(kv.Value, sel);
            }
        }

        private static void ApplySelectStyle(VisualElement tile, bool selected)
        {
            if (tile == null)
                return;
            if (selected)
            {
                tile.style.borderLeftWidth = 3;
                tile.style.borderLeftColor = new Color(0.25f, 0.45f, 0.95f, 1f);
            }
            else
            {
                tile.style.borderLeftWidth = 0;
            }
        }

        private string FindRightIdUnder(Vector2 panelPosition)
        {
            string best = null;
            var bestArea = float.MaxValue;
            foreach (var kv in _rightById)
            {
                if (kv.Value == null || !kv.Value.worldBound.Contains(panelPosition))
                    continue;
                var r = kv.Value.worldBound;
                var area = r.width * r.height;
                if (area < bestArea)
                {
                    bestArea = area;
                    best = kv.Key;
                }
            }

            return best;
        }

        private void TryPair(string leftId, string rightId)
        {
            if (string.IsNullOrEmpty(leftId) || string.IsNullOrEmpty(rightId))
                return;

            if (!_leftById.ContainsKey(leftId) || !_rightById.ContainsKey(rightId))
                return;

            foreach (var kv in new List<KeyValuePair<string, string>>(_pairingLeftToRight))
            {
                if (string.Equals(kv.Value, rightId, StringComparison.Ordinal) &&
                    !string.Equals(kv.Key, leftId, StringComparison.Ordinal))
                    _pairingLeftToRight.Remove(kv.Key);
            }

            if (_pairingLeftToRight.TryGetValue(leftId, out var existing) &&
                string.Equals(existing, rightId, StringComparison.Ordinal))
            {
                _pairingLeftToRight.Remove(leftId);
            }
            else
            {
                _pairingLeftToRight[leftId] = rightId;
            }

            _selectedLeftId = null;
            RefreshSelectionStyles();
            RefreshUnpairControls();
            RefreshCommittedLines();
        }

        private void ClearPairForLeft(string leftId)
        {
            if (string.IsNullOrEmpty(leftId))
                return;
            if (!_pairingLeftToRight.Remove(leftId.Trim()))
                return;
            _selectedLeftId = null;
            RefreshSelectionStyles();
            RefreshUnpairControls();
            RefreshCommittedLines();
        }

        private void RefreshUnpairControls()
        {
            foreach (var kv in _unlinkByLeftId)
            {
                if (kv.Value == null)
                    continue;
                var show = _pairingLeftToRight.ContainsKey(kv.Key);
                kv.Value.style.display = show ? DisplayStyle.Flex : DisplayStyle.None;
            }
        }

        private bool ValidatePairs()
        {
            if (!_contentReady || _dto == null)
            {
                _context?.presentValidationMessage?.Invoke("This task is not ready yet. Check the lesson content.");
                return false;
            }

            foreach (var left in _dto.leftItems)
            {
                if (left == null || string.IsNullOrWhiteSpace(left.id))
                    continue;
                var id = left.id.Trim();
                if (!_pairingLeftToRight.TryGetValue(id, out var r) || string.IsNullOrEmpty(r))
                {
                    _context?.presentValidationMessage?.Invoke("Fill every match.");
                    return false;
                }
            }

            foreach (var kv in _pairingLeftToRight)
            {
                if (!_expectedLeftToRight.TryGetValue(kv.Key, out var expected))
                {
                    _context?.presentValidationMessage?.Invoke("Not quite — check your matches.");
                    return false;
                }

                if (!string.Equals(expected, kv.Value, StringComparison.Ordinal))
                {
                    _context?.presentValidationMessage?.Invoke("Not quite — check your matches.");
                    return false;
                }
            }

            if (_pairingLeftToRight.Count != _dto.leftItems.Length)
            {
                _context?.presentValidationMessage?.Invoke("Not quite — check your matches.");
                return false;
            }

            return true;
        }

        public bool TryBuildTaskAttemptJson(out string attemptJson, out string validationMessage)
        {
            attemptJson = null;
            validationMessage = null;
            if (!_contentReady || _dto == null)
            {
                validationMessage = "Matching task is not ready yet.";
                return false;
            }

            var elems = new List<string>();
            foreach (var left in _dto.leftItems)
            {
                if (left == null || string.IsNullOrWhiteSpace(left.id))
                    continue;
                var lid = left.id.Trim();
                _pairingLeftToRight.TryGetValue(lid, out var rid);
                rid = string.IsNullOrEmpty(rid) ? string.Empty : rid.Trim();
                elems.Add($"{TaskAttemptJson.StringLiteral(lid)}:{TaskAttemptJson.StringLiteral(rid)}");
            }

            if (elems.Count == 0)
            {
                validationMessage = "Matching task is incomplete.";
                return false;
            }

            attemptJson =
                "{\"taskType\":\"Matching\",\"matching\":{\"pairs\":{" + string.Join(",", elems) + "}}}";
            return true;
        }

        private void UpdateRubberBand()
        {
            if (string.IsNullOrEmpty(_dragLeftId) || !_leftById.TryGetValue(_dragLeftId, out var leftEl))
            {
                _lineLayer.SetRubberBand(null, null);
                return;
            }

            var startWorld = GetConnectorPoint(leftEl, fromLeft: true);
            var startLocal = _lineLayer.WorldToLocal(startWorld);
            _lineLayer.SetRubberBand(startLocal, _rubberEndLocal);
        }

        private void RefreshCommittedLines()
        {
            _lineLayer.ClearSegments();
            foreach (var kv in _pairingLeftToRight)
            {
                if (!_leftById.TryGetValue(kv.Key, out var leftEl) ||
                    !_rightById.TryGetValue(kv.Value, out var rightEl))
                    continue;

                var a = _lineLayer.WorldToLocal(GetConnectorPoint(leftEl, fromLeft: true));
                var b = _lineLayer.WorldToLocal(GetConnectorPoint(rightEl, fromLeft: false));
                _lineLayer.AddSegment(a, b);
            }

            _lineLayer.MarkDirtyRepaint();
        }

        /// <summary>World-space point on the inner edge facing the opposite column.</summary>
        private static Vector2 GetConnectorPoint(VisualElement el, bool fromLeft)
        {
            var r = el.worldBound;
            var cx = fromLeft ? r.xMax - 1f : r.xMin + 1f;
            var cy = r.yMin + r.height * 0.5f;
            return new Vector2(cx, cy);
        }

        private void ScheduleRefreshLines()
        {
            _root.schedule.Execute(() =>
            {
                RefreshCommittedLines();
                if (_draggingLine && !string.IsNullOrEmpty(_dragLeftId))
                    UpdateRubberBand();
            }).ExecuteLater(0);
        }

        private void AddLeftTile(MatchingItemDto def)
        {
            var itemId = def.id.Trim();

            var outer = new VisualElement();
            outer.name = $"match_left_{itemId}";
            outer.style.flexDirection = FlexDirection.Row;
            outer.style.alignItems = Align.Center;
            outer.style.marginBottom = 8;
            outer.userData = itemId;

            var card = new VisualElement();
            card.name = $"match_tile_{itemId}";
            card.style.flexGrow = 1;
            card.userData = itemId;
            card.AddToClassList("lg-btn");
            card.AddToClassList("lg-btn--secondary");
            card.style.paddingLeft = 10;
            card.style.paddingRight = 10;
            card.style.paddingTop = 10;
            card.style.paddingBottom = 10;
            card.style.flexDirection = FlexDirection.Column;
            card.style.alignItems = Align.FlexStart;
            card.focusable = true;

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

            var unlink = new Label("×");
            unlink.name = "matching-unpair";
            unlink.tooltip = "Rimuovi collegamento";
            unlink.style.width = 28;
            unlink.style.minWidth = 28;
            unlink.style.fontSize = 20;
            unlink.style.unityTextAlign = TextAnchor.MiddleCenter;
            unlink.style.color = new Color(0.42f, 0.45f, 0.52f, 1f);
            unlink.style.display = DisplayStyle.None;
            unlink.focusable = true;
            unlink.RegisterCallback<PointerDownEvent>(evt =>
            {
                if (!_interactable)
                    return;
                evt.StopPropagation();
            });
            unlink.RegisterCallback<PointerUpEvent>(evt =>
            {
                if (!_interactable)
                    return;
                evt.StopPropagation();
                ClearPairForLeft(itemId);
            });

            outer.Add(card);
            outer.Add(unlink);
            _leftColumn.Add(outer);
            _leftById[itemId] = outer;
            _unlinkByLeftId[itemId] = unlink;

            AttachLeftHandlers(card, itemId);
        }

        private void AddRightTile(MatchingItemDto def)
        {
            var itemId = def.id.Trim();
            var card = new VisualElement();
            card.name = $"match_tile_{itemId}";
            card.userData = itemId;
            card.AddToClassList("lg-btn");
            card.AddToClassList("lg-btn--secondary");
            card.style.marginBottom = 8;
            card.style.paddingLeft = 10;
            card.style.paddingRight = 10;
            card.style.paddingTop = 10;
            card.style.paddingBottom = 10;
            card.style.flexDirection = FlexDirection.Column;
            card.style.alignItems = Align.FlexStart;
            card.focusable = true;

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

            _rightColumn.Add(card);
            _rightById[itemId] = card;
        }

        private IEnumerator LoadImg(string url, VisualElement ve)
        {
            if (!ToolkitStepHttpResourceUrl.TryVerifyForClientFetch(url, out var verr))
            {
                Debug.LogWarning($"[MatchingToolkitStep] Blocked remote image URL: {verr}");
                yield break;
            }

            using var req = UnityWebRequestTexture.GetTexture(url);
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success || ve == null)
                yield break;
            var tex = DownloadHandlerTexture.GetContent(req);
            if (tex != null)
            {
                _remoteTextures.Add(tex);
                ve.style.backgroundImage = new StyleBackground(tex);
            }
        }

        private void StopImageLoads()
        {
            if (_coroutineHost == null)
                _imageLoads.Clear();
            else
            {
                foreach (var c in _imageLoads)
                {
                    if (c != null)
                        _coroutineHost.StopCoroutine(c);
                }

                _imageLoads.Clear();
            }

            foreach (var tex in _remoteTextures)
            {
                if (tex != null)
                    UnityEngine.Object.Destroy(tex);
            }

            _remoteTextures.Clear();
        }

        private static List<string> BuildLeftOrder(MatchingContentDto dto)
        {
            var order = new List<string>();
            if (dto.leftItems == null)
                return order;
            foreach (var it in dto.leftItems)
            {
                if (it?.id != null && !string.IsNullOrWhiteSpace(it.id))
                    order.Add(it.id.Trim());
            }

            return order;
        }

        private static List<string> BuildRightOrder(MatchingContentDto dto, bool shuffle)
        {
            var order = new List<string>();
            if (dto.rightItems == null)
                return order;
            foreach (var it in dto.rightItems)
            {
                if (it?.id != null && !string.IsNullOrWhiteSpace(it.id))
                    order.Add(it.id.Trim());
            }

            if (shuffle && order.Count > 1)
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

        private static MatchingItemDto FindItem(MatchingItemDto[] items, string id)
        {
            if (items == null)
                return null;
            foreach (var it in items)
            {
                if (it != null && string.Equals(it.id?.Trim(), id, StringComparison.Ordinal))
                    return it;
            }

            return null;
        }

        private static bool TryDeserialize(string json, out MatchingContentDto dto, out string error)
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
                error = "Matching content must be a JSON object.";
                return false;
            }

            dto = JsonUtility.FromJson<MatchingContentDto>(json);
            if (dto?.leftItems == null || dto.leftItems.Length == 0)
            {
                error = "At least one left item is required.";
                return false;
            }

            if (dto.rightItems == null || dto.rightItems.Length == 0)
            {
                error = "At least one right item is required.";
                return false;
            }

            if (dto.correctPairs == null || dto.correctPairs.Length == 0)
            {
                error = "At least one correct pair is required.";
                return false;
            }

            var leftIds = new HashSet<string>(StringComparer.Ordinal);
            foreach (var it in dto.leftItems)
            {
                if (it == null || string.IsNullOrWhiteSpace(it.id))
                {
                    error = "Each left item needs an id.";
                    return false;
                }

                var id = it.id.Trim();
                if (!leftIds.Add(id))
                {
                    error = "Duplicate left item id.";
                    return false;
                }

                if (string.IsNullOrWhiteSpace(it.label) && string.IsNullOrWhiteSpace(it.imageUrl))
                {
                    error = "Each left item needs a label and/or imageUrl.";
                    return false;
                }

                if (!string.IsNullOrWhiteSpace(it.imageUrl) && !ToolkitStepHttpResourceUrl.IsAllowed(it.imageUrl, out var imgErr))
                {
                    error = imgErr;
                    return false;
                }
            }

            var rightIds = new HashSet<string>(StringComparer.Ordinal);
            foreach (var it in dto.rightItems)
            {
                if (it == null || string.IsNullOrWhiteSpace(it.id))
                {
                    error = "Each right item needs an id.";
                    return false;
                }

                var id = it.id.Trim();
                if (!rightIds.Add(id))
                {
                    error = "Duplicate right item id.";
                    return false;
                }

                if (string.IsNullOrWhiteSpace(it.label) && string.IsNullOrWhiteSpace(it.imageUrl))
                {
                    error = "Each right item needs a label and/or imageUrl.";
                    return false;
                }

                if (!string.IsNullOrWhiteSpace(it.imageUrl) && !ToolkitStepHttpResourceUrl.IsAllowed(it.imageUrl, out var imgErr))
                {
                    error = imgErr;
                    return false;
                }
            }

            foreach (var p in dto.correctPairs)
            {
                if (p == null || string.IsNullOrWhiteSpace(p.leftItemId) || string.IsNullOrWhiteSpace(p.rightItemId))
                {
                    error = "Each correct pair needs leftItemId and rightItemId.";
                    return false;
                }

                var li = p.leftItemId.Trim();
                var ri = p.rightItemId.Trim();
                if (!leftIds.Contains(li))
                {
                    error = $"Unknown leftItemId in correctPairs: {li}";
                    return false;
                }

                if (!rightIds.Contains(ri))
                {
                    error = $"Unknown rightItemId in correctPairs: {ri}";
                    return false;
                }
            }

            foreach (var lid in leftIds)
            {
                var count = 0;
                foreach (var p in dto.correctPairs)
                {
                    if (p != null && string.Equals(p.leftItemId?.Trim(), lid, StringComparison.Ordinal))
                        count++;
                }

                if (count != 1)
                {
                    error = "Each left item must appear exactly once in correctPairs.";
                    return false;
                }
            }

            var usedRight = new HashSet<string>(StringComparer.Ordinal);
            foreach (var p in dto.correctPairs)
            {
                if (p == null)
                    continue;
                var ri = p.rightItemId.Trim();
                if (!usedRight.Add(ri))
                {
                    error = "Each right item may only be used once in correctPairs.";
                    return false;
                }
            }

            return true;
        }

        [Serializable]
        private sealed class MatchingContentDto
        {
            public string prompt;
            public string subtitle;
            public MatchingItemDto[] leftItems;
            public MatchingItemDto[] rightItems;
            public MatchingPairDto[] correctPairs;
            public MatchingPresentationDto presentation;
        }

        [Serializable]
        private sealed class MatchingItemDto
        {
            public string id;
            public string label;
            public string imageUrl;
        }

        [Serializable]
        private sealed class MatchingPairDto
        {
            public string leftItemId;
            public string rightItemId;
        }

        [Serializable]
        private sealed class MatchingPresentationDto
        {
            public string leftLabel;
            public string rightLabel;
            public bool shuffleRightOrder;
        }

        /// <summary>Draws committed segments plus optional rubber-band line during drag.</summary>
        private sealed class MatchingLineLayer : VisualElement
        {
            private readonly List<(Vector2 a, Vector2 b)> _segments = new();
            private Vector2? _rubberA;
            private Vector2? _rubberB;

            public MatchingLineLayer()
            {
                generateVisualContent += OnGenerateVisualContent;
            }

            public void ClearSegments()
            {
                _segments.Clear();
                MarkDirtyRepaint();
            }

            public void AddSegment(Vector2 a, Vector2 b)
            {
                _segments.Add((a, b));
            }

            public void SetRubberBand(Vector2? a, Vector2? b)
            {
                _rubberA = a;
                _rubberB = b;
                MarkDirtyRepaint();
            }

            private void OnGenerateVisualContent(MeshGenerationContext ctx)
            {
                var painter = ctx.painter2D;
                var stroke = new Color(0.28f, 0.42f, 0.92f, 0.9f);
                painter.strokeColor = stroke;
                painter.lineWidth = 3f;
                DrawSegments(painter, _segments);
                if (_rubberA.HasValue && _rubberB.HasValue)
                {
                    painter.BeginPath();
                    painter.MoveTo(_rubberA.Value);
                    painter.LineTo(_rubberB.Value);
                    painter.Stroke();
                }
            }

            private static void DrawSegments(Painter2D painter, List<(Vector2 a, Vector2 b)> segments)
            {
                foreach (var s in segments)
                {
                    painter.BeginPath();
                    painter.MoveTo(s.a);
                    painter.LineTo(s.b);
                    painter.Stroke();
                }
            }
        }
    }
}

