/**
 * One-time helper: normalize inline task scoring blocks in chapter generators.
 * Replaces legacy inline pizza objects with taskScoring(screenType, { minRatioToComplete }).
 *
 * Run: node scripts/patch-generator-scoring.mjs
 */
import fs from "node:fs";
import path from "node:path";

const GENERATORS = [
  "generate-chapter-01-catalog.mjs",
  "generate-chapter-02-catalog.mjs",
  "generate-chapter-03-catalog.mjs",
  "generate-chapter-04-catalog.mjs",
  "generate-chapter-05-catalog.mjs",
  "generate-chapter-06-catalog.mjs",
];

const INLINE_SCORING_RE =
  /scoring:\s*\{\s*backpack:\s*\{\s*pieces:\s*1\s*\},\s*pizza:\s*\{\s*mode:\s*"scored",\s*maxSlices:\s*\d+,\s*minRatioToComplete:\s*([\d.]+),\s*rounding:\s*"floor",\s*mapping:\s*\{\s*kind:\s*"linear"\s*\},\s*\},\s*\}/g;

const FLAT_SCORING_RE =
  /scoring:\s*\{\s*backpack:\s*\{\s*pieces:\s*1\s*\},\s*pizza:\s*\{\s*mode:\s*"flat",\s*slices:\s*\d+\s*\},\s*\}/g;

function ensureImport(source) {
  if (source.includes('from "./lib/scoring-defaults.mjs"')) {
    return source;
  }
  return source.replace(
    /(import path from "node:path";\n)/,
    '$1import { taskScoring } from "./lib/scoring-defaults.mjs";\n',
  );
}

function removeLocalScoringHelpers(source) {
  return source
    .replace(
      /function scoredPizza\(overrides = \{\}\) \{[\s\S]*?\n\}\n\n/g,
      "",
    )
    .replace(
      /function scoredFreetext\(overrides = \{\}\) \{[\s\S]*?\n\}\n\n/g,
      "",
    );
}

function patchFile(filename) {
  const filePath = path.join(process.cwd(), "scripts", filename);
  let source = fs.readFileSync(filePath, "utf8");
  source = ensureImport(source);
  source = removeLocalScoringHelpers(source);

  source = source.replace(INLINE_SCORING_RE, (match, minRatio, offset) => {
    const before = source.slice(Math.max(0, offset - 20000), offset);
    const screenMatch = [...before.matchAll(/screen_type:\s*"([^"]+)"/g)].at(-1);
    const screenType = screenMatch?.[1];
    if (!screenType) {
      throw new Error(`[patch] could not resolve screen_type before scoring in ${filename}`);
    }
    return `scoring: taskScoring("${screenType}", { minRatioToComplete: ${minRatio} })`;
  });

  source = source.replace(FLAT_SCORING_RE, (match, offset) => {
    const before = source.slice(Math.max(0, offset - 20000), offset);
    const screenMatch = [...before.matchAll(/screen_type:\s*"([^"]+)"/g)].at(-1);
    const screenType = screenMatch?.[1] ?? "matching";
    return `scoring: taskScoring("${screenType}", { minRatioToComplete: 0.75 })`;
  });

  source = source.replace(
    /scoring:\s*scoredPizza\(\{\s*minRatioToComplete:\s*([\d.]+)\s*\}\)/g,
    (match, minRatio, offset) => {
      const before = source.slice(Math.max(0, offset - 20000), offset);
      const screenMatch = [...before.matchAll(/screen_type:\s*"([^"]+)"/g)].at(-1);
      const screenType = screenMatch?.[1];
      if (!screenType) {
        throw new Error(`[patch] could not resolve screen_type for scoredPizza in ${filename}`);
      }
      return `scoring: taskScoring("${screenType}", { minRatioToComplete: ${minRatio} })`;
    },
  );

  source = source.replace(
    /scoring:\s*scoredFreetext\(\)/g,
    'scoring: taskScoring("free_text", { minRatioToComplete: 0.65 })',
  );

  source = source.replace(
    /scoring:\s*scoredPizza\(\{([^}]+)\}\)/g,
    (match, inner, offset) => {
      const minMatch = /minRatioToComplete:\s*([\d.]+)/.exec(inner);
      if (!minMatch) return match;
      const before = source.slice(Math.max(0, offset - 20000), offset);
      const screenMatch = [...before.matchAll(/screen_type:\s*"([^"]+)"/g)].at(-1);
      const screenType = screenMatch?.[1];
      if (!screenType) {
        throw new Error(`[patch] could not resolve screen_type for scoredPizza({...}) in ${filename}`);
      }
      return `scoring: taskScoring("${screenType}", { minRatioToComplete: ${minMatch[1]} })`;
    },
  );

  fs.writeFileSync(filePath, source, "utf8");
  console.log("patched", filename);
}

for (const file of GENERATORS) {
  patchFile(file);
}
