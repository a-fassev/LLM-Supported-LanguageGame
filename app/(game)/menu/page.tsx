"use client";

import { CenteredCard } from "@/components/game/layout/CenteredCard";
import { MainMenuActions } from "@/components/game/screens/MainMenuActions";
import { hubBackgroundKeys } from "@/lib/game/content/hub-background-keys";
import { useRegisterHubBackground } from "@/lib/game/hub-background-context";
import { useGameSession } from "@/lib/game/session-context";

const MENU_CARD_IMAGE_SRC = "/content-assets/hubs/menu/mainmenu-papernotiz-cropped.png";

export default function MenuPage() {
  const { account } = useGameSession();
  useRegisterHubBackground(hubBackgroundKeys.bolognaMap);

  return (
    <CenteredCard className="relative aspect-[1000/833] max-h-[calc(100dvh-(var(--game-shell-padding)*2))] max-w-2xl overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 backdrop-blur-0 !backdrop-blur-none ">
      {/* eslint-disable-next-line @next/next/no-img-element -- static LCP card art; eager load like GameBackground */}
      <img
        src={MENU_CARD_IMAGE_SRC}
        alt=""
        aria-hidden="true"
        width={1000}
        height={833}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none object-contain"
        draggable={false}
      />
      <div className="absolute inset-0 z-10 space-y-3 px-[18%] pb-[14%] pt-[23%] sm:space-y-4 sm:px-[22%]">
        <div className="text-center">
          <h1 className="relative inline-block w-max max-w-[calc(100vw-(var(--game-shell-padding)*2))] -translate-x-4 xl:-translate-x-10 -translate-y-6 -rotate-1 rounded-[2rem] border-[5px] border-[#fff6d8] bg-[#f8b93b] px-5 py-2 text-center text-[clamp(2rem,3.8vw,3.25rem)] font-black leading-none text-[#fff8df] shadow-[0_6px_0_#a63e1b,0_16px_34px_rgba(67,24,8,0.45)] [text-shadow:3px_3px_0_#a63e1b,-2px_-2px_0_#fff6d8,2px_-2px_0_#fff6d8,-2px_2px_0_#fff6d8,0_5px_0_#d66b22] whitespace-normal max-[380px]:border-4 max-[380px]:px-3 max-[380px]:py-1 max-[380px]:text-[1.45rem] sm:whitespace-nowrap">
            Menu principale
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-[380px]:mt-0.5 max-[380px]:text-xs">
            Bentornato{account?.username ? `, ${account.username}` : ""}!
          </p>
        </div>
        <MainMenuActions />
      </div>
    </CenteredCard>
  );
}
