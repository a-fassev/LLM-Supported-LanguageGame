using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    public sealed class LearningToolkitLoadingOverlay
    {
        private const string Owner = nameof(LearningToolkitLoadingOverlay);

        private VisualElement _root;
        private Label _message;

        public bool IsAttached => ToolkitOverlayUx.IsAttached(_root);

        public void Attach(VisualElement overlayPlane)
        {
            if (ToolkitOverlayUx.IsAttached(_root))
                return;

            ToolkitOverlayUx.TryAttachAndWire(
                overlayPlane,
                ToolkitOverlayTemplatePaths.LoadingOverlay,
                "loading-overlay-root",
                Owner,
                Wire,
                out _root);
        }

        public void Show(string message)
        {
            if (!ToolkitOverlayUx.IsAttached(_root))
            {
                ToolkitOverlayUx.WarnNotAttached(Owner);
                return;
            }

            if (_message != null)
            {
                _message.text = string.IsNullOrEmpty(message)
                    ? LearningToolkitChromeUx.LoadingFallbackMessage
                    : message;
            }

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
            _message = ToolkitOverlayUx.QueryRequired<Label>(root, "loading-message", Owner);
            return _message != null;
        }
    }
}
