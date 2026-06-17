/**
 * Regenerates lib/content/chapters/chapter-00 (tutorial — La valigia).
 *
 * Run: node scripts/generate-chapter-00-catalog.mjs
 *
 * WARNING: Deletes the entire chapter-00 tree first.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "lib/content/chapters/chapter-00");
const CHAPTER_ID = "chapter-00";
const QUEST_ID = "quest-01";
const BG_CHAPTER = "chapters/00/chapter/bg-missions";
const BG_QUEST = "chapters/00/quests/01/bg-overview";
function sceneBackground(n) {
  return `chapters/00/quests/01/bg-scene-${String(n).padStart(2, "0")}`;
}

/** Tutorial: evaluate tasks (scored) but award zero pizza/backpack. */
const TUTORIAL_SCORING = {
  backpack: { pieces: 0 },
  pizza: {
    mode: "scored",
    maxSlices: 0,
    rounding: "floor",
    mapping: { kind: "linear" },
  },
};

if (fs.existsSync(ROOT)) {
  fs.rmSync(ROOT, { recursive: true, force: true });
}

function writeJson(rel, value) {
  const filePath = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sceneId(n) {
  const nn = String(n).padStart(2, "0");
  return `${CHAPTER_ID}-${QUEST_ID}-scene-${nn}`;
}

function story(n, text, background = sceneBackground(n)) {
  return {
    id: sceneId(n),
    scene_type: "story",
    screen_type: "info",
    background,
    content: { text },
  };
}

function task(n, screenType, content, background = sceneBackground(n)) {
  return {
    id: sceneId(n),
    scene_type: "task",
    screen_type: screenType,
    background,
    content,
    scoring: TUTORIAL_SCORING,
  };
}

const scenes = [
  story(
    1,
    "Ti chiami Toni. Domani voli in Italia per un anno di scambio.\nOggi prepari la valigia. In questo capitolo provi ogni tipo di compito del gioco.",
  ),
  task(2, "multiple_choice", {
    title: "Scelta multipla — La valigia",
    instruction: "Scegli la risposta giusta.",
    referenceDocument: null,
    task: {
      prompt: "Cosa metti in valigia per l'Italia?",
      selectionMode: "single",
      preserveOptionOrder: true,
      options: [
        { id: "opt-passaporto", label: "il passaporto" },
        { id: "opt-sciarpa", label: "la sciarpa pesante" },
        { id: "opt-gelato", label: "il gelato" },
      ],
      correctOptionIds: ["opt-passaporto"],
    },
  }),
  task(3, "matching", {
    title: "Abbinamento — La valigia",
    task: {
      prompt: "Abbina ogni parola alla frase giusta.",
      leftItems: [
        { id: "left-camicia", label: "camicia" },
        { id: "left-scarpe", label: "scarpe" },
        { id: "left-libro", label: "libro" },
      ],
      rightItems: [
        { id: "right-camicia", label: "la camicia" },
        { id: "right-scarpe", label: "le scarpe" },
        { id: "right-libro", label: "il libro" },
        { id: "right-pizza", label: "la pizza" },
      ],
      correctPairs: [
        { leftItemId: "left-camicia", rightItemId: "right-camicia" },
        { leftItemId: "left-scarpe", rightItemId: "right-scarpe" },
        { leftItemId: "left-libro", rightItemId: "right-libro" },
      ],
      presentation: {
        leftLabel: "Parola",
        rightLabel: "Frase",
        shuffleRightOrder: true,
      },
    },
  }),
  task(4, "drag_drop", {
    title: "Trascina — La valigia",
    task: {
      prompt: "Metti ogni cosa nel posto giusto.",
      presentation: { targetMode: "blocks" },
      shuffleItemOrder: true,
      items: [
        { id: "item-maglietta", label: "maglietta" },
        { id: "item-passaporto", label: "passaporto" },
        { id: "item-camicia", label: "camicia" },
        { id: "item-biglietto", label: "biglietto" },
      ],
      targets: [
        {
          id: "cat-vestiti",
          title: "Vestiti",
          matchMode: "all",
          correctItemIds: ["item-maglietta", "item-camicia"],
        },
        {
          id: "cat-documenti",
          title: "Documenti",
          matchMode: "all",
          correctItemIds: ["item-passaporto", "item-biglietto"],
        },
      ],
    },
  }),
  task(5, "cloze", {
    title: "Completa — La valigia",
    task: {
      prompt: "Completa le parole mancanti.",
      caseSensitive: false,
      lines: [
        {
          segments: [
            { kind: "text", text: "Mi chiamo " },
            { kind: "gap", maxLength: 12, correctAnswers: ["Toni", "toni"] },
            { kind: "text", text: ". Vengo dalla " },
            { kind: "gap", maxLength: 16, correctAnswers: ["Germania", "germania"] },
            { kind: "text", text: "." },
          ],
        },
      ],
    },
  }),
  task(6, "error_spotting", {
    title: "Trova l'errore — La valigia",
    task: {
      prompt: "Tocca la parola con l'errore.",
      segments: [
        { id: "s1", text: "Io", isError: false },
        { id: "s2", text: " ha", isError: true, acceptedCorrections: ["ho"] },
        { id: "s3", text: " il", isError: false },
        { id: "s4", text: " passaporto", isError: false },
        { id: "s5", text: " in", isError: false },
        { id: "s6", text: " valigia.", isError: false },
      ],
    },
  }),
  task(7, "multiple_choice", {
    title: "Documento — La valigia",
    instruction: "Apri «Documento» in alto se ti serve il testo.",
    referenceDocument: {
      title: "Consigli della famiglia Ferrari",
      body: "Ciao Toni!\nPorta il passaporto e il biglietto.\nNon dimenticare una maglietta e le scarpe comode.\nA domani, a Bologna!",
    },
    task: {
      prompt: "Cosa devi portare secondo la famiglia Ferrari?",
      selectionMode: "single",
      preserveOptionOrder: true,
      options: [
        { id: "opt-pass", label: "il passaporto" },
        { id: "opt-neve", label: "la tuta da neve" },
        { id: "opt-pallone", label: "il pallone da calcio" },
      ],
      correctOptionIds: ["opt-pass"],
    },
  }),
  task(8, "free_text", {
    title: "Risposta libera — La valigia",
    task: {
      prompt: "Scrivi una frase: come ti chiami e da dove vieni.",
      targetLanguage: "it",
      showWordCount: true,
      minWords: 3,
      evaluation: {
        grammarWeight: 1,
        vocabularyWeight: 1,
        registerWeight: 0.5,
        taskFulfillmentWeight: 2,
        passThreshold: 0.5,
        registerTarget: "informal",
        scoringPolicy: "threshold_pass",
        maxPoints: 5,
        evaluationCriteria: [
          "Indica il tuo nome in italiano",
          "Indica il paese da cui vieni",
        ],
        targetStructures: ["Mi chiamo", "Vengo da", "Vengo dalla"],
      },
    },
  }),
  story(
    9,
    "La valigia è pronta. Domani mattina il volo per Bologna.\nLa tua avventura in Italia inizia presto!",
    "chapters/00/quests/01/bg-scene-09-final",
  ),
];

writeJson("chapter.json", {
  id: CHAPTER_ID,
  title: "La valigia — Prima del viaggio",
  order: 0,
  locked: false,
  quests: [QUEST_ID],
  background: BG_CHAPTER,
});

writeJson(`quests/${QUEST_ID}/quest.json`, {
  id: QUEST_ID,
  title: "Come si gioca",
  order: 1,
  kind: "main",
  requiresQuestId: null,
  background: BG_QUEST,
});

for (let i = 0; i < scenes.length; i++) {
  const nn = String(i + 1).padStart(2, "0");
  writeJson(`quests/${QUEST_ID}/scenes/${nn}.json`, scenes[i]);
}

console.log(`Wrote ${scenes.length} scenes to ${ROOT}`);
