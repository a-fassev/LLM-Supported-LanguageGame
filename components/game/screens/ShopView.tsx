"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
      className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-hidden", className)}
      aria-labelledby="room-shop-title"
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <h2 id="room-shop-title" className="text-lg font-black text-[#4b2211]">
            La tua stanza
          </h2>
          <p className="text-sm font-semibold text-[#7c4b28]">
            {complete ? "La stanza è completa." : message}
          </p>
        </div>
        <div className="rounded-lg border border-[#8f5a33]/25 bg-[#fff8eb]/85 px-3 py-1.5 text-base font-black text-[#5a2612] shadow-sm">
          <span aria-hidden="true">🍕 </span>
          <span className="tabular-nums">{totalSlices}</span>
        </div>
      </div>

      {error ? <p className="shrink-0 text-sm font-semibold text-destructive">{error}</p> : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[#8f5a33]/20 bg-[#2f2118]/85 p-2 shadow-inner">
        <div
          className="relative mx-auto max-h-full w-full max-w-full overflow-hidden rounded-lg bg-[#3b281d] shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
          style={{ aspectRatio: ROOM_CANVAS.aspectRatio }}
        >
          <Image
            src={ROOM_BACKGROUND_SRC}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover"
            priority
          />

          {room?.items.map((item) => {
            const isBought = purchased.has(item.id);
            const isPending = pendingItemId === item.id;
            const disabled = isBought || isPending || totalSlices < item.cost;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "absolute grid place-items-center overflow-hidden rounded-md border-2 border-[#5b391e]/55 bg-[linear-gradient(135deg,rgba(244,216,162,0.82),rgba(132,82,42,0.64))] text-[#fff2d5] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),0_8px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:scale-[1.015] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ffe08b]",
                  isBought && "pointer-events-none scale-95 opacity-0",
                  !isBought && totalSlices < item.cost && "cursor-not-allowed grayscale",
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
                <span className="grid max-w-[88%] place-items-center gap-0.5 rounded-md bg-[#2d1d11]/75 px-2 py-1 text-center text-[10px] font-black leading-tight text-[#fff2d5] shadow-sm sm:text-xs">
                  {isPending ? "Acquisto..." : "Da acquistare"}
                  <small className="text-[0.9em] text-[#ffd98a]">🍕 {item.cost}</small>
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

      {room ? (
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {room.items.map((item) => {
            const isBought = purchased.has(item.id);
            const disabled = isBought || pendingItemId !== null || totalSlices < item.cost;
            return (
              <Button
                key={item.id}
                type="button"
                variant="secondary"
                className={cn(
                  "h-16 flex-col gap-0 rounded-lg border border-[#8f5a33]/20 bg-[#fff8eb]/85 px-2 text-center text-[11px] font-black leading-tight text-[#5a2612] hover:bg-[#fff3de]",
                  isBought && "bg-[#e7efd9] text-[#355f3e]",
                )}
                disabled={disabled}
                onClick={() => void onBuy(item.id)}
              >
                <span className="line-clamp-2">{item.label}</span>
                <span className="text-xs text-[#9f4519]">{isBought ? "Comprato" : `🍕 ${item.cost}`}</span>
              </Button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function handleRoomError(error: ApiErrorResult, setError: (message: string) => void) {
  if (error.status >= 500 || error.status === 0 || error.code === "room_unavailable") {
    toastBlockingApiError(error);
  }
  setError(error.error);
}
