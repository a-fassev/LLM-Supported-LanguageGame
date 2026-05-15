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
        private static bool _hasLatestTotalSlices;
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

            SetLatestTotalSlices(_bootstrap.totalSlices);
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

        public static void SetLatestTotalSlices(int value)
        {
            _latestTotalSlices = Mathf.Max(0, value);
            _hasLatestTotalSlices = true;

            if (_bootstrap != null)
                _bootstrap.totalSlices = _latestTotalSlices;
        }

        public static bool TryGetLatestTotalSlices(out int totalSlices)
        {
            totalSlices = _latestTotalSlices;
            return _hasLatestTotalSlices;
        }

        public static void ApplyStartLevelResult(GameStartLevelEnvelope started)
        {
            if (started == null || !started.ok)
                return;

            SetLatestTotalSlices(started.totalSlices);

            if (_bootstrap != null)
            {
                _bootstrap.activeRun = new GameActiveRunDto
                {
                    runId = started.runId,
                    levelId = started.levelId,
                    levelSlug = started.levelSlug,
                    currentTaskOrderIndex = started.currentTaskOrderIndex,
                    taskCount = started.tasks != null ? started.tasks.Length : 0,
                };
            }
        }

        public static void ApplyTaskCompletion(GameCompleteTaskEnvelope completed)
        {
            if (completed == null || !completed.ok)
                return;

            SetLatestTotalSlices(completed.totalSlices);
            InvalidateBootstrap("task-completed");
        }

        public static void ApplyRunFinished(GameFinishEnvelope finished)
        {
            if (finished == null || !finished.ok)
                return;

            SetLatestTotalSlices(finished.totalSlices);
            InvalidateBootstrap("run-finished");
        }

        public static void Clear()
        {
            _bootstrap = null;
            _bootstrapUpdatedUtc = default;
            _bootstrapInvalidated = false;
            _latestTotalSlices = 0;
            _hasLatestTotalSlices = false;
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
                levels = CloneLevels(source.levels),
                activeRun = CloneActiveRun(source.activeRun),
            };
        }

        private static GameLevelBootstrapDto[] CloneLevels(GameLevelBootstrapDto[] source)
        {
            if (source == null)
                return null;

            var copy = new GameLevelBootstrapDto[source.Length];
            for (var i = 0; i < source.Length; i++)
            {
                var level = source[i];
                if (level == null)
                    continue;
                copy[i] = new GameLevelBootstrapDto
                {
                    id = level.id,
                    slug = level.slug,
                    displayName = level.displayName,
                    orderIndex = level.orderIndex,
                    requiredTotalSlices = level.requiredTotalSlices,
                    isUnlocked = level.isUnlocked,
                    hasCompletedAnyRun = level.hasCompletedAnyRun,
                    tasks = CloneTasks(level.tasks),
                };
            }

            return copy;
        }

        private static GameTaskBootstrapDto[] CloneTasks(GameTaskBootstrapDto[] source)
        {
            if (source == null)
                return null;

            var copy = new GameTaskBootstrapDto[source.Length];
            for (var i = 0; i < source.Length; i++)
            {
                var task = source[i];
                if (task == null)
                    continue;
                copy[i] = new GameTaskBootstrapDto
                {
                    id = task.id,
                    orderIndex = task.orderIndex,
                    taskType = task.taskType,
                    placeholderLabel = task.placeholderLabel,
                };
            }

            return copy;
        }

        private static GameActiveRunDto CloneActiveRun(GameActiveRunDto source)
        {
            if (source == null)
                return null;

            return new GameActiveRunDto
            {
                runId = source.runId,
                levelId = source.levelId,
                levelSlug = source.levelSlug,
                currentTaskOrderIndex = source.currentTaskOrderIndex,
                taskCount = source.taskCount,
            };
        }
    }
}
