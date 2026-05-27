import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseStepContent } from "@/lib/game/stepContentValidation";

const repoRoot = path.resolve(__dirname, "../../../..");
const mainMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260627180000_chapter_03_act_content.sql",
);
const dragDropFollowUpPath = path.join(
  repoRoot,
  "supabase/migrations/20260627180200_chapter_03_dragdrop_match_mode.sql",
);

const EXPECTED_CHAPTER_THEME = {
  background: "static/navigation/backgrounds/ph-st-nav-chapter-bg",
  music: "chapter3-theme",
  paletteKey: "chapter3",
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
    /\(\s*'chapter-03-quest-[^']+',\s*(\d+),\s*'(cutscene|task)',\s*(?:'([^']*)'|null)(?:::text)?,\s*'([^']+)',\s*'([^']+)',\s*\$(\w+)\$/gs;
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
    /insert into public\.game_chapters[\s\S]*?values \(\s*'chapter-03',[\s\S]*?'(\{[\s\S]*?\})'::jsonb/s,
  );
  expect(match).not.toBeNull();
  return JSON.parse(match![1]) as typeof EXPECTED_CHAPTER_THEME;
}

describe("chapter-03 migration payloads", () => {
  const mainSql = loadMigrationSql(mainMigrationPath);
  const mainSteps = collectStepPayloads(mainSql);

  it("validates all 18 step content_payload objects in the main migration", () => {
    expect(mainSteps).toHaveLength(18);
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

  it("keeps chapter theme_payload aligned with chapter3 palette", () => {
    expect(extractChapterThemeFromMainMigration(mainSql)).toEqual(EXPECTED_CHAPTER_THEME);
  });

  it("requires chapter 2 restaurant quest before chapter 3 bridge", () => {
    expect(mainSql).toContain('"prerequisiteQuestSlugs":["chapter-02-quest-04-restaurant"]');
  });

  it("requires cioccoshow before bonus vocab", () => {
    expect(mainSql).toContain(
      '"prerequisiteQuestSlugs":["chapter-03-quest-04-cioccoshow"]',
    );
  });

  it("includes museum volantino reference document in quest meta", () => {
    expect(mainSql).toContain('"documentId": "volantino-bologna-storia"');
    expect(mainSql).toContain('"buttonLabel": "Vedi il volantino"');
  });

  it("includes Made in Italy reference document on cioccoshow quest", () => {
    expect(mainSql).toContain('"documentId": "rivista-made-in-italy"');
    expect(mainSql).toContain('"buttonLabel": "Vedi la rivista"');
  });

  it("uses matchMode all on Made in Italy drag-drop city buckets", () => {
    const dragDrop = mainSteps.find(
      (row) => row.meta.logical === "chapter-03-q4-dragdrop-made-in-italy",
    );
    expect(dragDrop).toBeDefined();
    const targets = (dragDrop!.payload as { targets: Array<{ matchMode?: string }> }).targets;
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(target.matchMode, JSON.stringify(target)).toBe("all");
    }
  });

  it("keeps drag-drop follow-up targets in sync with the main migration", () => {
    const dragDrop = mainSteps.find(
      (row) => row.meta.logical === "chapter-03-q4-dragdrop-made-in-italy",
    );
    expect(dragDrop).toBeDefined();
    const followUpSql = loadMigrationSql(dragDropFollowUpPath);
    const match = followUpSql.match(/'(\[[\s\S]*?\])'::jsonb/);
    expect(match).not.toBeNull();
    const followUpTargets = JSON.parse(match![1]) as unknown;
    expect(followUpTargets).toEqual(
      (dragDrop!.payload as { targets: unknown }).targets,
    );
  });
});
