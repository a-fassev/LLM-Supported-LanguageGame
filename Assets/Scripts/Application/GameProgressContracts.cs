using System;

namespace LanguageGame.Application
{
    /// <summary>
    /// JSON DTOs for the /api/game/* contract (JsonUtility-friendly field names).
    /// </summary>
    [Serializable]
    public class GameTaskBootstrapDto
    {
        public string id;
        public int orderIndex;
        public string taskType;
        public string placeholderLabel;
    }

    [Serializable]
    public class GameLevelBootstrapDto
    {
        public string id;
        public string slug;
        public string displayName;
        public int orderIndex;
        public int requiredTotalSlices;
        public bool isUnlocked;
        public bool hasCompletedAnyRun;
        public GameTaskBootstrapDto[] tasks;
    }

    [Serializable]
    public class GameActiveRunDto
    {
        public string runId;
        public string levelId;
        public string levelSlug;
        public int currentTaskOrderIndex;
        public int taskCount;
    }

    [Serializable]
    public class GameBootstrapEnvelope
    {
        public bool ok;
        public int totalSlices;
        public int totalBackpackPieces;
        public GameLevelBootstrapDto[] levels;
        public GameActiveRunDto activeRun;
    }

    [Serializable]
    public class GameStartLevelEnvelope
    {
        public bool ok;
        public string runId;
        public string levelId;
        public string levelSlug;
        public string displayName;
        public int totalSlices;
        public int totalBackpackPieces;
        public GameTaskBootstrapDto[] tasks;
        public int currentTaskOrderIndex;
        public string error;
    }

    [Serializable]
    public class GameCompleteTaskEnvelope
    {
        public bool ok;
        public int awardedSlices;
        public int awardedBackpackPieces;
        public int totalSlices;
        public int totalBackpackPieces;
        public bool levelComplete;
        public int currentTaskOrderIndex;
        public string currentTaskId;
        public string error;
    }

    [Serializable]
    public class GameFinishEnvelope
    {
        public bool ok;
        public int totalSlices;
        public int totalBackpackPieces;
        public string error;
    }

    [Serializable]
    public class GameApiErrorEnvelope
    {
        public bool ok;
        public string error;
    }
}
