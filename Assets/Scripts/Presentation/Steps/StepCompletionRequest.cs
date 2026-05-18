namespace LanguageGame.Presentation.Steps
{
    public struct StepCompletionRequest
    {
        public bool requestComplete;
        public bool requestBackToChapters;

        /// <summary>
        /// Raw JSON object (including <c>taskType</c>) for server-scored pizza. Empty when omitted.
        /// </summary>
        public string taskAttemptJson;
    }
}
