"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CenteredCard } from "@/components/game/layout/CenteredCard";
import { GameBackground } from "@/components/game/layout/GameBackground";
import { MainMenuActions } from "@/components/game/screens/MainMenuActions";
import { useGameSession } from "@/lib/game/session-context";

export default function MenuPage() {
  const { account } = useGameSession();

  return (
    <GameBackground mode="hub">
      <CenteredCard>
        <Card className="bg-transparent shadow-none ring-0">
          <CardHeader className="px-0 pt-0 text-center">
            <CardTitle className="text-2xl">Menu principale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            <p className="text-center text-sm text-muted-foreground">
              Bentornato{account?.username ? `, ${account.username}` : ""}!
            </p>
            <MainMenuActions />
          </CardContent>
        </Card>
      </CenteredCard>
    </GameBackground>
  );
}
