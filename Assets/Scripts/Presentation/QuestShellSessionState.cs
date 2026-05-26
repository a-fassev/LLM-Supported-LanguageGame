namespace LanguageGame.Presentation
{
    /// <summary>Quest-run UI state shared across task and cutscene shells.</summary>
    public sealed class QuestShellSessionState
    {
        public bool Submitting;
        public string PendingFinishRunId;
        public bool HasPendingAdvance;
        public int PendingStepOrderIndex;
        public int PendingTaskOrderIndex;
        public int PendingTotalSlices;
        public int PendingTotalBackpackPieces;
        public bool PendingQuestComplete;
        public string PendingRunId;
        public bool RewardOverlayValidationMode;
    }
}
