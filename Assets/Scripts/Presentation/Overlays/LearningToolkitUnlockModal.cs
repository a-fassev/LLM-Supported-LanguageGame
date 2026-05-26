using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    public sealed class LearningToolkitUnlockModal
    {
        private const string Owner = nameof(LearningToolkitUnlockModal);

        private VisualElement _scrim;
        private VisualElement _card;
        private Label _title;
        private Label _message;
        private Button _confirm;
        private EventCallback<ClickEvent> _confirmClick;
        private ToolkitOverlayScrimRegistration _scrimRegistration;

        public void Attach(VisualElement overlayPlane)
        {
            if (ToolkitOverlayUx.IsAttached(_scrim))
                return;

            ToolkitOverlayUx.TryAttachAndWire(
                overlayPlane,
                ToolkitOverlayTemplatePaths.UnlockModal,
                "unlock-modal-scrim",
                Owner,
                Wire,
                out _scrim);
        }

        public void Show(string title, string message)
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

            _scrim.style.display = DisplayStyle.Flex;
            _scrim.BringToFront();
        }

        public void Hide()
        {
            if (_scrim == null)
                return;
            _scrim.style.display = DisplayStyle.None;
        }

        public void Destroy()
        {
            UnregisterHandlers();
            ToolkitOverlayUx.DetachAndClear(ref _scrim);
            _card = null;
            _title = null;
            _message = null;
            _confirm = null;
        }

        private bool Wire(VisualElement scrim)
        {
            _card = ToolkitOverlayUx.QueryRequired<VisualElement>(scrim, "unlock-modal-card", Owner);
            _title = ToolkitOverlayUx.QueryRequired<Label>(scrim, "unlock-title", Owner);
            _message = ToolkitOverlayUx.QueryRequired<Label>(scrim, "unlock-message", Owner);
            _confirm = ToolkitOverlayUx.QueryRequired<Button>(scrim, "unlock-confirm", Owner);
            if (!ToolkitOverlayUx.AllFound(_card, _title, _message, _confirm))
                return false;

            _confirm.text = LearningToolkitChromeUx.UnlockConfirmLabel;
            _confirmClick = _ => Hide();
            _confirm.RegisterCallback(_confirmClick);
            _scrimRegistration = ToolkitOverlayModalUx.RegisterScrimDismiss(scrim, _card, Hide);
            return true;
        }

        private void UnregisterHandlers()
        {
            _scrimRegistration.Unregister();
            _scrimRegistration = default;

            if (_confirm != null && _confirmClick != null)
                _confirm.UnregisterCallback(_confirmClick);
            _confirmClick = null;
        }
    }
}
