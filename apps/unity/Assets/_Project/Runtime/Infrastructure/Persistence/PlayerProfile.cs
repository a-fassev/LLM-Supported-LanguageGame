using System;
using System.Collections.Generic;

namespace ITBL.LanguageGame.Runtime.Infrastructure.Persistence
{
    [Serializable]
    public sealed class PlayerScore
    {
        public int totalPoints;
        public int tasksCompleted;
    }

    [Serializable]
    public sealed class PlayerStats
    {
        public int levelsCompleted;
        public int totalAttempts;
    }

    /// <summary>
    /// Persisted modifier slot for future gameplay/difficulty tuning (no runtime logic in V1).
    /// </summary>
    [Serializable]
    public sealed class PlayerModifierEntry
    {
        public string modifierId = string.Empty;
        public float magnitude;
        public long expiresAtUnix;
    }

    [Serializable]
    public sealed class PlayerProfile
    {
        public PlayerScore score = new();
        public PlayerStats stats = new();
        public List<PlayerModifierEntry> modifiers = new();
    }
}
