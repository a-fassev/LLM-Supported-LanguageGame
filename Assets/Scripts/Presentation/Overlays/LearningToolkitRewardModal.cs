using UnityEngine.Events;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Task reward / validation overlay (success mode vs single-message validation mode).</summary>
    public sealed class LearningToolkitRewardModal
    {
        private const string Owner = nameof(LearningToolkitRewardModal);

        private VisualElement _scrim;
        private VisualElement _card;
        private Label _message;
        private Label _pizza;
        private Label _backpack;
        private VisualElement _detailRows;
        private Button _backButton;
        private Button _nextButton;
        private UnityAction _onBack;
        private UnityAction _onNext;
        private bool _validationMode;
        private EventCallback<ClickEvent> _backClick;
        private EventCallback<ClickEvent> _nextClick;
        private ToolkitOverlayScrimRegistration _scrimRegistration;

        public void Attach(VisualElement overlayPlane)
        {
            if (ToolkitOverlayUx.IsAttached(_scrim))
                return;

            ToolkitOverlayUx.TryAttachAndWire(
                overlayPlane,
                ToolkitOverlayTemplatePaths.RewardModal,
                "reward-modal-scrim",
                Owner,
                Wire,
                out _scrim);
        }

        public void ConfigureSuccessChrome()
        {
            _validationMode = false;
            if (_detailRows != null)
                _detailRows.style.display = DisplayStyle.Flex;
            if (_nextButton != null)
                _nextButton.style.display = DisplayStyle.Flex;
            if (_backButton != null)
                _backButton.text = LearningToolkitChromeUx.RewardOverlayBackLabel;
            if (_nextButton != null)
                _nextButton.text = LearningToolkitChromeUx.RewardOverlayNextLabel;
        }

        public void ShowSuccess(string message, string pizzaLine, string backpackLine, UnityAction onBack, UnityAction onNext)
        {
            if (!ToolkitOverlayUx.IsAttached(_scrim))
            {
                ToolkitOverlayUx.WarnNotAttached(Owner);
                return;
            }

            _validationMode = false;
            ConfigureSuccessChrome();
            if (_message != null)
            {
                _message.text = string.IsNullOrEmpty(message)
                    ? LearningToolkitChromeUx.RewardSuccessFallbackMessage
                    : message;
            }

            if (_pizza != null)
                _pizza.text = pizzaLine ?? string.Empty;
            if (_backpack != null)
                _backpack.text = backpackLine ?? string.Empty;

            _onBack = onBack;
            _onNext = onNext;

            _scrim.style.display = DisplayStyle.Flex;
            _scrim.BringToFront();
        }

        public void ShowValidation(string message, string dismissLabel, UnityAction onDismiss)
        {
            if (!ToolkitOverlayUx.IsAttached(_scrim))
            {
                ToolkitOverlayUx.WarnNotAttached(Owner);
                return;
            }

            _validationMode = true;
            if (_message != null)
                _message.text = message ?? string.Empty;
            if (_detailRows != null)
                _detailRows.style.display = DisplayStyle.None;
            if (_nextButton != null)
                _nextButton.style.display = DisplayStyle.None;
            if (_backButton != null)
            {
                _backButton.text = string.IsNullOrEmpty(dismissLabel)
                    ? LearningToolkitChromeUx.ValidationDismissLabel
                    : dismissLabel;
            }

            _onBack = onDismiss;
            _onNext = null;

            _scrim.style.display = DisplayStyle.Flex;
            _scrim.BringToFront();
        }

        public void Hide()
        {
            if (_scrim == null)
                return;
            _scrim.style.display = DisplayStyle.None;
            _validationMode = false;
            _onBack = null;
            _onNext = null;
        }

        public void Destroy()
        {
            UnregisterHandlers();
            ToolkitOverlayUx.DetachAndClear(ref _scrim);
            _card = null;
            _message = null;
            _pizza = null;
            _backpack = null;
            _detailRows = null;
            _backButton = null;
            _nextButton = null;
        }

        private bool Wire(VisualElement scrim)
        {
            _card = ToolkitOverlayUx.QueryRequired<VisualElement>(scrim, "reward-modal-card", Owner);
            _message = ToolkitOverlayUx.QueryRequired<Label>(scrim, "reward-message", Owner);
            _detailRows = ToolkitOverlayUx.QueryRequired<VisualElement>(scrim, "reward-detail-rows", Owner);
            _pizza = ToolkitOverlayUx.QueryRequired<Label>(scrim, "reward-pizza-line", Owner);
            _backpack = ToolkitOverlayUx.QueryRequired<Label>(scrim, "reward-backpack-line", Owner);
            _backButton = ToolkitOverlayUx.QueryRequired<Button>(scrim, "reward-back", Owner);
            _nextButton = ToolkitOverlayUx.QueryRequired<Button>(scrim, "reward-next", Owner);
            if (!ToolkitOverlayUx.AllFound(_card, _message, _detailRows, _pizza, _backpack, _backButton, _nextButton))
                return false;

            _backClick = _ => _onBack?.Invoke();
            _nextClick = _ =>
            {
                if (!_validationMode)
                    _onNext?.Invoke();
            };

            _backButton.RegisterCallback(_backClick);
            _nextButton.RegisterCallback(_nextClick);

            _scrimRegistration = ToolkitOverlayModalUx.RegisterScrimDismiss(scrim, _card, () =>
            {
                if (_validationMode)
                {
                    var dismiss = _onBack;
                    Hide();
                    dismiss?.Invoke();
                }
                else
                {
                    var back = _onBack;
                    Hide();
                    back?.Invoke();
                }
            });

            ConfigureSuccessChrome();
            return true;
        }

        private void UnregisterHandlers()
        {
            _scrimRegistration.Unregister();
            _scrimRegistration = default;

            if (_backButton != null && _backClick != null)
                _backButton.UnregisterCallback(_backClick);
            if (_nextButton != null && _nextClick != null)
                _nextButton.UnregisterCallback(_nextClick);

            _backClick = null;
            _nextClick = null;
        }
    }
}
