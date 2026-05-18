using LanguageGame.Application;
using UnityEngine;

namespace LanguageGame.Presentation
{
    /// <summary>Shared pizza/backpack totals for HUD labels (session store + GameFlow fallback).</summary>
    internal static class WalletUiTotals
    {
        public static int GetDisplayedPizzaSlices()
        {
            if (GameSessionStateStore.TryGetLatestTotalSlices(out var slicesFromStore))
                return slicesFromStore;

            return GameFlowController.Instance != null ? GameFlowController.Instance.TotalPizzaSlices : 0;
        }

        public static int GetDisplayedBackpackPieces()
        {
            if (GameSessionStateStore.TryGetLatestTotalBackpackPieces(out var pieces))
                return pieces;

            return GameFlowController.Instance != null ? GameFlowController.Instance.TotalBackpackPieces : 0;
        }
    }
}
