using UnityEngine.Events;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Two-action confirmation modal (e.g. leave quest).</summary>
    public sealed class LearningToolkitConfirmModal
    {
        private const string Owner = nameof(LearningToolkitConfirmModal);

        private VisualElement _scrim;
        private VisualElement _card;
        private Label _title;
        private Label _message;
        private Button _secondary;
        private Button _primary;
        private UnityAction _onSecondary;
        private UnityAction _onPrimary;
        private EventCallback<ClickEvent> _secondaryClick;
        private EventCallback<ClickEvent> _primaryClick;
        private ToolkitOverlayScrimRegistration _scrimRegistration;

        public void Attach(VisualElement overlayPlane)
        {
            if (ToolkitOverlayUx.IsAttached(_scrim))
                return;

            ToolkitOverlayUx.TryAttachAndWire(
                overlayPlane,
                ToolkitOverlayTemplatePaths.ConfirmModal,
                "confirm-modal-scrim",
                Owner,
                Wire,
                out _scrim);
        }

        public void Show(string title, string message, string secondaryLabel, string primaryLabel,
            UnityAction onSecondary, UnityAction onPrimary)
        {
            if (!ToolkitOverlayUx.IsAttached(_scrim))
            {
                ToolkitOverlayUx.WarnNotAttached(Owner);
                return;
            }

            if (_title != null)
                _title.text = title ?? string.Empty;
            if (_message != null)
                _message.text = message ?? string.Empty;
            if (_secondary != null)
            {
                _secondary.text = string.IsNullOrEmpty(secondaryLabel)
                    ? LearningToolkitChromeUx.ConfirmSecondaryFallbackLabel
                    : secondaryLabel;
            }

            if (_primary != null)
            {
                _primary.text = string.IsNullOrEmpty(primaryLabel)
                    ? LearningToolkitChromeUx.ConfirmPrimaryFallbackLabel
                    : primaryLabel;
            }

            _onSecondary = onSecondary;
            _onPrimary = onPrimary;

            _scrim.style.display = DisplayStyle.Flex;
            _scrim.BringToFront();
        }

        public void Hide()
        {
            if (_scrim == null)
                return;
            _scrim.style.display = DisplayStyle.None;
            _onSecondary = null;
            _onPrimary = null;
        }

        public void Destroy()
        {
            UnregisterHandlers();
            ToolkitOverlayUx.DetachAndClear(ref _scrim);
            _card = null;
            _title = null;
            _message = null;
            _secondary = null;
            _primary = null;
        }

        private bool Wire(VisualElement scrim)
        {
            _card = ToolkitOverlayUx.QueryRequired<VisualElement>(scrim, "confirm-modal-card", Owner);
            _title = ToolkitOverlayUx.QueryRequired<Label>(scrim, "confirm-title", Owner);
            _message = ToolkitOverlayUx.QueryRequired<Label>(scrim, "confirm-message", Owner);
            _secondary = ToolkitOverlayUx.QueryRequired<Button>(scrim, "confirm-secondary", Owner);
            _primary = ToolkitOverlayUx.QueryRequired<Button>(scrim, "confirm-primary", Owner);
            if (!ToolkitOverlayUx.AllFound(_card, _title, _message, _secondary, _primary))
                return false;

            _secondaryClick = _ =>
            {
                var secondary = _onSecondary;
                Hide();
                secondary?.Invoke();
            };

            _primaryClick = _ =>
            {
                var primary = _onPrimary;
                Hide();
                primary?.Invoke();
            };

            _secondary.RegisterCallback(_secondaryClick);
            _primary.RegisterCallback(_primaryClick);

            _scrimRegistration = ToolkitOverlayModalUx.RegisterScrimDismiss(scrim, _card, () =>
            {
                var secondary = _onSecondary;
                Hide();
                secondary?.Invoke();
            });

            return true;
        }

        private void UnregisterHandlers()
        {
            _scrimRegistration.Unregister();
            _scrimRegistration = default;

            if (_secondary != null && _secondaryClick != null)
                _secondary.UnregisterCallback(_secondaryClick);
            if (_primary != null && _primaryClick != null)
                _primary.UnregisterCallback(_primaryClick);

            _secondaryClick = null;
            _primaryClick = null;
        }
    }
}
