using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

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
        private bool _shellMountFailed;

        private UIDocument _fatalOverlayDoc;
        private readonly LearningToolkitLoadErrorBanner _fatalMountBanner = new();
        private bool _fatalMountBannerReady;

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
            _fatalMountBanner.Destroy();
            if (_fatalOverlayDoc != null)
                Destroy(_fatalOverlayDoc.gameObject);
        }

        /// <summary>Re-evaluates which shell to show and refreshes its UI.</summary>
        public void RefreshShellRouting()
        {
            if (!enabled || _shellMountFailed)
                return;

            var flow = GameFlowController.Instance;
            GameQuestStepDto step = null;
            var wantTask = QuestShellSharedRuntime.ShouldUseTaskShell(_shared.Session, flow, out step);

            if (_activeShell != null && wantTask == _useTaskShell)
            {
                _activeShell.RefreshUi();
                return;
            }

            SetActiveShell(wantTask ? _taskShell : _cutShell);
            if (_shellMountFailed)
                return;

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

            if (_activeShell == null)
                return;

            _activeShell.Mount();
            if (_activeShell.IsMounted)
                return;

            var failedShell = _activeShell;
            var shellLabel = ReferenceEquals(failedShell, _taskShell) ? "Aufgabe" : "Szene";
            Debug.LogError($"[QuestStepShellHost] Failed to mount {shellLabel} shell UXML.");
            failedShell.Unmount();
            _activeShell = null;
            ShowShellMountFailure(shellLabel);
        }

        private bool EnsureFatalMountOverlay()
        {
            if (_fatalMountBannerReady)
                return true;

            if (_fatalOverlayDoc == null)
            {
                _fatalOverlayDoc = LearningToolkitBootstrap.SpawnUiDocument(this, "Shells/CutShellScreen");
                if (_fatalOverlayDoc == null)
                    return false;
            }

            var overlay = LearningToolkitBootstrap.ResolveOverlayPlane(_fatalOverlayDoc);
            if (overlay == null)
            {
                Debug.LogError("[QuestStepShellHost] Cannot show mount failure UI — overlay-plane missing.");
                return false;
            }

            _fatalMountBanner.Attach(overlay);
            _fatalMountBannerReady = true;
            return true;
        }

        private void ShowShellMountFailure(string shellLabel)
        {
            _shellMountFailed = true;
            enabled = false;

            if (EnsureFatalMountOverlay())
            {
                _fatalMountBanner.Show(
                    $"Die Quest-Oberfläche ({shellLabel}) konnte nicht geladen werden.",
                    () =>
                    {
                        _fatalMountBanner.Hide();
                        GameFlowController.Instance?.LoadChapterOverview();
                    },
                    LearningToolkitChromeUx.LeaveToChapterOverviewLabel);
                return;
            }

            Debug.LogError(
                "[QuestStepShellHost] Mount failure UI unavailable; returning to chapter overview.");
            StartCoroutine(FallbackLeaveToChaptersAfterMountFailure());
        }

        private IEnumerator FallbackLeaveToChaptersAfterMountFailure()
        {
            yield return null;
            GameFlowController.Instance?.LoadChapterOverview();
        }
    }
}
