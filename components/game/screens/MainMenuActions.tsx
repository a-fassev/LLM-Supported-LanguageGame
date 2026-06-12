"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api-client";
import { useGameSession } from "@/lib/game/session-context";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";

export function MainMenuActions() {
  const router = useRouter();
  const { token, clearSession } = useGameSession();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    if (token) {
      const result = await logout(token);
      if (!result.ok) toastBlockingApiError(result);
    }
    clearSession();
    router.replace("/login");
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-2 max-[380px]:gap-1.5 sm:gap-3">
      <Button
        className="min-h-12 rounded-xl border border-[#e7b074]/45 bg-[#9f4519] px-4 py-2.5 text-base font-black text-white shadow-[0_10px_24px_rgba(87,34,10,0.24),0_1px_0_rgba(255,238,202,0.28)_inset] hover:bg-[#b24d1f] hover:shadow-[0_12px_28px_rgba(87,34,10,0.28),0_1px_0_rgba(255,238,202,0.3)_inset] focus-visible:ring-[#f8b93b]/45 max-[380px]:h-9 max-[380px]:min-h-9 max-[380px]:py-1 sm:min-h-16 sm:px-5 sm:py-3.5 sm:text-lg"
        onClick={() => router.push("/chapters")}
      >
        <span
          className="rounded-2xl border-2 border-[#fff6d8] bg-[#f8b93b] px-4 py-1 text-[1.65rem] font-black leading-none text-[#fff8df] shadow-[0_3px_0_#a63e1b,0_9px_18px_rgba(67,24,8,0.22)] max-[380px]:px-3 max-[380px]:py-0 max-[380px]:text-[1.35rem] sm:px-5 sm:py-1.5 sm:text-3xl"
          style={{
            WebkitTextStroke: "1px #a63e1b",
            paintOrder: "stroke fill",
            textShadow:
              "1.5px 0 0 #a63e1b, -1.5px 0 0 #a63e1b, 0 1.5px 0 #a63e1b, 0 -1.5px 0 #a63e1b, 1.1px 1.1px 0 #a63e1b, -1.1px 1.1px 0 #a63e1b, 1.1px -1.1px 0 #a63e1b, -1.1px -1.1px 0 #a63e1b, 0 0 1px #a63e1b, 2px 3px 2px rgba(91, 31, 10, 0.38)",
          }}
        >
          Gioca
        </span>
      </Button>
      <div className="grid grid-cols-2 gap-2 max-[380px]:gap-1.5 sm:gap-3">
        <Button
          className="h-10 gap-1.5 rounded-xl border border-[#8f5a33]/24 bg-[#fff8eb]/78 px-2 text-sm font-bold text-[#5a2612] shadow-sm shadow-[#5d2b0e]/10 hover:bg-[#fff3de] hover:text-[#3d1b0f] focus-visible:ring-[#d77a32]/30 max-[380px]:h-8 max-[380px]:gap-1 max-[380px]:text-xs sm:h-12 sm:gap-2 sm:px-4 sm:text-base"
          variant="secondary"
          onClick={() => router.push("/shop")}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none size-[22px] bg-current [mask:url('/content-assets/hubs/menu/shop-business-delivery-svgrepo-com.svg')_center/contain_no-repeat] max-[380px]:size-5 sm:size-[26px]"
          />
          <span>Negozio</span>
        </Button>
        <Button
          className="h-10 gap-1.5 rounded-xl border border-[#8f5a33]/24 bg-[#fff8eb]/78 px-2 text-sm font-bold text-[#5a2612] shadow-sm shadow-[#5d2b0e]/10 hover:bg-[#fff3de] hover:text-[#3d1b0f] focus-visible:ring-[#d77a32]/30 max-[380px]:h-8 max-[380px]:gap-1 max-[380px]:text-xs sm:h-12 sm:gap-2 sm:px-4 sm:text-base"
          variant="secondary"
          onClick={() => router.push("/leaderboard")}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none size-[22px] bg-current [mask:url('/content-assets/hubs/menu/leaderboard-star-svgrepo-com.svg')_center/contain_no-repeat] max-[380px]:size-5 sm:size-[26px]"
          />
          <span>Classifica</span>
        </Button>
      </div>
      <Button
        className="mt-1 h-9 rounded-lg border border-[#8f5a33]/20 bg-transparent px-4 font-semibold text-[#5a2612]/85 shadow-none hover:bg-[#fff8eb]/45 hover:text-[#3d1b0f] focus-visible:ring-[#d77a32]/25 max-[380px]:mt-0 max-[380px]:h-5 max-[380px]:text-xs sm:mt-2"
        variant="outline"
        onClick={onLogout}
        disabled={pending}
      >
        Esci
      </Button>
    </div>
  );
}
