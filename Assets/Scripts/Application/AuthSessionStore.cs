using UnityEngine;

namespace LanguageGame.Application
{
    /// <summary>
    /// Local session token for the Next.js backend / Supabase-backed auth flow.
    /// </summary>
    public static class AuthSessionStore
    {
        private const string TokenKey = "language_game.auth.token";
        private const string UsernameKey = "language_game.auth.username";

        public static void Save(string token, string username)
        {
            if (!string.IsNullOrEmpty(token))
                PlayerPrefs.SetString(TokenKey, token);
            if (!string.IsNullOrEmpty(username))
                PlayerPrefs.SetString(UsernameKey, username);
            PlayerPrefs.Save();
        }

        public static string GetToken()
        {
            return PlayerPrefs.GetString(TokenKey, string.Empty);
        }

        public static string GetUsername()
        {
            return PlayerPrefs.GetString(UsernameKey, string.Empty);
        }

        public static void Clear()
        {
            PlayerPrefs.DeleteKey(TokenKey);
            PlayerPrefs.DeleteKey(UsernameKey);
            PlayerPrefs.Save();
        }
    }
}
