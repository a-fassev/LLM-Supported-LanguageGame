using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Brief success / info strip (non-blocking micro-feedback).</summary>
    public sealed class LearningToolkitInfoBanner
    {
        private const string Owner = nameof(LearningToolkitInfoBanner);

        private VisualElement _root;
        private Label _message;

        public void Attach(VisualElement overlayPlane)
        {
            if (ToolkitOverlayUx.IsAttached(_root))
                return;

            ToolkitOverlayUx.TryAttachAndWire(
                overlayPlane,
                ToolkitOverlayTemplatePaths.InfoBanner,
                "info-banner-root",
                Owner,
                Wire,
                out _root,
                insertAtFront: true);
        }

        public void ShowInfo(string message)
        {
            if (!ToolkitOverlayUx.IsAttached(_root))
            {
                ToolkitOverlayUx.WarnNotAttached(Owner);
                return;
            }

            if (_message != null)
                _message.text = message ?? string.Empty;
            _root.style.display = DisplayStyle.Flex;
            _root.BringToFront();
        }

        public void Hide()
        {
            if (_root == null)
                return;
            _root.style.display = DisplayStyle.None;
        }

        public void Destroy()
        {
            ToolkitOverlayUx.DetachAndClear(ref _root);
            _message = null;
        }

        private bool Wire(VisualElement root)
        {
            _message = ToolkitOverlayUx.QueryRequired<Label>(root, "info-message", Owner);
            return _message != null;
        }
    }
}
