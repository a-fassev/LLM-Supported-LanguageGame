namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Builds a JSON object (no surrounding braces) with <c>taskType</c> for <c>POST .../complete</c> when pizza uses scored mode.
    /// </summary>
    public interface ITaskAttemptPayloadProvider
    {
        bool TryBuildTaskAttemptJson(out string attemptJson, out string validationMessage);
    }
}
