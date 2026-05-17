namespace LanguageGame.Presentation.Steps
{
    /// <summary>Optional contract for shell-driven task completion needing a fresh server-evaluated gate token.</summary>
    public interface IEvaluationGateForTaskCompletion
    {
        /// <returns><c>false</c> when no queued token exists yet.</returns>
        bool TryTakeEvaluationGateToken(out string evaluationGateToken);
    }
}
