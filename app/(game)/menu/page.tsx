"use client";

import { CenteredCard } from "@/components/game/layout/CenteredCard";
import { GameBackground } from "@/components/game/layout/GameBackground";
import { MainMenuActions } from "@/components/game/screens/MainMenuActions";
import { useGameSession } from "@/lib/game/session-context";

export default function MenuPage() {
  const { account } = useGameSession();

  return (
    <GameBackground mode="hub">
      <CenteredCard>
        <div className="space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Menu principale</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bentornato{account?.username ? `, ${account.username}` : ""}!
            </p>
          </div>
          <MainMenuActions />
        </div>
      </CenteredCard>
    </GameBackground>
  );
}
