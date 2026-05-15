using System.Collections;
using System.Collections.Generic;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UI;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Privacy-safe auth: generated username + password. UI is authored in the Auth scene (like MainMenu).
    /// </summary>
    public class AuthView : MonoBehaviour
    {
        [SerializeField] private AuthApiClient apiClient;

        [Header("Panels")]
        [SerializeField] private GameObject loginPanel;
        [SerializeField] private GameObject registerPanel;

        [Header("Fields")]
        [SerializeField] private InputField loginUsername;
        [SerializeField] private InputField loginPassword;
        [SerializeField] private InputField registerPassword;
        [SerializeField] private InputField registerPasswordConfirm;
        [SerializeField] private Text generatedUsernameText;
        [SerializeField] private Text statusText;

        [Header("Actions")]
        [SerializeField] private Button loginButton;
        [SerializeField] private Button registerButton;
        [SerializeField] private Button goToRegisterButton;
        [SerializeField] private Button goToLoginButton;
        [SerializeField] private Button newUsernameButton;

        private string _suggestedUsername = string.Empty;

        private void Awake()
        {
            if (apiClient == null)
                apiClient = FindAnyObjectByType<AuthApiClient>();

            ResolveRefsIfNeeded();
            if (!IsAuthUiComplete())
            {
                LogMissingAuthUiDiagnostics();
                ClearCanvasContentChildren();
                BuildDefaultUiUnderCanvas();
            }
            ResolveRefsIfNeeded();
            WireInputField(loginUsername);
            WireInputField(loginPassword);
            WireInputField(registerPassword);
            WireInputField(registerPasswordConfirm);
        }

        /// <summary>
        /// Returns true when scene wiring (inspector or expected paths under this Canvas) provides everything Auth needs.
        /// </summary>
        private bool IsAuthUiComplete()
        {
            return loginPanel != null && registerPanel != null && statusText != null
                && loginUsername != null && loginPassword != null
                && loginButton != null && goToRegisterButton != null
                && generatedUsernameText != null && newUsernameButton != null
                && registerPassword != null && registerPasswordConfirm != null
                && registerButton != null && goToLoginButton != null;
        }

        private void LogMissingAuthUiDiagnostics()
        {
            var missing = new List<string>(16);
            if (loginPanel == null) missing.Add(nameof(loginPanel));
            if (registerPanel == null) missing.Add(nameof(registerPanel));
            if (statusText == null) missing.Add(nameof(statusText));
            if (loginUsername == null) missing.Add(nameof(loginUsername));
            if (loginPassword == null) missing.Add(nameof(loginPassword));
            if (loginButton == null) missing.Add(nameof(loginButton));
            if (goToRegisterButton == null) missing.Add(nameof(goToRegisterButton));
            if (generatedUsernameText == null) missing.Add(nameof(generatedUsernameText));
            if (newUsernameButton == null) missing.Add(nameof(newUsernameButton));
            if (registerPassword == null) missing.Add(nameof(registerPassword));
            if (registerPasswordConfirm == null) missing.Add(nameof(registerPasswordConfirm));
            if (registerButton == null) missing.Add(nameof(registerButton));
            if (goToLoginButton == null) missing.Add(nameof(goToLoginButton));

            Debug.LogWarning(
                "[AuthView] Auth UI incomplete under \"" + gameObject.name + "\" (missing: " + string.Join(", ", missing) +
                "). Expected paths like LoginPanel/LoginUsername under this Canvas, or assign references in the Inspector. Rebuilding default UI.");
        }

        /// <summary>
        /// Removes existing Canvas children so we can rebuild without duplicate controls (Destroy is end-of-frame and would stack new UI on old).
        /// </summary>
        private void ClearCanvasContentChildren()
        {
            if (GetComponent<Canvas>() == null)
                return;
            for (var i = transform.childCount - 1; i >= 0; i--)
                DestroyImmediate(transform.GetChild(i).gameObject);
        }

        private void ResolveRefsIfNeeded()
        {
            var root = transform;
            if (loginPanel == null)
                loginPanel = root.Find("LoginPanel")?.gameObject;
            if (registerPanel == null)
                registerPanel = root.Find("RegisterPanel")?.gameObject;
            if (statusText == null)
                statusText = root.Find("StatusText")?.GetComponent<Text>();
            if (loginUsername == null)
                loginUsername = root.Find("LoginPanel/LoginUsername")?.GetComponent<InputField>();
            if (loginPassword == null)
                loginPassword = root.Find("LoginPanel/LoginPassword")?.GetComponent<InputField>();
            if (loginButton == null)
                loginButton = root.Find("LoginPanel/LoginButton")?.GetComponent<Button>();
            if (goToRegisterButton == null)
                goToRegisterButton = root.Find("LoginPanel/GoToRegisterButton")?.GetComponent<Button>();
            if (generatedUsernameText == null)
                generatedUsernameText = root.Find("RegisterPanel/UsernameRow/GeneratedUsernameText")?.GetComponent<Text>();
            if (newUsernameButton == null)
                newUsernameButton = root.Find("RegisterPanel/UsernameRow/NewUsernameButton")?.GetComponent<Button>();
            if (registerPassword == null)
                registerPassword = root.Find("RegisterPanel/RegisterPassword")?.GetComponent<InputField>();
            if (registerPasswordConfirm == null)
                registerPasswordConfirm = root.Find("RegisterPanel/RegisterPasswordConfirm")?.GetComponent<InputField>();
            if (registerButton == null)
                registerButton = root.Find("RegisterPanel/RegisterButton")?.GetComponent<Button>();
            if (goToLoginButton == null)
                goToLoginButton = root.Find("RegisterPanel/GoToLoginButton")?.GetComponent<Button>();
        }

        private static void WireInputField(InputField field)
        {
            if (field == null)
                return;
            if (field.textComponent == null)
            {
                var t = field.transform.Find("Text");
                if (t != null)
                    field.textComponent = t.GetComponent<Text>();
            }
            if (field.placeholder == null)
            {
                var p = field.transform.Find("Placeholder");
                if (p != null)
                    field.placeholder = p.GetComponent<Text>();
            }
        }

        /// <summary>
        /// Runtime fallback when the Auth scene Canvas has no children (matches editor hierarchy names/paths).
        /// </summary>
        private void BuildDefaultUiUnderCanvas()
        {
            var canvas = GetComponent<Canvas>();
            if (canvas == null)
            {
                Debug.LogError("[AuthView] Canvas is required on the same GameObject.");
                return;
            }

            var rootRt = transform as RectTransform;
            if (rootRt != null)
                rootRt.localScale = Vector3.one;

            var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            var bg = new GameObject("Background");
            bg.transform.SetParent(transform, false);
            var bgRt = bg.AddComponent<RectTransform>();
            StretchFull(bgRt);
            bg.AddComponent<CanvasRenderer>();
            var bgImg = bg.AddComponent<Image>();
            bgImg.color = new Color(0.13f, 0.13f, 0.2f);

            CreateTitleText(transform, font);
            CreateStatusText(transform, font);

            loginPanel = new GameObject("LoginPanel");
            loginPanel.transform.SetParent(transform, false);
            var lpRt = loginPanel.AddComponent<RectTransform>();
            lpRt.anchorMin = new Vector2(0.2f, 0.32f);
            lpRt.anchorMax = new Vector2(0.8f, 0.64f);
            lpRt.offsetMin = Vector2.zero;
            lpRt.offsetMax = Vector2.zero;
            loginPanel.AddComponent<CanvasRenderer>();
            var lpImg = loginPanel.AddComponent<Image>();
            lpImg.color = new Color(1f, 1f, 1f, 0f);
            lpImg.raycastTarget = false;

            loginUsername = CreateInput(loginPanel.transform, "LoginUsername", "Username", font, false,
                new Vector2(0.05f, 0.62f), new Vector2(0.95f, 0.92f));
            loginPassword = CreateInput(loginPanel.transform, "LoginPassword", "Password", font, true,
                new Vector2(0.05f, 0.32f), new Vector2(0.95f, 0.58f));
            loginButton = CreateMenuButton(loginPanel.transform, "LoginButton", "Log in", font,
                new Vector2(0.25f, 0.14f), new Vector2(0.75f, 0.3f), new Color(0.2f, 0.55f, 0.85f));
            goToRegisterButton = CreateMenuButton(loginPanel.transform, "GoToRegisterButton", "New here? Register", font,
                new Vector2(0.1f, 0.02f), new Vector2(0.9f, 0.11f), new Color(0.25f, 0.35f, 0.5f, 0.9f));
            SetButtonLabelStyle(goToRegisterButton, 22);

            registerPanel = new GameObject("RegisterPanel");
            registerPanel.transform.SetParent(transform, false);
            var rpRt = registerPanel.AddComponent<RectTransform>();
            rpRt.anchorMin = new Vector2(0.15f, 0.22f);
            rpRt.anchorMax = new Vector2(0.85f, 0.72f);
            rpRt.offsetMin = Vector2.zero;
            rpRt.offsetMax = Vector2.zero;
            registerPanel.AddComponent<CanvasRenderer>();
            var rpImg = registerPanel.AddComponent<Image>();
            rpImg.color = new Color(1f, 1f, 1f, 0f);
            rpImg.raycastTarget = false;

            var userRow = new GameObject("UsernameRow");
            userRow.transform.SetParent(registerPanel.transform, false);
            var urRt = userRow.AddComponent<RectTransform>();
            urRt.anchorMin = new Vector2(0.05f, 0.72f);
            urRt.anchorMax = new Vector2(0.95f, 0.95f);
            urRt.offsetMin = Vector2.zero;
            urRt.offsetMax = Vector2.zero;
            userRow.AddComponent<CanvasRenderer>();
            var urImg = userRow.AddComponent<Image>();
            urImg.color = new Color(1f, 1f, 1f, 0f);
            urImg.raycastTarget = false;

            var guGo = new GameObject("GeneratedUsernameText");
            guGo.transform.SetParent(userRow.transform, false);
            var guRt = guGo.AddComponent<RectTransform>();
            guRt.anchorMin = new Vector2(0f, 0f);
            guRt.anchorMax = new Vector2(0.68f, 1f);
            guRt.offsetMin = Vector2.zero;
            guRt.offsetMax = Vector2.zero;
            guGo.AddComponent<CanvasRenderer>();
            generatedUsernameText = guGo.AddComponent<Text>();
            generatedUsernameText.font = font;
            generatedUsernameText.fontSize = 28;
            generatedUsernameText.alignment = TextAnchor.MiddleLeft;
            generatedUsernameText.color = Color.white;
            generatedUsernameText.text = "(generating...)";

            newUsernameButton = CreateMenuButton(userRow.transform, "NewUsernameButton", "New name", font,
                new Vector2(0.7f, 0.05f), new Vector2(0.98f, 0.95f), new Color(0.2f, 0.55f, 0.85f));
            SetButtonLabelStyle(newUsernameButton, 22);

            registerPassword = CreateInput(registerPanel.transform, "RegisterPassword", "Password", font, true,
                new Vector2(0.05f, 0.48f), new Vector2(0.95f, 0.68f));
            registerPasswordConfirm = CreateInput(registerPanel.transform, "RegisterPasswordConfirm", "Repeat password", font,
                true, new Vector2(0.05f, 0.26f), new Vector2(0.95f, 0.46f));
            registerButton = CreateMenuButton(registerPanel.transform, "RegisterButton", "Create account", font,
                new Vector2(0.25f, 0.08f), new Vector2(0.75f, 0.22f), new Color(0.2f, 0.55f, 0.85f));
            goToLoginButton = CreateMenuButton(registerPanel.transform, "GoToLoginButton", "Have an account? Log in", font,
                new Vector2(0.1f, 0f), new Vector2(0.9f, 0.06f), new Color(0.25f, 0.35f, 0.5f, 0.9f));
            SetButtonLabelStyle(goToLoginButton, 22);

            registerPanel.SetActive(false);
            Canvas.ForceUpdateCanvases();
        }

        private static void CreateTitleText(Transform parent, Font font)
        {
            var titleGo = new GameObject("TitleText");
            titleGo.transform.SetParent(parent, false);
            var titleRt = titleGo.AddComponent<RectTransform>();
            titleRt.anchorMin = new Vector2(0.1f, 0.78f);
            titleRt.anchorMax = new Vector2(0.9f, 0.92f);
            titleRt.offsetMin = Vector2.zero;
            titleRt.offsetMax = Vector2.zero;
            titleGo.AddComponent<CanvasRenderer>();
            var title = titleGo.AddComponent<Text>();
            title.font = font;
            title.fontSize = 48;
            title.fontStyle = FontStyle.Bold;
            title.alignment = TextAnchor.MiddleCenter;
            title.color = Color.white;
            title.text = "Sign in";
        }

        private static void CreateStatusText(Transform parent, Font font)
        {
            var stGo = new GameObject("StatusText");
            stGo.transform.SetParent(parent, false);
            var stRt = stGo.AddComponent<RectTransform>();
            stRt.anchorMin = new Vector2(0.1f, 0.66f);
            stRt.anchorMax = new Vector2(0.9f, 0.76f);
            stRt.offsetMin = Vector2.zero;
            stRt.offsetMax = Vector2.zero;
            stGo.AddComponent<CanvasRenderer>();
            var st = stGo.AddComponent<Text>();
            st.font = font;
            st.fontSize = 22;
            st.alignment = TextAnchor.MiddleCenter;
            st.color = new Color(1f, 0.85f, 0.3f);
            st.text = string.Empty;
        }

        private static Button CreateMenuButton(Transform parent, string name, string label, Font font, Vector2 aMin,
            Vector2 aMax, Color imageColor)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = aMin;
            rt.anchorMax = aMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            go.AddComponent<CanvasRenderer>();
            var img = go.AddComponent<Image>();
            img.color = imageColor;
            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;

            var txtGo = new GameObject("Label");
            txtGo.transform.SetParent(go.transform, false);
            var trt = txtGo.AddComponent<RectTransform>();
            StretchFull(trt);
            txtGo.AddComponent<CanvasRenderer>();
            var t = txtGo.AddComponent<Text>();
            t.font = font;
            t.fontSize = 26;
            t.fontStyle = FontStyle.Bold;
            t.alignment = TextAnchor.MiddleCenter;
            t.color = Color.white;
            t.text = label;
            return btn;
        }

        /// <summary>
        /// Caption text for buttons we create ("Label") or Unity UI defaults ("Text").
        /// </summary>
        private static Text GetButtonCaptionText(Button btn)
        {
            if (btn == null)
                return null;
            var labelTr = btn.transform.Find("Label");
            if (labelTr != null)
            {
                var t = labelTr.GetComponent<Text>();
                if (t != null)
                    return t;
            }
            var textTr = btn.transform.Find("Text");
            if (textTr != null)
            {
                var t = textTr.GetComponent<Text>();
                if (t != null)
                    return t;
            }
            return btn.GetComponentInChildren<Text>(true);
        }

        private static void SetButtonLabelStyle(Button btn, int fontSize)
        {
            var t = GetButtonCaptionText(btn);
            if (t != null)
                t.fontSize = fontSize;
        }

        private static void StretchFull(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
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
            root.AddComponent<CanvasRenderer>();

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
            textGo.AddComponent<CanvasRenderer>();
            var t = textGo.AddComponent<Text>();
            t.font = font;
            t.fontSize = 26;
            t.color = Color.white;
            t.supportRichText = false;
            t.raycastTarget = true;
            t.alignment = TextAnchor.MiddleLeft;
            inp.textComponent = t;

            var phGo = new GameObject("Placeholder");
            phGo.transform.SetParent(root.transform, false);
            var pRt = phGo.AddComponent<RectTransform>();
            StretchFull(pRt);
            phGo.AddComponent<CanvasRenderer>();
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

        private void Start()
        {
            if (apiClient == null)
            {
                SetStatus("Auth API client missing. Add AuthApiClient to the GameFlow object.");
                return;
            }

            if (GameFlowController.Instance == null)
            {
                SetStatus("GameFlowController missing.");
                return;
            }

            loginButton?.onClick.AddListener(OnLoginClicked);
            registerButton?.onClick.AddListener(OnRegisterClicked);
            goToRegisterButton?.onClick.AddListener(OnGoToRegisterClicked);
            goToLoginButton?.onClick.AddListener(OnGoToLoginClicked);
            newUsernameButton?.onClick.AddListener(RefreshSuggestedUsername);

            StartCoroutine(TryResumeSession());
            RefreshSuggestedUsername();
            ShowRegister(false);
        }

        private void OnDestroy()
        {
            loginButton?.onClick.RemoveListener(OnLoginClicked);
            registerButton?.onClick.RemoveListener(OnRegisterClicked);
            goToRegisterButton?.onClick.RemoveListener(OnGoToRegisterClicked);
            goToLoginButton?.onClick.RemoveListener(OnGoToLoginClicked);
            newUsernameButton?.onClick.RemoveListener(RefreshSuggestedUsername);
        }

        private void OnGoToRegisterClicked() => ShowRegister(true);

        private void OnGoToLoginClicked() => ShowRegister(false);

        private IEnumerator TryResumeSession()
        {
            yield return apiClient.ValidateSession(
                onValid: () => { GameFlowController.Instance?.LoadMainMenu(); },
                onInvalid: _ => { /* stay on auth */ });
        }

        private void ShowRegister(bool register)
        {
            if (loginPanel != null)
                loginPanel.SetActive(!register);
            if (registerPanel != null)
                registerPanel.SetActive(register);
            SetStatus(string.Empty);
        }

        private void SetStatus(string msg)
        {
            if (statusText != null)
                statusText.text = msg ?? string.Empty;
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
                    if (generatedUsernameText != null)
                        generatedUsernameText.text = u;
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

            var a = registerPassword != null ? registerPassword.text : string.Empty;
            var b = registerPasswordConfirm != null ? registerPasswordConfirm.text : string.Empty;
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
                    if (loginUsername != null)
                        loginUsername.text = username;
                },
                err => SetStatus(err)));
        }

        private void OnLoginClicked()
        {
            if (apiClient == null)
                return;
            var u = loginUsername != null ? loginUsername.text.Trim() : string.Empty;
            var p = loginPassword != null ? loginPassword.text : string.Empty;
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
