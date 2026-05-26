using System;
using System.Collections;
using LanguageGame.Application;
using LanguageGame.Presentation.Steps;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Shared overlays, progression coroutines, and session state for task/cutscene shells.</summary>
    public sealed class QuestShellSharedRuntime
    {
        public const string FinishQuestLabel = "Quest beenden";
        public const string ShellCutsceneDefaultCtaLabel = "Weiter";
        public const string ShellTaskCheckLabel = "Controlla";
        public const string ValidationDismissLabel = "Verstanden";

        public readonly QuestShellSessionState Session = new();

        public readonly LearningToolkitLoadingOverlay Loading = new();
        public readonly LearningToolkitConfirmModal BackConfirm = new();
        public readonly LearningToolkitRewardModal Reward = new();
        public readonly LearningToolkitLoadErrorBanner FinishError = new();
        public readonly LearningToolkitReferenceDocumentModal ReferenceDoc = new();
        public readonly LearningToolkitPauseMenuModal PauseMenuModal = new();

        private readonly MonoBehaviour _host;

        public QuestShellSharedRuntime(MonoBehaviour host)
        {
            _host = host;
        }

        public GameProgressApiClient GameApi { get; private set; }

        public void ResolveGameApi()
        {
            if (GameApi == null)
                GameApi = UnityEngine.Object.FindAnyObjectByType<GameProgressApiClient>();
        }

        public void AttachOverlays(VisualElement overlayPlane)
        {
            if (overlayPlane == null)
                return;

            Loading.Attach(overlayPlane);
            BackConfirm.Attach(overlayPlane);
            Reward.Attach(overlayPlane);
            FinishError.Attach(overlayPlane);
            ReferenceDoc.Attach(overlayPlane);
            PauseMenuModal.Attach(overlayPlane);
        }

        public void DestroyOverlays()
        {
            Loading.Destroy();
            BackConfirm.Destroy();
            Reward.Destroy();
            FinishError.Destroy();
            ReferenceDoc.Destroy();
            PauseMenuModal.Destroy();
        }

        public bool IsBackBlocked(IStepView activeStep)
        {
            if (activeStep is ICutsceneBeatNavigator cutsceneNav && cutsceneNav.IsCutsceneBlockBack())
                return true;

            var flow = GameFlowController.Instance;
            if (flow == null)
                return false;

            var meta = flow.ServerQuestMeta;
            return meta?.flow != null && meta.flow.blockBack;
        }

        public void ShowBackConfirm(Action onCancel, Action onLeave)
        {
            var flow = GameFlowController.Instance;
            var message = flow != null && flow.IsServerQuestActive
                ? "Dein Fortschritt wird nach jedem Schritt gespeichert. Du kannst die Quest später in den Kapiteln fortsetzen. Jetzt verlassen?"
                : "Wenn du jetzt gehst, geht der Fortschritt in dieser Quest verloren. Zurück zu den Kapiteln?";
            BackConfirm.Show("Quest verlassen?", message, "Bleiben", LearningToolkitChromeUx.LeaveToChapterOverviewLabel,
                onCancel, onLeave);
        }

        public void HideBackConfirm() => BackConfirm.Hide();

        public void PresentValidationMessage(string message)
        {
            if (string.IsNullOrEmpty(message))
                return;

            Session.RewardOverlayValidationMode = true;
            Reward.ShowValidation(message, ValidationDismissLabel, () =>
            {
                Reward.Hide();
                Session.RewardOverlayValidationMode = false;
                Reward.ConfigureSuccessChrome();
            });
        }

        public void ResetRewardOverlayToRewardLayout()
        {
            Session.RewardOverlayValidationMode = false;
            Reward.ConfigureSuccessChrome();
        }

        public void HideRewardOverlay() => Reward.Hide();

        public static string BuildTaskCompletionHeadline(int taskItemsCorrect, int taskItemsTotal)
        {
            if (taskItemsTotal <= 0)
                return "Compito completato!";
            if (taskItemsCorrect >= taskItemsTotal)
                return "Tutto giusto!";
            if (taskItemsCorrect <= 0)
                return "Nessuna risposta era corretta.";
            return $"Hai risposto correttamente a {taskItemsCorrect} su {taskItemsTotal} elementi.";
        }

        public void ShowTaskRewardOverlay(int awardedSlices, int awardedBackpackPieces, int taskItemsCorrect,
            int taskItemsTotal, Action onBackDismiss, Action onNextDismiss)
        {
            Session.RewardOverlayValidationMode = false;
            Reward.ConfigureSuccessChrome();
            Reward.ShowSuccess(
                BuildTaskCompletionHeadline(taskItemsCorrect, taskItemsTotal),
                $"Fette di pizza guadagnate: {Mathf.Max(0, awardedSlices)}",
                $"Pezzi per lo zaino guadagnati: {Mathf.Max(0, awardedBackpackPieces)}",
                onBackDismiss,
                onNextDismiss);
        }

        public IEnumerator FinishPendingRunRoutine(string runId, Action refreshUi, Action reenablePrimaryFinish)
        {
            if (string.IsNullOrEmpty(runId) || GameApi == null)
                yield break;

            FinishError.Hide();
            Session.Submitting = true;
            refreshUi?.Invoke();

            Loading.Show("Zurück zu den Kapiteln…");

            var finish = new FinishQuestRunUseCase(GameApi);
            GameFinishEnvelope finishResult = null;
            var finishErr = string.Empty;
            yield return finish.Run(runId, r => finishResult = r, e => finishErr = e);

            Loading.Hide();

            if (finishResult == null || !finishResult.ok)
            {
                Session.Submitting = false;
                if (GameProgressApiClient.LooksLikeSessionAuthFailure(finishErr))
                {
                    GameFlowController.Instance?.LoadAuth();
                    yield break;
                }

                var message = string.IsNullOrEmpty(finishErr)
                    ? "Quest konnte nicht abgeschlossen werden. Tippe auf Quest beenden, um es erneut zu versuchen."
                    : $"Quest konnte nicht abgeschlossen werden: {finishErr}";
                Debug.LogWarning("[QuestShell] " + message);

                FinishError.Show(message, () =>
                {
                    FinishError.Hide();
                    _host.StartCoroutine(FinishPendingRunRoutine(runId, refreshUi, reenablePrimaryFinish));
                });

                reenablePrimaryFinish?.Invoke();
                yield break;
            }

            Session.PendingFinishRunId = null;
            Session.Submitting = false;

            var flow = GameFlowController.Instance;
            if (flow == null)
                yield break;

            flow.SetTotalPizzaSlices(finishResult.totalSlices);
            flow.SetTotalBackpackPieces(finishResult.totalBackpackPieces);

            var autoStartSlug = flow.ServerQuestMeta?.flow?.autoStartQuestSlug;
            flow.ClearServerQuestState();

            if (!string.IsNullOrWhiteSpace(autoStartSlug))
                _host.StartCoroutine(AutoStartQuestBySlugRoutine(autoStartSlug.Trim()));
            else
                flow.LoadQuestOverview();
        }

        public IEnumerator AutoStartQuestBySlugRoutine(string questSlug)
        {
            var flow = GameFlowController.Instance;
            if (flow == null || GameApi == null || string.IsNullOrEmpty(questSlug))
            {
                flow?.LoadQuestOverview();
                yield break;
            }

            var quests = flow.SelectedChapterQuests;
            if (quests == null || quests.Length == 0)
            {
                flow.LoadQuestOverview();
                yield break;
            }

            GameQuestBootstrapDto target = null;
            for (var i = 0; i < quests.Length; i++)
            {
                var q = quests[i];
                if (q != null && string.Equals(q.slug, questSlug, StringComparison.Ordinal))
                {
                    target = q;
                    break;
                }
            }

            if (target == null || !target.isUnlocked)
            {
                Debug.LogWarning($"[QuestShell] Auto-start quest '{questSlug}' unavailable; showing overview.");
                flow.LoadQuestOverview();
                yield break;
            }

            Loading.Show("Quest wird gestartet…");

            var useCase = new StartQuestRunUseCase(GameApi);
            GameStartQuestEnvelope started = null;
            var err = string.Empty;
            yield return useCase.Run(target.id, s => started = s, m => err = m);

            Loading.Hide();

            if (started == null || !started.ok)
            {
                if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                {
                    flow.LoadAuth();
                    yield break;
                }

                Debug.LogWarning($"[QuestShell] Auto-start quest failed: {err}");
                flow.LoadQuestOverview();
                yield break;
            }

            flow.SetTotalPizzaSlices(started.totalSlices);
            flow.SetTotalBackpackPieces(started.totalBackpackPieces);
            flow.BeginServerQuest(
                started.runId,
                started.questId,
                started.displayName,
                started.metaJson,
                started.steps,
                started.currentStepOrderIndex,
                started.currentTaskOrderIndex,
                started.totalSlices,
                started.totalBackpackPieces);
        }

        public void ApplyPendingAdvanceAndContinue(Action refreshUi)
        {
            if (!Session.HasPendingAdvance)
                return;

            var flow = GameFlowController.Instance;
            if (flow == null)
                return;

            Session.HasPendingAdvance = false;
            flow.ApplyServerTaskProgress(
                Session.PendingStepOrderIndex,
                Session.PendingTaskOrderIndex,
                Session.PendingTotalSlices,
                Session.PendingTotalBackpackPieces,
                questComplete: false);

            if (Session.PendingQuestComplete)
            {
                Session.PendingFinishRunId = Session.PendingRunId;
                _host.StartCoroutine(FinishPendingRunRoutine(Session.PendingFinishRunId, refreshUi, null));
                return;
            }

            refreshUi?.Invoke();
        }

        public static bool SameStepBindingForUi(GameQuestStepDto cached, GameQuestStepDto incoming)
        {
            if (incoming == null || cached == null)
                return false;
            if (!string.Equals(cached.id, incoming.id, StringComparison.Ordinal))
                return false;
            return string.Equals(cached.contentJson ?? "", incoming.contentJson ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.difficulty ?? "", incoming.difficulty ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.templateKey ?? "", incoming.templateKey ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.rewardRulesJson ?? "", incoming.rewardRulesJson ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.stepKind ?? "", incoming.stepKind ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.taskType ?? "", incoming.taskType ?? "", StringComparison.Ordinal)
                   && cached.isTask == incoming.isTask
                   && cached.orderIndex == incoming.orderIndex;
        }

        /// <summary>Task shell handles tasks, quest finish chrome, and missing-step recovery.</summary>
        public static bool ShouldUseTaskShell(QuestShellSessionState session, GameFlowController flow,
            out GameQuestStepDto step)
        {
            step = null;
            if (!string.IsNullOrEmpty(session?.PendingFinishRunId))
                return true;

            if (flow == null || !flow.IsServerQuestActive)
                return true;

            if (!flow.TryGetCurrentServerStep(out step))
                return true;

            return step.isTask;
        }
    }
}
