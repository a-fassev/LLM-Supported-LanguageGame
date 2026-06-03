import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type ChapterFileParsed,
  type QuestFileParsed,
  type SceneFileParsed,
  parseChapterFile,
  parseQuestFile,
  parseSceneFile,
} from "@/lib/game/schemas/contentCatalogSchema";

export type CatalogScene = SceneFileParsed & {
  sceneNumber: number;
  filename: string;
};

export type CatalogQuest = QuestFileParsed & {
  scenes: CatalogScene[];
};

export type CatalogChapter = ChapterFileParsed & {
  questsExpanded: CatalogQuest[];
};

export type ContentCatalog = {
  chapters: CatalogChapter[];
};

let cachedCatalog: ContentCatalog | null = null;
let cachedRoot: string | null = null;

function err(message: string): never {
  throw new Error(`[content-catalog] ${message}`);
}

function sceneIdExpected(chapterId: string, questId: string, sceneNumber: number): string {
  return `${chapterId}-${questId}-scene-${sceneNumber.toString().padStart(2, "0")}`;
}

function parseSceneNumberFromFilename(filename: string): number {
  const m = /^(\d{2})\.json$/.exec(filename);
  if (!m) err(`invalid scene filename '${filename}' (expected exactly NN.json, e.g. 01.json)`);
  return Number.parseInt(m[1], 10);
}

function validateSceneSequence(sceneNumbers: number[], chapterId: string, questId: string) {
  if (sceneNumbers.length === 0) {
    err(`chapter '${chapterId}' quest '${questId}' has no scenes`);
  }
  for (let i = 0; i < sceneNumbers.length; i++) {
    const expected = i + 1;
    if (sceneNumbers[i] !== expected) {
      err(
        `chapter '${chapterId}' quest '${questId}' scene files must be contiguous from 01.json (missing ${expected.toString().padStart(2, "0")}.json)`,
      );
    }
  }
}

async function readJson(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    err(`invalid JSON: ${filePath}`);
  }
}

async function loadScenes(chapterId: string, questId: string, scenesDir: string): Promise<CatalogScene[]> {
  const sceneDirEntries = await fs.readdir(scenesDir, { withFileTypes: true });
  const sceneFiles = sceneDirEntries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((e) => e.name);
  if (sceneFiles.length === 0) {
    err(`chapter '${chapterId}' quest '${questId}' has no scene JSON files`);
  }

  const sceneNumbers = sceneFiles.map(parseSceneNumberFromFilename).sort((a, b) => a - b);
  validateSceneSequence(sceneNumbers, chapterId, questId);

  const scenes: CatalogScene[] = [];
  for (const n of sceneNumbers) {
    const filename = `${n.toString().padStart(2, "0")}.json`;
    const filePath = path.join(scenesDir, filename);
    const raw = await readJson(filePath);
    const parsed = parseSceneFile(raw);
    if (!parsed.ok) err(`${filePath}: ${parsed.issues}`);
    const scene = parsed.value;

    const expectedId = sceneIdExpected(chapterId, questId, n);
    if (scene.id !== expectedId) {
      err(`${filePath}: scene id '${scene.id}' must be '${expectedId}'`);
    }

    scenes.push({ ...scene, sceneNumber: n, filename });
  }
  return scenes;
}

async function loadQuest(chapterId: string, questId: string, questsDir: string): Promise<CatalogQuest> {
  const questDir = path.join(questsDir, questId);
  const stat = await fs.stat(questDir).catch(() => null);
  if (!stat?.isDirectory()) {
    err(`chapter '${chapterId}' references missing quest directory '${questId}'`);
  }

  const questPath = path.join(questDir, "quest.json");
  const questRaw = await readJson(questPath);
  const questParsed = parseQuestFile(questRaw);
  if (!questParsed.ok) err(`${questPath}: ${questParsed.issues}`);
  const quest = questParsed.value;
  if (quest.id !== questId) {
    err(`${questPath}: id '${quest.id}' must match directory '${questId}'`);
  }

  const scenes = await loadScenes(chapterId, questId, path.join(questDir, "scenes"));
  return { ...quest, scenes };
}

