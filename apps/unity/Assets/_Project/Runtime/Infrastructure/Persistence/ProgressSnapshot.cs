using System;
using System.Collections.Generic;

namespace ITBL.LanguageGame.Runtime.Infrastructure.Persistence
{
    [Serializable]
    public sealed class LevelProgressEntry
    {
        public string levelId;
        public int levelOrder;
        public LevelState state;
    }

    [Serializable]
    public sealed class ProgressSnapshot
    {
        public int schemaVersion = 1;
        public List<LevelProgressEntry> levels = new();
        public List<LevelAttemptEntry> levelAttempts = new();
    }

    [Serializable]
    public sealed class TaskAttemptEntry
    {
        public string taskId;
        public int attemptsUsed;
        public bool passed;
        public int scoreEarned;
        public int scoreMax;
        public bool completed;
    }

    [Serializable]
    public sealed class LevelAttemptEntry
    {
        public string levelId;
        public string attemptId;
        public bool isCompleted;
        public bool isPassed;
        public int currentTaskIndex;
        public long updatedAtUnixSeconds;
        public List<TaskAttemptEntry> tasks = new();
    }

    [Serializable]
    public sealed class SaveData
    {
        public ProgressSnapshot progress = new();
        public PlayerProfile profile = new();
    }
}
