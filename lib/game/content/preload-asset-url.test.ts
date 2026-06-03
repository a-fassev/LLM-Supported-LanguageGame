import { afterEach, describe, expect, it, vi } from "vitest";
import { clearAssetPreloadCache, preloadAssetUrl } from "@/lib/game/content/preload-asset-url";

describe("preloadAssetUrl", () => {
  afterEach(() => {
    clearAssetPreloadCache();
    vi.restoreAllMocks();
  });

  it("resolves true when image loads", async () => {
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      decoding = "async";
      private _src = "";

      set src(value: string) {
        this._src = value;
        queueMicrotask(() => this.onload?.());
      }

      get src() {
        return this._src;
      }
    }

    vi.stubGlobal("Image", MockImage);

    await expect(preloadAssetUrl("/content-assets/hubs/auth/bg-login.png")).resolves.toBe(true);
  });

  it("deduplicates concurrent preloads for the same url", async () => {
    let constructCount = 0;

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      decoding = "async";

      constructor() {
        constructCount += 1;
      }

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", MockImage);

    const url = "/content-assets/hubs/auth/bg-register.png";
    await Promise.all([preloadAssetUrl(url), preloadAssetUrl(url)]);
    expect(constructCount).toBe(1);
  });

  it("evicts oldest entries when cache exceeds limit", async () => {
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      decoding = "async";

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", MockImage);

    for (let i = 0; i < 50; i++) {
      await preloadAssetUrl(`/content-assets/test/bg-${i}.png`);
    }

    let constructCount = 0;
    class TrackingImage extends MockImage {
      constructor() {
        super();
        constructCount += 1;
      }
    }
    vi.stubGlobal("Image", TrackingImage);

    await preloadAssetUrl("/content-assets/test/bg-0.png");
    expect(constructCount).toBe(1);
  });
});
