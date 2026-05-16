using System;
using UnityEngine;

namespace LanguageGame.Application
{
    /// <summary>
    /// Session-scoped read model for server-backed game data.
    /// Stores the last bootstrap snapshot plus freshness/invalidation metadata.
    /// </summary>
    public static class GameSessionStateStore
    {
        public const float DefaultBootstrapFreshSeconds = 45f;

        private static GameBootstrapEnvelope _bootstrap;
        private static DateTime _bootstrapUpdatedUtc;
        private static bool _bootstrapInvalidated;
        private static int _latestTotalSlices;
        private static int _latestTotalBackpackPieces;
        private static bool _hasLatestWalletTotals;
        private static string _lastInvalidationReason;

        public static bool HasBootstrapSnapshot => _bootstrap != null;

        public static string LastInvalidationReason => _lastInvalidationReason;

        public static bool TryGetBootstrapSnapshot(out GameBootstrapEnvelope snapshot)
        {
            snapshot = CloneBootstrap(_bootstrap);
            return snapshot != null;
        }

        public static void SetBootstrapSnapshot(GameBootstrapEnvelope snapshot)
        {
            if (snapshot == null)
                return;

            _bootstrap = CloneBootstrap(snapshot);
            _bootstrapUpdatedUtc = DateTime.UtcNow;
            _bootstrapInvalidated = false;
            _lastInvalidationReason = null;

            SetLatestWalletTotals(_bootstrap.totalSlices, _bootstrap.totalBackpackPieces);
        }

        public static bool IsBootstrapFresh(float maxAgeSeconds)
        {
            if (_bootstrap == null || _bootstrapInvalidated)
                return false;

            var ageSeconds = (DateTime.UtcNow - _bootstrapUpdatedUtc).TotalSeconds;
            return ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
        }

        public static void InvalidateBootstrap(string reason)
        {
            _bootstrapInvalidated = true;
            _lastInvalidationReason = reason;
        }

        public static void SetLatestWalletTotals(int totalSlices, int totalBackpackPieces)
        {
            _latestTotalSlices = Mathf.Max(0, totalSlices);
            _latestTotalBackpackPieces = Mathf.Max(0, totalBackpackPieces);
            _hasLatestWalletTotals = true;

            if (_bootstrap != null)
            {
                _bootstrap.totalSlices = _latestTotalSlices;
                _bootstrap.totalBackpackPieces = _latestTotalBackpackPieces;
            }
        }

        public static bool TryGetLatestTotalSlices(out int totalSlices)
        {
            totalSlices = _latestTotalSlices;
            return _hasLatestWalletTotals;
        }

        public static bool TryGetLatestTotalBackpackPieces(out int totalBackpackPieces)
        {
            totalBackpackPieces = _latestTotalBackpackPieces;
            return _hasLatestWalletTotals;
        }

        public static void ApplyStartQuestResult(GameStartQuestEnvelope started)
        {
            if (started == null || !started.ok)
                return;

            SetLatestWalletTotals(started.totalSlices, started.totalBackpackPieces);

            if (_bootstrap != null)
            {
                _bootstrap.activeRun = new GameActiveQuestRunDto
                {
                    runId = started.runId,
                    chapterId = started.chapterId,
                    questId = started.questId,
                    questSlug = started.questSlug,
                    currentStepOrderIndex = started.currentStepOrderIndex,
                    currentTaskOrderIndex = started.currentTaskOrderIndex,
                    stepCount = started.steps != null ? started.steps.Length : 0,
                };
            }
        }

        public static void ApplyTaskCompletion(GameCompleteTaskEnvelope completed)
        {
            if (completed == null || !completed.ok)
                return;

            SetLatestWalletTotals(completed.totalSlices, completed.totalBackpackPieces);
            InvalidateBootstrap("task-completed");
        }

        public static void ApplyRunFinished(GameFinishEnvelope finished)
        {
            if (finished == null || !finished.ok)
                return;

            SetLatestWalletTotals(finished.totalSlices, finished.totalBackpackPieces);
            InvalidateBootstrap("run-finished");
        }

        public static void Clear()
        {
            _bootstrap = null;
            _bootstrapUpdatedUtc = default;
            _bootstrapInvalidated = false;
            _latestTotalSlices = 0;
            _latestTotalBackpackPieces = 0;
            _hasLatestWalletTotals = false;
            _lastInvalidationReason = null;
        }

        private static GameBootstrapEnvelope CloneBootstrap(GameBootstrapEnvelope source)
        {
            if (source == null)
                return null;

            return new GameBootstrapEnvelope
            {
                ok = source.ok,
                totalSlices = source.totalSlices,
                totalBackpackPieces = source.totalBackpackPieces,
                chapters = CloneChapters(source.chapters),
                activeRun = CloneActiveRun(source.activeRun),
            };
        }

        private static GameChapterBootstrapDto[] CloneChapters(GameChapterBootstrapDto[] source)
        {
            if (source == null)
                return null;

            var copy = new GameChapterBootstrapDto[source.Length];
            for (var i = 0; i < source.Length; i++)
            {
                var chapter = source[i];
                if (chapter == null)
                    continue;
                copy[i] = new GameChapterBootstrapDto
                {
                    id = chapter.id,
                    slug = chapter.slug,
                    displayName = chapter.displayName,
                    orderIndex = chapter.orderIndex,
                    themeJson = chapter.themeJson,
                    isUnlocked = chapter.isUnlocked,
                    unlockHint = chapter.unlockHint,
                    quests = CloneQuests(chapter.quests),
                };
            }

            return copy;
        }

        private static GameQuestBootstrapDto[] CloneQuests(GameQuestBootstrapDto[] source)
        {
            if (source == null)
                return null;

            var copy = new GameQuestBootstrapDto[source.Length];
            for (var i = 0; i < source.Length; i++)
            {
                var quest = source[i];
                if (quest == null)
                    continue;
                copy[i] = new GameQuestBootstrapDto
                {
                    id = quest.id,
                    chapterId = quest.chapterId,
                    slug = quest.slug,
                    displayName = quest.displayName,
                    orderIndex = quest.orderIndex,
                    isUnlocked = quest.isUnlocked,
                    hasCompletedAnyRun = quest.hasCompletedAnyRun,
                    unlockHint = quest.unlockHint,
                    steps = CloneSteps(quest.steps),
                };
            }

            return copy;
        }

        private static GameQuestStepDto[] CloneSteps(GameQuestStepDto[] source)
        {
            if (source == null)
                return null;

            var copy = new GameQuestStepDto[source.Length];
            for (var i = 0; i < source.Length; i++)
            {
                var step = source[i];
                if (step == null)
                    continue;
                copy[i] = new GameQuestStepDto
                {
                    id = step.id,
                    orderIndex = step.orderIndex,
                    stepKind = step.stepKind,
                    taskType = step.taskType,
                    templateKey = step.templateKey,
                    logicalTaskKey = step.logicalTaskKey,
                    contentJson = step.contentJson,
                    rewardRulesJson = step.rewardRulesJson,
                    isTask = step.isTask,
                };
            }

            return copy;
        }

        private static GameActiveQuestRunDto CloneActiveRun(GameActiveQuestRunDto source)
        {
            if (source == null)
                return null;

            return new GameActiveQuestRunDto
            {
                runId = source.runId,
                chapterId = source.chapterId,
                questId = source.questId,
                questSlug = source.questSlug,
                currentStepOrderIndex = source.currentStepOrderIndex,
                currentTaskOrderIndex = source.currentTaskOrderIndex,
                stepCount = source.stepCount,
            };
        }
    }
}
