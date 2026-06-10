"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  addRoomTestPizza,
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
  const [testPizzaPending, setTestPizzaPending] = useState(false);
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

  async function onAddTestPizza() {
    if (!token || testPizzaPending) return;

    setTestPizzaPending(true);
    setError(null);
    const result = await addRoomTestPizza(token);
    setTestPizzaPending(false);
    if (!result.ok) {
      handleRoomError(result, setError);
      return;
    }

    setRoom(result.data);
    onWalletChange?.(result.data.totalSlices);
    setMessage("100 spicchi di pizza aggiunti per il test.");
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

      <div className="relative min-h-0 flex-1 overflow-auto rounded-xl border border-[#8f5a33]/20 bg-[#2f2118]/85 p-2 shadow-inner">
        <div
          className="relative mx-auto h-full max-h-full max-w-full overflow-hidden rounded-lg bg-[#3b281d] shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
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
                  "absolute grid place-items-center overflow-hidden rounded-lg border border-[#ffd98a]/60 bg-[#fff1d8]/18 text-[#fff2d5] shadow-[0_6px_18px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(255,255,255,0.18)] transition hover:scale-[1.01] hover:bg-[#fff1d8]/28 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ffe08b]",
                  isBought && "pointer-events-none scale-95 opacity-0",
                  !isBought && totalSlices < item.cost && "cursor-not-allowed border-white/25 bg-black/12 opacity-70 grayscale",
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
                <span className="grid max-w-[88%] place-items-center gap-0.5 rounded-md bg-[#2d1d11]/78 px-2 py-1 text-center text-[10px] font-black leading-tight text-[#fff2d5] shadow-sm sm:text-xs">
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

        <Button
          type="button"
          className="absolute bottom-4 right-4 z-50 rounded-lg border border-[#fff6d8]/60 bg-[#9f4519] px-4 py-2 text-sm font-black text-white shadow-[0_10px_22px_rgba(0,0,0,0.24)] hover:bg-[#b24d1f]"
          disabled={testPizzaPending}
          onClick={() => void onAddTestPizza()}
        >
          {testPizzaPending ? "..." : "+100 🍕"}
        </Button>
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
