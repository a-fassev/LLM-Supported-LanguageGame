using System;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Infrastructure.Persistence
{
    public sealed class PersistenceRepositories
    {
        public PersistenceRepositories(IProgressRepository progress, IPlayerProfileRepository profile)
        {
            ProgressRepository = progress;
            PlayerProfileRepository = profile;
        }

        public IProgressRepository ProgressRepository { get; }
        public IPlayerProfileRepository PlayerProfileRepository { get; }
    }

    public static class PersistenceRepositoryFactory
    {
        public const string LocalProvider = "local";
        public const string SupabaseProvider = "supabase";

        public static PersistenceRepositories Create(string providerName, JsonSaveStore localStore)
        {
            string normalized = (providerName ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                normalized = LocalProvider;
            }

            if (normalized == SupabaseProvider)
            {
                Debug.LogWarning("[Persistence] Provider 'supabase' ist vorbereitet, aber in V1 nicht implementiert. Fallback auf 'local'.");
                return BuildLocal(localStore);
            }

            if (normalized != LocalProvider)
            {
                Debug.LogWarning($"[Persistence] Unbekannter Provider '{providerName}'. Fallback auf 'local'.");
            }

            return BuildLocal(localStore);
        }

        private static PersistenceRepositories BuildLocal(JsonSaveStore localStore)
        {
            return new PersistenceRepositories(
                new JsonProgressRepository(localStore),
                new JsonPlayerProfileRepository(localStore));
        }
    }
}
