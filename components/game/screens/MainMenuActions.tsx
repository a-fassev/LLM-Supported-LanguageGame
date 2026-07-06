"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api-client";
import { gameClientMessages as msg } from "@/lib/game/clientMessages";
import { useGameSession } from "@/lib/game/session-context";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";
import { cn } from "@/lib/utils";

const PRE_TEST_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdASCnoChQE3wGtGYbFLpj-sYB6nFrv7gk9YGE1MJj0HH4AAA/viewform";

export function MainMenuActions() {
  const router = useRouter();
  const { token, account, clearSession } = useGameSession();
  const [pending, setPending] = useState(false);
  const leaderboardEligible = account?.leaderboardEligible ?? false;

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
        className="h-10 gap-1.5 rounded-xl border border-[#8f5a33]/24 bg-[#fff8eb]/78 px-2 text-sm font-bold text-[#5a2612] shadow-sm shadow-[#5d2b0e]/10 hover:bg-[#fff3de] hover:text-[#3d1b0f] focus-visible:ring-[#d77a32]/30 max-[380px]:h-8 max-[380px]:gap-1 max-[380px]:text-xs sm:h-12 sm:gap-2 sm:px-4 sm:text-base"
        variant="secondary"
        onClick={() => router.push("/chapters")}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none size-[22px] bg-current [mask:url('/content-assets/hubs/menu/play-circle-svgrepo-com.svg')_center/contain_no-repeat] max-[380px]:size-5 sm:size-[26px]"
        />
        <span>Gioca</span>
      </Button>
      <Button
        asChild
        className="h-10 gap-1.5 rounded-xl border border-[#8f5a33]/24 bg-[#fff8eb]/78 px-2 text-sm font-bold text-[#5a2612] shadow-sm shadow-[#5d2b0e]/10 hover:bg-[#fff3de] hover:text-[#3d1b0f] focus-visible:ring-[#d77a32]/30 max-[380px]:h-8 max-[380px]:gap-1 max-[380px]:text-xs sm:h-12 sm:gap-2 sm:px-4 sm:text-base"
        variant="secondary"
      >
        <a
          href={PRE_TEST_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none size-[22px] bg-current [mask:url('/content-assets/hubs/menu/pre-test-clipboard-svgrepo-com.svg')_center/contain_no-repeat] max-[380px]:size-5 sm:size-[26px]"
          />
          <span>Test iniziale</span>
        </a>
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
          className={cn(
            "h-10 gap-1.5 rounded-xl border border-[#8f5a33]/24 bg-[#fff8eb]/78 px-2 text-sm font-bold text-[#5a2612] shadow-sm shadow-[#5d2b0e]/10 hover:bg-[#fff3de] hover:text-[#3d1b0f] focus-visible:ring-[#d77a32]/30 max-[380px]:h-8 max-[380px]:gap-1 max-[380px]:text-xs sm:h-12 sm:gap-2 sm:px-4 sm:text-base",
            !leaderboardEligible && "cursor-not-allowed opacity-60 hover:bg-[#fff8eb]/78 hover:text-[#5a2612]",
          )}
          variant="secondary"
          disabled={!leaderboardEligible}
          title={!leaderboardEligible ? msg.leaderboardNotAvailable : undefined}
          onClick={() => {
            if (leaderboardEligible) router.push("/leaderboard");
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none size-[22px] bg-current [mask:url('/content-assets/hubs/menu/leaderboard-star-svgrepo-com.svg')_center/contain_no-repeat] max-[380px]:size-5 sm:size-[26px]"
          />
          <span>Classifica</span>
        </Button>
      </div>
      {!leaderboardEligible ? (
        <p className="text-center text-xs text-muted-foreground sm:text-sm" role="status">
          {msg.leaderboardNotAvailable}
        </p>
      ) : null}
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
