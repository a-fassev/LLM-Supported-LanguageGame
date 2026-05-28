namespace LanguageGame.Presentation
{
    /// <summary>Shared shell / overlay copy and element names.</summary>
    internal static class LearningToolkitChromeUx
    {
        public const string PauseMenuButtonName = "pause-menu-button";
        public const string PauseButtonLabel = "Pausa";

        public const string PauseMenuTitle = "Pausa";
        public const string PauseResumeLabel = "Continua";
        public const string LeaveToMainMenuLabel = "Menu principale";
        public const string LeaveToChapterOverviewLabel = "Capitoli";

        public const string LoadingFallbackMessage = "Un momento…";
        public const string FreitextReviewingBusyMessage = "Sto leggendo il tuo testo…";
        public const string ErrorBannerRetryLabel = "Riprova";

        public const string ConfirmSecondaryFallbackLabel = "Resta";
        public const string ConfirmPrimaryFallbackLabel = "OK";
        public const string UnlockConfirmLabel = "OK";

        public const string RewardOverlayBackLabel = "Indietro";
        public const string RewardOverlayNextLabel = "Avanti";
        public const string RewardSuccessFallbackMessage = "Compito completato!";
        public const string ValidationDismissLabel = "Capito";

        public const string ReferenceDocumentTitleFallback = "Documento";

        public static string FormatTeamDisplayLabel(string team) =>
            team == "blue" ? "Squadra Blu" : team == "red" ? "Squadra Rossa" : team ?? string.Empty;

        /// <summary>Single-line shell header: chapter and active quest (middle dot separator).</summary>
        public static string FormatChapterQuestHeaderTitle(string chapterDisplayName, string questDisplayName)
        {
            var chapter = chapterDisplayName?.Trim();
            var quest = questDisplayName?.Trim();
            if (string.IsNullOrEmpty(quest))
                return chapter ?? string.Empty;
            if (string.IsNullOrEmpty(chapter))
                return quest;
            return $"{chapter} · {quest}";
        }
    }
}
