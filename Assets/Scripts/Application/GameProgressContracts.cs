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
        /// <summary>Optional UI hint from API; hard tasks use Terra emphasis chrome.</summary>
        public string difficulty;
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
        /// <summary>Stringified quest meta_payload (reference document, flow flags).</summary>
        public string metaJson;
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
        /// <summary>0-based ordinal of pending step among active ordered quest steps.</summary>
        public int currentStepOrderIndex;
        /// <summary>Completed task-step count this run (cutscene advance does not increase this).</summary>
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
        /// <summary>Stringified quest meta_payload for active run.</summary>
        public string metaJson;
        public int totalSlices;
        public int totalBackpackPieces;
        public GameQuestStepDto[] steps;
        /// <summary>0-based ordinal of upcoming step (cutscenes + tasks).</summary>
        public int currentStepOrderIndex;
        /// <summary>Count of fully completed task steps; not bumped by cutscene advance.</summary>
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

        /// <summary>Authoritative part-score when server ran attempt evaluation; -1 when not applicable.</summary>
        public int taskItemsCorrect = -1;

        /// <summary>Authoritative part-score denominator; -1 when not applicable.</summary>
        public int taskItemsTotal = -1;
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
    public sealed class FreitextLlmEvaluateAnswerBodyDto
    {
        public string answerText;
    }

    [Serializable]
    public sealed class CompleteTaskEvaluationGateBodyDto
    {
        public string evaluationGateToken;
    }

    [Serializable]
    public sealed class GameFreitextLlmEvaluateEnvelope
    {
        public bool ok;
        public bool isPass;
        public float weightedScore;
        public float grammarScore;
        public float vocabularyScore;
        public float registerScore;
        public string grammarFeedback;
        public string vocabularyFeedback;
        public string registerFeedback;
        public string summaryFeedback;
        public string nextStepAdvice;
        public int scoreEarned;
        public int scoreMax;
        public string evaluationGateToken;
        public string code;
        public string error;
    }

    [Serializable]
    public class GameApiErrorEnvelope
    {
        public bool ok;

        /// <summary>Optional stable code from the API (e.g. UNAUTHORIZED); preferred over substring matching on <see cref="error"/>.</summary>
        public string code;

        public string error;
    }
}
