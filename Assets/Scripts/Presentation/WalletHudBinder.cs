using System.Collections.Generic;
using LanguageGame.Presentation.Steps;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Binds wallet HUD labels (pizza + backpack) from navigation chrome parts.</summary>
    public sealed class WalletHudBinder
    {
        private Label _walletPizza;

        private Label _walletBackpack;

        public bool Bind(VisualElement root)
        {
            _walletPizza = null;
            _walletBackpack = null;

            if (root == null)
            {
                Debug.LogError("[WalletHudBinder] Root is null.");
                return false;
            }

            _walletPizza = root.Q<Label>("wallet-pizza");
            _walletBackpack = root.Q<Label>("wallet-backpack");

            if (_walletPizza == null || _walletBackpack == null)
            {
                Debug.LogError("[WalletHudBinder] Missing wallet-pizza or wallet-backpack label.");
                return false;
            }

            ApplyHudBadgesIn(root);
            return true;
        }

        public bool Bind(UIDocument doc) => doc != null && Bind(doc.rootVisualElement);

        public void Refresh()
        {
            if (_walletPizza != null)
                _walletPizza.text = WalletUiTotals.GetDisplayedPizzaSlices().ToString();

            if (_walletBackpack != null)
                _walletBackpack.text = WalletUiTotals.GetDisplayedBackpackPieces().ToString();
        }

        /// <summary>Applies GameArt badge sprites to every named wallet badge under <paramref name="root"/>.</summary>
        public static void ApplyHudBadgesIn(VisualElement root)
        {
            if (root == null)
                return;

            ApplyHudBadgeArt(root, "wallet-badge-pizza", "hud-pizza-icon", GameArtAssetKeys.HudPizzaIconBackgroundKey);
            ApplyHudBadgeArt(root, "wallet-badge-backpack", "hud-backpack-icon", GameArtAssetKeys.HudBackpackIconBackgroundKey);
        }

        private static void ApplyHudBadgeArt(
            VisualElement root,
            string badgeName,
            string iconName,
            string gameArtKey)
        {
            List<VisualElement> badges = root.Query<VisualElement>(name: badgeName).ToList();
            if (badges.Count == 0)
                return;

            foreach (VisualElement badge in badges)
            {
                if (!ToolkitSceneBackgroundBinder.ApplyGameArtKey(badge, gameArtKey))
                    continue;

                var icon = badge.Q<Label>(iconName);
                if (icon != null)
                    icon.style.display = DisplayStyle.None;
            }
        }
    }
}
