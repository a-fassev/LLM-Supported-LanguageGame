using UnityEngine.Events;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Quest pause menu overlay.</summary>
    public sealed class LearningToolkitPauseMenuModal
    {
        private const string Owner = nameof(LearningToolkitPauseMenuModal);

        private VisualElement _scrim;
        private Button _resumeButton;
        private Button _leaveButton;
        private UnityAction _onResume;
        private UnityAction _onLeave;
        private EventCallback<ClickEvent> _resumeClick;
        private EventCallback<ClickEvent> _leaveClick;

        public void Attach(VisualElement overlayPlane)
        {
            if (ToolkitOverlayUx.IsAttached(_scrim))
                return;

            ToolkitOverlayUx.TryAttachAndWire(
                overlayPlane,
                ToolkitOverlayTemplatePaths.PauseMenuModal,
                "pause-menu-modal-scrim",
                Owner,
                Wire,
                out _scrim);
        }

        public void Show(UnityAction onResume, UnityAction onLeave, bool leaveEnabled, string leaveButtonLabel)
        {
            if (!ToolkitOverlayUx.IsAttached(_scrim))
            {
                ToolkitOverlayUx.WarnNotAttached(Owner);
                return;
            }

            _onResume = onResume;
            _onLeave = onLeave;
            if (_leaveButton != null)
            {
                _leaveButton.text = string.IsNullOrWhiteSpace(leaveButtonLabel)
                    ? LearningToolkitChromeUx.LeaveToChapterOverviewLabel
                    : leaveButtonLabel.Trim();
                _leaveButton.SetEnabled(leaveEnabled);
                _leaveButton.style.display = leaveEnabled ? DisplayStyle.Flex : DisplayStyle.None;
            }

            _scrim.style.display = DisplayStyle.Flex;
            _scrim.BringToFront();
        }

        public void Hide()
        {
            if (_scrim != null)
                _scrim.style.display = DisplayStyle.None;
            _onResume = null;
            _onLeave = null;
        }

        public void Destroy()
        {
            UnregisterHandlers();
            ToolkitOverlayUx.DetachAndClear(ref _scrim);
            _resumeButton = null;
            _leaveButton = null;
        }

        private bool Wire(VisualElement scrim)
        {
            var title = ToolkitOverlayUx.QueryRequired<Label>(scrim, "pause-title", Owner);
            _resumeButton = ToolkitOverlayUx.QueryRequired<Button>(scrim, "pause-resume", Owner);
            _leaveButton = ToolkitOverlayUx.QueryRequired<Button>(scrim, "pause-leave", Owner);
            if (!ToolkitOverlayUx.AllFound(title, _resumeButton, _leaveButton))
                return false;

            title.text = LearningToolkitChromeUx.PauseMenuTitle;
            _resumeButton.text = LearningToolkitChromeUx.PauseResumeLabel;

            _resumeClick = _ =>
            {
                var resume = _onResume;
                Hide();
                resume?.Invoke();
            };

            _leaveClick = _ =>
            {
                var leave = _onLeave;
                Hide();
                leave?.Invoke();
            };

            _resumeButton.RegisterCallback(_resumeClick);
            _leaveButton.RegisterCallback(_leaveClick);
            return true;
        }

        private void UnregisterHandlers()
        {
            if (_resumeButton != null && _resumeClick != null)
                _resumeButton.UnregisterCallback(_resumeClick);
            if (_leaveButton != null && _leaveClick != null)
                _leaveButton.UnregisterCallback(_leaveClick);

            _resumeClick = null;
            _leaveClick = null;
        }
    }
}
