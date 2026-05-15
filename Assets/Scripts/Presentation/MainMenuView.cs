using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class MainMenuView : MonoBehaviour
    {
        [SerializeField] private Button playButton;
        [SerializeField] private Button logoutButton;

        private void Awake()
        {
            if (playButton == null)
                Debug.LogWarning("[MainMenuView] playButton is not assigned.");
            if (logoutButton == null)
                Debug.LogWarning("[MainMenuView] logoutButton is not assigned.");
        }

        private void Start()
        {
            playButton?.onClick.AddListener(OnPlayClicked);
            logoutButton?.onClick.AddListener(OnLogoutClicked);
        }

        private void OnPlayClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[MainMenuView] GameFlowController not found.");
                return;
            }
            GameFlowController.Instance.LoadCityMap();
        }

        private void OnLogoutClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[MainMenuView] GameFlowController not found.");
                return;
            }

            var api = FindFirstObjectByType<AuthApiClient>();
            if (api != null)
                StartCoroutine(LogoutRoutine(api));
            else
                FinishLogoutLocalOnly();
        }

        private IEnumerator LogoutRoutine(AuthApiClient api)
        {
            yield return api.LogoutRemote(
                onDone: FinishLogoutLocalOnly,
                onError: _ => FinishLogoutLocalOnly());
        }

        private void FinishLogoutLocalOnly()
        {
            AuthSessionStore.Clear();
            GameFlowController.Instance?.LoadAuth();
        }

        private void OnDestroy()
        {
            playButton?.onClick.RemoveListener(OnPlayClicked);
            logoutButton?.onClick.RemoveListener(OnLogoutClicked);
        }
    }
}
