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
    }
}
