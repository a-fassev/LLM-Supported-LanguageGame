using System;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    internal readonly struct ToolkitOverlayScrimRegistration
    {
        private readonly VisualElement _scrim;
        private readonly VisualElement _card;
        private readonly EventCallback<ClickEvent> _scrimHandler;
        private readonly EventCallback<ClickEvent> _cardHandler;

        public ToolkitOverlayScrimRegistration(
            VisualElement scrim,
            VisualElement card,
            EventCallback<ClickEvent> scrimHandler,
            EventCallback<ClickEvent> cardHandler)
        {
            _scrim = scrim;
            _card = card;
            _scrimHandler = scrimHandler;
            _cardHandler = cardHandler;
        }

        public void Unregister()
        {
            if (_scrim != null && _scrimHandler != null)
                _scrim.UnregisterCallback(_scrimHandler);

            if (_card != null && _cardHandler != null)
                _card.UnregisterCallback(_cardHandler);
        }
    }

    internal static class ToolkitOverlayModalUx
    {
        public static ToolkitOverlayScrimRegistration RegisterScrimDismiss(
            VisualElement scrim,
            VisualElement card,
            Action onBackdrop)
        {
            if (scrim == null)
                return default;

            EventCallback<ClickEvent> scrimHandler = evt =>
            {
                if (card == null)
                {
                    onBackdrop?.Invoke();
                    return;
                }

                if (!IsDescendantOf(evt.target as VisualElement, card))
                    onBackdrop?.Invoke();
            };

            EventCallback<ClickEvent> cardHandler = evt => evt.StopImmediatePropagation();

            scrim.RegisterCallback(scrimHandler);
            card?.RegisterCallback(cardHandler);

            return new ToolkitOverlayScrimRegistration(scrim, card, scrimHandler, cardHandler);
        }

        private static bool IsDescendantOf(VisualElement target, VisualElement ancestor)
        {
            if (ancestor == null)
                return false;

            for (var p = target; p != null; p = p.parent)
            {
                if (p == ancestor)
                    return true;
            }

            return false;
        }
    }
}
