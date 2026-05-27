import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseStepContent } from "@/lib/game/stepContentValidation";
import { parseQuestMetaPayloadStrict } from "@/lib/game/schemas/questMetaPayloadSchema";

const migrationPath = path.resolve(
  __dirname,
  "../../../../supabase/migrations/20260527160000_chapter_01_act1_content.sql",
);

type StepMeta = {
  kind: "cutscene" | "task";
  taskType: string | null;
  logical: string;
};

function loadMigrationSql(): string {
  return fs.readFileSync(migrationPath, "utf8");
}

function collectStepPayloads(sql: string): Array<{ meta: StepMeta; payload: unknown }> {
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

  const payloadRe = /\$(\w+)\$(\{[\s\S]*?\})\$\1\$/g;
  const rows: Array<{ meta: StepMeta; payload: unknown }> = [];
  for (const m of sql.matchAll(payloadRe)) {
    const meta = tags.get(m[1]);
    if (!meta) continue;
    rows.push({ meta, payload: JSON.parse(m[2]) });
  }
  return rows;
}

describe("chapter-01 migration payloads", () => {
  it("validates all 16 step content_payload objects", () => {
    const sql = loadMigrationSql();
    const rows = collectStepPayloads(sql);
    expect(rows).toHaveLength(16);

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
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("does not accept invalid cloze answers for the vacation task", () => {
    const sql = loadMigrationSql();
    const vacation = collectStepPayloads(sql).find((r) => r.meta.logical === "chapter-01-q1-cloze-vacation");
    expect(vacation).toBeDefined();
    const payload = vacation!.payload as {
      lines: Array<{ segments: Array<{ kind: string; correctAnswers?: string[] }> }>;
    };
    const firstGap = payload.lines[0]?.segments.find((s) => s.kind === "gap");
    expect(firstGap?.correctAnswers).not.toContain("son andato");
    expect(firstGap?.correctAnswers).not.toContain("son andata");
  });

  it("validates bar quest meta_payload including referenceDocument", () => {
    const sql = loadMigrationSql();
    const metaMatch = sql.match(/\$bar_meta\$(\{[\s\S]*?\})\$bar_meta\$/);
    expect(metaMatch).not.toBeNull();
    const parsed = parseQuestMetaPayloadStrict(JSON.parse(metaMatch![1]));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.referenceDocument?.documentId).toBe("brochure-grotte-castellana");
      expect(parsed.value.flow?.blockBack).toBe(false);
      expect(parsed.value.flow?.autoStartQuestSlug).toBeUndefined();
    }
  });

  it("retires greenfield demo quests in the same migration", () => {
    const sql = loadMigrationSql();
    expect(sql).toContain("and q.slug in ('quest-01', 'quest-02')");
  });
});
