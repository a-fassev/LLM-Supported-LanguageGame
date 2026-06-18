"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  getRoomState,
  purchaseRoomItem,
  type ApiErrorResult,
  type RoomStateDto,
} from "@/lib/api-client";
import { ROOM_BACKGROUND_SRC, ROOM_CANVAS } from "@/lib/game/room-catalog";
import { useGameSession } from "@/lib/game/session-context";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";
import { cn } from "@/lib/utils";

type ShopViewProps = {
  className?: string;
  initialSlices?: number;
  onWalletChange?: (totalSlices: number) => void;
};

export function ShopView({ className, initialSlices = 0, onWalletChange }: ShopViewProps) {
  const { token } = useGameSession();
  const [room, setRoom] = useState<RoomStateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState("Usa gli spicchi di pizza per arredare la tua stanza dello scambio.");
  const [error, setError] = useState<string | null>(null);

  const purchased = useMemo(() => new Set(room?.purchasedItemIds ?? []), [room?.purchasedItemIds]);
  const totalSlices = room?.totalSlices ?? initialSlices;

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      setError(null);
      const result = await getRoomState(token);
      if (cancelled) return;

      if (!result.ok) {
        handleRoomError(result, setError);
        setLoading(false);
        return;
      }
      setRoom(result.data);
      onWalletChange?.(result.data.totalSlices);
      setLoading(false);
    }

    void loadRoom();

    return () => {
      cancelled = true;
    };
  }, [onWalletChange, token]);

  async function onBuy(itemId: string) {
    if (!token) {
      return;
    }
    if (pendingItemId) {
      return;
    }
    const item = room?.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    if (purchased.has(item.id)) {
      setMessage(`${item.label} è già nella stanza.`);
      return;
    }
    if (totalSlices < item.cost) {
      setMessage(`Non hai abbastanza spicchi di pizza per ${item.label}.`);
      return;
    }

    setPendingItemId(item.id);
    setError(null);
    const result = await purchaseRoomItem(token, { itemId: item.id });
    setPendingItemId(null);
    if (!result.ok) {
      handleRoomError(result, setError);
      return;
    }

    setRoom(result.data);
    onWalletChange?.(result.data.totalSlices);
    setMessage(`${item.label} acquistato.`);
  }

  const complete = room ? purchased.size === room.items.length : false;

  return (
    <section
      className={cn("flex min-h-0 h-full flex-1 flex-col overflow-hidden", className)}
      aria-labelledby="room-shop-title"
    >
      {error ? <p className="shrink-0 text-sm font-semibold text-destructive">{error}</p> : null}

      <div className="relative grid min-h-0 flex-1 place-items-center overflow-visible">
        <div
          className="relative h-full max-h-full max-w-full overflow-hidden rounded-xl bg-[#3b281d] shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
          style={{ aspectRatio: ROOM_CANVAS.aspectRatio }}
        >
          <h2 id="room-shop-title" className="sr-only">
            La tua stanza
          </h2>
          <Image
            src={ROOM_BACKGROUND_SRC}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />

          <div className="absolute left-3 top-3 z-50 max-w-[min(75%,32rem)] rounded-lg border border-[#8f5a33]/28 bg-[#fff8eb]/88 px-3 py-2 text-[#4b2211] shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-bold text-[#7c4b28] sm:text-sm">
              {complete ? "La stanza è completa." : message}
            </p>
          </div>

          {room?.items.map((item) => {
            const isBought = purchased.has(item.id);
            const isPending = pendingItemId === item.id;
            const disabled = isBought || isPending || totalSlices < item.cost;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "absolute grid place-items-center overflow-hidden rounded-lg border-2 border-[#e8b45a] bg-[linear-gradient(135deg,#f7dca7_0%,#c8853d_52%,#8b4a20_100%)] text-[#4b2211] shadow-[0_7px_18px_rgba(58,28,12,0.28),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:scale-[1.01] hover:brightness-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ffe08b]",
                  isBought && "pointer-events-none scale-95 opacity-0",
                  !isBought && totalSlices < item.cost && "cursor-not-allowed border-[#b6814a] bg-[linear-gradient(135deg,#d8b984_0%,#9c6b37_54%,#6b3b1b_100%)] brightness-90",
                )}
                style={{
                  left: `${(item.x / ROOM_CANVAS.width) * 100}%`,
                  top: `${(item.y / ROOM_CANVAS.height) * 100}%`,
                  width: `${(item.width / ROOM_CANVAS.width) * 100}%`,
                  height: `${(item.height / ROOM_CANVAS.height) * 100}%`,
                  zIndex: 30 + Math.round(1_000_000 / (item.width * item.height)),
                }}
                disabled={disabled}
                aria-label={`Compra ${item.label} per ${item.cost} spicchi di pizza`}
                onClick={() => void onBuy(item.id)}
              >
                <span className="grid max-w-[88%] place-items-center rounded-md bg-[#5a2612] px-2 py-1 text-center text-[10px] font-black leading-tight text-[#ffd98a] shadow-sm sm:text-xs">
                  {isPending ? "..." : `🍕 ${item.cost}`}
                </span>
              </button>
            );
          })}

          {loading ? (
            <div className="absolute inset-0 grid place-items-center bg-[#2f2118]/70 text-sm font-bold text-[#fff2d5]">
              Caricamento...
            </div>
          ) : null}
        </div>

      </div>
    </section>
  );
}

function handleRoomError(error: ApiErrorResult, setError: (message: string) => void) {
  if (error.status >= 500 || error.status === 0 || error.code === "room_unavailable") {
    toastBlockingApiError(error);
  }
  setError(error.error);
}
