using UnityEngine.Events;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    public sealed class LearningToolkitLoadErrorBanner
    {
        private const string Owner = nameof(LearningToolkitLoadErrorBanner);

        private VisualElement _root;
        private Label _messageText;
        private Button _retryButton;
        private UnityAction _pendingRetry;
        private EventCallback<ClickEvent> _retryClick;

        public void Attach(VisualElement overlayPlane)
        {
            if (ToolkitOverlayUx.IsAttached(_root))
                return;

            ToolkitOverlayUx.TryAttachAndWire(
                overlayPlane,
                ToolkitOverlayTemplatePaths.LoadErrorBanner,
                "load-error-banner-root",
                Owner,
                Wire,
                out _root,
                insertAtFront: true);
        }

        public void Show(string message, UnityAction onRetry, string actionButtonLabel = null)
        {
            if (!ToolkitOverlayUx.IsAttached(_root))
            {
                ToolkitOverlayUx.WarnNotAttached(Owner);
                return;
            }

            _pendingRetry = onRetry;

            if (_messageText != null)
                _messageText.text = message;

            if (_retryButton != null)
            {
                _retryButton.text = string.IsNullOrWhiteSpace(actionButtonLabel)
                    ? LearningToolkitChromeUx.ErrorBannerRetryLabel
                    : actionButtonLabel.Trim();
            }

            _root.style.display = DisplayStyle.Flex;
        }

        public void Hide()
        {
            if (_root == null)
                return;
            _root.style.display = DisplayStyle.None;
        }

        public void SetRetryInteractable(bool interactable)
        {
            if (_retryButton != null)
                _retryButton.SetEnabled(interactable);
        }

        public void Destroy()
        {
            if (_retryButton != null && _retryClick != null)
                _retryButton.UnregisterCallback(_retryClick);

            ToolkitOverlayUx.DetachAndClear(ref _root);
            _messageText = null;
            _retryButton = null;
            _pendingRetry = null;
            _retryClick = null;
        }

        private bool Wire(VisualElement root)
        {
            _messageText = ToolkitOverlayUx.QueryRequired<Label>(root, "error-message", Owner);
            _retryButton = ToolkitOverlayUx.QueryRequired<Button>(root, "error-retry-button", Owner);
            if (!ToolkitOverlayUx.AllFound(_messageText, _retryButton))
                return false;

            _retryClick = _ => _pendingRetry?.Invoke();
            _retryButton.RegisterCallback(_retryClick);
            return true;
        }
    }
}
