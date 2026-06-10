import { ROOM_ITEMS, getRoomItem } from "@/lib/game/room-catalog";
import {
  deletePurchasedRoomItems,
  getPurchasedRoomItemIds,
  incrementWalletTotals,
  purchaseRoomItem,
  type PurchaseRoomItemResult,
} from "@/lib/game/repositories/game-progress-repository";
import { walletWithBackpackProgressForAccount } from "@/lib/game/services/wallet-snapshot-service";

type FailedPurchaseRoomItemResult = Extract<PurchaseRoomItemResult, { ok: false }>;

export type RoomStateResult =
  | {
      ok: true;
      totalSlices: number;
      totalBackpackPieces: number;
      backpackProgressPercent: number;
      backpackCompletedTasks: number;
      backpackTotalTasks: number;
      purchasedItemIds: string[];
      items: typeof ROOM_ITEMS;
    }
  | { ok: false; status: number; error: string; code?: string };

export async function getRoomState(accountId: string): Promise<RoomStateResult> {
  const purchasedItemIds = await getPurchasedRoomItemIds(accountId);
  if (purchasedItemIds === null) {
    return { ok: false, status: 500, error: "Impossibile caricare la stanza.", code: "room_unavailable" };
  }

  const wallet = await walletWithBackpackProgressForAccount(accountId);
  if (!wallet) {
    return { ok: false, status: 500, error: "Impossibile caricare il portafoglio.", code: "wallet_unavailable" };
  }

  return {
    ok: true,
    ...wallet,
    purchasedItemIds,
    items: ROOM_ITEMS,
  };
}

export type RoomPurchaseResult =
  | Extract<RoomStateResult, { ok: true }>
  | { ok: false; status: number; error: string; code?: string };

export async function buyRoomItem(accountId: string, itemId: string): Promise<RoomPurchaseResult> {
  const item = getRoomItem(itemId);
  if (!item) {
    return { ok: false, status: 400, error: "Oggetto non valido.", code: "invalid_room_item" };
  }

  const purchase = await purchaseRoomItem(accountId, item.id, item.cost);
  if (!purchase.ok) {
    return roomPurchaseError(purchase);
  }

  return getRoomState(accountId);
}

export async function addRoomTestSlices(accountId: string): Promise<RoomPurchaseResult> {
  const updated = await incrementWalletTotals(accountId, 100, 0);
  if (!updated) {
    return { ok: false, status: 500, error: "Pizza di test non aggiunta.", code: "room_test_wallet_failed" };
  }

  return getRoomState(accountId);
}

export async function resetRoomTestPurchases(accountId: string): Promise<RoomPurchaseResult> {
  const deleted = await deletePurchasedRoomItems(accountId);
  if (!deleted) {
    return { ok: false, status: 500, error: "Reset della stanza non riuscito.", code: "room_reset_failed" };
  }

  return getRoomState(accountId);
}

function roomPurchaseError(result: FailedPurchaseRoomItemResult): RoomPurchaseResult {
  switch (result.reason) {
    case "already_purchased":
      return { ok: false, status: 409, error: "Questo oggetto è già nella stanza.", code: "room_item_already_purchased" };
    case "not_enough_slices":
      return { ok: false, status: 409, error: "Non hai abbastanza spicchi di pizza.", code: "not_enough_slices" };
    default:
      return { ok: false, status: 500, error: "Acquisto non riuscito.", code: "room_purchase_failed" };
  }
}
