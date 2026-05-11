using System;
using System.Collections.Generic;
using System.Linq;
using ITBL.LanguageGame.Runtime.Infrastructure.Persistence;

namespace ITBL.LanguageGame.Runtime.Game.Levels
{
    public interface IProgressionService
    {
        IReadOnlyList<LevelRuntimeState> GetLevelStates();
        bool IsUnlocked(string levelId);
        void CompleteLevel(string levelId, int awardedPoints);
        void RecordTaskCompletion(int awardedPoints);
        PlayerProfile GetPlayerProfile();
        string GetLockReason(string levelId);
        bool TryGetLevelDescriptor(string levelId, out LevelDescriptor descriptor);
        LevelAttemptEntry BeginLevelAttempt(string levelId, bool resumeLastAttempt);
        void SaveLevelAttempt(LevelAttemptEntry attempt);
    }

    public readonly struct LevelRuntimeState
    {
        public LevelRuntimeState(string levelId, string displayName, int order, LevelState state)
        {
            LevelId = levelId;
            DisplayName = displayName;
            Order = order;
            State = state;
        }

        public string LevelId { get; }
        public string DisplayName { get; }
        public int Order { get; }
        public LevelState State { get; }
    }

    public sealed class ProgressionService : IProgressionService
    {
        private readonly IProgressRepository _progressRepository;
        private readonly IPlayerProfileRepository _profileRepository;
        private readonly IReadOnlyList<LevelDescriptor> _levels;

        private ProgressSnapshot _snapshot;
        private PlayerProfile _profile;

        public ProgressionService(
            IProgressRepository progressRepository,
            IPlayerProfileRepository profileRepository,
            IReadOnlyList<LevelDescriptor> levels)
        {
            _progressRepository = progressRepository;
            _profileRepository = profileRepository;
            _levels = levels;

            _snapshot = _progressRepository.Load();
            _profile = _profileRepository.Load();
            EnsureConsistency();
            Persist();
        }

        public IReadOnlyList<LevelRuntimeState> GetLevelStates()
        {
            EnsureConsistency();
            return _levels
                .OrderBy(level => level.Order)
                .Select(level =>
                {
                    LevelProgressEntry entry = GetOrCreateEntry(level);
                    return new LevelRuntimeState(level.LevelId, level.DisplayName, level.Order, entry.state);
                })
                .ToList();
        }

        public bool IsUnlocked(string levelId)
        {
            EnsureConsistency();
            LevelProgressEntry entry = _snapshot.levels.FirstOrDefault(level => level.levelId == levelId);
            return entry != null && entry.state != LevelState.Locked;
        }

        public void CompleteLevel(string levelId, int awardedPoints)
        {
            EnsureConsistency();

            LevelDescriptor descriptor = _levels.FirstOrDefault(level => level.LevelId == levelId);
            if (string.IsNullOrWhiteSpace(descriptor.LevelId))
            {
                return;
            }

            LevelProgressEntry current = GetOrCreateEntry(descriptor);
            current.state = LevelState.Completed;

            LevelDescriptor next = _levels
                .Where(level => level.Order > descriptor.Order)
                .OrderBy(level => level.Order)
                .FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(next.LevelId))
            {
                LevelProgressEntry nextEntry = GetOrCreateEntry(next);
                if (nextEntry.state == LevelState.Locked)
                {
                    nextEntry.state = LevelState.Unlocked;
                }
            }

            _profile.score.totalPoints += awardedPoints;
            _profile.stats.levelsCompleted = _snapshot.levels.Count(level => level.state == LevelState.Completed);

            Persist();
        }

        public void RecordTaskCompletion(int awardedPoints)
        {
            EnsureConsistency();
            _profile.score.tasksCompleted += 1;
            _profile.score.totalPoints += Math.Max(0, awardedPoints);
            Persist();
        }

        public PlayerProfile GetPlayerProfile()
        {
            return _profile;
        }

        public bool TryGetLevelDescriptor(string levelId, out LevelDescriptor descriptor)
        {
            descriptor = _levels.FirstOrDefault(level => level.LevelId == levelId);
            return !string.IsNullOrWhiteSpace(descriptor.LevelId);
        }

