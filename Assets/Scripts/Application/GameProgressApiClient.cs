using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace LanguageGame.Application
{
    /// <summary>
    /// HTTP client for game progress API (Bearer session). Lives beside <see cref="AuthApiClient"/> on GameFlow.
    /// Task completion and cutscene advance responses normally use camelCase (Next.js). When those keys are absent,
    /// snake_case fields (e.g. raw RPC-shaped JSON) are merged via a companion wire-type <c>JsonUtility</c> parse.
    /// </summary>
    public class GameProgressApiClient : MonoBehaviour
    {
        [SerializeField] private AuthApiClient authApiClient;

        /// <summary>
        /// Whether this response indicates the bearer session is no longer valid.
        /// Prefer <paramref name="httpStatusCode"/> when available; <paramref name="message"/> is fallback/JSON body text.
        /// </summary>
        public static bool LooksLikeSessionAuthFailure(string message, long httpStatusCode = 0)
        {
            if (httpStatusCode == 401 || httpStatusCode == 403)
                return true;

            if (string.IsNullOrWhiteSpace(message))
                return false;

            var trimmed = message.Trim();
            if (trimmed.Length > 0 && trimmed[0] == '{')
            {
                var env = JsonUtility.FromJson<GameApiErrorEnvelope>(trimmed);
                if (env != null && ErrorCodeIndicatesSessionFailure(env.code))
                    return true;
                if (!string.IsNullOrEmpty(env?.error))
                    return LooksLikeSessionAuthFailure(env.error, 0);
            }

            if (trimmed.Equals("Unauthorized", StringComparison.OrdinalIgnoreCase))
                return true;
            if (trimmed.Equals("Forbidden", StringComparison.OrdinalIgnoreCase))
                return true;

            var lower = trimmed.ToLowerInvariant();
            string[] phrases =
            {
                "not logged in",
                "session expired",
                "please sign in",
                "invalid token",
                "jwt expired",
                "jwt malformed",
                "token expired",
                "missing authorization",
                "authorization required",
                "invalid session",
                "auth required",
                "\"code\":401",
                "\"code\":403",
            };

            foreach (var phrase in phrases)
            {
                if (lower.Contains(phrase))
                    return true;
            }

            return false;
        }

        /// <summary>Optional API <see cref="GameApiErrorEnvelope.code"/> field (future-proof; substring list remains fallback).</summary>
        private static bool ErrorCodeIndicatesSessionFailure(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return false;
            var c = code.Trim();
            if (c.Equals("401", StringComparison.Ordinal) || c.Equals("403", StringComparison.Ordinal))
                return true;
            return c.Equals("UNAUTHORIZED", StringComparison.OrdinalIgnoreCase)
                   || c.Equals("FORBIDDEN", StringComparison.OrdinalIgnoreCase)
                   || c.Equals("SESSION_EXPIRED", StringComparison.OrdinalIgnoreCase)
                   || c.Equals("INVALID_TOKEN", StringComparison.OrdinalIgnoreCase);
        }

        private void Awake()
        {
            if (authApiClient == null)
                authApiClient = GetComponent<AuthApiClient>();
        }

        public string ApiBaseUrl =>
            authApiClient != null ? authApiClient.ApiBaseUrl : "http://127.0.0.1:3000";

        public IEnumerator GetLeaderboard(Action<GameLeaderboardEnvelope> onOk, Action<string> onError)
        {
            yield return AuthorizedGet(
                "/api/game/leaderboard",
                text =>
                {
                    var env = JsonUtility.FromJson<GameLeaderboardEnvelope>(text);
                    if (env != null && env.ok && env.self != null)
                    {
                        onOk?.Invoke(env);
                        return;
                    }

                    onError?.Invoke(ParseErrorMessage(text, "Invalid leaderboard response"));
                },
                onError);
        }

        public IEnumerator GetBootstrap(Action<GameBootstrapEnvelope> onOk, Action<string> onError)
        {
            yield return AuthorizedGet(
                "/api/game/bootstrap",
                text =>
                {
                    var env = JsonUtility.FromJson<GameBootstrapEnvelope>(text);
                    if (env != null && env.ok)
                    {
                        onOk?.Invoke(env);
                        return;
                    }
                    onError?.Invoke(ParseErrorMessage(text, "Invalid bootstrap response"));
                },
                onError);
        }

        public IEnumerator StartQuest(string questId, Action<GameStartQuestEnvelope> onOk, Action<string> onError)
        {
            var path = $"/api/game/quests/{Uri.EscapeDataString(questId)}/start";
            yield return AuthorizedPostEmpty(path, text =>
            {
                var env = JsonUtility.FromJson<GameStartQuestEnvelope>(text);
                if (env != null && env.ok)
                {
                    onOk?.Invoke(env);
                    return;
                }
                onError?.Invoke(!string.IsNullOrEmpty(env?.error)
                    ? env.error
                    : ParseErrorMessage(text, "Could not start quest"));
            }, onError);
        }

        public IEnumerator CompleteStepTask(string runId, string stepId,
            Action<GameCompleteTaskEnvelope> onOk, Action<string> onError,
            string evaluationGateToken = null, string taskAttemptJson = null)
        {
            var path =
                $"/api/game/runs/{Uri.EscapeDataString(runId)}/steps/{Uri.EscapeDataString(stepId)}/complete";

            var body = BuildCompleteTaskBody(evaluationGateToken, taskAttemptJson);
            if (body == null)
            {
                yield return AuthorizedPostEmpty(path, text =>
                {
                    var env = JsonUtility.FromJson<GameCompleteTaskEnvelope>(text);
                    MergeCompleteTaskEnvelopeSnakeCase(text, env);
                    if (env != null && env.ok)
                    {
                        onOk?.Invoke(env);
                        return;
                    }
                    onError?.Invoke(!string.IsNullOrEmpty(env?.error)
                        ? env.error
                        : ParseErrorMessage(text, "Could not complete task"));
                }, onError);
                yield break;
            }

            var bytes = Encoding.UTF8.GetBytes(body);
            yield return AuthorizedPostUtf8(path, bytes, text =>
            {
                var env = JsonUtility.FromJson<GameCompleteTaskEnvelope>(text);
                MergeCompleteTaskEnvelopeSnakeCase(text, env);
                if (env != null && env.ok)
                {
                    onOk?.Invoke(env);
                    return;
                }
                onError?.Invoke(!string.IsNullOrEmpty(env?.error)
                    ? env.error
                    : ParseErrorMessage(text, "Could not complete task"));
            }, onError);
        }

        private static string BuildCompleteTaskBody(string evaluationGateToken, string taskAttemptJson)
        {
            var hasGate = !string.IsNullOrWhiteSpace(evaluationGateToken);
            var hasAttempt = !string.IsNullOrWhiteSpace(taskAttemptJson);
            if (!hasGate && !hasAttempt)
                return null;

            var sb = new StringBuilder();
            sb.Append('{');
            if (hasGate)
            {
                sb.Append("\"evaluationGateToken\":\"");
                sb.Append(EscapeJsonString(evaluationGateToken.Trim()));
                sb.Append('"');
            }

            if (hasAttempt)
            {
                if (hasGate)
                    sb.Append(',');
                sb.Append("\"attempt\":");
                sb.Append(taskAttemptJson.Trim());
            }

            sb.Append('}');
            return sb.ToString();
        }

        private static string EscapeJsonString(string s)
        {
            if (string.IsNullOrEmpty(s))
                return string.Empty;
            var sb = new StringBuilder();
            foreach (var ch in s)
            {
                switch (ch)
                {
                    case '\\':
                        sb.Append("\\\\");
                        break;
                    case '"':
                        sb.Append("\\\"");
                        break;
                    default:
                        sb.Append(ch);
                        break;
                }
            }

            return sb.ToString();
        }

        public IEnumerator EvaluateFreitextLlmStep(string runId, string stepId, string answerText,
            Action<GameFreitextLlmEvaluateEnvelope> onOk, Action<string> onError)
        {
            var path =
                $"/api/game/runs/{Uri.EscapeDataString(runId)}/steps/{Uri.EscapeDataString(stepId)}/evaluate";

            var payload = JsonUtility.ToJson(new FreitextLlmEvaluateAnswerBodyDto
            {
                answerText = answerText ?? string.Empty,
            });
            var bytes = Encoding.UTF8.GetBytes(payload ?? "{}");

            yield return AuthorizedPostUtf8(path, bytes, text =>
            {
                var env = JsonUtility.FromJson<GameFreitextLlmEvaluateEnvelope>(text);
                if (env != null && env.ok)
                {
                    onOk?.Invoke(env);
                    return;
                }

                var message = env != null && !string.IsNullOrEmpty(env.error)
                    ? env.error
                    : ParseErrorMessage(text, "FreitextLlm scorer failed.");

                if (env != null && !string.IsNullOrEmpty(env.code))
                    message = $"{message} ({env.code})";

                onError?.Invoke(message);
            }, onError);
        }

        public IEnumerator AdvanceCutsceneStep(string runId, string stepId,
            Action<GameCompleteTaskEnvelope> onOk, Action<string> onError)
        {
            var path =
                $"/api/game/runs/{Uri.EscapeDataString(runId)}/steps/{Uri.EscapeDataString(stepId)}/advance";
            yield return AuthorizedPostEmpty(path, text =>
            {
                var env = JsonUtility.FromJson<GameCompleteTaskEnvelope>(text);
                MergeCompleteTaskEnvelopeSnakeCase(text, env);
                if (env != null && env.ok)
                {
                    onOk?.Invoke(env);
                    return;
                }
                onError?.Invoke(!string.IsNullOrEmpty(env?.error)
                    ? env.error
                    : ParseErrorMessage(text, "Could not advance scene"));
            }, onError);
        }

        public IEnumerator FinishRun(string runId, Action<GameFinishEnvelope> onOk, Action<string> onError)
        {
            var path = $"/api/game/runs/{Uri.EscapeDataString(runId)}/finish";
            yield return AuthorizedPostEmpty(path, text =>
            {
                var env = JsonUtility.FromJson<GameFinishEnvelope>(text);
                if (env != null && env.ok)
                {
                    onOk?.Invoke(env);
                    return;
                }
                onError?.Invoke(!string.IsNullOrEmpty(env?.error)
                    ? env.error
                    : ParseErrorMessage(text, "Could not finish run"));
            }, onError);
        }

        private IEnumerator AuthorizedGet(string path, Action<string> onBody, Action<string> onError)
        {
            var token = AuthSessionStore.GetToken();
            if (string.IsNullOrEmpty(token))
            {
                onError?.Invoke("Not logged in");
                yield break;
            }

            using var req = UnityWebRequest.Get($"{ApiBaseUrl}{path}");
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Authorization", $"Bearer {token}");
            yield return req.SendWebRequest();

            var statusCode = req.responseCode;
            if (statusCode == 401 || statusCode == 403)
            {
                ClearSessionAfterUnauthorized();
                onError?.Invoke("Session expired. Please sign in again.");
                yield break;
            }

            if (req.result != UnityWebRequest.Result.Success)
            {
                onError?.Invoke(req.error);
                yield break;
            }

            onBody?.Invoke(req.downloadHandler.text);
        }

        private IEnumerator AuthorizedPostEmpty(string path, Action<string> onBody, Action<string> onError)
        {
            var token = AuthSessionStore.GetToken();
            if (string.IsNullOrEmpty(token))
            {
                onError?.Invoke("Not logged in");
                yield break;
            }

            using var req = new UnityWebRequest($"{ApiBaseUrl}{path}", UnityWebRequest.kHttpVerbPOST);
            req.uploadHandler = new UploadHandlerRaw(Array.Empty<byte>());
            req.downloadHandler = new DownloadHandlerBuffer();
            req.uploadHandler.contentType = "application/json";
            req.SetRequestHeader("Authorization", $"Bearer {token}");
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();

            var statusCode = req.responseCode;
            if (statusCode == 401 || statusCode == 403)
            {
                ClearSessionAfterUnauthorized();
                onError?.Invoke("Session expired. Please sign in again.");
                yield break;
            }

            if (req.result != UnityWebRequest.Result.Success)
            {
                var text = req.downloadHandler != null ? req.downloadHandler.text : string.Empty;
                onError?.Invoke(!string.IsNullOrEmpty(text) ? ParseErrorMessage(text, req.error) : req.error);
                yield break;
            }

            onBody?.Invoke(req.downloadHandler.text);
        }

        private IEnumerator AuthorizedPostUtf8(string path, byte[] bodyBytes, Action<string> onBody, Action<string> onError)
        {
            var token = AuthSessionStore.GetToken();
            if (string.IsNullOrEmpty(token))
            {
                onError?.Invoke("Not logged in");
                yield break;
            }

            var payload = bodyBytes ?? Array.Empty<byte>();

            using var req = new UnityWebRequest($"{ApiBaseUrl}{path}", UnityWebRequest.kHttpVerbPOST);
            req.uploadHandler = new UploadHandlerRaw(payload);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.uploadHandler.contentType = "application/json";
            req.SetRequestHeader("Authorization", $"Bearer {token}");
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();

            var statusCode = req.responseCode;
            if (statusCode == 401 || statusCode == 403)
            {
                ClearSessionAfterUnauthorized();
                onError?.Invoke("Session expired. Please sign in again.");
                yield break;
            }

            if (req.result != UnityWebRequest.Result.Success)
            {
                var text = req.downloadHandler != null ? req.downloadHandler.text : string.Empty;
                onError?.Invoke(!string.IsNullOrEmpty(text) ? ParseErrorMessage(text, req.error) : req.error);
                yield break;
            }

            onBody?.Invoke(req.downloadHandler.text);
        }

        private static void ClearSessionAfterUnauthorized()
        {
            AuthSessionStore.Clear();
            GameSessionStateStore.Clear();
        }

        private static string ParseErrorMessage(string json, string fallback)
        {
            if (string.IsNullOrEmpty(json))
                return fallback;
            var err = JsonUtility.FromJson<GameApiErrorEnvelope>(json);
            return !string.IsNullOrEmpty(err?.error) ? err.error : fallback;
        }

        /// <summary>
        /// <see cref="JsonUtility"/> maps field names exactly. Prefer camelCase; copy snake_case when a camel key is missing.
        /// </summary>
        private static void MergeCompleteTaskEnvelopeSnakeCase(string json, GameCompleteTaskEnvelope env)
        {
            if (env == null || string.IsNullOrEmpty(json) || !env.ok)
                return;

            var sn = JsonUtility.FromJson<GameCompleteTaskEnvelopeSnake>(json);

            if (!JsonKeyPresent(json, "awardedSlices") && JsonKeyPresent(json, "awarded_slices"))
                env.awardedSlices = sn.awarded_slices;

            if (!JsonKeyPresent(json, "awardedBackpackPieces") && JsonKeyPresent(json, "awarded_backpack_pieces"))
                env.awardedBackpackPieces = sn.awarded_backpack_pieces;

            if (!JsonKeyPresent(json, "totalSlices") && JsonKeyPresent(json, "total_slices"))
                env.totalSlices = sn.total_slices;

            if (!JsonKeyPresent(json, "totalBackpackPieces") && JsonKeyPresent(json, "total_backpack_pieces"))
                env.totalBackpackPieces = sn.total_backpack_pieces;

            if (!JsonKeyPresent(json, "questComplete") && JsonKeyPresent(json, "quest_complete"))
                env.questComplete = sn.quest_complete;

            if (!JsonKeyPresent(json, "currentStepOrderIndex") && JsonKeyPresent(json, "current_step_order_index"))
                env.currentStepOrderIndex = sn.current_step_order_index;

            if (!JsonKeyPresent(json, "currentTaskOrderIndex") && JsonKeyPresent(json, "current_task_order_index"))
                env.currentTaskOrderIndex = sn.current_task_order_index;

            if (!JsonKeyPresent(json, "nextTaskStepId") && JsonKeyPresent(json, "next_task_step_id"))
                env.nextTaskStepId = sn.next_task_step_id ?? string.Empty;

            if (!JsonKeyPresent(json, "taskItemsCorrect") && JsonKeyPresent(json, "task_items_correct"))
                env.taskItemsCorrect = sn.task_items_correct;

            if (!JsonKeyPresent(json, "taskItemsTotal") && JsonKeyPresent(json, "task_items_total"))
                env.taskItemsTotal = sn.task_items_total;

            NormalizeTaskItemsFieldsFromJson(json, env);
        }

        /// <summary>
        /// <see cref="JsonUtility"/> only assigns fields present in JSON. When either score key is missing
        /// (camelCase or snake_case), or only one of the two is present, normalize both to <c>-1</c> so the
        /// client never shows a bogus partial breakdown (e.g. legacy servers).
        /// </summary>
        private static void NormalizeTaskItemsFieldsFromJson(string json, GameCompleteTaskEnvelope env)
        {
            if (env == null || string.IsNullOrEmpty(json))
                return;

            var hasCorrect =
                JsonKeyPresent(json, "taskItemsCorrect") || JsonKeyPresent(json, "task_items_correct");
            var hasTotal =
                JsonKeyPresent(json, "taskItemsTotal") || JsonKeyPresent(json, "task_items_total");
            if (!hasCorrect || !hasTotal)
            {
                env.taskItemsCorrect = -1;
                env.taskItemsTotal = -1;
            }
        }

        /// <summary>True when <paramref name="key"/> appears as a JSON object property (immediately before <c>:</c>).</summary>
        private static bool JsonKeyPresent(string json, string key)
        {
            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(key))
                return false;
            var needle = $"\"{key}\"";
            for (var i = 0;;)
            {
                var idx = json.IndexOf(needle, i, StringComparison.Ordinal);
                if (idx < 0)
                    return false;
                var j = idx + needle.Length;
                while (j < json.Length && char.IsWhiteSpace(json[j]))
                    j++;
                if (j < json.Length && json[j] == ':')
                    return true;
                i = idx + 1;
            }
        }

        /// <summary>Wire DTO for PostgREST/RPC-style responses; used only after <c>GameCompleteTaskEnvelope</c> parse.</summary>
        [Serializable]
        private sealed class GameCompleteTaskEnvelopeSnake
        {
            public bool ok;
            public int awarded_slices;
            public int awarded_backpack_pieces;
            public int total_slices;
            public int total_backpack_pieces;
            public bool quest_complete;
            public int current_step_order_index;
            public int current_task_order_index;
            public string next_task_step_id;
            public string error;
            public int task_items_correct;
            public int task_items_total;
        }
    }
}
