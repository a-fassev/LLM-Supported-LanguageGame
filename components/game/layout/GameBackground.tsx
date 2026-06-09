"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { preloadAssetUrl } from "@/lib/game/content/preload-asset-url";
import { resolveAssetUrl } from "@/lib/game/content/resolve-asset-url";

export const BACKGROUND_CROSSFADE_MS = 300;

type GameBackgroundProps = {
  assetKey?: string | null;
  /** Additional keys to warm in cache (e.g. auth pair, next scene background). */
  preloadAssetKeys?: readonly string[];
  mode?: "hub" | "play";
  className?: string;
  children: React.ReactNode;
};

export function GameBackground({
  assetKey,
  preloadAssetKeys,
  mode = "hub",
  className,
  children,
}: GameBackgroundProps) {
  const targetUrl = resolveAssetUrl(assetKey);
  const fallback = mode === "play" ? "game-background-fallback-play" : "game-background-fallback-hub";
  const prioritizeImage = mode === "play" || Boolean(preloadAssetKeys?.length);

  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const displayedUrlRef = useRef<string | null>(null);
  const activeTargetUrlRef = useRef<string | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!preloadAssetKeys?.length) return;
    for (const key of preloadAssetKeys) {
      const url = resolveAssetUrl(key);
      if (url) void preloadAssetUrl(url);
    }
  }, [preloadAssetKeys]);

  useEffect(() => {
    activeTargetUrlRef.current = targetUrl;

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (!targetUrl) {
      displayedUrlRef.current = null;
      queueMicrotask(() => {
        if (activeTargetUrlRef.current !== null) return;
        setBaseUrl(null);
        setOverlayUrl(null);
        setOverlayVisible(false);
      });
      return;
    }

    if (targetUrl === displayedUrlRef.current) return;

    let cancelled = false;

    void (async () => {
      const requestedUrl = targetUrl;
      const loaded = await preloadAssetUrl(requestedUrl);
      if (cancelled || activeTargetUrlRef.current !== requestedUrl) return;

      if (!loaded) {
        if (activeTargetUrlRef.current !== requestedUrl) return;
        displayedUrlRef.current = null;
        setBaseUrl(null);
        setOverlayUrl(null);
        setOverlayVisible(false);
        return;
      }

      if (cancelled || activeTargetUrlRef.current !== requestedUrl) return;

      const previous = displayedUrlRef.current;
      displayedUrlRef.current = requestedUrl;

      if (!previous) {
        setBaseUrl(requestedUrl);
        setOverlayUrl(null);
        setOverlayVisible(false);
        return;
      }

      setOverlayUrl(requestedUrl);
      setOverlayVisible(false);
      requestAnimationFrame(() => {
        if (!cancelled && activeTargetUrlRef.current === requestedUrl) {
          setOverlayVisible(true);
        }
      });

      transitionTimerRef.current = setTimeout(() => {
        if (cancelled || activeTargetUrlRef.current !== requestedUrl) return;
        setBaseUrl(requestedUrl);
        setOverlayUrl(null);
        setOverlayVisible(false);
        transitionTimerRef.current = null;
      }, BACKGROUND_CROSSFADE_MS);
    })();

    return () => {
      cancelled = true;
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [targetUrl]);

  const renderLayer = (url: string, opacity: number) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={url}
      src={url}
      alt=""
      className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover ease-out"
      style={{
        opacity,
        transitionDuration: `${BACKGROUND_CROSSFADE_MS}ms`,
        transitionProperty: "opacity",
      }}
      loading={prioritizeImage ? "eager" : "lazy"}
      fetchPriority={prioritizeImage ? "high" : "auto"}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );

  return (
    <div className={cn("scrollbar-hide relative isolate h-dvh w-full overflow-x-hidden overflow-y-auto", fallback, className)}>
      {baseUrl ? renderLayer(baseUrl, overlayUrl && overlayVisible ? 0 : 1) : null}
      {overlayUrl ? renderLayer(overlayUrl, overlayVisible ? 1 : 0) : null}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/20" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
