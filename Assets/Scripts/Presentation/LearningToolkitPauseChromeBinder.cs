using System;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Wires the shared pause button + leave overlay for map / overview screens.</summary>
    public sealed class LearningToolkitPauseChromeBinder
    {
        private readonly LearningToolkitPauseMenuModal _modal = new();

        private Button _pauseButton;
        private string _leaveLabel;
        private Action _onLeave;
        private Func<bool> _canLeave = () => true;

        public bool Bind(UIDocument doc, string leaveButtonLabel, Action onLeave, Func<bool> canLeave = null)
        {
            _leaveLabel = leaveButtonLabel;
            _onLeave = onLeave;
            _canLeave = canLeave ?? (() => true);

            if (doc?.rootVisualElement == null)
                return false;

            _pauseButton = doc.rootVisualElement.Q<Button>(LearningToolkitChromeUx.PauseMenuButtonName);
            if (_pauseButton == null)
            {
                Debug.LogError(
                    $"[LearningToolkitPauseChromeBinder] Missing Button name='{LearningToolkitChromeUx.PauseMenuButtonName}' in screen UXML.");
                return false;
            }

            var overlay = LearningToolkitBootstrap.ResolveOverlayPlane(doc);
            if (overlay == null)
            {
                Debug.LogError("[LearningToolkitPauseChromeBinder] overlay-plane missing.");
                return false;
            }

            _modal.Attach(overlay);
            _pauseButton.text = LearningToolkitChromeUx.PauseButtonLabel;
            _pauseButton.UnregisterCallback<ClickEvent>(OnPauseClicked);
            _pauseButton.RegisterCallback<ClickEvent>(OnPauseClicked);
            return true;
        }

        public void SetPauseEnabled(bool enabled)
        {
            if (_pauseButton != null)
                _pauseButton.SetEnabled(enabled);
        }

        public void Destroy()
        {
            if (_pauseButton != null)
            {
                _pauseButton.UnregisterCallback<ClickEvent>(OnPauseClicked);
                _pauseButton = null;
            }

            _modal.Destroy();
            _onLeave = null;
            _canLeave = () => true;
        }

        private void OnPauseClicked(ClickEvent _)
        {
            var leaveEnabled = _canLeave();
            _modal.Show(
                () => _modal.Hide(),
                () => _onLeave?.Invoke(),
                leaveEnabled,
                _leaveLabel);
        }
    }
}
