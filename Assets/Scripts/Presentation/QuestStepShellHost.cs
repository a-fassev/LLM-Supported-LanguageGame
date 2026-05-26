using LanguageGame.Application;
using UnityEngine;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Routes between task and cutscene shells within the Quest scene based on the current server step.
    /// </summary>
    public sealed class QuestStepShellHost : MonoBehaviour
    {
        private QuestShellSharedRuntime _shared;
        private TaskShellPresenter _taskShell;
        private CutsceneShellPresenter _cutShell;
        private IQuestStepShellPresenter _activeShell;
        private bool _useTaskShell = true;

        private void Awake()
        {
            _shared = new QuestShellSharedRuntime(this);
            _taskShell = new TaskShellPresenter(this, _shared, RefreshShellRouting);
            _cutShell = new CutsceneShellPresenter(this, _shared, RefreshShellRouting);
        }

        private void Start()
        {
            var flow = GameFlowController.Instance;
            if (flow != null)
                ChapterThemeRuntime.Apply(flow.SelectedChapterThemeJson);

            RefreshShellRouting();
        }

        private void OnDestroy()
        {
            SetActiveShell(null);
            _shared.DestroyOverlays();
        }

        /// <summary>Re-evaluates which shell to show and refreshes its UI.</summary>
        public void RefreshShellRouting()
        {
            var flow = GameFlowController.Instance;
            GameQuestStepDto step = null;
            var wantTask = QuestShellSharedRuntime.ShouldUseTaskShell(_shared.Session, flow, out step);

            if (_activeShell != null && wantTask == _useTaskShell)
            {
                _activeShell.RefreshUi();
                return;
            }

            SetActiveShell(wantTask ? _taskShell : _cutShell);
            _useTaskShell = wantTask;
            _activeShell?.RefreshUi();
        }

        private void SetActiveShell(IQuestStepShellPresenter next)
        {
            if (_activeShell == next)
                return;

            if (_activeShell != null)
            {
                _activeShell.Unmount();
                _shared.DestroyOverlays();
            }

            _activeShell = next;

            if (_activeShell != null)
                _activeShell.Mount();
        }
    }
}
