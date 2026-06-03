import { describe, expect, it } from "vitest";
import { loadContentCatalog, resetContentCatalogCacheForTests } from "@/lib/game/content/catalog-loader";

describe("content catalog chapters", () => {
  it("loads six chapters from lib/content", async () => {
    resetContentCatalogCacheForTests();
    const catalog = await loadContentCatalog({ bypassCache: true });
    expect(catalog.chapters.map((chapter) => chapter.id)).toEqual([
      "chapter-01",
      "chapter-02",
      "chapter-03",
      "chapter-04",
      "chapter-05",
      "chapter-06",
    ]);
  });
});
