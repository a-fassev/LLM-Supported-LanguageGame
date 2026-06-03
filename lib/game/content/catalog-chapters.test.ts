import { describe, expect, it } from "vitest";
import { loadContentCatalog, resetContentCatalogCacheForTests } from "@/lib/game/content/catalog-loader";

describe("content catalog chapters", () => {
  it("loads seven chapters from lib/content (reference sandbox + progression 1–6)", async () => {
    resetContentCatalogCacheForTests();
    const catalog = await loadContentCatalog({ bypassCache: true });
    expect(catalog.chapters.map((chapter) => chapter.id)).toEqual([
      "chapter-00",
      "chapter-01",
      "chapter-02",
      "chapter-03",
      "chapter-04",
      "chapter-05",
      "chapter-06",
    ]);
    expect(catalog.chapters[0].reference).toBe(true);
    expect(catalog.chapters[0].order).toBe(0);
  });
});
