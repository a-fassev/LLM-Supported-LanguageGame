using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    /// <summary>Placeholder UI for the avatar shop hub screen (navigation + pizza display only).</summary>
    public class AvatarShopView : MonoBehaviour
    {
        [SerializeField] private Button backButton;
        [SerializeField] private Text pizzaSlicesText;
        [SerializeField] private Text backpackPiecesText;
        [SerializeField] private Text placeholderHintText;

        private void Awake()
        {
            if (backButton == null)
                Debug.LogWarning("[AvatarShopView] backButton is not assigned.");
        }

        private void OnEnable()
        {
            RefreshWalletLabels();
        }

        private void Start()
        {
            backButton?.onClick.AddListener(OnBackClicked);
        }

        private void RefreshWalletLabels()
        {
            var slices   = GameFlowController.Instance != null ? GameFlowController.Instance.TotalPizzaSlices : 0;
            var backpack = GameFlowController.Instance != null ? GameFlowController.Instance.TotalBackpackPieces : 0;
            var line = $"Pizza slices: {slices}";
            if (pizzaSlicesText != null)
                pizzaSlicesText.text = line;
            if (backpackPiecesText != null)
                backpackPiecesText.text = $"Backpack pieces: {backpack}";
        }

        private void OnBackClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[AvatarShopView] GameFlowController not found.");
                return;
            }

            GameFlowController.Instance.ReturnFromAvatarShop();
        }

        private void OnDestroy()
        {
            backButton?.onClick.RemoveListener(OnBackClicked);
        }
    }
}
