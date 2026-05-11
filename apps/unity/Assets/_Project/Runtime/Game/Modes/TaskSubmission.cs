using System.Collections.Generic;

namespace ITBL.LanguageGame.Runtime.Game.Modes
{
    public sealed class TaskSubmission
    {
        public int ContractVersion { get; set; } = 1;
        public string SessionId { get; set; } = string.Empty;
        public string AttemptId { get; set; } = string.Empty;
        public string LevelId { get; set; } = string.Empty;
        public string TaskId { get; set; } = string.Empty;
        public string PromptText { get; set; } = string.Empty;
        public int AttemptNumber { get; set; }
        public string RawText { get; set; } = string.Empty;
        public List<string> Values { get; } = new();
    }
}
