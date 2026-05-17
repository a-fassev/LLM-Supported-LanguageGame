using System;
using LanguageGame.Presentation;
using UnityEngine;
using UnityEngine.Serialization;
using UnityEngine.UI;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Root-level <see cref="IStepView"/> that delegates lifecycle to another component implementing
    /// <see cref="IStepView"/>. Use layered Catalog prefabs: story/decoration hierarchy plus a nested
    /// mechanic (<see cref="TaskStepBase"/>) or <see cref="CutsceneStepBase"/> prefab assigned in the Inspector.
    /// </summary>
    [RequireComponent(typeof(RectTransform))]
    public sealed class ComposableStepRootView : MonoBehaviour, IStepView
    {
        [SerializeField]
        [Tooltip(
            "The concrete MonoBehaviour that implements IStepView (e.g. on a nested prefab root). Cannot reference this component.")]
        private MonoBehaviour _innerStepView;

        [SerializeField]
        [Tooltip(
            "Shown when Inner Step View is missing or invalid. Keep this subtree under active parents—inactive ancestors hide it even after SetActive(true). Leave empty to use runtime fallback when enabled.")]
        private GameObject _misconfigurationBanner;

        [FormerlySerializedAs("createRuntimeMisconfigurationFallback")]
        [SerializeField]
        [Tooltip(
            "When Inner is invalid and no banner is assigned, creates an on-screen fallback so misconfiguration is visible in Play Mode.")]
        private bool _createRuntimeMisconfigurationFallback = true;

        private IStepView _resolvedInner;
        private GameObject _runtimeMisconfigurationBanner;

        private void OnValidate()
        {
            if (_innerStepView == null)
                return;

            if (ReferenceEquals(_innerStepView, this))
            {
                Debug.LogWarning(
                    $"[ComposableStepRootView] '{name}': Inner step view cannot reference this component.",
                    this);
                return;
            }

            if (_innerStepView is not IStepView)
            {
                Debug.LogWarning(
                    $"[ComposableStepRootView] '{name}': '{_innerStepView.GetType().Name}' does not implement IStepView.",
                    this);
            }
        }

        private IStepView ResolveInner(bool warnMissing)
        {
            if (_innerStepView == null)
            {
                if (warnMissing)
                    Debug.LogError($"[ComposableStepRootView] '{name}': Assign _innerStepView (implements IStepView).", this);
                return null;
            }

            if (ReferenceEquals(_innerStepView, this))
            {
                if (warnMissing)
                    Debug.LogError($"[ComposableStepRootView] '{name}': Inner cannot be this component.", this);
                return null;
            }

            if (_innerStepView is IStepView inner)
                return inner;

            if (warnMissing)
                Debug.LogError($"[ComposableStepRootView] '{name}': Inner is not an IStepView.", this);
            return null;
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            HideMisconfigurationState();

            _resolvedInner = ResolveInner(true);
            if (_resolvedInner == null)
            {
                ShowMisconfigurationState();
                return;
            }

            _resolvedInner.Bind(context, onRequest);
        }

        public void SetInteractable(bool interactable)
        {
            _resolvedInner ??= ResolveInner(false);
            _resolvedInner?.SetInteractable(interactable);
        }

        public void Teardown()
        {
            HideMisconfigurationState();
            _resolvedInner?.Teardown();
            _resolvedInner = null;
        }

        private void HideMisconfigurationState()
        {
            if (_misconfigurationBanner != null)
                _misconfigurationBanner.SetActive(false);
            DestroyRuntimeMisconfigurationBanner();
        }

        private void ShowMisconfigurationState()
        {
            if (_misconfigurationBanner != null)
            {
                _misconfigurationBanner.SetActive(true);
                return;
            }

            if (!_createRuntimeMisconfigurationFallback || !UnityEngine.Application.isPlaying)
                return;

            DestroyRuntimeMisconfigurationBanner();
            _runtimeMisconfigurationBanner = BuildRuntimeMisconfigurationBanner();
            if (_runtimeMisconfigurationBanner != null)
                _runtimeMisconfigurationBanner.SetActive(true);
        }

        private void DestroyRuntimeMisconfigurationBanner()
        {
            if (_runtimeMisconfigurationBanner == null)
                return;
            Destroy(_runtimeMisconfigurationBanner);
            _runtimeMisconfigurationBanner = null;
        }

        private GameObject BuildRuntimeMisconfigurationBanner()
        {
            var host = GetComponent<RectTransform>();
            if (host == null)
                return null;

            UiThemeProvider.TryGet(out var tokens);

            var root = new GameObject("MisconfiguredStepNotice", typeof(RectTransform));
            root.transform.SetParent(host, false);
            UiTokenApplier.StretchFull(root.GetComponent<RectTransform>());

            var bgGo = new GameObject("Backdrop", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
            bgGo.transform.SetParent(root.transform, false);
            UiTokenApplier.StretchFull(bgGo.GetComponent<RectTransform>());
            var panel = bgGo.GetComponent<Image>();
            panel.color = tokens != null
                ? tokens.palette.errorBackground
                : new Color(0.12f, 0.02f, 0.02f, 0.94f);
            panel.raycastTarget = false;

            var textGo = new GameObject("Message", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            textGo.transform.SetParent(root.transform, false);
            UiTokenApplier.StretchFull(textGo.GetComponent<RectTransform>());

            var text = textGo.GetComponent<Text>();
            text.alignment = TextAnchor.MiddleCenter;
            text.text =
                $"{nameof(ComposableStepRootView)}: assign Inner Step View to a mechanic implementing IStepView.";
            text.raycastTarget = false;

            if (tokens != null)
                UiTokenApplier.ApplyText(text, tokens.typography.caption, tokens.palette.errorText);
            else
            {
                text.font = UiTokenApplier.ResolveFallbackFont();
                text.fontSize = 28;
                text.color = new Color(1f, 0.85f, 0.85f, 1f);
            }

            text.fontStyle = FontStyle.Bold;

            return root;
        }
    }
}
