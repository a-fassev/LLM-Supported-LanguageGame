using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Auth screen using Unity UI Toolkit (menus theme).
    /// </summary>
    public sealed class AuthView : MonoBehaviour
    {
        [SerializeField] private AuthApiClient apiClient;

        private UIDocument _doc;

        private VisualElement _loginPanel;

        private VisualElement _registerPanel;

        private TextField _loginUsername;

        private TextField _loginPassword;

        private TextField _registerPassword;

        private TextField _registerPasswordConfirm;

        private Button _loginButton;

        private Button _registerButton;

        private Button _goToRegister;

        private Button _goToLogin;

        private Button _newUsernameButton;

        private Label _statusLabel;

        private Label _generatedUsernameLabel;

        private string _suggestedUsername = string.Empty;

        private readonly LearningToolkitLoadingOverlay _loading = new LearningToolkitLoadingOverlay();

        private int _authBusyRequests;

        private void Awake()
        {
            if (apiClient == null)
                apiClient = FindAnyObjectByType<AuthApiClient>();

            _doc = LearningToolkitBootstrap.SpawnUiDocument(this, "Screens/AuthScreen");
            if (_doc == null)
            {
                Debug.LogError("[AuthView] UI Toolkit bootstrap failed — check Resources paths and PanelSettings.");
                enabled = false;
                return;
            }
            BindUi();
            ToolkitNavigationScreenBinder.ApplyAuthScreen(_doc.rootVisualElement);
            AttachLoadingChrome();
            LearningToolkitNavigationFeedback.RegisterPresentationDocument(_doc);
        }

        private void BindUi()
        {
            VisualElement root = _doc.rootVisualElement;

            _statusLabel = root.Q<Label>("status-label");

            _loginPanel = root.Q<VisualElement>("login-panel");
            _registerPanel = root.Q<VisualElement>("register-panel");

            _loginUsername = root.Q<TextField>("login-username");
            _loginPassword = root.Q<TextField>("login-password");

            ConfigurePassword(_loginPassword);

            _registerPassword = root.Q<TextField>("register-password");
            _registerPasswordConfirm = root.Q<TextField>("register-password-confirm");

            ConfigurePassword(_registerPassword);
            ConfigurePassword(_registerPasswordConfirm);

            _generatedUsernameLabel = root.Q<Label>("generated-username-label");

            _loginButton = root.Q<Button>("login-button");
            _registerButton = root.Q<Button>("register-button");
            _goToRegister = root.Q<Button>("goto-register-button");
            _goToLogin = root.Q<Button>("goto-login-button");
            _newUsernameButton = root.Q<Button>("new-username-button");
        }

        private static void ConfigurePassword(TextField field)
        {
            if (field == null)
                return;
            field.isPasswordField = true;
            field.maskChar = '*';
        }

        private void Start()
        {
            if (apiClient == null)
            {
                SetStatus("AuthApiClient mancante. Collegalo al GameObject GameFlow.");
                return;
            }

            if (GameFlowController.Instance == null)
            {
                SetStatus("GameFlowController mancante.");
                return;
            }

            _loginButton?.RegisterCallback<ClickEvent>(_ => OnLoginClicked());
            _registerButton?.RegisterCallback<ClickEvent>(_ => OnRegisterClicked());
            _goToRegister?.RegisterCallback<ClickEvent>(_ => ShowRegisterFlow(true));
            _goToLogin?.RegisterCallback<ClickEvent>(_ => ShowRegisterFlow(false));
            _newUsernameButton?.RegisterCallback<ClickEvent>(_ => RefreshSuggestedUsername());

            StartCoroutine(TryResumeSession());
            RefreshSuggestedUsername();
            ShowRegisterFlow(false);
        }

        private IEnumerator TryResumeSession()
        {
            PushAuthBusyScope();
            _loading.Show("Controllo sessione…");

            yield return StartCoroutine(apiClient.ValidateSession(
                onValid: () => { GameFlowController.Instance?.LoadMainMenu(); },
                onInvalid: _ =>
                {
                    GameSessionStateStore.Clear();
                    AuthSessionStore.Clear();
                    SetStatus("La sessione è scaduta. Accedi di nuovo.");
                }));

            _loading.Hide();
            PopAuthBusyScope();
        }

        private void ShowRegisterFlow(bool register)
        {
            if (_loginPanel != null)
                _loginPanel.style.display = register ? DisplayStyle.None : DisplayStyle.Flex;

            if (_registerPanel != null)
                _registerPanel.style.display = register ? DisplayStyle.Flex : DisplayStyle.None;

            SetStatus(string.Empty);
        }

        private void SetStatus(string message)
        {
            if (_statusLabel != null)
                _statusLabel.text = message ?? string.Empty;
            else if (!string.IsNullOrEmpty(message))
                Debug.LogWarning("[AuthView] " + message);
        }

        private void RefreshSuggestedUsername()
        {
            if (apiClient == null)
                return;

            StartCoroutine(SuggestUsernameCoroutine());
        }

        private IEnumerator SuggestUsernameCoroutine()
        {
            PushAuthBusyScope();

            yield return StartCoroutine(apiClient.SuggestUsername(
                u =>
                {
                    _suggestedUsername = u;
                    if (_generatedUsernameLabel != null)
                        _generatedUsernameLabel.text = u;
                },
                err => SetStatus("Impossibile suggerire un nome: " + err)));

            PopAuthBusyScope();
        }

        private void OnRegisterClicked()
        {
            if (apiClient == null)
                return;

            if (IsAuthBusy())
                return;

            if (string.IsNullOrEmpty(_suggestedUsername))
            {
                SetStatus("Attendi un nome giocatore suggerito.");
                return;
            }

            string a = _registerPassword != null ? _registerPassword.value : string.Empty;
            string b = _registerPasswordConfirm != null ? _registerPasswordConfirm.value : string.Empty;

            if (a != b)
            {
                SetStatus("Le password non coincidono.");
                return;
            }

            if (a.Length < 8)
            {
                SetStatus("Scegli una password di almeno 8 caratteri.");
                return;
            }

            SetStatus("Creazione account…");
            StartCoroutine(RegisterCoroutine(_suggestedUsername, a, b));
        }

        private IEnumerator RegisterCoroutine(string username, string pwd, string pwdConfirm)
        {
            PushAuthBusyScope();

            yield return StartCoroutine(apiClient.Register(username, pwd, pwdConfirm,
                (u, team) =>
                {
                    var teamNote = string.IsNullOrEmpty(team)
                        ? string.Empty
                        : $" Sei nella {LearningToolkitChromeUx.FormatTeamDisplayLabel(team)}.";
                    SetStatus($"Account pronto: {u} — ora puoi accedere!{teamNote}");
                    ShowRegisterFlow(false);

                    if (_loginUsername != null)
                        _loginUsername.value = u;
                },
                err => SetStatus(err)));

            PopAuthBusyScope();
        }

        private void OnLoginClicked()
        {
            if (apiClient == null)
                return;

            if (IsAuthBusy())
                return;

            string username = _loginUsername != null ? _loginUsername.value.Trim() : string.Empty;
            string pwd = _loginPassword != null ? _loginPassword.value : string.Empty;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(pwd))
            {
                SetStatus("Inserisci nome utente e password.");
                return;
            }

            SetStatus("Accesso in corso…");
            StartCoroutine(LoginCoroutine(username, pwd));
        }

        private IEnumerator LoginCoroutine(string username, string password)
        {
            PushAuthBusyScope();

            yield return StartCoroutine(apiClient.Login(username, password,
                () =>
                {
                    SetStatus(string.Empty);
                    GameSessionStateStore.Clear();
                    GameFlowController.Instance?.LoadMainMenu();
                },
                err => SetStatus(err)));

            PopAuthBusyScope();
        }

        private void AttachLoadingChrome()
        {
            VisualElement overlay = LearningToolkitBootstrap.ResolveOverlayPlane(_doc);
            if (overlay == null)
            {
                Debug.LogError("[AuthView] overlay-plane missing in Auth UI definition; loading chrome disabled.");
                return;
            }

            if (!_loading.IsAttached)
                _loading.Attach(overlay);
        }

        private bool IsAuthBusy() => _authBusyRequests > 0;

        private void PushAuthBusyScope()
        {
            _authBusyRequests++;
            RefreshAuthInteractableAfterBusyChange();
        }

        private void PopAuthBusyScope()
        {
            if (_authBusyRequests > 0)
                _authBusyRequests--;

            RefreshAuthInteractableAfterBusyChange();
        }

        private void RefreshAuthInteractableAfterBusyChange()
        {
            bool idle = !IsAuthBusy();

            _loginButton?.SetEnabled(idle);
            _registerButton?.SetEnabled(idle);
            _goToRegister?.SetEnabled(idle);
            _goToLogin?.SetEnabled(idle);
            _newUsernameButton?.SetEnabled(idle);

            bool fieldsIdle = idle;
            _loginUsername?.SetEnabled(fieldsIdle);
            _loginPassword?.SetEnabled(fieldsIdle);
            _registerPassword?.SetEnabled(fieldsIdle);
            _registerPasswordConfirm?.SetEnabled(fieldsIdle);
        }

        private static string FormatTeamLabel(string team) => LearningToolkitChromeUx.FormatTeamDisplayLabel(team);

        private void OnDestroy()
        {
            if (_doc != null)
                LearningToolkitNavigationFeedback.UnregisterPresentationDocument(_doc);
            _loading.Destroy();
            if (_doc != null)
                Destroy(_doc.gameObject);
        }
    }
}
