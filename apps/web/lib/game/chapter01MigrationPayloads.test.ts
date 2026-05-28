import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseStepContent } from "@/lib/game/stepContentValidation";
import { parseQuestMetaPayloadStrict } from "@/lib/game/schemas/questMetaPayloadSchema";

const repoRoot = path.resolve(__dirname, "../../../..");
const mainMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260527160000_chapter_01_act1_content.sql",
);
const followUpMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260527170000_chapter_01_review_fixes.sql",
);
const bonusMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260628110000_chapter_01_bonus_vocab.sql",
);

/** Dollar-quote tags duplicated in the follow-up migration — keep payloads identical. */
const FOLLOW_UP_STEP_TAGS = ["q1s2", "q2s2", "q3s1", "q3s6"] as const;

const EXPECTED_CHAPTER_THEME = {
  background: "static/navigation/backgrounds/ph-st-nav-chapter-bg",
  music: "chapter1-theme",
  paletteKey: "chapter1",
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
    /\(\s*'chapter-01-quest-[^']+',\s*(\d+),\s*'(cutscene|task)',\s*(?:'([^']*)'|null)(?:::text)?,\s*'([^']+)',\s*'([^']+)',\s*\$(\w+)\$/gs;
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
    /insert into public\.game_chapters[\s\S]*?values \(\s*'chapter-01',[\s\S]*?'(\{[\s\S]*?\})'::jsonb/s,
  );
  expect(match).not.toBeNull();
  return JSON.parse(match![1]) as typeof EXPECTED_CHAPTER_THEME;
}

function extractChapterThemeFromFollowUpMigration(sql: string): typeof EXPECTED_CHAPTER_THEME {
  const match = sql.match(
    /theme_payload = '(\{[^']+\})'::jsonb/s,
  );
  expect(match).not.toBeNull();
  return JSON.parse(match![1]) as typeof EXPECTED_CHAPTER_THEME;
}

describe("chapter-01 migration payloads", () => {
  const mainSql = loadMigrationSql(mainMigrationPath);
  const followUpSql = loadMigrationSql(followUpMigrationPath);
  const bonusSql = loadMigrationSql(bonusMigrationPath);
  const mainSteps = collectStepPayloads(mainSql);
  const mainByTag = extractPayloadsByTag(mainSql);
  const followUpByTag = extractPayloadsByTag(followUpSql);
  const bonusByTag = extractPayloadsByTag(bonusSql);

  it("validates all 16 step content_payload objects in the main migration", () => {
    expect(mainSteps).toHaveLength(16);
    expect(validateStepPayloads(mainSteps), validateStepPayloads(mainSteps).join("\n")).toEqual([]);
  });

  it("validates chapter-01 bonus migration payloads", () => {
    const bonusRows = [
      {
        meta: {
          kind: "cutscene" as const,
          taskType: null,
          logical: "chapter-01-q4-cutscene-bonus-intro",
        },
        payload: bonusByTag.get("q4s0"),
      },
      {
        meta: {
          kind: "task" as const,
          taskType: "Matching",
          logical: "chapter-01-q4-matching-vocab",
        },
        payload: bonusByTag.get("q4s1"),
      },
    ].filter((row) => !!row.payload) as Array<{ meta: StepMeta; payload: unknown }>;
    expect(bonusRows).toHaveLength(2);
    expect(validateStepPayloads(bonusRows), validateStepPayloads(bonusRows).join("\n")).toEqual([]);
    expect(bonusSql).toContain('"prerequisiteQuestSlugs":["chapter-01-quest-03-bar"]');
    expect(bonusSql).toContain('"sampleSize": 10');
  });

  it("validates follow-up migration step payloads and retires demo quests", () => {
    expect(followUpSql).toContain("and q.slug in ('quest-01', 'quest-02')");

    const followUpRows = FOLLOW_UP_STEP_TAGS.flatMap((tag) => {
      const mainRow = mainSteps.find((row) => row.tag === tag);
      expect(mainRow, `main migration missing tag ${tag}`).toBeDefined();
      return mainRow ? [mainRow] : [];
    });

    expect(followUpRows).toHaveLength(FOLLOW_UP_STEP_TAGS.length);
    expect(validateStepPayloads(followUpRows), validateStepPayloads(followUpRows).join("\n")).toEqual([]);
  });

  it("keeps follow-up migration payloads in sync with the main migration", () => {
    for (const tag of FOLLOW_UP_STEP_TAGS) {
      expect(followUpByTag.has(tag), `follow-up migration missing tag ${tag}`).toBe(true);
      expect(mainByTag.has(tag), `main migration missing tag ${tag}`).toBe(true);
      expect(followUpByTag.get(tag)).toEqual(mainByTag.get(tag));
    }
  });

  it("keeps chapter theme_payload in sync across both migrations", () => {
    expect(extractChapterThemeFromMainMigration(mainSql)).toEqual(EXPECTED_CHAPTER_THEME);
    expect(extractChapterThemeFromFollowUpMigration(followUpSql)).toEqual(EXPECTED_CHAPTER_THEME);
  });

  it("does not accept invalid cloze answers for the vacation task", () => {
    const vacation = mainSteps.find((r) => r.meta.logical === "chapter-01-q1-cloze-vacation");
    expect(vacation).toBeDefined();
    const payload = vacation!.payload as {
      lines: Array<{ segments: Array<{ kind: string; correctAnswers?: string[] }> }>;
    };
    const firstGap = payload.lines[0]?.segments.find((s) => s.kind === "gap");
    expect(firstGap?.correctAnswers).not.toContain("son andato");
    expect(firstGap?.correctAnswers).not.toContain("son andata");
  });

  it("validates bar quest meta_payload including referenceDocument", () => {
    const metaMatch = mainSql.match(/\$bar_meta\$(\{[\s\S]*?\})\$bar_meta\$/);
    expect(metaMatch).not.toBeNull();
    const parsed = parseQuestMetaPayloadStrict(JSON.parse(metaMatch![1]));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.referenceDocument?.documentId).toBe("brochure-grotte-castellana");
      expect(parsed.value.flow?.blockBack).toBe(false);
      expect(parsed.value.flow?.autoStartQuestSlug).toBeUndefined();
    }
  });
});
