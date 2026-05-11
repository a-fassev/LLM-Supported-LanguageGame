using ITBL.LanguageGame.Runtime.Core;

namespace ITBL.LanguageGame.Runtime.Game.Modes
{
    public sealed class TaskResult
    {
        public bool IsPass { get; set; }
        public int ScoreEarned { get; set; }
        public int ScoreMax { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public bool IsEvaluationError { get; set; }
        public bool RetryRecommended { get; set; } = true;
        public AppErrorCode ErrorCode { get; set; } = AppErrorCode.None;

        public bool IsPerfectScore => ScoreMax > 0 && ScoreEarned >= ScoreMax;
    }
}
