using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Avatar shop hub with UI Toolkit (Wave 2).</summary>
    public class AvatarShopView : MonoBehaviour
    {
        private UIDocument _doc;

        private readonly LearningToolkitPauseChromeBinder _pauseChrome = new();

        private readonly WalletHudBinder _walletHud = new();

        private Button _equipButton;

        private Button _purchaseButton;

        private readonly LearningToolkitInfoBanner _infoBanner = new();

        private IVisualElementScheduledItem _toastHideSchedule;

        private void Awake()
        {
            _doc = LearningToolkitBootstrap.SpawnUiDocument(this, "AvatarShopScreen");
            if (_doc == null)
            {
                Debug.LogError("[AvatarShopView] UITK bootstrap failed — missing AvatarShopScreen or PanelSettings.");
                enabled = false;
                return;
            }

            var root = _doc.rootVisualElement;
            _equipButton = root.Q<Button>("equip-button");
            _purchaseButton = root.Q<Button>("purchase-button");

            if (!_walletHud.Bind(_doc))
            {
                Debug.LogError("[AvatarShopView] Wallet HUD bind failed.");
                enabled = false;
                return;
            }

            VisualElement overlay = LearningToolkitBootstrap.ResolveOverlayPlane(_doc);
            if (overlay != null)
                _infoBanner.Attach(overlay);

            LearningToolkitNavigationFeedback.RegisterPresentationDocument(_doc);

            if (!_pauseChrome.Bind(_doc, LearningToolkitChromeUx.LeaveToChapterOverviewLabel, OnLeaveToChapterOverview))
            {
                Debug.LogError("[AvatarShopView] Pause chrome bind failed.");
                enabled = false;
                return;
            }
            _equipButton?.RegisterCallback<ClickEvent>(_ => ShowPlaceHolderToast("Nothing to equip yet."));
            _purchaseButton?.RegisterCallback<ClickEvent>(_ => ShowPlaceHolderToast("Purchasing will arrive with catalog content."));

            if (_equipButton != null)
                _equipButton.SetEnabled(false);
            if (_purchaseButton != null)
                _purchaseButton.SetEnabled(false);
        }

        private void OnEnable()
        {
            _walletHud.Refresh();
        }

        private void ShowPlaceHolderToast(string message)
        {
            _toastHideSchedule?.Pause();
            _infoBanner.ShowInfo(message);
            var root = _doc?.rootVisualElement;
            if (root == null)
                return;
            _toastHideSchedule = root.schedule
                .Execute(() =>
                {
                    if (_doc != null && _doc.rootVisualElement != null)
                        _infoBanner.Hide();
                })
                .StartingIn(2200);
        }

        private void OnLeaveToChapterOverview()
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
            _toastHideSchedule?.Pause();
            if (_doc != null)
                LearningToolkitNavigationFeedback.UnregisterPresentationDocument(_doc);
            _pauseChrome.Destroy();
            _infoBanner.Destroy();
            if (_doc != null)
                Destroy(_doc.gameObject);
        }
    }
}
