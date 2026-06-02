import { ensureWalletRow, getWalletTotals } from "@/lib/game/repositories/game-progress-repository";
import { gameClientMessages as msg } from "@/lib/game/clientMessages";

export type BootstrapResult =
  | {
      ok: true;
      totalSlices: number;
      totalBackpackPieces: number;
      chapters: [];
    }
  | { ok: false; status: number; error: string; code?: string; details?: Record<string, unknown> };

/** Wallet snapshot only; chapter catalog is not loaded from Supabase until content is re-authored. */
export async function bootstrapGameState(accountId: string): Promise<BootstrapResult> {
  const okEnsure = await ensureWalletRow(accountId);
  if (!okEnsure) return { ok: false, status: 500, error: msg.couldNotLoadWallet };

  const wallet = await getWalletTotals(accountId);
  if (wallet === null) return { ok: false, status: 500, error: msg.couldNotLoadWallet };

  return {
    ok: true,
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    chapters: [],
  };
}
