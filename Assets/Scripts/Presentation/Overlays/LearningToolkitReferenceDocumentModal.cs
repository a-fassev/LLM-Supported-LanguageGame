using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Scrollable in-quest reference document (e.g. brochure).</summary>
    public sealed class LearningToolkitReferenceDocumentModal
    {
        private const string Owner = nameof(LearningToolkitReferenceDocumentModal);

        private VisualElement _scrim;
        private Label _title;
        private Label _body;
        private Button _closeButton;
        private EventCallback<ClickEvent> _closeClick;

        public void Attach(VisualElement overlayPlane)
        {
            if (ToolkitOverlayUx.IsAttached(_scrim))
                return;

            ToolkitOverlayUx.TryAttachAndWire(
                overlayPlane,
                ToolkitOverlayTemplatePaths.ReferenceDocumentModal,
                "reference-doc-modal-scrim",
                Owner,
                Wire,
                out _scrim);
        }

        public void Show(string title, string bodyText)
        {
            if (!ToolkitOverlayUx.IsAttached(_scrim))
            {
                ToolkitOverlayUx.WarnNotAttached(Owner);
                return;
            }

            if (_title != null)
            {
                _title.text = string.IsNullOrWhiteSpace(title)
                    ? LearningToolkitChromeUx.ReferenceDocumentTitleFallback
                    : title.Trim();
            }

            if (_body != null)
                _body.text = bodyText ?? string.Empty;

            _scrim.style.display = DisplayStyle.Flex;
            _scrim.BringToFront();
        }

        public void Hide()
        {
            if (_scrim != null)
                _scrim.style.display = DisplayStyle.None;
        }

        public void Destroy()
        {
            if (_closeButton != null && _closeClick != null)
                _closeButton.UnregisterCallback(_closeClick);

            ToolkitOverlayUx.DetachAndClear(ref _scrim);
            _title = null;
            _body = null;
            _closeButton = null;
            _closeClick = null;
        }

        private bool Wire(VisualElement scrim)
        {
            _title = ToolkitOverlayUx.QueryRequired<Label>(scrim, "reference-title", Owner);
            _body = ToolkitOverlayUx.QueryRequired<Label>(scrim, "reference-body", Owner);
            _closeButton = ToolkitOverlayUx.QueryRequired<Button>(scrim, "reference-close", Owner);
            if (!ToolkitOverlayUx.AllFound(_title, _body, _closeButton))
                return false;

            _closeClick = _ => Hide();
            _closeButton.RegisterCallback(_closeClick);
            return true;
        }
    }
}
