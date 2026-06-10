import { loadContentCatalog } from "@/lib/game/content/catalog-loader";
import { backpackProgressFromCatalog } from "@/lib/game/backpack-progress";
import { getWalletTotals } from "@/lib/game/repositories/game-progress-repository";

export async function walletWithBackpackProgressForAccount(accountId: string) {
  const wallet = await getWalletTotals(accountId);
  if (!wallet) return null;

  const catalog = await loadContentCatalog();
  return {
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    ...backpackProgressFromCatalog(catalog, wallet.totalBackpackPieces),
  };
}
