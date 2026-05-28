import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseStepContent } from "@/lib/game/stepContentValidation";

const repoRoot = path.resolve(__dirname, "../../../..");
const mainMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260627150000_chapter_02_act_content.sql",
);
const followUpMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260627150100_chapter_02_review_fixes.sql",
);
const q3SplitMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260629120000_chapter_02_q3_split_profiles.sql",
);
const nutelleriaClozeLinesMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260628160000_chapter_02_nutelleria_cloze_lines.sql",
);

/** Dollar-quote tags in follow-up migrations mapped to canonical main migration tags. */
const FOLLOW_UP_STEP_TAG_MAP = {
  q3s1_photo: "q3s1_photo",
  q3s2_saviano: "q3s2_saviano",
  q3s3_delpiero: "q3s3_delpiero",
  q3s4_ferragni: "q3s4_ferragni",
} as const;

const EXPECTED_CHAPTER_THEME = {
  background: "static/navigation/backgrounds/ph-st-nav-chapter-bg",
  music: "chapter2-theme",
  paletteKey: "chapter2",
};

type StepMeta = {
  kind: "cutscene" | "task";
  taskType: string | null;
  logical: string;
};

function loadMigrationSql(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

/** Extract JSON payloads from SQL dollar-quoted blocks keyed by tag name. */
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
    /\(\s*'chapter-02-quest-[^']+',\s*(\d+),\s*'(cutscene|task)',\s*(?:'([^']*)'|null)(?:::text)?,\s*'([^']+)',\s*'([^']+)',\s*\$(\w+)\$/gs;
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
    /insert into public\.game_chapters[\s\S]*?values \(\s*'chapter-02',[\s\S]*?'(\{[\s\S]*?\})'::jsonb/s,
  );
  expect(match).not.toBeNull();
  return JSON.parse(match![1]) as typeof EXPECTED_CHAPTER_THEME;
}

describe("chapter-02 migration payloads", () => {
  const mainSql = loadMigrationSql(mainMigrationPath);
  const followUpSql = loadMigrationSql(followUpMigrationPath);
  const q3SplitSql = loadMigrationSql(q3SplitMigrationPath);
  const mainSteps = collectStepPayloads(mainSql);
  const mainByTag = extractPayloadsByTag(mainSql);
  const followUpByTag = extractPayloadsByTag(followUpSql);
  const q3SplitByTag = extractPayloadsByTag(q3SplitSql);

  it("validates all 21 step content_payload objects in the main migration", () => {
    expect(mainSteps).toHaveLength(21);
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

  it("retires greenfield demo quests for chapter-02", () => {
    expect(mainSql).toContain("and q.slug in ('quest-03', 'quest-04')");
  });

  it("keeps chapter theme_payload aligned with chapter2 palette", () => {
    expect(extractChapterThemeFromMainMigration(mainSql)).toEqual(EXPECTED_CHAPTER_THEME);
  });

  it("requires chapter 1 bar quest before chapter 2 bridge", () => {
    expect(mainSql).toContain('"prerequisiteQuestSlugs":["chapter-01-quest-03-bar"]');
  });

  it("requires all three location quests before bonus", () => {
    expect(mainSql).toContain(
      '"prerequisiteQuestSlugs":["chapter-02-quest-02-nutelleria","chapter-02-quest-03-school-project","chapter-02-quest-04-restaurant"]',
    );
  });

  it("uses drag-drop OR semantics for motivation letter gap t3", () => {
    const q4 = mainSteps.find((row) => row.meta.logical === "chapter-02-q4-dragdrop-motivation-letter");
    expect(q4).toBeDefined();
    const payload = q4!.payload as Record<string, unknown>;
    const targets = payload.targets as Array<{ id: string; correctItemIds: string[] }>;
    const t3 = targets.find((t) => t.id === "t3");
    expect(t3?.correctItemIds).toEqual(["f-inizio"]);
  });

  it("splits Akt 2.2 profiles into photo grid plus three identikit ClozeText steps", () => {
    const photo = mainSteps.find((row) => row.meta.logical === "chapter-02-q3-profiles-photo");
    expect(photo).toBeDefined();
    expect(photo!.meta.taskType).toBe("SpecialScreen");
    const photoPayload = photo!.payload as {
      photoViewerChrome?: { showCaptions?: boolean; items?: unknown[] };
      blocks?: unknown[];
    };
    expect(photoPayload.photoViewerChrome?.showCaptions).toBe(true);
    expect(photoPayload.photoViewerChrome?.items).toHaveLength(3);
    expect(photoPayload.blocks).toEqual([]);

    const identikitKeys = [
      "chapter-02-q3-identikit-saviano",
      "chapter-02-q3-identikit-del-piero",
      "chapter-02-q3-identikit-ferragni",
    ];
    for (const key of identikitKeys) {
      const step = mainSteps.find((row) => row.meta.logical === key);
      expect(step, key).toBeDefined();
      expect(step!.meta.taskType).toBe("ClozeText");
      const payload = step!.payload as {
        referenceDocument?: { title?: string; bodyText?: string };
        lines?: Array<{ segments: unknown[] }>;
      };
      expect(payload.referenceDocument?.bodyText?.length).toBeGreaterThan(40);
      expect(payload.lines?.length).toBe(6);
    }
  });

  it("uses ClozeText (not SpecialScreen) for q3 identikit steps to avoid attempt_mismatch on complete", () => {
    const identikit = mainSteps.filter((row) => row.meta.logical.startsWith("chapter-02-q3-identikit-"));
    expect(identikit).toHaveLength(3);
    expect(identikit.every((row) => row.meta.taskType === "ClozeText")).toBe(true);
    expect(mainSteps.some((row) => row.meta.logical === "chapter-02-q3-profiles-identikit")).toBe(false);
  });

  it("keeps q3 split migration payloads in sync with the main migration", () => {
    for (const [splitTag, mainTag] of Object.entries(FOLLOW_UP_STEP_TAG_MAP)) {
      expect(q3SplitByTag.has(splitTag), `q3 split migration missing tag ${splitTag}`).toBe(true);
      expect(mainByTag.has(mainTag), `main migration missing tag ${mainTag}`).toBe(true);
      expect(q3SplitByTag.get(splitTag)).toEqual(mainByTag.get(mainTag));
    }
  });

  it("follow-up migration patches drag-drop gap t3 to f-inizio only", () => {
    expect(followUpSql).toContain("chapter-02-q4-dragdrop-motivation-letter");
    expect(followUpSql).toContain('\'["f-inizio"]\'::jsonb');
    expect(followUpSql).toContain("'{targets,2,correctItemIds}'");
  });

  it("nutelleria cloze follow-up splits dialogue into multiple lines with 26 gaps", () => {
    const sql = loadMigrationSql(nutelleriaClozeLinesMigrationPath);
    const payload = extractPayloadsByTag(sql).get("q2s1_lines");
    expect(payload).toBeDefined();

    const result = parseStepContent({
      step_kind: "task",
      task_type: "ClozeText",
      content_payload: payload,
    });
    expect(result.ok, result.ok ? "" : result.issues).toBe(true);

    const lines = (payload as { lines: Array<{ segments: Array<{ kind: string }> }> }).lines;
    expect(lines.length).toBe(8);

    const gapCount = lines.reduce(
      (sum, line) => sum + line.segments.filter((segment) => segment.kind === "gap").length,
      0,
    );
    expect(gapCount).toBe(26);
  });
});
