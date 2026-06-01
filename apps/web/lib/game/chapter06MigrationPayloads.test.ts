import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseStepContent } from "@/lib/game/stepContentValidation";

const repoRoot = path.resolve(__dirname, "../../../..");
const mainMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260702120000_chapter_06_act_content.sql",
);

const EXPECTED_CHAPTER_THEME = {
  background: "static/navigation/backgrounds/ph-st-nav-chapter-bg",
  music: "chapter6-theme",
  paletteKey: "chapter6",
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
    /\(\s*'chapter-06-quest-[^']+',\s*(\d+),\s*'(cutscene|task)',\s*(?:'([^']*)'|null)(?:::text)?,\s*'([^']+)',\s*'([^']+)',\s*\$(\w+)\$/gs;
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
    /insert into public\.game_chapters[\s\S]*?values \(\s*'chapter-06',[\s\S]*?'(\{[\s\S]*?\})'::jsonb/s,
  );
  expect(match).not.toBeNull();
  return JSON.parse(match![1]) as typeof EXPECTED_CHAPTER_THEME;
}

describe("chapter-06 migration payloads", () => {
  const mainSql = loadMigrationSql(mainMigrationPath);
  const mainSteps = collectStepPayloads(mainSql);

  it("validates all 13 step content_payload objects in the main migration", () => {
    expect(mainSteps).toHaveLength(13);
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

  it("keeps chapter theme_payload aligned with chapter6 palette", () => {
    expect(extractChapterThemeFromMainMigration(mainSql)).toEqual(EXPECTED_CHAPTER_THEME);
  });

  it("requires chapter 5 formal mail before chapter 6 bridge", () => {
    expect(mainSql).toContain('"prerequisiteQuestSlugs":["chapter-05-quest-04-formal-mail"]');
  });

  it("gates finale on both parallel branches", () => {
    expect(mainSql).toContain(
      '"prerequisiteQuestSlugs":["chapter-06-quest-02-restaurant-literature","chapter-06-quest-03-sicily-lady"]',
    );
  });

  it("stores sicily photo viewer with seven captions", () => {
    const photo = mainSteps.find((row) => row.meta.logical === "chapter-06-q3-photo-sicily");
    expect(photo).toBeDefined();
    const items = (
      photo!.payload as { photoViewerChrome?: { items?: unknown[] } }
    ).photoViewerChrome?.items;
    expect(items?.length).toBe(7);
  });

  it("stores sixteen multiple-choice questions in the finale quiz", () => {
    const quiz = mainSteps.find((row) => row.meta.logical === "chapter-06-q4-quiz-italiana");
    expect(quiz).toBeDefined();
    const questions = (quiz!.payload as { questions?: unknown[] }).questions;
    expect(questions?.length).toBe(16);
  });

  it("uses chapter-06 GameArt paths in payloads", () => {
    for (const { meta, payload } of mainSteps) {
      const asset = (payload as { sceneBackgroundAsset?: string }).sceneBackgroundAsset;
      if (asset) {
        expect(asset, `${meta.logical} sceneBackgroundAsset`).toMatch(/chapter-06/);
      }
    }
  });
});
