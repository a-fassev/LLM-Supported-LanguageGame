/**
 * One-shot generator for lib/content/chapters/chapter-02 (Lezione 2).
 * Run: node scripts/generate-chapter-02-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { taskScoring } from "./lib/scoring-defaults.mjs";

const ROOT = path.join(process.cwd(), "lib/content/chapters/chapter-02");
const CHAPTER_ID = "chapter-02";

function writeJson(rel, value) {
  const filePath = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function story(chapterId, questId, n, bg, text) {
  const nn = String(n).padStart(2, "0");
  return {
    id: `${chapterId}-${questId}-scene-${nn}`,
    scene_type: "story",
    screen_type: "info",
    background: bg,
    content: { text },
  };
}

function gap(answers, maxLength = 48) {
  return { kind: "gap", maxLength, correctAnswers: answers };
}

function freetextEvaluation(criteria) {
  return {
    grammarWeight: 1,
    vocabularyWeight: 1,
    registerWeight: 1,
    taskFulfillmentWeight: 1,
    passThreshold: 0.65,
    registerTarget: "neutral",
    scoringPolicy: "threshold_pass",
    maxPoints: 5,
    evaluationCriteria: criteria,
    targetStructures: ["che", "cui", "dove"],
  };
}

const SAVIANO_BODY = `Roberto Saviano è nato il 22 settembre 1979. Nei suoi articoli e libri racconta normalmente della criminalità organizzata, soprattutto della Camorra. Di sicuro è diventato famoso per il suo libro "Gomorra" (2006). Il libro parla della Camorra in Campania perché l'autore è cresciuto in quella zona. Per questo conosce bene i problemi che ci sono lì. Tuttavia è specialmente con la pubblicazione di "Gomorra" che la sua vita cammina veloce in un'altra direzione. Da allora non può più vivere senza scorta, cioè senza poliziotti che gli stanno vicino. Se vuole andare al cinema o si sente male e deve andare dal dottore, parla con gli uomini della scorta che lo accompagnano subito. E chiaramente deve chiedere ai suoi "ragazzi" se vuole prendere velocemente un caffè al bar. Tutto sommato, non è sempre una vita facile. Saviano però continua a lottare. Non solo non si arrende, ma lavora sodo e fa in continuazione nuove indagini: nel 2020 è uscito il suo ultimo libro "Gridalo", un libro con cui chiede a tutti di aver il coraggio di non stare zitti e parlare sempre apertamente dei problemi.`;

const DEL_PIERO_BODY = `Alessandro Del Piero è nato il 9 novembre 1974 a Conegliano, una piccola città in Veneto. Da bambino la sua famiglia non era ricca: il padre lavorava come elettricista e la madre da casalinga. Lui giocava a calcio nelle strade del paese con il fratello maggiore, Stefano. A tredici anni è entrato nella squadra giovanile del Padova, e a diciotto anni è arrivato alla Juventus, una delle squadre più famose d'Italia. Ha giocato per la Juventus per diciannove anni: nessun altro giocatore ha mai fatto una cosa simile. Per questo i tifosi gli hanno dato il soprannome "Pinturicchio" e poi "Capitano". Con la Juventus ha vinto molti campionati italiani, ma il momento più bello della sua carriera è arrivato nel 2006: con la nazionale italiana ha vinto la Coppa del Mondo in Germania. Tutti gli italiani ricordano il suo gol nella semifinale contro i tedeschi. Oggi Del Piero non gioca più, ma lavora come commentatore in TV e aiuta i giovani calciatori con la sua fondazione. È sposato con Sonia e ha tre figli.`;

const FERRAGNI_BODY = `Chiara Ferragni è nata il 7 maggio 1987 a Cremona, in Lombardia. Da ragazza studiava legge all'università di Milano, ma la sua vera passione era la moda. Nel 2009, quando aveva solo ventidue anni, ha aperto un blog di moda chiamato "The Blonde Salad". All'inizio nessuno credeva nel suo progetto, ma in pochi anni il blog è diventato famosissimo in tutto il mondo. Oggi Chiara è una delle influencer più conosciute del pianeta: sui suoi profili social la seguono milioni di persone. Ha creato anche una sua linea di moda, "Chiara Ferragni Collection", con scarpe, vestiti e accessori. Nel 2018 si è sposata con il rapper Fedez in una cerimonia spettacolare in Sicilia. Hanno avuto due figli, Leone e Vittoria, e per anni la loro vita è stata seguita dai fan su Instagram. Nel 2024 però la coppia si è separata e Chiara ha vissuto un periodo difficile, anche per un caso legato a un dolce di Natale, il "pandoro Balocco". Però continua a lavorare ed è ancora una delle donne più importanti del mondo della moda in Italia.`;

const steckbriefRefDoc = {
  title: "Italiani famosi — profili",
  body: "Scegli una persona e completa il suo identikit con le informazioni del testo. Puoi rileggere ogni profilo quando vuoi.",
  sections: [
    { title: "Roberto Saviano", body: SAVIANO_BODY },
    { title: "Alessandro Del Piero", body: DEL_PIERO_BODY },
    { title: "Chiara Ferragni", body: FERRAGNI_BODY },
  ],
};

const IDENTIKIT_TEMPLATE =
  "nome:\n" +
  "anno di nascita:\n" +
  "regione d'origine:\n" +
  "professione:\n" +
  "È famoso/a perché\n" +
  "particolarità:";

function identikitEvaluation() {
  return {
    grammarWeight: 1,
    vocabularyWeight: 1,
    registerWeight: 1,
    taskFulfillmentWeight: 2,
    passThreshold: 0.65,
    registerTarget: "neutral",
    scoringPolicy: "threshold_pass",
    maxPoints: 5,
    evaluationCriteria: [
      "Choose exactly one profile (Saviano, Del Piero, or Ferragni) and fill all six identikit fields for that person only",
      "Use facts from the reference text: name, birth date or year, region, profession, why famous, one distinctive detail",
      "Accept varied phrasing; reward accurate information, not exact wording from the text",
    ],
    targetStructures: [],
  };
}

const quizGalleryRefDoc = {
  documentId: "ch02-quiz-persons",
  title: "Chi sono?",
  body: "Ecco le sei persone del quiz. Il nome sotto ogni foto ti aiuta a scegliere.",
  figures: [
    { image: "chapters/02/quests/03/ref-quiz-verdi", caption: "Giuseppe Verdi" },
    { image: "chapters/02/quests/03/ref-quiz-colombo", caption: "Cristoforo Colombo" },
    { image: "chapters/02/quests/03/ref-quiz-montessori", caption: "Maria Montessori" },
    { image: "chapters/02/quests/03/ref-quiz-michelangelo", caption: "Michelangelo Buonarroti" },
    { image: "chapters/02/quests/03/ref-quiz-ferrante", caption: "Elena Ferrante" },
    { image: "chapters/02/quests/03/ref-quiz-da-vinci", caption: "Leonardo da Vinci" },
  ],
};

const QUIZ_PERSON_OPTIONS = [
  { id: "verdi", label: "Giuseppe Verdi" },
  { id: "colombo", label: "Cristoforo Colombo" },
  { id: "montessori", label: "Maria Montessori" },
  { id: "michelangelo", label: "Michelangelo Buonarroti" },
  { id: "ferrante", label: "Elena Ferrante" },
  { id: "da-vinci", label: "Leonardo da Vinci" },
];

function menuRefDoc(caption, imageKey) {
  return {
    title: caption,
    body: "Descrivi questa parte del menù con una frase. Usa che, cui o dove.",
    figures: [{ image: imageKey, caption }],
  };
}

function mcQuizScene(sceneNum, titleSuffix, grammarPrompt, grammarOptions, correctGrammarId, correctPersonId) {
  const nn = String(sceneNum).padStart(2, "0");
  return {
    id: `${CHAPTER_ID}-quest-03-scene-${nn}`,
    scene_type: "task",
    screen_type: "multiple_choice",
    background: "chapters/02/quests/03/bg-desk-task",
    content: {
      title: `Chi sono io? (${titleSuffix})`,
      instruction:
        "Metti il pronome relativo e il participio, poi scegli la persona. Usa il documento con le foto se ti serve.",
      referenceDocument: quizGalleryRefDoc,
      task: {
        questions: [
          {
            id: `q${titleSuffix}-grammar`,
            selectionMode: "single",
            preserveOptionOrder: true,
            prompt: grammarPrompt,
            options: grammarOptions,
            correctOptionIds: [correctGrammarId],
          },
          {
            id: `q${titleSuffix}-person`,
            selectionMode: "single",
            preserveOptionOrder: true,
            prompt: "A quale persona si riferisce questa frase?",
            options: QUIZ_PERSON_OPTIONS,
            correctOptionIds: [correctPersonId],
          },
        ],
      },
    },
    scoring: taskScoring("multiple_choice"),
  };
}

function freetextProfessionScene(questId, sceneNum, bg, prompt) {
  const nn = String(sceneNum).padStart(2, "0");
  return {
    id: `${CHAPTER_ID}-${questId}-scene-${nn}`,
    scene_type: "task",
    screen_type: "free_text",
    background: bg,
    content: {
      title: "Descrivi la professione",
      instruction: "Scrivi una frase in italiano con un pronome relativo (che, cui o dove).",
      referenceDocument: null,
      task: {
        prompt,
        targetLanguage: "it",
        showWordCount: true,
        minWords: 5,
        evaluation: freetextEvaluation([
          "Use at least one relative pronoun (che, cui, or dove) correctly",
          "Describe the profession plausibly in Italian at B1 level",
        ]),
      },
    },
    scoring: taskScoring("free_text"),
  };
}

function menuEvaluationCriteria(caption) {
  const categoryRules = {
    "gli antipasti": "Require a starter eaten at the beginning of the meal; do not accept pizza, pasta, rice, main courses or desserts as the main example.",
    "i primi piatti": "Require a first course such as pasta, rice, soup or gnocchi; do not accept antipasti, pizza, dessert or secondi piatti as the main example.",
    "i secondi piatti (con contorni)":
      "Require meat, fish, eggs, cheese or similar main-course dishes, often with a side dish; do not accept pasta or rice as secondi piatti.",
    "le pizze": "Require pizza as the category, with dough/toppings or pizza as a main dish; do not accept descriptions of small starters or dishes eaten only at the beginning of the meal.",
    "i dolci": "Require sweet desserts served at or near the end of the meal; do not accept savory courses as the main example.",
  };
  return [
    "Use at least one relative pronoun (che, cui, or dove) correctly",
    `Describe the menu category ${caption} plausibly (position in an Italian meal and typical dishes)`,
    categoryRules[caption] ?? "Require the answer to match the named menu category.",
    "Do not accept examples that belong mainly to another menu category",
  ];
}

function freetextMenuScene(sceneNum, caption, imageKey, prompt) {
  const nn = String(sceneNum).padStart(2, "0");
  return {
    id: `${CHAPTER_ID}-quest-04-scene-${nn}`,
    scene_type: "task",
    screen_type: "free_text",
    background: "chapters/02/quests/04/bg-trattoria-task",
    content: {
      title: "Descrivi il menù",
      instruction: "Scrivi una frase in italiano con un pronome relativo (che, cui o dove).",
      referenceDocument: menuRefDoc(caption, imageKey),
      task: {
        prompt,
        targetLanguage: "it",
        showWordCount: true,
        minWords: 5,
        evaluation: freetextEvaluation(menuEvaluationCriteria(caption)),
      },
    },
    scoring: taskScoring("free_text"),
  };
}

// --- chapter + quests ---
writeJson("chapter.json", {
  id: CHAPTER_ID,
  title: "Sogni e progetti",
  order: 2,
  locked: false,
  quests: ["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"],
  background: "chapters/02/chapter/bg-missions",
});

const quests = [
  {
    id: "quest-01",
    title: "La mattina a casa",
    order: 1,
    kind: "main",
    requiresQuestId: null,
    background: "chapters/02/quests/01/bg-overview",
    bgRoom: "chapters/02/quests/01/bg-room-morning",
  },
  {
    id: "quest-02",
    title: "La Nutelleria",
    order: 2,
    kind: "main",
    requiresQuestId: "quest-01",
    background: "chapters/02/quests/02/bg-overview",
    bgNutelleria: "chapters/02/quests/02/bg-nutelleria",
    bgTask: "chapters/02/quests/02/bg-nutelleria-task",
  },
  {
    id: "quest-03",
    title: "Il progetto di scuola",
    order: 3,
    kind: "main",
    requiresQuestId: "quest-02",
    background: "chapters/02/quests/03/bg-overview",
    bgDesk: "chapters/02/quests/03/bg-desk",
    bgTask: "chapters/02/quests/03/bg-desk-task",
  },
  {
    id: "quest-04",
    title: "La Trattoria da Marini",
    order: 4,
    kind: "main",
    requiresQuestId: "quest-03",
    background: "chapters/02/quests/04/bg-overview",
    bgTrattoria: "chapters/02/quests/04/bg-trattoria",
    bgTrattoriaExterior: "chapters/02/quests/04/bg-trattoria-exterior",
    bgTask: "chapters/02/quests/04/bg-trattoria-task",
  },
  {
    id: "quest-01-bonus",
    title: "Extra: parole della lezione",
    order: 5,
    kind: "bonus",
    requiresQuestId: "quest-04",
    background: "chapters/02/quests/bonus/bg-overview",
    bgBonus: "chapters/02/quests/bonus/bg-neutral",
    bgTask: "chapters/02/quests/bonus/bg-task",
  },
];

for (const q of quests) {
  writeJson(`quests/${q.id}/quest.json`, {
    id: q.id,
    title: q.title,
    order: q.order,
    kind: q.kind,
    requiresQuestId: q.requiresQuestId,
    background: q.background,
  });
}

// --- quest-01 (3 story) ---
const q1bg = quests[0].bgRoom;
writeJson(
  "quests/quest-01/scenes/01.json",
  story(
    CHAPTER_ID,
    "quest-01",
    1,
    q1bg,
    "Hai dormito bene nella tua nuova camera. La signora Ferrari ti ha lasciato la colazione in tavola: biscotti e un cappuccino.",
  ),
);
writeJson(
  "quests/quest-01/scenes/02.json",
  story(
    CHAPTER_ID,
    "quest-01",
    2,
    q1bg,
    "Tu\nOggi ho un po' di tempo libero. Devo finire un progetto per la scuola su un italiano famoso. E poi ho letto che un ristorante qui in centro cerca personale per l'estate — magari vado a vedere. Ma prima voglio fare un giro in città...",
  ),
);
writeJson(
  "quests/quest-01/scenes/03.json",
  story(
    CHAPTER_ID,
    "quest-01",
    3,
    q1bg,
    "Oggi ti aspettano tre missioni: una visita alla Nutelleria in centro, i compiti di scuola a casa e un ristorante che cerca personale per l'estate. Puoi iniziare dalla lista missioni del capitolo.",
  ),
);

// --- quest-02 (15 scenes) ---
const q2bg = quests[1].bgNutelleria;
const q2task = quests[1].bgTask;

writeJson(
  "quests/quest-02/scenes/01.json",
  story(
    CHAPTER_ID,
    "quest-02",
    1,
    q2bg,
    "Stai camminando sotto i portici e ti fermi davanti a un locale che hai sentito nominare tante volte: la Nutelleria. Profumo di crêpe e di cioccolato. Entri e ti siedi a un tavolino vicino alla finestra.",
  ),
);
writeJson(
  "quests/quest-02/scenes/02.json",
  story(
    CHAPTER_ID,
    "quest-02",
    2,
    q2bg,
    "A un tavolo vicino c'è un ragazzo che riconosci subito: è Dario, un compagno della tua nuova classe al Liceo Galvani. Ti vede e ti fa un cenno con la mano.",
  ),
);
writeJson(
  "quests/quest-02/scenes/03.json",
  story(
    CHAPTER_ID,
    "quest-02",
    3,
    q2bg,
    "Dario\n\"Ehi, ciao! Anche tu qui? Stai cercando un posto? Vieni, siediti con me. Io qui incontro sempre qualcuno! Non crederai mai che mi è successo qui ieri!\"",
  ),
);
writeJson(
  "quests/quest-02/scenes/04.json",
  story(CHAPTER_ID, "quest-02", 4, q2bg, "Tu\n\"Ciao Dario! Cosa è successo?\""),
);
writeJson(
  "quests/quest-02/scenes/05.json",
  story(
    CHAPTER_ID,
    "quest-02",
    5,
    q2bg,
    "Dario\n\"Ho incontrato Elena, un'amica di mia madre. Lei fa l'archeologa e mi ha raccontato del suo lavoro. È stato interessantissimo! Sai, ho deciso: da grande voglio fare l'archeologo anch'io!\"",
  ),
);
writeJson(
  "quests/quest-02/scenes/06.json",
  story(
    CHAPTER_ID,
    "quest-02",
    6,
    q2bg,
    "Tu\nDario sembra davvero entusiasta. Vediamo se i suoi piani sono realistici...",
  ),
);

writeJson("quests/quest-02/scenes/07.json", {
  id: `${CHAPTER_ID}-quest-02-scene-07`,
  scene_type: "task",
  screen_type: "cloze",
  background: q2task,
  content: {
    title: "Anch'io farò l'archeologo!",
    instruction:
      "Scegli l'avverbio o l'aggettivo, poi completa con i possessivi (con o senza articolo) e i verbi al futuro.",
    referenceDocument: null,
    task: {
      prompt:
        "Parla con Dario del suo sogno. Scegli l'avverbio o l'aggettivo, poi completa con i possessivi (con o senza articolo) e i verbi al futuro.",
      caseSensitive: false,
      lines: [
        {
          segments: [
            { kind: "text", text: "Tu: Allora, com'è andata con l'archeologa?\nDario: " },
            { kind: "text", text: "*Benissimo/Buonissimo*" },
            gap(["Benissimo", "benissimo"]),
            { kind: "text", text: "! Sai, ho deciso che " },
            gap(["farò", "Farò"]),
            { kind: "text", text: " (fare) l'archeologo anch'io!\nTu: Davvero? Ma non " },
            gap(["avrai", "Avrai"]),
            { kind: "text", text: " (avere) bisogno di voti molto alti per farlo? Sono questi che mi " },
            gap(["mancano", "Mancano"]),
            { kind: "text", text: " (mancare).\nDario: Sì, certo. Da domani " },
            gap(["studierò", "Studierò"]),
            { kind: "text", text: " (studiare) tutti i giorni. Così gli insegnanti mi " },
            gap(["daranno", "Daranno"]),
            { kind: "text", text: " (dare) " },
            { kind: "text", text: "*bene/buoni*" },
            gap(["buoni", "Buoni"]),
            { kind: "text", text: " voti. " },
            gap(["I miei", "i miei"]),
            { kind: "text", text: " genitori " },
            gap(["saranno", "Saranno"]),
            { kind: "text", text: " (essere) contentissimi, soprattutto " },
            gap(["mio", "Mio"]),
            { kind: "text", text: " padre perché gli piace tanto la storia. " },
            gap(["Smetterò", "smetterò"]),
            { kind: "text", text: " (Smettere) anche di chiacchierare con gli altri, anche se " },
            gap(["sarà", "Sarà"]),
            { kind: "text", text: " (essere) " },
            { kind: "text", text: "*difficile/difficilmente*" },
            gap(["difficile", "Difficile"]),
            { kind: "text", text: " (difficile).\n\nTu: Così alla fine " },
            gap(["farai", "Farai"]),
            { kind: "text", text: " (fare) un'ottima maturità. Non " },
            gap(["sarà", "Sarà"]),
            { kind: "text", text: " (essere) mica " },
            { kind: "text", text: "*facile/facilmente*" },
            gap(["facile", "Facile"]),
            { kind: "text", text: " (facile).\n\nDario: Ma che cosa " },
            gap(["penserete", "Penserete"]),
            { kind: "text", text: " (pensare) voi di questa " },
            gap(["mia", "Mia"]),
            { kind: "text", text: " idea?\nTu: Boh, la " },
            gap(["accetteranno", "Accetteranno"]),
            { kind: "text", text: " (accettare) tutti i tuoi amici, non credi?\nDario: E tu? Sai già cosa " },
            gap(["farai", "Farai"]),
            { kind: "text", text: " (fare) dopo " },
            gap(["la", "La"]),
            { kind: "text", text: " maturità?\nTu: Sì, ho già una mezza idea " },
            gap(["sul mio", "Sul mio"]),
            { kind: "text", text: " futuro. Sai che a " },
            gap(["mia", "Mia"]),
            { kind: "text", text: " sorella e a me piace molto la musica e proprio ieri ho sentito un'intervista " },
            gap(["alla nostra", "Alla nostra"]),
            { kind: "text", text: " cantante preferita.\nDario: Ah, interessante, dimmi tutto. Mangiamo qualcosa insieme e tu racconti. Che ne dici?" },
          ],
        },
      ],
    },
  },
  scoring: taskScoring("cloze"),
});

writeJson(
  "quests/quest-02/scenes/08.json",
  story(
    CHAPTER_ID,
    "quest-02",
    8,
    q2bg,
    "Dario\n\"Sai, dopo il discorso con Elena ho pensato a tante cose. Per esempio non conosco tanti mestieri diversi, solo quelli più comuni. Sai cosa facciamo? Uno nomina un mestiere e l'altro spiega cosa fanno usando che, cui o dove, d'accordo? Cominci tu a spiegare.\"",
  ),
);

writeJson(
  "quests/quest-02/scenes/09.json",
  freetextProfessionScene(
    "quest-02",
    9,
    q2task,
    "Descrivi la professione dell'architetto con una frase. Usa che, cui o dove.",
  ),
);
writeJson(
  "quests/quest-02/scenes/10.json",
  freetextProfessionScene(
    "quest-02",
    10,
    q2task,
    "Descrivi la professione del/la giornalista con una frase. Usa che, cui o dove.",
  ),
);
writeJson(
  "quests/quest-02/scenes/11.json",
  freetextProfessionScene(
    "quest-02",
    11,
    q2task,
    "Descrivi la professione del medico con una frase. Usa che, cui o dove.",
  ),
);
writeJson(
  "quests/quest-02/scenes/12.json",
  freetextProfessionScene(
    "quest-02",
    12,
    q2task,
    "Descrivi la professione del/la giardiniere/a con una frase. Usa che, cui o dove.",
  ),
);

writeJson(
  "quests/quest-02/scenes/13.json",
  story(
    CHAPTER_ID,
    "quest-02",
    13,
    q2bg,
    "Dario\n\"Meraviglioso! Senti, io devo andare, ho ancora molte cose da fare. Ci vediamo domani a scuola, eh! E grazie per la chiacchierata.\"",
  ),
);
writeJson(
  "quests/quest-02/scenes/14.json",
  story(
    CHAPTER_ID,
    "quest-02",
    14,
    q2bg,
    "Tu\nChe entusiasmo, Dario. Forse anch'io dovrei pensare di più al mio futuro. Ma adesso ho cose più urgenti: i compiti di scuola mi aspettano a casa, e cercavo anche un lavoretto per l'estate...",
  ),
);
writeJson(
  "quests/quest-02/scenes/15.json",
  story(
    CHAPTER_ID,
    "quest-02",
    15,
    q2bg,
    "Esci dalla Nutelleria. Ti restano ancora due cose importanti per oggi: i compiti a casa della famiglia Ferrari e il ristorante in centro che cerca personale per l'estate.",
  ),
);

// --- quest-03 (13 scenes: user noted scene 13 homework saved) ---
const q3bg = quests[2].bgDesk;
const q3task = quests[2].bgTask;

writeJson(
  "quests/quest-03/scenes/01.json",
  story(
    CHAPTER_ID,
    "quest-03",
    1,
    q3bg,
    "Torni a casa della famiglia Ferrari. La signora Ferrari ti saluta e ti ricorda che hai i compiti da fare. Sali in camera tua, accendi il computer e apri il portale della scuola.",
  ),
);
writeJson(
  "quests/quest-03/scenes/02.json",
  story(
    CHAPTER_ID,
    "quest-03",
    2,
    q3bg,
    "Tu\nEcco il primo vero compito per il Liceo Galvani. La prof ci ha chiesto di scegliere un italiano famoso, di leggere il profilo e di fare un identikit. E dopo c'è anche un quiz su altre persone famose. Vediamo chi sono...",
  ),
);
writeJson(
  "quests/quest-03/scenes/03.json",
  story(
    CHAPTER_ID,
    "quest-03",
    3,
    q3bg,
    "Clicca su ciascuna scheda nel documento per leggere il profilo. Quando hai letto i tre testi, scegli una persona e completa il suo identikit.",
  ),
);

writeJson("quests/quest-03/scenes/04.json", {
  id: `${CHAPTER_ID}-quest-03-scene-04`,
  scene_type: "task",
  screen_type: "free_text",
  background: q3task,
  content: {
    title: "Che persona straordinaria!",
    instruction:
      "Apri il documento, leggi i profili e scegli una delle tre persone. Completa solo il suo identikit con le informazioni del testo.",
    referenceDocument: steckbriefRefDoc,
    task: {
      prompt:
        "Completa l'identikit.",
      initialAnswerText: IDENTIKIT_TEMPLATE,
      targetLanguage: "it",
      showWordCount: true,
      minWords: 7,
      evaluation: identikitEvaluation(),
    },
  },
  scoring: taskScoring("free_text"),
});

writeJson(
  "quests/quest-03/scenes/05.json",
  story(
    CHAPTER_ID,
    "quest-03",
    5,
    q3bg,
    "Tu\nBene, l'identikit è pronto. Adesso il quiz: la prof ha preparato anche un gioco \"Chi sono io?\" con altre persone famose italiane. Vediamo se riesco a indovinare...",
  ),
);

writeJson(
  "quests/quest-03/scenes/06.json",
  mcQuizScene(
    6,
    "1/6",
    "Chi è la donna molto famosa ___ ha ___ (fondare) la casa dei bambini nel 1907?",
    [
      { id: "g1-a", label: "che · ha fondato" },
      { id: "g1-b", label: "che · ha fondare" },
      { id: "g1-c", label: "cui · ha fondato" },
      { id: "g1-d", label: "dove · ha fondato" },
    ],
    "g1-a",
    "montessori",
  ),
);
writeJson(
  "quests/quest-03/scenes/07.json",
  mcQuizScene(
    7,
    "2/6",
    "Dove sono ___ (arrivare) le tre caravelle di questo uomo ___ parliamo ancora oggi?",
    [
      { id: "g2-a", label: "sono arrivate · di cui parliamo" },
      { id: "g2-b", label: "sono arrivati · di cui parliamo" },
      { id: "g2-c", label: "sono arrivate · che parliamo" },
      { id: "g2-d", label: "è arrivata · di cui parliamo" },
    ],
    "g2-a",
    "colombo",
  ),
);
writeJson(
  "quests/quest-03/scenes/08.json",
  mcQuizScene(
    8,
    "3/6",
    "Chi è il musicista ___ nel 1800 ha ___ (fare) il politico?",
    [
      { id: "g3-a", label: "che · ha fatto" },
      { id: "g3-b", label: "che · ha fare" },
      { id: "g3-c", label: "cui · ha fatto" },
      { id: "g3-d", label: "dove · ha fatto" },
    ],
    "g3-a",
    "verdi",
  ),
);
writeJson(
  "quests/quest-03/scenes/09.json",
  mcQuizScene(
    9,
    "4/6",
    "Chi è l'artista ___ conosciamo un dipinto molto famoso ___ si chiama \"La Gioconda\"?",
    [
      { id: "g4-a", label: "di cui conosciamo · che si chiama" },
      { id: "g4-b", label: "che conosciamo · cui si chiama" },
      { id: "g4-c", label: "di cui conosciamo · cui si chiama" },
      { id: "g4-d", label: "che conosciamo · che si chiama" },
    ],
    "g4-a",
    "da-vinci",
  ),
);
writeJson(
  "quests/quest-03/scenes/10.json",
  mcQuizScene(
    10,
    "5/6",
    "Come si chiama lo scultore ___ ha ___ (creare) il David di Firenze?",
    [
      { id: "g5-a", label: "che · ha creato" },
      { id: "g5-b", label: "che · ha creare" },
      { id: "g5-c", label: "cui · ha creato" },
      { id: "g5-d", label: "dove · ha creato" },
    ],
    "g5-a",
    "michelangelo",
  ),
);
writeJson(
  "quests/quest-03/scenes/11.json",
  mcQuizScene(
    11,
    "6/6",
    "Come si chiama la scrittrice, famosissima in tutto il mondo, ___ ha ___ (scrivere) quattro romanzi su Napoli e ___ non si sa molto?",
    [
      { id: "g6-a", label: "che · ha scritto · di cui non si sa" },
      { id: "g6-b", label: "che · ha scritto · che non si sa" },
      { id: "g6-c", label: "cui · ha scritto · di cui non si sa" },
      { id: "g6-d", label: "che · ha scrivere · di cui non si sa" },
    ],
    "g6-a",
    "ferrante",
  ),
);

writeJson(
  "quests/quest-03/scenes/12.json",
  story(
    CHAPTER_ID,
    "quest-03",
    12,
    q3bg,
    "Tu\nFatto! La prof sarà contenta. Adesso però ho davvero fame, e penso che c'è ancora una cosa da fare oggi: quel ristorante in centro cerca personale per l'estate...",
  ),
);
writeJson(
  "quests/quest-03/scenes/13.json",
  story(
    CHAPTER_ID,
    "quest-03",
    13,
    q3bg,
    "Salvi il compito sul portale della scuola e chiudi il computer. Ti resta un ultimo posto da visitare oggi: il ristorante.",
  ),
);

// --- quest-04 (21 scenes) ---
const q4bg = quests[3].bgTrattoria;
const q4Exterior = quests[3].bgTrattoriaExterior;
const q4task = quests[3].bgTask;

writeJson(
  "quests/quest-04/scenes/01.json",
  story(
    CHAPTER_ID,
    "quest-04",
    1,
    q4Exterior,
    "Esci di nuovo nel pomeriggio. Sotto i portici, vicino a Piazza Maggiore, trovi il ristorante di cui ti ha parlato la signora Ferrari: \"Trattoria da Marini\". All'ingresso c'è un cartello: Cercasi personale per la stagione estiva.",
  ),
);
writeJson(
  "quests/quest-04/scenes/02.json",
  story(
    CHAPTER_ID,
    "quest-04",
    2,
    q4Exterior,
    "Tu\nBene. Lavorare durante l'estate non sarebbe male. Posso guadagnare qualcosa e migliorare il mio italiano. Entriamo.",
  ),
);
writeJson(
  "quests/quest-04/scenes/03.json",
  story(
    CHAPTER_ID,
    "quest-04",
    3,
    q4bg,
    "Entri nel ristorante. Un uomo sulla cinquantina, con il grembiule bianco, sta pulendo un tavolo vicino alla finestra. Ti vede e si avvicina.",
  ),
);
writeJson(
  "quests/quest-04/scenes/04.json",
  story(
    CHAPTER_ID,
    "quest-04",
    4,
    q4bg,
    "Signor Marini\n\"Buongiorno! Vuoi mangiare qualcosa? In questo momento la cucina è chiusa, riapriamo più tardi.\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/05.json",
  story(
    CHAPTER_ID,
    "quest-04",
    5,
    q4bg,
    "Tu\n\"Buongiorno, no, scusi… Ho visto il cartello fuori. Cerco un lavoretto per l'estate.\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/06.json",
  story(
    CHAPTER_ID,
    "quest-04",
    6,
    q4bg,
    "Signor Marini\n\"Ah, perfetto! Stiamo cercando del personale per la stagione estiva. Hai con te una lettera di motivazione?\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/07.json",
  story(
    CHAPTER_ID,
    "quest-04",
    7,
    q4bg,
    "Tu\n\"Non ancora, ma ecco il mio portatile. Posso prepararla qui?\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/08.json",
  story(
    CHAPTER_ID,
    "quest-04",
    8,
    q4bg,
    "Signor Marini\n\"Certo, siediti pure. Quando hai finito, me la mandi via email e poi ne parliamo un po'. Ah, e visto che siamo un ristorante: ti farò anche qualche domanda sui piatti italiani, eh!\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/09.json",
  story(
    CHAPTER_ID,
    "quest-04",
    9,
    q4bg,
    "Tu\nVa bene. Apro il computer e si comincia. Ci sono delle formule fisse che si usano sempre nelle lettere formali: bisogna solo scegliere quelle giuste.",
  ),
);
writeJson(
  "quests/quest-04/scenes/10.json",
  story(
    CHAPTER_ID,
    "quest-04",
    10,
    q4bg,
    "Completa la lettera di motivazione con le formule giuste. Trascina le espressioni dalla lista nelle lacune. (Trovi la lettera di motivazione sotto „Documento“.)",
  ),
);

const letterFormulas = [
  { id: "f-gentili", label: "Gentili Signore e Signori," },
  { id: "f-cassari", label: "Gentile Signora Cassari," },
  { id: "f-devalli", label: "Gentile Signor De Valli," },
  { id: "f-direttore", label: "Egregio Direttore," },
  { id: "f-dottoressa", label: "Stimata Dottoressa," },
  { id: "f-candidarmi", label: "con la presente desidero candidarmi …" },
  { id: "f-chiedere", label: "vorrei chiedere/presentare …" },
  { id: "f-prego", label: "Vi prego di …" },
  { id: "f-inizio", label: "all'inizio" },
  { id: "f-primo", label: "per primo" },
  { id: "f-poi", label: "poi" },
  { id: "f-piu-tardi", label: "più tardi …" },
  { id: "f-inoltre", label: "inoltre" },
  { id: "f-in-piu", label: "in più" },
  { id: "f-infine", label: "infine" },
  { id: "f-alla-fine", label: "alla fine" },
  {
    id: "f-contatti-sing",
    label: "Se desidera ulteriori informazioni, non esiti a contattarmi.",
  },
  {
    id: "f-contatti-pl",
    label: "Se desiderate ulteriori informazioni, non esitate a contattarmi.",
  },
  {
    id: "f-attesa",
    label: "In attesa di una Vostra gentile risposta, invio i miei più cordiali saluti",
  },
  { id: "f-notizie", label: "Gradirei molto ricevere presto Vostre notizie." },
  {
    id: "f-ringraziando",
    label: "RingraziandoVi anticipatamente, porgo i miei più distinti saluti.",
  },
];

writeJson("quests/quest-04/scenes/11.json", {
  id: `${CHAPTER_ID}-quest-04-scene-11`,
  scene_type: "task",
  screen_type: "drag_drop",
  background: q4task,
  content: {
    title: "Lettera di motivazione",
    instruction: "Trascina la formula giusta in ogni spazio vuoto della lettera.",
    referenceDocument: {
      title: "Bozza della lettera",
      body: `___ (1)

___ (2) per un posto come aiuto in sala nel vostro ristorante.

___ (3) ho sedici anni e frequento la decima classe di un liceo linguistico a Monaco di Baviera. Studio l'italiano da tre anni e quest'estate vorrei migliorare la mia lingua lavorando in Italia. ___ (4) ho già lavorato come babysitter per due estati e ho fatto il tirocinio nella mensa della mia scuola, quindi ho un po' di esperienza con il pubblico e con il servizio.

___ (5) sono una persona puntuale, gentile e motivata. ___ (6)

___ (7)`,
    },
    task: {
      prompt:
        "Completa la lettera di motivazione con le formule giuste. (Trovi la lettera di motivazione con le relative lacune sotto „Documento“.)",
      presentation: { targetMode: "blocks" },
      shuffleItemOrder: true,
      items: letterFormulas,
      targets: [
        {
          id: "slot-1",
          title: "(1) — saluto iniziale",
          correctItemIds: ["f-gentili", "f-cassari", "f-devalli", "f-direttore", "f-dottoressa"],
        },
        {
          id: "slot-2",
          title: "(2) — presentare la candidatura",
          correctItemIds: ["f-candidarmi", "f-chiedere"],
        },
        {
          id: "slot-3",
          title: "(3) — inizio del corpo centrale",
          correctItemIds: ["f-inizio", "f-primo"],
        },
        {
          id: "slot-4",
          title: "(4) — collegare un'informazione in più",
          correctItemIds: ["f-inoltre", "f-in-piu"],
        },
        {
          id: "slot-5",
          title: "(5) — passaggio successivo",
          correctItemIds: ["f-poi", "f-piu-tardi", "f-infine", "f-alla-fine"],
        },
        {
          id: "slot-6",
          title: "(6) — invito al contatto",
          correctItemIds: ["f-contatti-sing", "f-contatti-pl"],
        },
        {
          id: "slot-7",
          title: "(7) — formula di chiusura",
          correctItemIds: ["f-attesa", "f-notizie", "f-ringraziando"],
        },
      ],
    },
  },
  scoring: taskScoring("drag_drop"),
});

writeJson(
  "quests/quest-04/scenes/12.json",
  story(
    CHAPTER_ID,
    "quest-04",
    12,
    q4bg,
    "Salvi la lettera e la mandi all'indirizzo email del ristorante. Pochi secondi dopo, il Signor Marini apre il suo telefono, legge il messaggio e si avvicina al tuo tavolo con un sorriso.",
  ),
);
writeJson(
  "quests/quest-04/scenes/13.json",
  story(
    CHAPTER_ID,
    "quest-04",
    13,
    q4bg,
    "Signor Marini\n\"Bene, bene! Bella lettera. Adesso però la prova vera: se vuoi lavorare qui da Marini, devi conoscere un po' la nostra cucina. Ti faccio vedere il nostro menù. Descrivimi com'è strutturato un menù italiano: cosa sono le varie parti? Usa frasi con che, cui o dove, va bene?\"",
  ),
);

writeJson(
  "quests/quest-04/scenes/14.json",
  freetextMenuScene(
    14,
    "gli antipasti",
    "chapters/02/quests/04/ref-menu-antipasti",
    "Descrivi gli antipasti con una frase. Usa che, cui o dove.",
  ),
);
writeJson(
  "quests/quest-04/scenes/15.json",
  freetextMenuScene(
    15,
    "i primi piatti",
    "chapters/02/quests/04/ref-menu-primi",
    "Descrivi i primi piatti con una frase. Usa che, cui o dove.",
  ),
);
writeJson(
  "quests/quest-04/scenes/16.json",
  freetextMenuScene(
    16,
    "i secondi piatti (con contorni)",
    "chapters/02/quests/04/ref-menu-secondi",
    "Descrivi i secondi piatti con una frase. Usa che, cui o dove.",
  ),
);
writeJson(
  "quests/quest-04/scenes/17.json",
  freetextMenuScene(17, "le pizze", "chapters/02/quests/04/ref-menu-pizze", "Descrivi le pizze con una frase. Usa che, cui o dove."),
);
writeJson(
  "quests/quest-04/scenes/18.json",
  freetextMenuScene(18, "i dolci", "chapters/02/quests/04/ref-menu-dolci", "Descrivi i dolci con una frase. Usa che, cui o dove."),
);

writeJson(
  "quests/quest-04/scenes/19.json",
  story(
    CHAPTER_ID,
    "quest-04",
    19,
    q4bg,
    "Signor Marini\n\"Bravissimo/a! Si vede che hai studiato bene. Senti,  per l'estate ti posso offrire un posto come aiuto in sala. Adesso vai a casa, parla con la tua famiglia ospitante e poi ci sentiamo. Ah, e tieni: il primo caffè da Marini in offerta!\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/20.json",
  story(
    CHAPTER_ID,
    "quest-04",
    20,
    q4bg,
    "Tu\nChe giornata! Ho conosciuto meglio Bologna, ho fatto i compiti, ho trovato anche un lavoretto per l'estate. Niente male, e sono appena arrivato/a!",
  ),
);
writeJson(
  "quests/quest-04/scenes/21.json",
  story(
    CHAPTER_ID,
    "quest-04",
    21,
    q4bg,
    "Esci dal ristorante. Il sole tramonta sui portici di Bologna.",
  ),
);

// --- bonus ---
const bbg = quests[4].bgBonus;
const btask = quests[4].bgTask;

writeJson(
  "quests/quest-01-bonus/scenes/01.json",
  story(
    CHAPTER_ID,
    "quest-01-bonus",
    1,
    bbg,
    "Hai completato il secondo capitolo della tua avventura a Bologna. Hai parlato del futuro con un nuovo amico, hai conosciuto tre italiani famosi e hai fatto domanda per il tuo primo lavoretto.",
  ),
);
writeJson(
  "quests/quest-01-bonus/scenes/02.json",
  story(
    CHAPTER_ID,
    "quest-01-bonus",
    2,
    bbg,
    "Prima di chiudere il capitolo, mettiti alla prova: quante parole di questa lezione ricordi davvero?",
  ),
);
writeJson(
  "quests/quest-01-bonus/scenes/03.json",
  story(
    CHAPTER_ID,
    "quest-01-bonus",
    3,
    bbg,
    "Risolvi questo compito bonus per guadagnare fino a 5 fette di pizza extra!",
  ),
);

const bonusPoolPairs = [
  ["la professione", "profession / occupation"],
  ["il mestiere", "trade / job"],
  ["il medico", "doctor / physician"],
  ["l'impiegato", "clerk / employee"],
  ["l'impiegata", "clerk / employee"],
  ["il giardiniere", "gardener"],
  ["la giardiniere", "gardener"],
  ["il giornalista", "journalist"],
  ["la giornalista", "journalist"],
  ["l'archeologo", "archaeologist"],
  ["l'archeologa", "archaeologist"],
  ["il poliziotto", "police officer"],
  ["la poliziotta", "police officer"],
  ["l'architetto", "architect"],
  ["l'architetto donna", "architect"],
  ["l'insegnante", "teacher"],
  ["il professore", "professor"],
  ["la professoressa", "professor"],
  ["il dottore", "doctor"],
  ["la dottoressa", "doctor"],
  ["(creare) un profilo", "(to create) a profile"],
  ["informare (il pubblico)", "to inform (the public)"],
  ["fare un'indagine", "to carry out an investigation"],
  ["lottare contro la criminalità", "to fight against crime"],
  ["fare la scorta a", "to provide bodyguard protection for"],
  ["inscenare (un caso)", "to stage (a case)"],
  ["(spiegare) la particolarità (di un caso)", "(to explain) the particularity (of a case)"],
  ["il liceo artistico", "art high school"],
  ["il liceo classico", "classical/humanistic high school"],
  ["il liceo scientifico", "scientific high school"],
  ["il liceo linguistico", "linguistic high school"],
  ["il liceo musicale", "music high school"],
  ["la formazione professionale", "vocational training"],
  ["il passaggio", "transition / passage"],
  ["la scuola primaria", "primary school"],
  ["la scuola secondaria", "secondary school"],
  ["l'obbligo (d'istruzione)", "(school) obligation"],
  ["lo stage", "internship"],
  ["lo stagista", "intern"],
  ["la stagista", "intern"],
  ["il braccio", "arm"],
  ["le braccia", "arms"],
  ["la mano", "hand"],
  ["le mani", "hands"],
  ["il ginocchio", "knee"],
  ["le ginocchia", "knees"],
  ["l'occhio", "eye"],
  ["la testa", "head"],
  ["il naso", "nose"],
  ["il labbro", "lip"],
  ["le labbra", "lips"],
  ["l'orecchio", "ear"],
  ["le orecchie", "ears"],
  ["il piede", "foot"],
  ["i capelli", "hair"],
  ["la spalla", "shoulder"],
  ["il dito", "finger"],
  ["le dita", "fingers"],
  ["il cuore", "heart"],
  ["la gamba", "leg"],
  ["il muscolo", "muscle"],
  ["rilassato", "relaxed"],
  ["rilassata", "relaxed"],
  ["disponibile", "available"],
  ["umano", "human"],
  ["umana", "human"],
  ["magnifico", "magnificent / great"],
  ["magnifica", "magnificent / great"],
  ["carismatico", "charismatic"],
  ["carismatica", "charismatic"],
  ["orgoglioso", "proud"],
  ["orgogliosa", "proud"],
  ["geniale", "brilliant / genius"],
  ["(super)potente", "(super)powerful"],
  ["(ultra)sensibile", "(ultra)sensitive"],
  ["sincero", "sincere / honest"],
  ["sincera", "sincere / honest"],
  ["responsabile", "responsible"],
  ["flessibile", "flexible"],
  ["duro", "hard / tough"],
  ["dura", "hard / tough"],
  ["snello", "slim"],
  ["snella", "slim"],
  ["distrutto", "destroyed / exhausted"],
  ["distrutta", "destroyed / exhausted"],
  ["pigro", "lazy"],
  ["pigra", "lazy"],
  ["vegano", "vegan"],
  ["vegana", "vegan"],
  ["l'esperto", "expert"],
  ["l'esperta", "expert"],
  ["programmare", "to program"],
  ["utilizzare", "to use"],
  ["il materiale", "material"],
  ["il modello", "model"],
  ["magnetico", "magnetic"],
  ["magnetica", "magnetic"],
  ["chimico", "chemical"],
  ["chimica", "chemical"],
  ["la base (chimica)", "(chemical) base"],
  ["il comando", "command / control"],
  ["la trasmissione", "transmission / broadcast"],
  ["la radio", "radio"],
  ["il frigorifero", "refrigerator"],
  ["il ventilatore", "fan / ventilator"],
  ["lo schermo", "screen"],
  ["il robot", "robot"],
];

writeJson("quests/quest-01-bonus/scenes/04.json", {
  id: `${CHAPTER_ID}-quest-01-bonus-scene-04`,
  scene_type: "task",
  screen_type: "matching",
  background: btask,
  content: {
    title: "Sfida bonus",
    instruction: "Abbina ogni parola italiana al suo equivalente inglese.",
    referenceDocument: null,
    task: {
      prompt: "Abbina ogni parola italiana al suo equivalente inglese.",
      sampleSize: 10,
      poolPairs: bonusPoolPairs.map(([leftLabel, rightLabel], i) => ({
        id: `ch02v${String(i + 1).padStart(2, "0")}`,
        leftLabel,
        rightLabel,
      })),
      presentation: {
        leftLabel: "italiano",
        rightLabel: "english",
        shuffleRightOrder: true,
      },
    },
  },
  scoring: taskScoring("matching"),
});

console.log("Generated chapter-02 catalog under", ROOT);
