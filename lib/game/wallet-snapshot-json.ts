import type { WalletSnapshotFields } from "@/lib/game/services/game-progress-service";

export function walletSnapshotJson(wallet: WalletSnapshotFields) {
  return {
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    backpackProgressPercent: wallet.backpackProgressPercent,
    backpackCompletedTasks: wallet.backpackCompletedTasks,
    backpackTotalTasks: wallet.backpackTotalTasks,
  };
}
