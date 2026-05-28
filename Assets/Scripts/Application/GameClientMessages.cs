namespace LanguageGame.Application
{
    /// <summary>Italian fallback copy for game/auth HTTP clients when the API returns no error body.</summary>
    internal static class GameClientMessages
    {
        public const string NotLoggedIn = "Accesso non effettuato.";
        public const string SessionExpiredSignInAgain = "Sessione scaduta. Accedi di nuovo.";
        public const string SessionExpired = "Sessione scaduta.";
        public const string NoSavedSession = "Nessuna sessione salvata.";
        public const string InvalidServerResponse = "Risposta del server non valida.";
        public const string RegistrationFailed = "Registrazione non riuscita.";
        public const string LoginFailed = "Accesso non riuscito.";

        public const string CouldNotStartQuest = "Impossibile avviare la missione.";
        public const string CouldNotCompleteTask = "Impossibile completare l'attività.";
        public const string CouldNotAdvanceScene = "Impossibile avanzare la scena.";
        public const string CouldNotFinishRun = "Impossibile completare la missione.";
        public const string FreitextScorerFailed = "Valutazione Freitext non riuscita.";
        public const string InvalidLeaderboardResponse = "Risposta classifica non valida.";
        public const string InvalidBootstrapResponse = "Risposta dati di gioco non valida.";
    }
}
