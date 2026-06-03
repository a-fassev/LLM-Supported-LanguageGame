"use client";

import { useRouter } from "next/navigation";
import { HubPage } from "@/components/game/layout/HubPage";
import { QuestHud } from "@/components/game/shell/QuestHud";
import { ShopView } from "@/components/game/screens/ShopView";
import { useBootstrap } from "@/lib/game/use-bootstrap";

export default function ShopPage() {
  const router = useRouter();
  const { loading, error, data } = useBootstrap({ refreshOnFocus: true });

  const headerRight = data ? (
    <QuestHud totalSlices={data.totalSlices} totalBackpackPieces={data.totalBackpackPieces} />
  ) : null;

  return (
    <HubPage
      title="Negozio"
      onBack={() => router.push("/menu")}
      headerRight={headerRight}
      className="flex flex-col overflow-hidden"
    >
      {error ? <p className="shrink-0 text-sm text-destructive">{error}</p> : null}
      {loading && !data ? (
        <p className="shrink-0 text-sm text-muted-foreground">Caricamento...</p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <ShopView className="min-h-0 flex-1" />
      </div>
    </HubPage>
  );
}
