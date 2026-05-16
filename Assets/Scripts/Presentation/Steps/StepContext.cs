using System;

namespace LanguageGame.Presentation.Steps
{
    [Serializable]
    public class StepContext
    {
        public string runId;
        public string stepId;
        public string taskId;
        public string questId;
        public string questDisplayName;
        public string stepKind;
        public string taskType;
        public string templateKey;
        public string contentJson;
        public string rewardRulesJson;
        public int stepIndexZeroBased;
        public int totalSteps;
        public bool isLastStep;
        public int totalSlices;
        public int totalBackpackPieces;

        /// <summary>Hides in-step navigation when QuestShell chrome already exposes it.</summary>
        public bool suppressHostedBackChapterNavigation;

        /// <summary>Hides Continue/Next on the cutscene canvas when QuestShell exposes the shell Next button.</summary>
        public bool suppressHostedContinueNavigation;

        public bool IsTask => string.Equals(stepKind, "task", StringComparison.OrdinalIgnoreCase);
        public int StepNumberOneBased => stepIndexZeroBased + 1;
    }
}
