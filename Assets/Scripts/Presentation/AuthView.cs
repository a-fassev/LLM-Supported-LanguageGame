using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UI;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Privacy-safe auth: generated username + password (wired at runtime if no references assigned).
    /// </summary>
    public class AuthView : MonoBehaviour
    {
        [SerializeField] private GameObject host;
        [SerializeField] private AuthApiClient apiClient;

        private string _suggestedUsername = string.Empty;
        private Text _usernameLabel;
        private InputField _loginUser;
        private InputField _loginPass;
        private InputField _regPassA;
        private InputField _regPassB;
        private Text _status;
        private GameObject _loginPanel;
        private GameObject _registerPanel;

        private void Awake()
        {
            if (host == null)
                host = gameObject;
            if (apiClient == null)
                apiClient = FindFirstObjectByType<AuthApiClient>();

            BuildUiIfNeeded();
        }

        private void Start()
        {
            if (apiClient == null)
            {
                SetStatus("Auth API client missing. Add AuthApiClient to the GameFlow object.");
                return;
            }

            var flow = GameFlowController.Instance;
            if (flow == null)
            {
                SetStatus("GameFlowController missing.");
                return;
            }

            StartCoroutine(TryResumeSession());
            RefreshSuggestedUsername();
        }

        private IEnumerator TryResumeSession()
        {
            yield return apiClient.ValidateSession(
                onValid: () => { GameFlowController.Instance?.LoadMainMenu(); },
                onInvalid: _ => { /* stay on auth */ });
        }

        private void BuildUiIfNeeded()
        {
            if (host.transform.childCount > 0)
                return;

            var canvas = host.GetComponent<Canvas>();
            if (canvas == null)
            {
                Debug.LogError("[AuthView] Host must have a Canvas component.");
                return;
            }

            var font = Resources.GetBuiltinResource<Font>("Arial.ttf")
                       ?? Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            var bg = new GameObject("Background");
            bg.transform.SetParent(host.transform, false);
            var bgRt = bg.AddComponent<RectTransform>();
            StretchFull(bgRt);
            var bgImg = bg.AddComponent<Image>();
            bgImg.color = new Color(0.13f, 0.13f, 0.2f);

            var titleGo = new GameObject("Title");
            titleGo.transform.SetParent(host.transform, false);
            var titleRt = titleGo.AddComponent<RectTransform>();
            titleRt.anchorMin = new Vector2(0.1f, 0.78f);
            titleRt.anchorMax = new Vector2(0.9f, 0.92f);
            titleRt.offsetMin = Vector2.zero;
            titleRt.offsetMax = Vector2.zero;
            var title = titleGo.AddComponent<Text>();
            title.font = font;
            title.fontSize = 48;
            title.fontStyle = FontStyle.Bold;
            title.alignment = TextAnchor.MiddleCenter;
            title.color = Color.white;
            title.text = "Sign in";

            _status = CreateText(host.transform, "Status", new Vector2(0.1f, 0.66f), new Vector2(0.9f, 0.76f), 22, TextAnchor.MiddleCenter,
                new Color(1f, 0.85f, 0.3f), font ?? Resources.GetBuiltinResource<Font>("Arial.ttf"));
            _status.text = string.Empty;

            _loginPanel = new GameObject("LoginPanel");
            _loginPanel.transform.SetParent(host.transform, false);
            var lpRt = _loginPanel.AddComponent<RectTransform>();
            lpRt.anchorMin = new Vector2(0.2f, 0.32f);
            lpRt.anchorMax = new Vector2(0.8f, 0.64f);
            lpRt.offsetMin = Vector2.zero;
            lpRt.offsetMax = Vector2.zero;

            _loginUser = CreateInput(_loginPanel.transform, "LoginUsername", "Username", font, isPassword: false,
                new Vector2(0.05f, 0.62f), new Vector2(0.95f, 0.92f));
            _loginPass = CreateInput(_loginPanel.transform, "LoginPassword", "Password", font, isPassword: true,
                new Vector2(0.05f, 0.32f), new Vector2(0.95f, 0.58f));
            CreateButton(_loginPanel.transform, "LoginButton", "Log in", font, new Vector2(0.25f, 0.02f), new Vector2(0.75f, 0.26f),
                OnLoginClicked);

            CreateButton(_loginPanel.transform, "ToRegister", "New here? Register", font,
                new Vector2(0.1f, 0.0f), new Vector2(0.9f, 0.18f), () => ShowRegister(true))
                .GetComponent<Image>().color = new Color(0.25f, 0.35f, 0.5f, 0.9f);

            _registerPanel = new GameObject("RegisterPanel");
            _registerPanel.transform.SetParent(host.transform, false);
            var rpRt = _registerPanel.AddComponent<RectTransform>();
            rpRt.anchorMin = new Vector2(0.15f, 0.22f);
            rpRt.anchorMax = new Vector2(0.85f, 0.72f);
            rpRt.offsetMin = Vector2.zero;
            rpRt.offsetMax = Vector2.zero;

            var userRow = new GameObject("UsernameRow");
            userRow.transform.SetParent(_registerPanel.transform, false);
            var urRt = userRow.AddComponent<RectTransform>();
            urRt.anchorMin = new Vector2(0.05f, 0.72f);
            urRt.anchorMax = new Vector2(0.95f, 0.95f);
            urRt.offsetMin = Vector2.zero;
            urRt.offsetMax = Vector2.zero;

            _usernameLabel = CreateText(userRow.transform, "UsernameValue", new Vector2(0f, 0f), new Vector2(0.68f, 1f), 28,
                TextAnchor.MiddleLeft, Color.white, font);
            _usernameLabel.text = "(generating...)";

            CreateButton(userRow.transform, "Regenerate", "New name", font, new Vector2(0.7f, 0.05f), new Vector2(0.98f, 0.95f),
                RefreshSuggestedUsername);

            _regPassA = CreateInput(_registerPanel.transform, "RegPassA", "Password", font, true,
                new Vector2(0.05f, 0.48f), new Vector2(0.95f, 0.68f));
            _regPassB = CreateInput(_registerPanel.transform, "RegPassB", "Repeat password", font, true,
                new Vector2(0.05f, 0.26f), new Vector2(0.95f, 0.46f));

            CreateButton(_registerPanel.transform, "RegisterBtn", "Create account", font, new Vector2(0.25f, 0.02f),
                new Vector2(0.75f, 0.2f), OnRegisterClicked);

            CreateButton(_registerPanel.transform, "ToLogin", "Have an account? Log in", font, new Vector2(0.15f, -0.22f),
                new Vector2(0.85f, -0.02f), () => ShowRegister(false));
            ShowRegister(false);
        }

        private static void StretchFull(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        private static Text CreateText(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax, int size,
            TextAnchor align, Color color, Font font)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var t = go.AddComponent<Text>();
            t.font = font;
            t.fontSize = size;
            t.alignment = align;
            t.color = color;
            return t;
        }

        private static Button CreateButton(Transform parent, string name, string label, Font font, Vector2 aMin,
            Vector2 aMax, UnityEngine.Events.UnityAction onClick)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = aMin;
            rt.anchorMax = aMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = go.AddComponent<Image>();
            img.color = new Color(0.2f, 0.55f, 0.85f);
            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;
            btn.onClick.AddListener(onClick);

            var txtGo = new GameObject("Text");
            txtGo.transform.SetParent(go.transform, false);
            var trt = txtGo.AddComponent<RectTransform>();
            StretchFull(trt);
            var t = txtGo.AddComponent<Text>();
            t.font = font;
            t.fontSize = 26;
            t.fontStyle = FontStyle.Bold;
            t.alignment = TextAnchor.MiddleCenter;
            t.color = Color.white;
            t.text = label;
            return btn;
        }

        private static InputField CreateInput(Transform parent, string name, string placeholder, Font font, bool isPassword,
            Vector2 aMin, Vector2 aMax)
        {
            var root = new GameObject(name);
            root.transform.SetParent(parent, false);
            var rt = root.AddComponent<RectTransform>();
            rt.anchorMin = aMin;
            rt.anchorMax = aMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            var bg = root.AddComponent<Image>();
            bg.color = new Color(1f, 1f, 1f, 0.12f);

            var inp = root.AddComponent<InputField>();
            inp.contentType = isPassword ? InputField.ContentType.Password : InputField.ContentType.Standard;
            var textGo = new GameObject("Text");
            textGo.transform.SetParent(root.transform, false);
            var tRt = textGo.AddComponent<RectTransform>();
            tRt.anchorMin = new Vector2(0.02f, 0.1f);
            tRt.anchorMax = new Vector2(0.98f, 0.9f);
            tRt.offsetMin = Vector2.zero;
            tRt.offsetMax = Vector2.zero;
            var t = textGo.AddComponent<Text>();
            t.font = font;
            t.fontSize = 26;
            t.color = Color.white;
            t.supportRichText = false;
            t.raycastTarget = true;
            inp.textComponent = t;

            var phGo = new GameObject("Placeholder");
            phGo.transform.SetParent(root.transform, false);
            var pRt = phGo.AddComponent<RectTransform>();
            StretchFull(pRt);
            var pt = phGo.AddComponent<Text>();
            pt.font = font;
            pt.fontSize = 24;
            pt.fontStyle = FontStyle.Italic;
            pt.color = new Color(1f, 1f, 1f, 0.45f);
            pt.text = placeholder;
            pt.raycastTarget = false;
            inp.placeholder = pt;

            return inp;
        }

        private void ShowRegister(bool register)
        {
            if (_loginPanel != null) _loginPanel.SetActive(!register);
            if (_registerPanel != null) _registerPanel.SetActive(register);
            SetStatus(string.Empty);
        }

        private void SetStatus(string msg)
        {
            if (_status != null)
                _status.text = msg ?? string.Empty;
            else if (!string.IsNullOrEmpty(msg))
                Debug.LogWarning("[AuthView] " + msg);
        }

        private void RefreshSuggestedUsername()
        {
            if (apiClient == null)
                return;
            StartCoroutine(apiClient.SuggestUsername(
                u =>
                {
                    _suggestedUsername = u;
                    if (_usernameLabel != null)
                        _usernameLabel.text = u;
                },
                err => SetStatus("Could not get username: " + err)));
        }

        private void OnRegisterClicked()
        {
            if (apiClient == null)
                return;
            if (string.IsNullOrEmpty(_suggestedUsername))
            {
                SetStatus("Please wait for a username.");
                return;
            }

            var a = _regPassA != null ? _regPassA.text : string.Empty;
            var b = _regPassB != null ? _regPassB.text : string.Empty;
            if (a != b)
            {
                SetStatus("Passwords do not match.");
                return;
            }

            if (a.Length < 8)
            {
                SetStatus("Password must be at least 8 characters.");
                return;
            }

            SetStatus("Creating account...");
            StartCoroutine(apiClient.Register(_suggestedUsername, a, b,
                username =>
                {
                    SetStatus("Account ready. Username: " + username + " — you can log in now.");
                    ShowRegister(false);
                    if (_loginUser != null) _loginUser.text = username;
                },
                err => SetStatus(err)));
        }

        private void OnLoginClicked()
        {
            if (apiClient == null)
                return;
            var u = _loginUser != null ? _loginUser.text.Trim() : string.Empty;
            var p = _loginPass != null ? _loginPass.text : string.Empty;
            if (string.IsNullOrEmpty(u) || string.IsNullOrEmpty(p))
            {
                SetStatus("Enter username and password.");
                return;
            }

            SetStatus("Signing in...");
            StartCoroutine(apiClient.Login(u, p,
                () =>
                {
                    SetStatus(string.Empty);
                    GameFlowController.Instance?.LoadMainMenu();
                },
                err => SetStatus(err)));
        }
    }
}
