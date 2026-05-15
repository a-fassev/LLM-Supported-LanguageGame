using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace LanguageGame.Application
{
    /// <summary>
    /// HTTP client for game progress API (Bearer session). Lives beside <see cref="AuthApiClient"/> on GameFlow.
    /// </summary>
    public class GameProgressApiClient : MonoBehaviour
    {
        [SerializeField] private AuthApiClient authApiClient;

        private void Awake()
        {
            if (authApiClient == null)
                authApiClient = GetComponent<AuthApiClient>();
        }

        public string ApiBaseUrl =>
            authApiClient != null ? authApiClient.ApiBaseUrl : "http://127.0.0.1:3000";

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

        public IEnumerator StartLevel(string levelId, Action<GameStartLevelEnvelope> onOk, Action<string> onError)
        {
            var path = $"/api/game/levels/{Uri.EscapeDataString(levelId)}/start";
            yield return AuthorizedPostEmpty(path, text =>
            {
                var env = JsonUtility.FromJson<GameStartLevelEnvelope>(text);
                if (env != null && env.ok)
                {
                    onOk?.Invoke(env);
                    return;
                }
                onError?.Invoke(!string.IsNullOrEmpty(env?.error)
                    ? env.error
                    : ParseErrorMessage(text, "Could not start level"));
            }, onError);
        }

        public IEnumerator CompleteTask(string runId, string taskId,
            Action<GameCompleteTaskEnvelope> onOk, Action<string> onError)
        {
            var path =
                $"/api/game/runs/{Uri.EscapeDataString(runId)}/tasks/{Uri.EscapeDataString(taskId)}/complete";
            yield return AuthorizedPostEmpty(path, text =>
            {
                var env = JsonUtility.FromJson<GameCompleteTaskEnvelope>(text);
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

            if (req.result != UnityWebRequest.Result.Success)
            {
                var text = req.downloadHandler != null ? req.downloadHandler.text : string.Empty;
                onError?.Invoke(!string.IsNullOrEmpty(text) ? ParseErrorMessage(text, req.error) : req.error);
                yield break;
            }

            onBody?.Invoke(req.downloadHandler.text);
        }

        private static string ParseErrorMessage(string json, string fallback)
        {
            if (string.IsNullOrEmpty(json))
                return fallback;
            var err = JsonUtility.FromJson<GameApiErrorEnvelope>(json);
            return !string.IsNullOrEmpty(err?.error) ? err.error : fallback;
        }
    }
}
