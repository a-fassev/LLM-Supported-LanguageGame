import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadContentCatalog, resetContentCatalogCacheForTests } from "@/lib/game/content/catalog-loader";

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function makeBaseCatalogRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lg-content-"));
  const chapterDir = path.join(root, "chapters", "chapter-01");
  await writeJson(path.join(chapterDir, "chapter.json"), {
    id: "chapter-01",
    title: "Bologna",
    order: 0,
    quests: ["quest-01"],
    background: "chapters/01/chapter/bg-missions",
  });
  await writeJson(path.join(chapterDir, "quests", "quest-01", "quest.json"), {
    id: "quest-01",
    title: "Arrivo",
    order: 1,
    kind: "main",
    requiresQuestId: null,
    background: "chapters/01/quests/01/bg-overview",
  });
  return root;
}

describe("catalog-loader", () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    resetContentCatalogCacheForTests();
    await Promise.all(
      tempRoots.map(async (root) => {
        await fs.rm(root, { recursive: true, force: true });
      }),
    );
    tempRoots.length = 0;
  });

  it("loads a valid catalog", async () => {
    const root = await makeBaseCatalogRoot();
    tempRoots.push(root);

    await writeJson(path.join(root, "chapters", "chapter-01", "quests", "quest-01", "scenes", "01.json"), {
      id: "chapter-01-quest-01-scene-01",
      scene_type: "story",
      screen_type: "info",
      background: "chapters/01/quests/01/bg",
      content: { text: "hello" },
    });
    await writeJson(path.join(root, "chapters", "chapter-01", "quests", "quest-01", "scenes", "02.json"), {
      id: "chapter-01-quest-01-scene-02",
      scene_type: "task",
      screen_type: "multiple_choice",
      background: "chapters/01/quests/01/bg-task",
      content: {
        title: "x",
        task: {
          selectionMode: "single",
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ],
          correctOptionIds: ["a"],
        },
      },
      scoring: {
        backpack: { pieces: 1 },
        pizza: { mode: "flat", slices: 1 },
      },
    });

    const catalog = await loadContentCatalog({ rootDir: root, bypassCache: true });
    expect(catalog.chapters).toHaveLength(1);
    expect(catalog.chapters[0].questsExpanded[0].scenes).toHaveLength(2);
    expect(catalog.chapters[0].questsExpanded[0].scenes[1].id).toBe("chapter-01-quest-01-scene-02");
  });

  it("fails when scene sequence has gaps", async () => {
    const root = await makeBaseCatalogRoot();
    tempRoots.push(root);

    await writeJson(path.join(root, "chapters", "chapter-01", "quests", "quest-01", "scenes", "01.json"), {
      id: "chapter-01-quest-01-scene-01",
      scene_type: "story",
      screen_type: "info",
      background: "chapters/01/quests/01/bg",
      content: { text: "hello" },
    });
    await writeJson(path.join(root, "chapters", "chapter-01", "quests", "quest-01", "scenes", "03.json"), {
      id: "chapter-01-quest-01-scene-03",
      scene_type: "story",
      screen_type: "info",
      background: "chapters/01/quests/01/bg",
      content: { text: "ciao" },
    });

    await expect(loadContentCatalog({ rootDir: root, bypassCache: true })).rejects.toThrow(/missing 02\.json/);
  });

  it("fails when scene id does not match filename convention", async () => {
    const root = await makeBaseCatalogRoot();
    tempRoots.push(root);

    await writeJson(path.join(root, "chapters", "chapter-01", "quests", "quest-01", "scenes", "01.json"), {
      id: "chapter-01-quest-01-scene-99",
      scene_type: "story",
      screen_type: "info",
      background: "chapters/01/quests/01/bg",
      content: { text: "hello" },
    });

    await expect(loadContentCatalog({ rootDir: root, bypassCache: true })).rejects.toThrow(/must be 'chapter-01-quest-01-scene-01'/);
  });

  it("fails when scene filename is not exactly two digits", async () => {
    const root = await makeBaseCatalogRoot();
    tempRoots.push(root);

    await writeJson(path.join(root, "chapters", "chapter-01", "quests", "quest-01", "scenes", "1.json"), {
      id: "chapter-01-quest-01-scene-01",
      scene_type: "story",
      screen_type: "info",
      background: "chapters/01/quests/01/bg",
      content: { text: "hello" },
    });

    await expect(loadContentCatalog({ rootDir: root, bypassCache: true })).rejects.toThrow(/expected exactly NN\.json/);
  });

  it("loads matching scene with poolPairs and sampleSize without concrete items", async () => {
    const root = await makeBaseCatalogRoot();
    tempRoots.push(root);

    await writeJson(path.join(root, "chapters", "chapter-01", "quests", "quest-01", "scenes", "01.json"), {
      id: "chapter-01-quest-01-scene-01",
      scene_type: "story",
      screen_type: "info",
      background: "chapters/01/quests/01/bg",
      content: { text: "hello" },
    });
    await writeJson(path.join(root, "chapters", "chapter-01", "quests", "quest-01", "scenes", "02.json"), {
      id: "chapter-01-quest-01-scene-02",
      scene_type: "task",
      screen_type: "matching",
      background: "chapters/01/quests/01/bg-task",
      content: {
        title: "Pool matching",
        task: {
          poolPairs: [{ id: "p1", leftLabel: "ciao", rightLabel: "hello" }],
          sampleSize: 1,
        },
      },
      scoring: {
        backpack: { pieces: 1 },
        pizza: { mode: "flat", slices: 1 },
      },
    });

    const catalog = await loadContentCatalog({ rootDir: root, bypassCache: true });
    const quest = catalog.chapters[0]?.questsExpanded[0];
    const task = quest?.scenes[1];
    expect(task?.screen_type).toBe("matching");
    expect((task?.content.task as { poolPairs?: unknown[] }).poolPairs).toHaveLength(1);
  });

  it("rejects more than one reference chapter", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "lg-content-ref-"));
    tempRoots.push(root);

    for (const [chapterId, order] of [
      ["chapter-00", 0],
      ["chapter-99", 1],
    ] as const) {
      const chapterDir = path.join(root, "chapters", chapterId);
      await writeJson(path.join(chapterDir, "chapter.json"), {
        id: chapterId,
        title: "Ref",
        order,
        reference: true,
        quests: ["quest-01"],
        background: "chapters/00/chapter/bg-missions",
      });
      await writeJson(path.join(chapterDir, "quests", "quest-01", "quest.json"), {
        id: "quest-01",
        title: "Q",
        order: 1,
        kind: "main",
        requiresQuestId: null,
        background: "chapters/00/quests/01/bg-overview",
      });
      await writeJson(path.join(chapterDir, "quests", "quest-01", "scenes", "01.json"), {
        id: `${chapterId}-quest-01-scene-01`,
        scene_type: "story",
        screen_type: "info",
        background: "chapters/00/quests/01/bg",
        content: { text: "hello" },
      });
    }

    await expect(loadContentCatalog({ rootDir: root, bypassCache: true })).rejects.toThrow(
      /at most one chapter may have reference: true/,
    );
  });
});
