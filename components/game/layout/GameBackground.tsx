import { cn } from "@/lib/utils";
import { resolveAssetUrl } from "@/lib/game/content/resolve-asset-url";

type GameBackgroundProps = {
  assetKey?: string | null;
  mode?: "hub" | "play";
  className?: string;
  children: React.ReactNode;
};

export function GameBackground({ assetKey, mode = "hub", className, children }: GameBackgroundProps) {
  const url = resolveAssetUrl(assetKey);
  const fallback = mode === "play" ? "game-background-fallback-play" : "game-background-fallback-hub";

  return (
    <div className={cn("relative isolate min-h-dvh w-full overflow-hidden", fallback, className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-black/20" />
      <div className="relative z-10 min-h-dvh">{children}</div>
    </div>
  );
}
