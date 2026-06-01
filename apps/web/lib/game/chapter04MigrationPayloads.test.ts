import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseStepContent } from "@/lib/game/stepContentValidation";

const repoRoot = path.resolve(__dirname, "../../../..");
const mainMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260630120000_chapter_04_act_content.sql",
);

const EXPECTED_CHAPTER_THEME = {
  background: "static/navigation/backgrounds/ph-st-nav-chapter-bg",
  music: "chapter4-theme",
  paletteKey: "chapter4",
};

type StepMeta = {
  kind: "cutscene" | "task";
  taskType: string | null;
  logical: string;
};

function loadMigrationSql(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function extractPayloadsByTag(sql: string): Map<string, unknown> {
  const payloadRe = /\$(\w+)\$(\{[\s\S]*?\})\$\1\$/g;
  const byTag = new Map<string, unknown>();
  for (const m of sql.matchAll(payloadRe)) {
    byTag.set(m[1], JSON.parse(m[2]));
  }
  return byTag;
}

function collectStepPayloads(sql: string): Array<{ tag: string; meta: StepMeta; payload: unknown }> {
  const rowRe =
    /\(\s*'chapter-04-quest-[^']+',\s*(\d+),\s*'(cutscene|task)',\s*(?:'([^']*)'|null)(?:::text)?,\s*'([^']+)',\s*'([^']+)',\s*\$(\w+)\$/gs;
  const tags = new Map<string, StepMeta>();
  for (const m of sql.matchAll(rowRe)) {
    tags.set(m[6], {
      kind: m[2] as "cutscene" | "task",
      taskType: m[3] ?? null,
      logical: m[5],
    });
  }

  const rows: Array<{ tag: string; meta: StepMeta; payload: unknown }> = [];
  for (const [tag, payload] of extractPayloadsByTag(sql)) {
    const meta = tags.get(tag);
    if (!meta) continue;
    rows.push({ tag, meta, payload });
  }
  return rows;
}

function validateStepPayloads(
  rows: Array<{ meta: StepMeta; payload: unknown }>,
): string[] {
  const failures: string[] = [];
  for (const { meta, payload } of rows) {
    const result = parseStepContent({
      step_kind: meta.kind,
      task_type: meta.taskType,
      content_payload: payload,
    });
    if (!result.ok) {
      failures.push(`${meta.logical}: ${result.issues}`);
    }
  }
  return failures;
}

function extractChapterThemeFromMainMigration(sql: string): typeof EXPECTED_CHAPTER_THEME {
  const match = sql.match(
    /insert into public\.game_chapters[\s\S]*?values \(\s*'chapter-04',[\s\S]*?'(\{[\s\S]*?\})'::jsonb/s,
  );
  expect(match).not.toBeNull();
  return JSON.parse(match![1]) as typeof EXPECTED_CHAPTER_THEME;
}

describe("chapter-04 migration payloads", () => {
  const mainSql = loadMigrationSql(mainMigrationPath);
  const mainSteps = collectStepPayloads(mainSql);

  it("validates all 16 step content_payload objects in the main migration", () => {
    expect(mainSteps).toHaveLength(16);
    expect(validateStepPayloads(mainSteps), validateStepPayloads(mainSteps).join("\n")).toEqual([]);
  });

  it("sets sceneBackgroundAsset on every task and cutscene step", () => {
    for (const { meta, payload } of mainSteps) {
      const record = payload as Record<string, unknown>;
      expect(record.sceneBackgroundAsset, `${meta.logical} missing sceneBackgroundAsset`).toBeTruthy();
    }
  });

  it("uses unique logical_task_key values across the chapter", () => {
    const keys = mainSteps.map((row) => row.meta.logical);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps chapter theme_payload aligned with chapter4 palette", () => {
    expect(extractChapterThemeFromMainMigration(mainSql)).toEqual(EXPECTED_CHAPTER_THEME);
  });

  it("requires chapter 3 cioccoshow before chapter 4 bridge", () => {
    expect(mainSql).toContain('"prerequisiteQuestSlugs":["chapter-03-quest-04-cioccoshow"]');
  });

  it("uses linear unlock through mail before Comacchio", () => {
    expect(mainSql).toContain(
      '"prerequisiteQuestSlugs":["chapter-04-quest-03-mail-consolation"]',
    );
    expect(mainSql).toContain('"autoStartQuestSlug":"chapter-04-quest-02-sara-giardini"');
    expect(mainSql).toContain('"autoStartQuestSlug":"chapter-04-quest-05-bonus-vocab"');
  });

  it("stores four Sicily photos for Sara", () => {
    const photo = mainSteps.find((row) => row.meta.logical === "chapter-04-q2-photo-sicily");
    expect(photo).toBeDefined();
    const items = (
      photo!.payload as { photoViewerChrome?: { items?: unknown[] } }
    ).photoViewerChrome?.items;
    expect(items?.length).toBe(4);
  });

  it("stores four Comacchio multiple-choice questions", () => {
    const mc = mainSteps.find((row) => row.meta.logical === "chapter-04-q4-mc-invito");
    expect(mc).toBeDefined();
    const questions = (mc!.payload as { questions?: unknown[] }).questions;
    expect(questions?.length).toBe(4);
  });

  it("retires mistaken Atto-6 quest slugs under chapter-04", () => {
    expect(mainSql).toContain("chapter-04-quest-02-restaurant-literature");
    expect(mainSql).toContain("set is_active = false");
  });
});
