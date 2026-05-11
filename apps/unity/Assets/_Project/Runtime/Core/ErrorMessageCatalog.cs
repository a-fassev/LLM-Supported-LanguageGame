using System.Collections.Generic;

namespace ITBL.LanguageGame.Runtime.Core
{
    public static class ErrorMessageCatalog
    {
        private static readonly IReadOnlyDictionary<AppErrorCode, string> Messages = new Dictionary<AppErrorCode, string>
        {
            { AppErrorCode.ContentInvalid, "Leveldaten sind gerade ungueltig. Bitte spaeter erneut versuchen." },
            { AppErrorCode.TaskConfigInvalid, "Diese Aufgabe konnte nicht gestartet werden." },
            { AppErrorCode.NetworkTimeout, "Die Verbindung hat zu lange gebraucht. Bitte erneut versuchen." },
            { AppErrorCode.ApiUnavailable, "Der Bewertungsdienst ist aktuell nicht verfuegbar." },
            { AppErrorCode.ApiInvalidResponse, "Die Rueckmeldung war unvollstaendig. Bitte erneut versuchen." },
            { AppErrorCode.SceneLoadFailed, "Der Szenenwechsel ist fehlgeschlagen. Wir bringen dich zurueck in den Hub." },
            { AppErrorCode.PersistenceLoadFailed, "Spielstand konnte nicht geladen werden. Es wird mit einem sicheren Standard gestartet." },
            { AppErrorCode.PersistenceSaveFailed, "Spielstand konnte nicht gespeichert werden." },
        };

        private static readonly Dictionary<AppErrorCode, string> RuntimeOverrides = new();

        /// <summary>
        /// Replaces runtime-only overrides (e.g. from <see cref="GameRuntimeConfig"/>). Clears when entries is null.
        /// </summary>
        public static void SetRuntimeOverrides(IReadOnlyList<ErrorMessageOverrideEntry> entries)
        {
            RuntimeOverrides.Clear();
            if (entries == null)
            {
                return;
            }

            foreach (ErrorMessageOverrideEntry entry in entries)
            {
                if (entry == null || string.IsNullOrWhiteSpace(entry.message))
                {
                    continue;
                }

                RuntimeOverrides[entry.code] = entry.message.Trim();
            }
        }

        public static string Resolve(AppErrorCode code)
        {
            if (RuntimeOverrides.TryGetValue(code, out string overridden))
            {
                return overridden;
            }

            if (Messages.TryGetValue(code, out string message))
            {
                return message;
            }

            return "Es ist ein unerwarteter Fehler aufgetreten.";
        }
    }
}
