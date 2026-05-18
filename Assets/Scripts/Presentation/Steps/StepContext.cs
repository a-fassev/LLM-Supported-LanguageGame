using System;
using LanguageGame.Application;

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

        /// <summary>Quest shell shows client-side validation (e.g. empty gaps) in the shared overlay.</summary>
        public Action<string> presentValidationMessage;

        /// <summary>
        /// Optional: same full-screen loading overlay as primary Check/Save (e.g. while an LLM evaluates Freitext).
        /// Pair with <see cref="dismissBusyOverlay"/> on error/cancel; on success the shell may replace the message
        /// immediately with server-task completion (e.g. &quot;Checking…&quot;).
        /// </summary>
        public Action<string> presentBusyOverlay;

        /// <summary>Optional: hides the overlay from <see cref="presentBusyOverlay"/>.</summary>
        public Action dismissBusyOverlay;

        /// <summary>Optional: shell-injected HTTP client so steps avoid global lookup.</summary>
        public GameProgressApiClient gameProgressApi;

        public bool IsTask => string.Equals(stepKind, "task", StringComparison.OrdinalIgnoreCase);
        public int StepNumberOneBased => stepIndexZeroBased + 1;
    }
}
