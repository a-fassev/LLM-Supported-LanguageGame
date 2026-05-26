using LanguageGame.Application;
using LanguageGame.Presentation.Steps;
using UnityEngine;

namespace LanguageGame.Presentation
{
    /// <summary>Shared pause / leave-quest behavior for task and cutscene shells.</summary>
    internal static class QuestShellNavigationUx
    {
        public static void ShowPauseMenu(QuestShellSharedRuntime shared, IStepView activeStep)
        {
            if (shared == null || shared.Session.Submitting)
                return;

            shared.PauseMenuModal.Show(
                () => shared.PauseMenuModal.Hide(),
                () =>
                {
                    shared.PauseMenuModal.Hide();
                    TryLeaveQuest(shared, activeStep, "QuestShell");
                },
                leaveEnabled: !shared.IsBackBlocked(activeStep),
                LearningToolkitChromeUx.LeaveToChapterOverviewLabel);
        }

        public static void TryLeaveQuest(QuestShellSharedRuntime shared, IStepView activeStep, string logTag)
        {
            var flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError($"[{logTag}] GameFlowController not found.");
                return;
            }

            if (shared == null || shared.Session.Submitting || flow.IsSceneTransitionInProgress)
                return;

            if (shared.IsBackBlocked(activeStep))
                return;

            if (flow.IsServerQuestActive)
            {
                if (flow.TryGetCurrentServerStep(out _))
                {
                    shared.ShowBackConfirm(
                        () => shared.HideBackConfirm(),
                        () =>
                        {
                            shared.HideBackConfirm();
                            flow.LoadChapterOverview();
                        });
                    return;
                }

                flow.LoadChapterOverview();
                return;
            }

            flow.LoadChapterOverview();
        }
    }
}