function validateQuestFlow(chapter: ChapterFileParsed, quests: CatalogQuest[]) {
  const byId = new Map(quests.map((q) => [q.id, q] as const));
  const orderedMain = chapter.quests.map((id) => byId.get(id)).filter((q): q is CatalogQuest => !!q && q.kind === "main");
  for (let i = 0; i < orderedMain.length; i++) {
    const q = orderedMain[i];
    const expectedRequires = i === 0 ? null : orderedMain[i - 1].id;
    if (q.requiresQuestId !== expectedRequires) {
      err(
        `chapter '${chapter.id}' quest '${q.id}' requiresQuestId '${q.requiresQuestId}' must match previous main quest '${expectedRequires}'`,
      );
    }
    if (q.autoStartQuestId !== null) {
      const target = byId.get(q.autoStartQuestId);
      if (!target || target.kind !== "main") {
        err(`chapter '${chapter.id}' quest '${q.id}' autoStartQuestId '${q.autoStartQuestId}' must point to a main quest`);
      }
      if (q.autoStartQuestId === q.id) {
        err(`chapter '${chapter.id}' quest '${q.id}' autoStartQuestId cannot self-reference`);
      }
    }
  }
}

async function loadCatalogInternal(contentRoot: string): Promise<ContentCatalog> {
  const chaptersRoot = path.join(contentRoot, "chapters");
  const chapterEntries = await fs.readdir(chaptersRoot, { withFileTypes: true }).catch(() => null);
  if (!chapterEntries) err(`missing content directory '${chaptersRoot}'`);

  const chapterDirs = chapterEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (chapterDirs.length === 0) err(`no chapters found in '${chaptersRoot}'`);

  const loaded: CatalogChapter[] = [];
  for (const chapterDirName of chapterDirs) {
    const chapterDir = path.join(chaptersRoot, chapterDirName);
    const chapterPath = path.join(chapterDir, "chapter.json");
    const chapterRaw = await readJson(chapterPath);
    const chapterParsed = parseChapterFile(chapterRaw);
    if (!chapterParsed.ok) err(`${chapterPath}: ${chapterParsed.issues}`);
    const chapter = chapterParsed.value;

    if (chapter.id !== chapterDirName) {
      err(`${chapterPath}: id '${chapter.id}' must match directory '${chapterDirName}'`);
    }

    const questsDir = path.join(chapterDir, "quests");
    const quests = await Promise.all(chapter.quests.map((questId) => loadQuest(chapter.id, questId, questsDir)));
    validateQuestFlow(chapter, quests);

    loaded.push({
      ...chapter,
      questsExpanded: quests,
    });
  }

  loaded.sort((a, b) => a.order - b.order);
  for (let i = 0; i < loaded.length; i++) {
    const expected = i + 1;
    if (loaded[i].order !== expected) {
      err(`chapter order must be contiguous from 1 (missing order ${expected})`);
    }
  }
  return { chapters: loaded };
}

export async function loadContentCatalog(options?: {
  rootDir?: string;
  bypassCache?: boolean;
}): Promise<ContentCatalog> {
  const rootDir = options?.rootDir ?? path.join(process.cwd(), "lib", "content");
  const bypassCache =
    options?.bypassCache !== undefined
      ? options.bypassCache
      : process.env.NODE_ENV === "development";

  if (!bypassCache && cachedCatalog && cachedRoot === rootDir) return cachedCatalog;
  const catalog = await loadCatalogInternal(rootDir);
  if (!bypassCache) {
    cachedCatalog = catalog;
    cachedRoot = rootDir;
  }
  return catalog;
}

export function resetContentCatalogCacheForTests() {
  cachedCatalog = null;
  cachedRoot = null;
}

export function findCatalogChapter(catalog: ContentCatalog, chapterId: string): CatalogChapter | null {
  return catalog.chapters.find((chapter) => chapter.id === chapterId) ?? null;
}

export function findCatalogQuest(
  catalog: ContentCatalog,
  chapterId: string,
  questId: string,
): CatalogQuest | null {
  const chapter = findCatalogChapter(catalog, chapterId);
  if (!chapter) return null;
  return chapter.questsExpanded.find((quest) => quest.id === questId) ?? null;
}

export function findCatalogScene(
  catalog: ContentCatalog,
  chapterId: string,
  questId: string,
  sceneId: string,
): CatalogScene | null {
  const quest = findCatalogQuest(catalog, chapterId, questId);
  if (!quest) return null;
  return quest.scenes.find((scene) => scene.id === sceneId) ?? null;
}

