using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    public sealed class LearningToolkitLoadingOverlay
    {
        private VisualElement _root;

        private Label _message;

        public bool IsAttached => _root != null && _root.parent != null;

        public void Attach(VisualElement overlayPlane)
        {
            if (overlayPlane == null || IsAttached)
                return;

            _root = new VisualElement();
            _root.AddToClassList("lg-loading-overlay");

            var card = new VisualElement();
            card.AddToClassList("lg-loading-card");

            _message = new Label("Loading…");
            _message.AddToClassList("lg-heading-screen");
            _message.style.unityTextAlign = TextAnchor.MiddleCenter;
            _message.style.whiteSpace = WhiteSpace.Normal;

            card.Add(_message);
            _root.Add(card);
            overlayPlane.Add(_root);
            Hide();
        }

        public void Show(string message)
        {
            if (_root == null)
                return;

            if (_message != null)
                _message.text = string.IsNullOrEmpty(message) ? "Loading…" : message;

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
            if (_root == null)
                return;
            _root.RemoveFromHierarchy();
            _root = null;
            _message = null;
        }
    }

    public sealed class LearningToolkitLoadErrorBanner
    {
        private VisualElement _root;

        private Label _messageText;

        private Button _retryButton;

        private UnityAction _pendingRetry;

        public void Attach(VisualElement overlayPlane)
        {
            if (overlayPlane == null || _root != null)
                return;

            _root = new VisualElement();
            _root.AddToClassList("lg-error-banner");

            _messageText = new Label();
            _messageText.AddToClassList("lg-banner-message");
            _messageText.AddToClassList("lg-text-muted");
            _messageText.style.whiteSpace = WhiteSpace.Normal;

            _retryButton = new Button { text = "Retry" };
            _retryButton.AddToClassList("lg-btn");
            _retryButton.AddToClassList("lg-btn--primary");
            _retryButton.RegisterCallback<ClickEvent>(_ => _pendingRetry?.Invoke());

            _root.Add(_messageText);
            _root.Add(_retryButton);

            overlayPlane.Insert(0, _root);
            Hide();
        }

        public void Show(string message, UnityAction onRetry)
        {
            if (_root == null)
                return;

            _pendingRetry = onRetry;

            if (_messageText != null)
                _messageText.text = message;

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
            if (_root == null)
                return;
            _root.RemoveFromHierarchy();
            _root = null;
            _messageText = null;
            _retryButton = null;
            _pendingRetry = null;
        }
    }

    public sealed class LearningToolkitUnlockModal
    {
        private VisualElement _scrim;

        private VisualElement _card;

        private Label _title;

        private Label _message;

        private Button _confirm;

        private bool Attached => _scrim != null && _scrim.parent != null;

        public void Attach(VisualElement overlayPlane)
        {
            if (overlayPlane == null || Attached)
                return;

            _scrim = new VisualElement();
            _scrim.AddToClassList("lg-modal-scrim");

            _card = new VisualElement();
            _card.AddToClassList("lg-modal-card");

            _title = new Label();
            _title.AddToClassList("lg-heading-screen");
            _title.style.marginBottom = 12;

            _message = new Label();
            _message.AddToClassList("lg-text-body");
            _message.style.whiteSpace = WhiteSpace.Normal;
            _message.style.marginBottom = 16;

            _confirm = new Button { text = "OK" };
            _confirm.AddToClassList("lg-btn");
            _confirm.AddToClassList("lg-btn--primary");
            _confirm.style.alignSelf = Align.Stretch;

            _card.Add(_title);
            _card.Add(_message);
            _card.Add(_confirm);
            _scrim.Add(_card);
            overlayPlane.Add(_scrim);

            Hide();

            _confirm.RegisterCallback<ClickEvent>(_ => Hide());

            _scrim.RegisterCallback<ClickEvent>(evt =>
            {
                if (_card == null)
                {
                    Hide();
                    return;
                }

                var target = evt.target as VisualElement;
                if (target == null)
                    return;

                var insideCard = false;
                for (var p = target; p != null; p = p.parent)
                {
                    if (p == _card)
                    {
                        insideCard = true;
                        break;
                    }
                }

                if (!insideCard)
                    Hide();
            });

            _card.RegisterCallback<ClickEvent>(evt => evt.StopImmediatePropagation());
        }

        public void Show(string title, string message)
        {
            if (_title != null)
                _title.text = title ?? string.Empty;
            if (_message != null)
                _message.text = message ?? string.Empty;
            if (_scrim != null)
            {
                _scrim.style.display = DisplayStyle.Flex;
                _scrim.BringToFront();
            }
        }

        public void Hide()
        {
            if (_scrim == null)
                return;
            _scrim.style.display = DisplayStyle.None;
        }

        public void Destroy()
        {
           if (_scrim == null)
                return;
            _scrim.RemoveFromHierarchy();
            _scrim = null;
            _card = null;
            _title = null;
            _message = null;
            _confirm = null;
        }
    }

    /// <summary>Two-action confirmation modal (e.g. leave quest).</summary>
    public sealed class LearningToolkitConfirmModal
    {
        private VisualElement _scrim;

        private VisualElement _card;

        private Label _title;

        private Label _message;

        private Button _secondary;

        private Button _primary;

        private UnityAction _onSecondary;

        private UnityAction _onPrimary;

        private bool Attached => _scrim != null && _scrim.parent != null;

        public void Attach(VisualElement overlayPlane)
        {
            if (overlayPlane == null || Attached)
                return;

            _scrim = new VisualElement();
            _scrim.AddToClassList("lg-modal-scrim");

            _card = new VisualElement();
            _card.AddToClassList("lg-modal-card");

            _title = new Label();
            _title.AddToClassList("lg-heading-screen");
            _title.style.marginBottom = 8;

            _message = new Label();
            _message.AddToClassList("lg-text-body");
            _message.style.whiteSpace = WhiteSpace.Normal;
            _message.style.marginBottom = 16;

            var row = new VisualElement();
            row.style.flexDirection = FlexDirection.Row;
            row.style.justifyContent = Justify.FlexEnd;
            row.style.flexWrap = Wrap.Wrap;

            _secondary = new Button { text = "Cancel" };
            _secondary.AddToClassList("lg-btn");
            _secondary.AddToClassList("lg-btn--ghost");
            _secondary.style.marginRight = 8;

            _primary = new Button { text = "OK" };
            _primary.AddToClassList("lg-btn");
            _primary.AddToClassList("lg-btn--primary");

            _secondary.RegisterCallback<ClickEvent>(_ =>
            {
                var secondary = _onSecondary;
                Hide();
                secondary?.Invoke();
            });

            _primary.RegisterCallback<ClickEvent>(_ =>
            {
                var primary = _onPrimary;
                Hide();
                primary?.Invoke();
            });

            row.Add(_secondary);
            row.Add(_primary);
            _card.Add(_title);
            _card.Add(_message);
            _card.Add(row);
            _scrim.Add(_card);
            overlayPlane.Add(_scrim);

            Hide();

            _scrim.RegisterCallback<ClickEvent>(evt =>
            {
                if (_card == null)
                {
                    Hide();
                    return;
                }

                var target = evt.target as VisualElement;
                if (target != null)
                {
                    for (var p = target; p != null; p = p.parent)
                    {
                        if (p == _card)
                            return;
                    }
                }

                // Backdrop tap matches "cancel / stay" (secondary action).
                var secondary = _onSecondary;
                Hide();
                secondary?.Invoke();
            });

            _card.RegisterCallback<ClickEvent>(evt => evt.StopImmediatePropagation());
        }

        public void Show(string title, string message, string secondaryLabel, string primaryLabel,
            UnityAction onSecondary, UnityAction onPrimary)
        {
            if (_title != null)
                _title.text = title ?? string.Empty;
            if (_message != null)
                _message.text = message ?? string.Empty;
            if (_secondary != null)
                _secondary.text = string.IsNullOrEmpty(secondaryLabel) ? "Cancel" : secondaryLabel;
            if (_primary != null)
                _primary.text = string.IsNullOrEmpty(primaryLabel) ? "OK" : primaryLabel;

            _onSecondary = onSecondary;
            _onPrimary = onPrimary;

            if (_scrim != null)
            {
                _scrim.style.display = DisplayStyle.Flex;
                _scrim.BringToFront();
            }
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
            if (_scrim == null)
                return;
            _scrim.RemoveFromHierarchy();
            _scrim = null;
            _card = null;
            _title = null;
            _message = null;
            _secondary = null;
            _primary = null;
        }
    }

    /// <summary>Task reward / validation overlay (success mode vs single-message validation mode).</summary>
    public sealed class LearningToolkitRewardModal
    {
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

        private bool Attached => _scrim != null && _scrim.parent != null;

        public void Attach(VisualElement overlayPlane)
        {
            if (overlayPlane == null || Attached)
                return;

            _scrim = new VisualElement();
            _scrim.AddToClassList("lg-modal-scrim");

            _card = new VisualElement();
            _card.AddToClassList("lg-modal-card");

            _message = new Label();
            _message.AddToClassList("lg-heading-screen");
            _message.style.marginBottom = 12;
            _message.style.unityTextAlign = TextAnchor.MiddleCenter;
            _message.style.whiteSpace = WhiteSpace.Normal;

            _detailRows = new VisualElement();
            _detailRows.style.marginBottom = 16;

            _pizza = new Label();
            _pizza.AddToClassList("lg-text-body");
            _pizza.style.whiteSpace = WhiteSpace.Normal;

            _backpack = new Label();
            _backpack.AddToClassList("lg-text-body");
            _backpack.style.whiteSpace = WhiteSpace.Normal;

            _detailRows.Add(_pizza);
            _detailRows.Add(_backpack);

            var row = new VisualElement();
            row.style.flexDirection = FlexDirection.Row;
            row.style.justifyContent = Justify.SpaceBetween;
            row.style.flexWrap = Wrap.Wrap;

            _backButton = new Button { text = "Back" };
            _backButton.AddToClassList("lg-btn");
            _backButton.AddToClassList("lg-btn--secondary");

            _nextButton = new Button { text = "Next" };
            _nextButton.AddToClassList("lg-btn");
            _nextButton.AddToClassList("lg-btn--primary");

            _backButton.RegisterCallback<ClickEvent>(_ =>
            {
                _onBack?.Invoke();
            });

            _nextButton.RegisterCallback<ClickEvent>(_ =>
            {
                if (!_validationMode)
                    _onNext?.Invoke();
            });

            row.Add(_backButton);
            row.Add(_nextButton);

            _card.Add(_message);
            _card.Add(_detailRows);
            _card.Add(row);
            _scrim.Add(_card);
            overlayPlane.Add(_scrim);

            Hide();

            _scrim.RegisterCallback<ClickEvent>(evt =>
            {
                if (_card == null)
                    return;

                var target = evt.target as VisualElement;
                if (target != null)
                {
                    for (var p = target; p != null; p = p.parent)
                    {
                        if (p == _card)
                            return;
                    }
                }

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

            _card.RegisterCallback<ClickEvent>(evt => evt.StopImmediatePropagation());
        }

        public void ConfigureSuccessChrome()
        {
            _validationMode = false;
            if (_detailRows != null)
                _detailRows.style.display = DisplayStyle.Flex;
            if (_nextButton != null)
                _nextButton.style.display = DisplayStyle.Flex;
            if (_backButton != null)
                _backButton.text = "Back";
        }

        public void ShowSuccess(string message, string pizzaLine, string backpackLine, UnityAction onBack, UnityAction onNext)
        {
            _validationMode = false;
            ConfigureSuccessChrome();
            if (_message != null)
                _message.text = message ?? "Success!";
            if (_pizza != null)
                _pizza.text = pizzaLine ?? string.Empty;
            if (_backpack != null)
                _backpack.text = backpackLine ?? string.Empty;

            _onBack = onBack;
            _onNext = onNext;

            if (_scrim != null)
            {
                _scrim.style.display = DisplayStyle.Flex;
                _scrim.BringToFront();
            }
        }

        public void ShowValidation(string message, string dismissLabel, UnityAction onDismiss)
        {
            _validationMode = true;
            if (_message != null)
                _message.text = message ?? string.Empty;
            if (_detailRows != null)
                _detailRows.style.display = DisplayStyle.None;
            if (_nextButton != null)
                _nextButton.style.display = DisplayStyle.None;
            if (_backButton != null)
                _backButton.text = string.IsNullOrEmpty(dismissLabel) ? "OK" : dismissLabel;

            _onBack = onDismiss;
            _onNext = null;

            if (_scrim != null)
            {
                _scrim.style.display = DisplayStyle.Flex;
                _scrim.BringToFront();
            }
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
            if (_scrim == null)
                return;
            _scrim.RemoveFromHierarchy();
            _scrim = null;
            _card = null;
            _message = null;
            _pizza = null;
            _backpack = null;
            _detailRows = null;
            _backButton = null;
            _nextButton = null;
        }
    }

    /// <summary>Brief success / info strip (non-blocking micro-feedback).</summary>
    public sealed class LearningToolkitInfoBanner
    {
        private VisualElement _root;

        private Label _message;

        public void Attach(VisualElement overlayPlane)
        {
            if (overlayPlane == null || _root != null)
                return;

            _root = new VisualElement();
            _root.AddToClassList("lg-error-banner");
            _root.style.position = Position.Absolute;
            _root.style.top = 0;
            _root.style.bottom = StyleKeyword.Auto;

            _message = new Label();
            _message.AddToClassList("lg-banner-message");
            _message.AddToClassList("lg-text-body");
            _message.style.whiteSpace = WhiteSpace.Normal;

            _root.Add(_message);
            overlayPlane.Insert(0, _root);
            Hide();
        }

        public void ShowInfo(string message)
        {
            if (_root == null)
                return;
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
            if (_root == null)
                return;
            _root.RemoveFromHierarchy();
            _root = null;
            _message = null;
        }
    }
}
