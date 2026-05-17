using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Short “please wait” feedback when a scene load is requested while another is already in progress.
    /// </summary>
    internal static class LearningToolkitNavigationFeedback
    {
        private const string DefaultMessage = "Please wait…";
        private static readonly LearningToolkitInfoBanner Banner = new();

        private static VisualElement _attachedOverlay;
        private static IVisualElementScheduledItem _hideSchedule;

        public static void ShowForSuppressedTransition()
        {
            var doc = Object.FindAnyObjectByType<UIDocument>();
            if (doc == null)
                return;

            if (doc.rootVisualElement == null)
                return;

            var overlay = LearningToolkitBootstrap.ResolveOverlayPlane(doc);
            if (overlay == null)
                return;

            if (_attachedOverlay != overlay)
            {
                Banner.Destroy();
                _attachedOverlay = overlay;
                Banner.Attach(overlay);
            }

            Banner.ShowInfo(DefaultMessage);
            _hideSchedule?.Pause();
            _hideSchedule = doc.rootVisualElement.schedule
                .Execute(() => Banner.Hide())
                .StartingIn(1600);
        }
    }

    /// <summary>Routes <see cref="GameFlowController.SceneTransitionSuppressed"/> to UITK without coupling Application code to overlays.</summary>
    internal static class GameFlowNavigationSuppressedListener
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void Register()
        {
            GameFlowController.SceneTransitionSuppressed -= OnSuppressed;
            GameFlowController.SceneTransitionSuppressed += OnSuppressed;
        }

        private static void OnSuppressed()
        {
            LearningToolkitNavigationFeedback.ShowForSuppressedTransition();
        }
    }
}
