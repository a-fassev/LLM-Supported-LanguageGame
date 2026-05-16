using System;

namespace LanguageGame.Application
{
    /// <summary>
    /// JSON DTOs for the /api/game/* contract (JsonUtility-friendly field names).
    /// </summary>
    [Serializable]
    public class GameQuestStepDto
    {
        public string id;
        public int orderIndex;
        public string stepKind;
        public string taskType;
        public string templateKey;
        public string logicalTaskKey;
        public string contentJson;
        public string rewardRulesJson;
        public bool isTask;
    }

    [Serializable]
    public class GameQuestBootstrapDto
    {
        public string id;
        public string chapterId;
        public string slug;
        public string displayName;
        public int orderIndex;
        public bool isUnlocked;
        public bool hasCompletedAnyRun;
        /// <summary>Non-empty when locked; UX overlay text.</summary>
        public string unlockHint;
        public GameQuestStepDto[] steps;
    }

    [Serializable]
    public class GameChapterBootstrapDto
    {
        public string id;
        public string slug;
        public string displayName;
        public int orderIndex;
        public string themeJson;
        /// <summary>Sequential unlock: gated until every quest in previous chapter finished.</summary>
        public bool isUnlocked;
        public string unlockHint;
        public GameQuestBootstrapDto[] quests;
    }

    [Serializable]
    public class GameActiveQuestRunDto
    {
        public string runId;
        public string chapterId;
        public string questId;
        public string questSlug;
        public int currentStepOrderIndex;
        public int currentTaskOrderIndex;
        public int stepCount;
    }

    [Serializable]
    public class GameBootstrapEnvelope
    {
        public bool ok;
        public int totalSlices;
        public int totalBackpackPieces;
        public GameChapterBootstrapDto[] chapters;
        public GameActiveQuestRunDto activeRun;
    }

    [Serializable]
    public class GameStartQuestEnvelope
    {
        public bool ok;
        public string runId;
        public string chapterId;
        public string questId;
        public string questSlug;
        public string displayName;
        public int totalSlices;
        public int totalBackpackPieces;
        public GameQuestStepDto[] steps;
        public int currentStepOrderIndex;
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
        public bool questComplete;
        public int currentStepOrderIndex;
        public int currentTaskOrderIndex;
        public string nextTaskStepId;
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