        public LevelAttemptEntry BeginLevelAttempt(string levelId, bool resumeLastAttempt)
        {
            EnsureConsistency();
            LevelAttemptEntry existing = _snapshot.levelAttempts
                .Where(item => item.levelId == levelId && !item.isCompleted)
                .OrderByDescending(item => item.updatedAtUnixSeconds)
                .FirstOrDefault();

            if (resumeLastAttempt && existing != null)
            {
                existing.updatedAtUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                Persist();
                return existing;
            }

            LevelAttemptEntry created = new()
            {
                levelId = levelId,
                attemptId = Guid.NewGuid().ToString("N"),
                isCompleted = false,
                isPassed = false,
                currentTaskIndex = 0,
                updatedAtUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                tasks = new List<TaskAttemptEntry>(),
            };
            _snapshot.levelAttempts.Add(created);
            _profile.stats.totalAttempts += 1;
            Persist();
            return created;
        }

        public void SaveLevelAttempt(LevelAttemptEntry attempt)
        {
            if (attempt == null || string.IsNullOrWhiteSpace(attempt.attemptId))
            {
                return;
            }

            EnsureConsistency();
            LevelAttemptEntry existing = _snapshot.levelAttempts.FirstOrDefault(item => item.attemptId == attempt.attemptId);
            if (existing == null)
            {
                attempt.updatedAtUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                _snapshot.levelAttempts.Add(attempt);
            }
            else
            {
                existing.levelId = attempt.levelId;
                existing.currentTaskIndex = attempt.currentTaskIndex;
                existing.isCompleted = attempt.isCompleted;
                existing.isPassed = attempt.isPassed;
                existing.tasks = attempt.tasks ?? new List<TaskAttemptEntry>();
                existing.updatedAtUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            }

            Persist();
        }

        public string GetLockReason(string levelId)
        {
            EnsureConsistency();
            if (IsUnlocked(levelId))
            {
                return string.Empty;
            }

            LevelDescriptor descriptor = _levels.FirstOrDefault(level => level.LevelId == levelId);
            if (string.IsNullOrWhiteSpace(descriptor.LevelId) || descriptor.Order <= 1)
            {
                return "Dieses Level ist aktuell nicht verfuegbar.";
            }

            LevelDescriptor previous = _levels.FirstOrDefault(level => level.Order == descriptor.Order - 1);
            return string.IsNullOrWhiteSpace(previous.LevelId)
                ? "Bitte zuerst das vorherige Level abschliessen."
                : $"Bitte zuerst {previous.DisplayName} abschliessen.";
        }

        private void EnsureConsistency()
        {
            if (_snapshot.levels == null)
            {
                _snapshot.levels = new List<LevelProgressEntry>();
            }

            if (_snapshot.levelAttempts == null)
            {
                _snapshot.levelAttempts = new List<LevelAttemptEntry>();
            }

            foreach (LevelDescriptor level in _levels)
            {
                GetOrCreateEntry(level);
            }

            foreach (LevelProgressEntry entry in _snapshot.levels)
            {
                if (entry.levelOrder <= 1)
                {
                    if (entry.state == LevelState.Locked)
                    {
                        entry.state = LevelState.Unlocked;
                    }
                    break;
                }
            }

            _profile ??= new PlayerProfile();
            _profile.score ??= new PlayerScore();
            _profile.stats ??= new PlayerStats();
        }

        private LevelProgressEntry GetOrCreateEntry(LevelDescriptor level)
        {
            LevelProgressEntry entry = _snapshot.levels.FirstOrDefault(item => item.levelId == level.LevelId);
            if (entry != null)
            {
                entry.levelOrder = level.Order;
                return entry;
            }

            LevelProgressEntry newEntry = new()
            {
                levelId = level.LevelId,
                levelOrder = level.Order,
                state = level.Order == 1 ? LevelState.Unlocked : LevelState.Locked,
            };
            _snapshot.levels.Add(newEntry);
            return newEntry;
        }

        private void Persist()
        {
            _progressRepository.Save(_snapshot);
            _profileRepository.Save(_profile);
        }
    }
}
