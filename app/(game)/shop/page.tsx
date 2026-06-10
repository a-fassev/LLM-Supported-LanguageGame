"use client";

import { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GameShellHeader } from "@/components/game/layout/GameShellHeader";
import { QuestHud } from "@/components/game/shell/QuestHud";
import { ShopView } from "@/components/game/screens/ShopView";
import { useBootstrap } from "@/lib/game/use-bootstrap";

export default function ShopPage() {
  const router = useRouter();
  const { loading, error, data, reload } = useBootstrap({ refreshOnFocus: true });
  const onWalletChange = useCallback(() => {
    void reload();
  }, [reload]);

  const headerRight = data ? (
    <QuestHud totalSlices={data.totalSlices} backpackProgressPercent={data.backpackProgressPercent} />
  ) : null;

  return (
    <main className="game-shell-inset flex h-dvh flex-col gap-3 overflow-hidden">
      <GameShellHeader
        title="Negozio"
        variant="hub"
        leading={
          <Button
            type="button"
            size="icon-lg"
            variant="outline"
            aria-label="Indietro"
            onClick={() => router.push("/menu")}
            className="!bg-[#fbf0dc] !text-[#5a2612] hover:!bg-[#fbf0dc] hover:!text-[#5a2612]"
          >
            <ArrowLeft className="size-6 stroke-[2.75]" aria-hidden />
          </Button>
        }
        actions={headerRight}
      />
      <section className="min-h-0 flex-1 overflow-hidden">
        {error ? <p className="shrink-0 text-sm text-destructive">{error}</p> : null}
        {loading && !data ? (
          <p className="shrink-0 text-sm text-muted-foreground">Caricamento...</p>
        ) : null}
        <ShopView
          className="min-h-0 flex-1"
          initialSlices={data?.totalSlices ?? 0}
          onWalletChange={onWalletChange}
        />
      </section>
    </main>
  );
}
