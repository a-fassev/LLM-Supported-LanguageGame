using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace LanguageGame.Application
{
    /// <summary>
    /// HTTP client for local Next.js auth API. Place on the same object as <see cref="GameFlowController"/>.
    /// </summary>
    public class AuthApiClient : MonoBehaviour
    {
        [SerializeField] private string apiBaseUrl = "http://127.0.0.1:3000";

        public string ApiBaseUrl => apiBaseUrl.TrimEnd('/');

        public IEnumerator SuggestUsername(Action<string> onSuccess, Action<string> onError)
        {
            using var req = UnityWebRequest.Get($"{ApiBaseUrl}/api/auth/suggest-username");
            req.downloadHandler = new DownloadHandlerBuffer();
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                onError?.Invoke(req.error);
                yield break;
            }

            var wrap = JsonUtility.FromJson<OkUsername>(req.downloadHandler.text);
            if (wrap == null || !wrap.ok || string.IsNullOrEmpty(wrap.username))
            {
                onError?.Invoke(GameClientMessages.InvalidServerResponse);
                yield break;
            }

            onSuccess?.Invoke(wrap.username);
        }

        public IEnumerator Register(string username, string password, string passwordConfirm,
            Action<string, string> onSuccess, Action<string> onError)
        {
            var body = JsonUtility.ToJson(new RegisterRequest
            {
                username = username,
                password = password,
                passwordConfirm = passwordConfirm,
            });

            using var req = new UnityWebRequest($"{ApiBaseUrl}/api/auth/register", "POST");
            req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.uploadHandler.contentType = "application/json";
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                onError?.Invoke(req.error);
                yield break;
            }

            var text = req.downloadHandler.text;
            var ok = JsonUtility.FromJson<OkRegister>(text);
            if (ok != null && ok.ok && !string.IsNullOrEmpty(ok.username))
            {
                onSuccess?.Invoke(ok.username, ok.team ?? string.Empty);
                yield break;
            }

            var err = JsonUtility.FromJson<ErrorBody>(text);
            onError?.Invoke(!string.IsNullOrEmpty(err?.error) ? err.error : GameClientMessages.RegistrationFailed);
        }

        public IEnumerator Login(string username, string password, Action onSuccess, Action<string> onError)
        {
            var body = JsonUtility.ToJson(new LoginRequest
            {
                username = username,
                password = password,
            });

            using var req = new UnityWebRequest($"{ApiBaseUrl}/api/auth/login", "POST");
            req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.uploadHandler.contentType = "application/json";
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                onError?.Invoke(req.error);
                yield break;
            }

            var text = req.downloadHandler.text;
            var ok = JsonUtility.FromJson<LoginOk>(text);
            if (ok != null && ok.ok && !string.IsNullOrEmpty(ok.token))
            {
                AuthSessionStore.Save(ok.token, ok.username);
                onSuccess?.Invoke();
                yield break;
            }

            var err = JsonUtility.FromJson<ErrorBody>(text);
            onError?.Invoke(!string.IsNullOrEmpty(err?.error) ? err.error : GameClientMessages.LoginFailed);
        }

        public IEnumerator ValidateSession(Action onValid, Action<string> onInvalid)
        {
            var token = AuthSessionStore.GetToken();
            if (string.IsNullOrEmpty(token))
            {
                onInvalid?.Invoke(GameClientMessages.NoSavedSession);
                yield break;
            }

            using var req = UnityWebRequest.Get($"{ApiBaseUrl}/api/auth/session");
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Authorization", $"Bearer {token}");
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                onInvalid?.Invoke(req.error);
                yield break;
            }

            var ok = JsonUtility.FromJson<SessionOk>(req.downloadHandler.text);
            if (ok != null && ok.ok && !string.IsNullOrEmpty(ok.username))
            {
                AuthSessionStore.Save(token, ok.username);
                onValid?.Invoke();
                yield break;
            }

            onInvalid?.Invoke(GameClientMessages.SessionExpired);
        }

        public IEnumerator LogoutRemote(Action onDone, Action<string> onError)
        {
            var token = AuthSessionStore.GetToken();
            if (string.IsNullOrEmpty(token))
            {
                onDone?.Invoke();
                yield break;
            }

            var body = JsonUtility.ToJson(new LogoutRequest { token = token });
            using var req = new UnityWebRequest($"{ApiBaseUrl}/api/auth/logout", "POST");
            req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.uploadHandler.contentType = "application/json";
            req.SetRequestHeader("Content-Type", "application/json");
            req.SetRequestHeader("Authorization", $"Bearer {token}");
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                onError?.Invoke(req.error);
                yield break;
            }

            onDone?.Invoke();
        }

        [Serializable]
        private class RegisterRequest
        {
            public string username;
            public string password;
            public string passwordConfirm;
        }

        [Serializable]
        private class LoginRequest
        {
            public string username;
            public string password;
        }

        [Serializable]
        private class LogoutRequest
        {
            public string token;
        }

        [Serializable]
        private class OkUsername
        {
            public bool ok;
            public string username;
        }

        [Serializable]
        private class OkRegister
        {
            public bool ok;
            public string username;
            public string team;
        }

        [Serializable]
        private class LoginOk
        {
            public bool ok;
            public string token;
            public string username;
            public string expiresAt;
        }

        [Serializable]
        private class SessionOk
        {
            public bool ok;
            public string username;
            public string expiresAt;
        }

        [Serializable]
        private class ErrorBody
        {
            public bool ok;
            public string error;
        }
    }
}
