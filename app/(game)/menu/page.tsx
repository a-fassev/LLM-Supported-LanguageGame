"use client";

import Image from "next/image";
import { CenteredCard } from "@/components/game/layout/CenteredCard";
import { MainMenuActions } from "@/components/game/screens/MainMenuActions";
import { useRegisterHubBackground } from "@/lib/game/hub-background-context";
import { useGameSession } from "@/lib/game/session-context";

export default function MenuPage() {
  const { account } = useGameSession();
  useRegisterHubBackground(null);

  return (
    <CenteredCard className="relative aspect-[1.34] max-h-[calc(100dvh-(var(--game-shell-padding)*2))] max-w-4xl overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 backdrop-blur-0">
      <Image
        src="/content-assets/hubs/menu/mainmenu-papernotiz.png"
        alt=""
        aria-hidden="true"
        width={1400}
        height={1045}
        sizes="(min-width: 768px) 48rem, calc(100vw - 5rem)"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-auto w-[128%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
        draggable={false}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[0%] top-[1%] z-[1] h-7 w-64 rotate-[23deg] rounded-[3px] border border-[#b28a55]/15 bg-[#f1d9a6]/72 shadow-[0_2px_8px_rgba(69,38,15,0.13)] [background-image:linear-gradient(90deg,rgba(255,255,255,0.18),transparent_26%,rgba(255,255,255,0.16)_62%,transparent)]"
      />
      <div className="relative z-10 space-y-5 px-[14%] pb-[11%] pt-[20%]">
        <div className="text-center">
          <h1 className="relative inline-block w-max max-w-[calc(100vw-(var(--game-shell-padding)*2))] -translate-y-10 -rotate-1 rounded-[2rem] border-[5px] border-[#fff6d8] bg-[#f8b93b] px-5 py-2 text-center text-[clamp(1.7rem,4.4vw,3.9rem)] font-black leading-none text-[#fff8df] shadow-[0_6px_0_#a63e1b,0_16px_34px_rgba(67,24,8,0.45)] [text-shadow:3px_3px_0_#a63e1b,-2px_-2px_0_#fff6d8,2px_-2px_0_#fff6d8,-2px_2px_0_#fff6d8,0_5px_0_#d66b22] whitespace-normal sm:whitespace-nowrap">
            Menu principale
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bentornato{account?.username ? `, ${account.username}` : ""}!
          </p>
        </div>
        <MainMenuActions />
      </div>
    </CenteredCard>
  );
}
