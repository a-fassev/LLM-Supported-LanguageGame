using System;
using System.Collections.Generic;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Core
{
    /// <summary>
    /// Optional Resources asset: load via Resources.Load&lt;GameRuntimeConfig&gt;("GameRuntimeConfig").
    /// If missing, GameRoot uses ScriptableObject.CreateInstance defaults (same field values).
    /// Environment variable ITBL_PERSISTENCE_PROVIDER wins when set; otherwise <see cref="persistenceProviderWhenEnvUnset"/>.
    /// </summary>
    [CreateAssetMenu(fileName = "GameRuntimeConfig", menuName = "ITBL/Game Runtime Config", order = 0)]
    public sealed class GameRuntimeConfig : ScriptableObject
    {
        [Header("Level attempts")]
        [Tooltip("Resume incomplete level attempts from disk when entering a level.")]
        public bool resumeLastAttempt = true;

        [Header("Task evaluation HTTP (LLM modes)")]
        public string taskEvaluationEndpointUrl = "/api/tasks/evaluate";

        [Tooltip("Must match Next.js TASK_EVAL_API_KEY when set. Sent as x-task-eval-api-key. Leave empty for local dev without auth.")]
        public string taskEvaluationApiKey = string.Empty;

        [Min(1)]
        public int taskEvaluationTimeoutSeconds = 12;

        [Min(0)]
        public int taskEvaluationMaxRetries = 1;

        [Header("Persistence")]
        [Tooltip("Used only when ITBL_PERSISTENCE_PROVIDER is unset. Empty = local default.")]
        public string persistenceProviderWhenEnvUnset = string.Empty;

        [Header("Optional user-facing messages")]
        public List<ErrorMessageOverrideEntry> errorMessageOverrides = new();

        /// <summary>
        /// Creates an in-memory instance with default field values (same as a new asset in the editor).
        /// </summary>
        public static GameRuntimeConfig CreateDefaultInstance()
        {
            return CreateInstance<GameRuntimeConfig>();
        }
    }

    [Serializable]
    public sealed class ErrorMessageOverrideEntry
    {
        public AppErrorCode code;

        [TextArea(2, 5)]
        public string message = string.Empty;
    }
}
