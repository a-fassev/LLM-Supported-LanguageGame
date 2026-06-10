/**
 * One-shot generator for lib/content/chapters/chapter-01 (Lezione 1).
 * Run: node scripts/generate-chapter-01-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { taskScoring } from "./lib/scoring-defaults.mjs";

const ROOT = path.join(process.cwd(), "lib/content/chapters/chapter-01");

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

const BROCHURE_BODY = `La visita alle Grotte di Castellana — aperte tutto l'anno — è possibile con guide turistiche.

Ci sono due itinerari: l'itinerario parziale della lunghezza di un chilometro e della durata di 50 minuti, l'itinerario completo della lunghezza di tre chilometri e della durata di quasi due ore.

La temperatura, costante tutto l'anno, è di circa 18 °C, mentre il tasso di umidità è superiore al 90%.

La Grave, prima e più grande caverna del sistema sotterraneo, è l'unico ambiente naturalmente collegato con l'esterno: 100 metri di lunghezza, per 50 di larghezza, per 60 di profondità.

La parte delle grotte aperta al pubblico è costituita da ambienti molto vari per forma e dimensioni. Stalattiti, stalagmiti, colonne, preziosi cristalli occhieggiano ovunque.

Infine, l'ultima e più bella caverna del sistema sotterraneo, la Grotta Bianca, definita per la ricchezza e il biancore dell'alabastro, è la più splendente del mondo.`;

const refDoc = {
  title: "Le Grotte di Castellana",
  body: BROCHURE_BODY,
};

// --- chapter + quests ---
writeJson("chapter.json", {
  id: "chapter-01",
  title: "Benvenuti a Bologna",
  order: 1,
  locked: false,
  quests: ["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"],
  background: "chapters/01/chapter/bg-missions",
});

const quests = [
  {
    id: "quest-01",
    title: "La tua camera",
    order: 1,
    kind: "main",
    requiresQuestId: null,
    background: "chapters/01/quests/01/bg-overview",
    folder: "01",
    bgRoom: "chapters/01/quests/01/bg-room",
  },
  {
    id: "quest-02",
    title: "Il primo giorno",
    order: 2,
    kind: "main",
    requiresQuestId: "quest-01",
    background: "chapters/01/quests/02/bg-overview",
    folder: "02",
    bgClass: "chapters/01/quests/02/bg-class",
  },
  {
    id: "quest-03",
    title: "Il messaggio di Matteo",
    order: 3,
    kind: "main",
    requiresQuestId: "quest-02",
    background: "chapters/01/quests/03/bg-overview",
    folder: "03",
    bgSchool: "chapters/01/quests/03/bg-school",
  },
  {
    id: "quest-04",
    title: "Il bar di Tonio",
    order: 4,
    kind: "main",
    requiresQuestId: "quest-03",
    background: "chapters/01/quests/04/bg-overview",
    folder: "04",
    bgBar: "chapters/01/quests/04/bg-bar",
  },
  {
    id: "quest-01-bonus",
    title: "Extra: sfida vocabolario",
    order: 5,
    kind: "bonus",
    requiresQuestId: "quest-04",
    background: "chapters/01/quests/bonus/bg-overview",
    folder: "bonus",
    bgBonus: "chapters/01/quests/bonus/bg-bonus",
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

// --- quest-01 (7 story) ---
const q1bg = quests[0].bgRoom;
writeJson("quests/quest-01/scenes/01.json", story("chapter-01", "quest-01", 1, q1bg, "Benvenuto/a a Bologna."));
writeJson(
  "quests/quest-01/scenes/02.json",
  story(
    "chapter-01",
    "quest-01",
    2,
    q1bg,
    "Ti chiami Toni. Vieni dalla Germania e sei in Italia per un anno di scambio. Da oggi vivi qui, nella casa della famiglia Ferrari, in una città che ancora non conosci.",
  ),
);
writeJson(
  "quests/quest-01/scenes/03.json",
  story(
    "chapter-01",
    "quest-01",
    3,
    q1bg,
    "È domenica sera. Domani sarà il tuo primo giorno al Liceo Galvani, la tua nuova scuola.",
  ),
);
writeJson(
  "quests/quest-01/scenes/04.json",
  story(
    "chapter-01",
    "quest-01",
    4,
    q1bg,
    "Questa è la tua camera. Adesso è ancora vuota, ma con il tempo si riempirà di ricordi, oggetti e souvenir delle tue avventure.",
  ),
);
writeJson(
  "quests/quest-01/scenes/05.json",
  story(
    "chapter-01",
    "quest-01",
    5,
    q1bg,
    "Durante il gioco completerai diversi compiti per la scuola e per le persone che incontrerai. Per ogni compito risolto, il tuo zaino diventa più pieno di colore. (Hai perso lo zaino il primo giorno!)",
  ),
);
writeJson(
  "quests/quest-01/scenes/06.json",
  story(
    "chapter-01",
    "quest-01",
    6,
    q1bg,
    "Per i compiti riceverai fette di pizza. Puoi usarle per personalizzare il tuo avatar con nuovi vestiti e accessori.",
  ),
);
writeJson(
  "quests/quest-01/scenes/07.json",
  story(
    "chapter-01",
    "quest-01",
    7,
    q1bg,
    "Dalla mappa dei capitoli puoi scegliere la prossima missione. Alcuni capitoli si aprono solo quando hai completato quelli precedenti.",
  ),
);

// --- quest-02 ---
const q2bg = quests[1].bgClass;
writeJson(
  "quests/quest-02/scenes/01.json",
  story(
    "chapter-01",
    "quest-02",
    1,
    q2bg,
    "Sei in Italia per un anno di scambio. Oggi è il tuo primo giorno al Liceo Galvani di Bologna. Lunedì mattina, ore 8:00. Entri in classe: gli studenti chiacchierano, qualcuno ti guarda con curiosità.",
  ),
);
writeJson(
  "quests/quest-02/scenes/02.json",
  story(
    "chapter-01",
    "quest-02",
    2,
    q2bg,
    "Prof.ssa Ricci\n\"Buongiorno a tutti! Bentornati! Spero che le vacanze siano andate bene. Oggi cominciamo con una cosa semplice: ognuno di voi racconta qualcosa delle vacanze estive. Chi vuole iniziare?\"",
  ),
);
writeJson(
  "quests/quest-02/scenes/03.json",
  story(
    "chapter-01",
    "quest-02",
    3,
    q2bg,
    "Chiara\n\"Inizio io, prof! Quest'estate sono stata in Sicilia con la mia famiglia. Faceva un caldo pazzesco, ma il mare era bellissimo. E tu? Sei nuovo/a, vero? Da dove vieni?\"",
  ),
);
writeJson(
  "quests/quest-02/scenes/04.json",
  story(
    "chapter-01",
    "quest-02",
    4,
    q2bg,
    "Tu\nTutti mi guardano. Devo raccontare qualcosa anch'io delle mie vacanze...",
  ),
);

function gap(answers, maxLength = 24) {
  return { kind: "gap", maxLength, correctAnswers: answers };
}

writeJson("quests/quest-02/scenes/05.json", {
  id: "chapter-01-quest-02-scene-05",
  scene_type: "task",
  screen_type: "cloze",
  background: "chapters/01/quests/02/bg-task-cloze",
  content: {
    title: "Completa il testo",
    instruction: "Completa con le forme giuste dei verbi all'imperfetto o al passato prossimo.",
    referenceDocument: null,
    task: {
      prompt:
        "Racconta delle tue vacanze. Completa con le forme giuste dei verbi all'imperfetto o al passato prossimo.",
      caseSensitive: false,
      lines: [
        {
          segments: [
            { kind: "text", text: "Quest'estate " },
            gap(["sono andato", "sono andata", "Sono andato", "Sono andata"]),
            { kind: "text", text: " in campeggio con la mia famiglia al Lago di Garda. " },
            gap(["Era", "era"]),
            { kind: "text", text: " la prima volta che " },
            gap(["vedevamo", "abbiamo visto", "Vedevamo", "Abbiamo visto"]),
            { kind: "text", text: " quel lago e ci " },
            gap(["è piaciuto", "È piaciuto"]),
            { kind: "text", text: " moltissimo. Ogni mattina " },
            gap(["facevo", "Facevo"]),
            { kind: "text", text: " colazione con vista sull'acqua, poi " },
            gap(["andavamo", "Andavamo"]),
            { kind: "text", text: " in spiaggia. Il tempo " },
            gap(["era", "Era"]),
            { kind: "text", text: " quasi sempre bello, solo un giorno " },
            gap(["è piovuto", "È piovuto"]),
            { kind: "text", text: " così tanto che " },
            gap(["abbiamo dovuto", "Abbiamo dovuto"]),
            { kind: "text", text: " rimanere in tenda. Una sera " },
            gap(["ho conosciuto", "Ho conosciuto"]),
            { kind: "text", text: " un ragazzo italiano di Verona: " },
            gap(["abbiamo parlato", "Abbiamo parlato"]),
            { kind: "text", text: " per ore, anche se il mio italiano non " },
            gap(["era", "Era"]),
            { kind: "text", text: " ancora perfetto. Quando " },
            gap(["sono tornato", "sono tornata", "Sono tornato", "Sono tornata"]),
            { kind: "text", text: " a casa, " },
            gap(["mi sentivo", "Mi sentivo"]),
            { kind: "text", text: " un po' triste, ma anche contento/a perché presto " },
            gap([
              "partivo",
              "Partivo",
              "sarei partito",
              "sarei partita",
              "Sarei partito",
              "Sarei partita",
            ]),
            { kind: "text", text: " per Bologna." },
          ],
        },
      ],
    },
  },
  scoring: taskScoring("cloze", { minRatioToComplete: 0.85 }),
});

writeJson(
  "quests/quest-02/scenes/06.json",
  story(
    "chapter-01",
    "quest-02",
    6,
    q2bg,
    "Dopo il tuo racconto, la prof.ssa Ricci sorride e prende un foglio dalla cattedra.",
  ),
);
writeJson(
  "quests/quest-02/scenes/07.json",
  story(
    "chapter-01",
    "quest-02",
    7,
    q2bg,
    "Prof.ssa Ricci\n\"Bravissimo/a! A proposito di viaggi: ho qui un articolo di una rivista tedesca con consigli per i turisti in Italia. Però... qualcosa non torna. Ci sono degli errori. Riuscite a trovarli?\"",
  ),
);

writeJson("quests/quest-02/scenes/08.json", {
  id: "chapter-01-quest-02-scene-08",
  scene_type: "task",
  screen_type: "error_spotting",
  background: "chapters/01/quests/02/bg-task-error",
  content: {
    title: "Trova gli errori",
    instruction: "Leggi il testo e trova i 5 errori. Clicca sulle informazioni sbagliate.",
    referenceDocument: null,
    task: {
      prompt:
        "Leggi il testo e trova i 5 errori sulle abitudini italiane al bar e al ristorante. Clicca sulle informazioni sbagliate.",
      expectedErrorRange: { min: 5, max: 5 },
      segments: [
        {
          id: "a1",
          text: "Come comportarsi in Italia: consigli per turisti\n\nIn Italia, se vuoi risparmiare al bar,",
          isError: false,
        },
        {
          id: "a3",
          text: " siediti sempre a un tavolino",
          isError: true,
          acceptedCorrections: [
            "bisogna stare in piedi al banco",
            "devi stare in piedi al banco",
            "stare in piedi al banco",
          ],
        },
        {
          id: "a4",
          text: " : il prezzo è lo stesso che al banco. Per quanto riguarda il caffè,",
          isError: false,
        },
        {
          id: "a5",
          text: " gli italiani bevono il cappuccino a tutte le ore del giorno",
          isError: true,
          acceptedCorrections: [
            "gli italiani bevono il cappuccino solo la mattina",
            "il cappuccino si beve solo la mattina",
            "solo la mattina, mai dopo pranzo",
          ],
        },
        {
          id: "a6",
          text: " , anche dopo pranzo e dopo cena. Al ristorante, quando arrivi,",
          isError: false,
        },
        {
          id: "a7",
          text: " scegli tu stesso il tavolo",
          isError: true,
          acceptedCorrections: [
            "si aspetta che il personale assegni il tavolo",
            "aspetta che il personale ti assegni il tavolo",
            "il personale assegna il tavolo",
          ],
        },
        {
          id: "a8",
          text: " senza aspettare. Un pasto italiano normale è composto da",
          isError: false,
        },
        {
          id: "a9",
          text: " un solo piatto, di solito pizza o pasta",
          isError: true,
          acceptedCorrections: [
            "più portate",
            "un pasto completo ha più portate",
            "diverse portate",
          ],
        },
        {
          id: "a10",
          text: " . Se mangi con gli amici, ognuno paga il proprio:",
          isError: false,
        },
        {
          id: "a11",
          text: " il conto separato è la regola in Italia",
          isError: true,
          acceptedCorrections: ["si paga insieme", "si divide il conto", "pagano insieme"],
        },
        {
          id: "a12",
          text: " . La mancia non è obbligatoria, ma sulla ricevuta si trova spesso il \"coperto\", una piccola somma per il pane e il servizio.",
          isError: false,
        },
      ],
    },
  },
  scoring: taskScoring("error_spotting", { minRatioToComplete: 0.6 }),
});

writeJson(
  "quests/quest-02/scenes/09.json",
  story(
    "chapter-01",
    "quest-02",
    9,
    q2bg,
    "Prof.ssa Ricci\n\"Perfetto, avete trovato tutto. Vedete, conoscere una cultura significa anche conoscere i piccoli dettagli. Bene, per oggi basta. Ci vediamo giovedì!\"",
  ),
);
writeJson(
  "quests/quest-02/scenes/10.json",
  story(
    "chapter-01",
    "quest-02",
    10,
    q2bg,
    "La campanella suona. Esci dalla classe con gli altri studenti e ti dirigi verso l'uscita della scuola.",
  ),
);

// --- quest-03 ---
const q3bg = quests[2].bgSchool;
writeJson(
  "quests/quest-03/scenes/01.json",
  story(
    "chapter-01",
    "quest-03",
    1,
    q3bg,
    "Davanti al Liceo Galvani. Il sole è alto, gli studenti escono in gruppi. Stai per andare via quando il telefono vibra in tasca.",
  ),
);
writeJson(
  "quests/quest-03/scenes/02.json",
  story(
    "chapter-01",
    "quest-03",
    2,
    q3bg,
    "Matteo\nCiao cugino/a! Allora, com'è andato il primo giorno a Bologna? Io oggi sono tornato a scuola anch'io e... che disastro! Ti racconto tutto, ma scrivo di fretta perché ho i compiti.",
  ),
);
writeJson(
  "quests/quest-03/scenes/03.json",
  story(
    "chapter-01",
    "quest-03",
    3,
    q3bg,
    "Tu\nÈ Matteo, mio cugino di Palermo. Mi scrive sempre quando succede qualcosa di importante. Vediamo cosa racconta...",
  ),
);

writeJson("quests/quest-03/scenes/04.json", {
  id: "chapter-01-quest-03-scene-04",
  scene_type: "task",
  screen_type: "cloze",
  background: "chapters/01/quests/03/bg-task-cloze",
  content: {
    title: "Completa l'SMS",
    instruction:
      "Leggi il messaggio di Matteo e scegli il pronome personale giusto e metti i verbi al passato prossimo.",
    referenceDocument: null,
    task: {
      prompt:
        "Leggi il messaggio di Matteo e scegli il pronome personale giusto e metti i verbi al passato prossimo.",
      caseSensitive: false,
      lines: [
        {
          segments: [
            { kind: "text", text: "Ciao cugino/a! " },
            gap(["ti", "Ti"]),
            { kind: "text", text: " scrivo solo poche frasi perché vado di fretta. Il nostro prof di matematica " },
            gap(["ci ha dato", "Ci ha dato"]),
            { kind: "text", text: " tantissimi compiti già il primo giorno … " },
            gap(["gli abbiamo detto", "Gli abbiamo detto"]),
            { kind: "text", text: " che non è giusto, ma lo conosci, non " },
            gap(["gli", "Gli"]),
            { kind: "text", text: " interessa. Ti salutano i miei genitori, a pranzo " },
            gap(["mi hanno detto", "Mi hanno detto"]),
            { kind: "text", text: " che " },
            gap(["gli hai mandato", "Gli hai mandato"]),
            { kind: "text", text: " un'e-mail. E poi Giulia …! " },
            gap(["le ho promesso", "Le ho promesso"]),
            { kind: "text", text: " di mandar" },
            gap(["le", "Le"]),
            { kind: "text", text: " non solo i suoi saluti, ma anche un bacio da parte di Cinzia. Vogliamo dir" },
            gap(["ti", "Ti"]),
            { kind: "text", text: " tutti che " },
            gap(["ci", "Ci"]),
            { kind: "text", text: " manchi! Appena ho un po' di tempo, mi faccio di nuovo vivo. A presto, M." },
          ],
        },
      ],
    },
  },
  scoring: taskScoring("cloze", { minRatioToComplete: 0.85 }),
});

writeJson(
  "quests/quest-03/scenes/05.json",
  story(
    "chapter-01",
    "quest-03",
    5,
    q3bg,
    "Tu\nMatteo non cambia mai. Gli rispondo più tardi, adesso ho voglia di esplorare un po' Bologna. È la mia prima vera giornata libera in città.",
  ),
);
writeJson(
  "quests/quest-03/scenes/06.json",
  story(
    "chapter-01",
    "quest-03",
    6,
    q3bg,
    "Riponi il telefono in tasca. È ora di andare in un bar nel centro di Bologna.",
  ),
);

// --- quest-04 (15 scenes, no 06 brochure read) ---
const q4bg = quests[3].bgBar;
const q4task = "chapters/01/quests/04/bg-bar-task";
writeJson(
  "quests/quest-04/scenes/01.json",
  story(
    "chapter-01",
    "quest-04",
    1,
    q4bg,
    "Cammini per le vie del centro di Bologna, sotto i portici. Hai sete e decidi di fermarti in un piccolo bar. Dentro c'è odore di caffè e di cornetti appena fatti.",
  ),
);
writeJson(
  "quests/quest-04/scenes/02.json",
  story(
    "chapter-01",
    "quest-04",
    2,
    q4bg,
    "Tonio\n\"Ciao, ragazzo/a! Cosa ti posso offrire? Un caffè, un'acqua? ... Aspetta, non ti ho mai visto qui. Sei nuovo/a a Bologna?\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/03.json",
  story(
    "chapter-01",
    "quest-04",
    3,
    q4bg,
    "Tu\n\"Sì, sono appena arrivato/a. Studio al Liceo Galvani.\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/04.json",
  story(
    "chapter-01",
    "quest-04",
    4,
    q4bg,
    "Tonio\n\"Ah, benvenuto/a allora! Io sono Tonio. Il bar è mio, ma io non sono di Bologna. Vengo dalla Puglia, da un paesino vicino a Castellana Grotte. Lo conosci? No? Eh, è un posto incredibile. Ci sono delle grotte sotterranee tra le più belle del mondo. Aspetta, ti faccio vedere una cosa...\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/05.json",
  story("chapter-01", "quest-04", 5, q4bg, "Tonio prende una brochure dal bancone e te la passa."),
);
writeJson(
  "quests/quest-04/scenes/06.json",
  story(
    "chapter-01",
    "quest-04",
    6,
    q4bg,
    "Sfogli la brochure. Durante i prossimi compiti potrai consultarla nel documento quando vuoi.",
  ),
);
writeJson(
  "quests/quest-04/scenes/07.json",
  story(
    "chapter-01",
    "quest-04",
    7,
    q4bg,
    "Tonio\n\"Allora, che ne dici? Bello, no? Ma senti, visto che sei bravo/a con l'italiano, mi puoi aiutare? Ci sono delle parole nella brochure che mia nipote dice di mettere in famiglie. Mi aiuti?\"",
  ),
);

writeJson("quests/quest-04/scenes/08.json", {
  id: "chapter-01-quest-04-scene-08",
  scene_type: "task",
  screen_type: "matching",
  background: q4task,
  content: {
    title: "Famiglie di parole",
    instruction: "Per ogni parola, trova la parola della stessa famiglia nel testo della brochure.",
    referenceDocument: refDoc,
    task: {
      prompt:
        "Per ogni verbo, aggettivo o sostantivo, trova la parola della stessa famiglia che trovi nel testo. Scrivi la parola corretta.",
      leftItems: [
        { id: "l1", label: "visitare" },
        { id: "l2", label: "aprire" },
        { id: "l3", label: "profondo" },
        { id: "l4", label: "largo" },
        { id: "l5", label: "umido" },
        { id: "l6", label: "durante" },
        { id: "l7", label: "parzialità" },
        { id: "l8", label: "lungo" },
      ],
      rightItems: [
        { id: "r1", label: "la visita" },
        { id: "r2", label: "aperte" },
        { id: "r3", label: "la profondità" },
        { id: "r4", label: "la larghezza" },
        { id: "r5", label: "l'umidità" },
        { id: "r6", label: "la durata" },
        { id: "r7", label: "parziale" },
        { id: "r8", label: "la lunghezza" },
        { id: "r9", label: "cristalli" },
      ],
      correctPairs: [
        { leftItemId: "l1", rightItemId: "r1" },
        { leftItemId: "l2", rightItemId: "r2" },
        { leftItemId: "l3", rightItemId: "r3" },
        { leftItemId: "l4", rightItemId: "r4" },
        { leftItemId: "l5", rightItemId: "r5" },
        { leftItemId: "l6", rightItemId: "r6" },
        { leftItemId: "l7", rightItemId: "r7" },
        { leftItemId: "l8", rightItemId: "r8" },
      ],
      presentation: {
        leftLabel: "Parola di partenza",
        rightLabel: "Dal testo",
        shuffleRightOrder: true,
      },
    },
  },
  scoring: taskScoring("matching", { minRatioToComplete: 0.75 }),
});

writeJson(
  "quests/quest-04/scenes/09.json",
  story(
    "chapter-01",
    "quest-04",
    9,
    q4bg,
    "Tonio\n\"Bravissimo/a! Sai, mia nipote studia l'inglese a scuola e mi ha detto che molte parole italiane assomigliano a parole inglesi. Lei ha fatto una lista, ma ha mescolato tutto! Mi aiuti a rimettere le coppie in ordine?\"",
  ),
);

writeJson("quests/quest-04/scenes/10.json", {
  id: "chapter-01-quest-04-scene-10",
  scene_type: "task",
  screen_type: "matching",
  background: q4task,
  content: {
    title: "Parole inglesi e italiane",
    instruction: "Collega ogni parola inglese alla parola italiana corrispondente.",
    referenceDocument: refDoc,
    task: {
      prompt: "Collega ogni parola inglese alla parola italiana corrispondente.",
      leftItems: [
        { id: "en1", label: "cave" },
        { id: "en2", label: "route" },
        { id: "en3", label: "itinerary" },
        { id: "en4", label: "exterior" },
        { id: "en5", label: "column" },
        { id: "en6", label: "explorer" },
      ],
      rightItems: [
        { id: "it1", label: "la grotta" },
        { id: "it2", label: "il percorso" },
        { id: "it3", label: "l'itinerario" },
        { id: "it4", label: "l'esterno" },
        { id: "it5", label: "la colonna" },
        { id: "it6", label: "l'esploratore" },
        { id: "it7", label: "la stalattite" },
      ],
      correctPairs: [
        { leftItemId: "en1", rightItemId: "it1" },
        { leftItemId: "en2", rightItemId: "it2" },
        { leftItemId: "en3", rightItemId: "it3" },
        { leftItemId: "en4", rightItemId: "it4" },
        { leftItemId: "en5", rightItemId: "it5" },
        { leftItemId: "en6", rightItemId: "it6" },
      ],
      presentation: {
        leftLabel: "inglese",
        rightLabel: "italiano",
        shuffleRightOrder: true,
      },
    },
  },
  scoring: taskScoring("matching", { minRatioToComplete: 0.75 }),
});

writeJson(
  "quests/quest-04/scenes/11.json",
  story(
    "chapter-01",
    "quest-04",
    11,
    q4bg,
    "Tonio\n\"Perfetto! Vedi, le lingue si assomigliano più di quanto pensiamo. Ah, un'ultima cosa: nella brochure ci sono tanti numeri, ma mia nipote dice che non si capisce bene cosa significano. Mi aiuti a spiegarli?\"",
  ),
);

writeJson("quests/quest-04/scenes/12.json", {
  id: "chapter-01-quest-04-scene-12",
  scene_type: "task",
  screen_type: "drag_drop",
  background: q4task,
  content: {
    title: "Abbina i numeri",
    instruction: "Trascina ogni numero con la sua unità di misura accanto alla frase giusta.",
    referenceDocument: refDoc,
    task: {
      prompt: "Trascina ogni numero con la sua unità di misura accanto alla frase giusta.",
      presentation: { targetMode: "blocks" },
      shuffleItemOrder: true,
      items: [
        { id: "card-1km", label: "1 chilometro" },
        { id: "card-3km", label: "3 chilometri" },
        { id: "card-50min", label: "50 minuti" },
        { id: "card-2ore", label: "2 ore" },
        { id: "card-18c", label: "18 gradi" },
        { id: "card-90pct", label: "90 per cento" },
        { id: "card-100m", label: "100 metri" },
        { id: "card-50m-l", label: "50 metri (larghezza)" },
        { id: "card-60m", label: "60 metri" },
      ],
      targets: [
        {
          id: "t1",
          title: "è lungo l'itinerario parziale",
          correctItemIds: ["card-1km"],
        },
        {
          id: "t2",
          title: "è lungo l'itinerario completo",
          correctItemIds: ["card-3km"],
        },
        {
          id: "t3",
          title: "dura la visita (primo itinerario)",
          correctItemIds: ["card-50min"],
        },
        {
          id: "t4",
          title: "dura la visita (secondo itinerario)",
          correctItemIds: ["card-2ore"],
        },
        {
          id: "t5",
          title: "è la temperatura nella grotta",
          correctItemIds: ["card-18c"],
        },
        {
          id: "t6",
          title: "è l'umidità nella grotta",
          correctItemIds: ["card-90pct"],
        },
        {
          id: "t7",
          title: "è lunga la più grande caverna",
          correctItemIds: ["card-100m"],
        },
        {
          id: "t8",
          title: "è larga la più grande caverna",
          correctItemIds: ["card-50m-l"],
        },
        {
          id: "t9",
          title: "è profonda la più grande caverna",
          correctItemIds: ["card-60m"],
        },
      ],
    },
  },
  scoring: taskScoring("drag_drop", { minRatioToComplete: 0.67 }),
});

writeJson(
  "quests/quest-04/scenes/13.json",
  story(
    "chapter-01",
    "quest-04",
    13,
    q4bg,
    "Tonio\n\"Grandissimo/a! Mi hai aiutato tanto, grazie! Tieni, il caffè te lo offro io. E se torni in Puglia un giorno, passa a trovarmi al mio paese, eh!\"",
  ),
);
writeJson(
  "quests/quest-04/scenes/14.json",
  story(
    "chapter-01",
    "quest-04",
    14,
    q4bg,
    "Hai guadagnato una fetta di pizza!",
  ),
);
writeJson(
  "quests/quest-04/scenes/15.json",
  story(
    "chapter-01",
    "quest-04",
    15,
    q4bg,
    "Tu\nChe tipo simpatico, Tonio. Bologna mi piace già.",
  ),
);
writeJson(
  "quests/quest-04/scenes/16.json",
  story(
    "chapter-01",
    "quest-04",
    16,
    q4bg,
    "Esci dal bar sorridente. La tua prima giornata a Bologna volge al termine.",
  ),
);

// --- bonus ---
const bbg = quests[4].bgBonus;
writeJson(
  "quests/quest-01-bonus/scenes/01.json",
  story(
    "chapter-01",
    "quest-01-bonus",
    1,
    bbg,
    "Hai finito il tuo primo giorno a Bologna. Hai conosciuto la tua nuova classe, hai esplorato il centro e hai imparato tante cose nuove.",
  ),
);
writeJson(
  "quests/quest-01-bonus/scenes/02.json",
  story(
    "chapter-01",
    "quest-01-bonus",
    2,
    bbg,
    "Prima di chiudere il capitolo, mettiti alla prova: quante parole di questa lezione ricordi davvero?",
  ),
);
writeJson(
  "quests/quest-01-bonus/scenes/03.json",
  story(
    "chapter-01",
    "quest-01-bonus",
    3,
    bbg,
    "Risolvi questo compito bonus per guadagnare fette di pizza extra!",
  ),
);

const bonusPairs = [
  ["l'agriturismo", "farm holiday"],
  ["la gita culturale", "cultural trip"],
  ["gli scavi", "excavations"],
  ["il parco nazionale", "national park"],
  ["la natura", "nature"],
  ["la campagna", "countryside"],
  ["in campagna", "in the countryside"],
  ["il campeggio", "camping"],
  ["la tenda", "tent"],
  ["il monte", "mountain"],
  ["la cima", "summit"],
  ["in cima", "at the top"],
  ["la montagna", "mountain range"],
  ["il mare", "sea"],
  ["la spiaggia", "beach"],
  ["in campeggio", "at the campsite"],
  ["in piscina", "at the pool"],
  ["in spiaggia", "at the beach"],
  ["il fiume", "river"],
  ["il lago", "lake"],
  ["l'ostello", "youth hostel"],
  ["la cartina", "map"],
  ["andare in bici", "to go by bike"],
  ["andare in barca", "to go by boat"],
  ["andare in macchina", "to go by car"],
  ["andare in treno", "to go by train"],
  ["andare a cavallo", "to go horseback riding"],
  ["l'esperienza", "experience"],
  ["la visita", "visit"],
  ["la visita guidata", "guided tour"],
  ["visitare", "to visit"],
  ["godere", "to enjoy"],
  ["godersi", "to enjoy oneself"],
  ["il kite surf", "kitesurfing"],
  ["il trekking", "trekking"],
  ["la canoa", "canoe"],
  ["la barca", "boat"],
  ["andare in canoa", "to go canoeing"],
  ["di nuovo", "again"],
  ["di segreto", "secretly"],
  ["di preciso", "exactly"],
  ["comunicare", "to communicate"],
  ["la telefonata", "phone call"],
  ["la piattaforma", "platform"],
  ["internet", "internet"],
  ["in internet", "on the internet"],
  ["l'accesso", "access"],
  ["allegare", "to attach"],
  ["aggiungere", "to add"],
  ["inviare", "to send"],
  ["il saluto", "greeting"],
  ["i miei migliori saluti", "best regards"],
  ["la formula", "greeting formula"],
  ["giovane", "young"],
  ["anziano", "elderly"],
  ["anziana", "old"],
  ["buono", "good"],
  ["buona", "kind"],
  ["cattivo", "bad"],
  ["cattiva", "mean"],
  ["meraviglioso", "wonderful"],
  ["meravigliosa", "marvelous"],
  ["fantastico", "fantastic"],
  ["fantastica", "fantastic"],
  ["simpatico", "likeable"],
  ["simpatica", "nice"],
  ["dolce", "sweet"],
  ["fortunato", "lucky"],
  ["fortunata", "fortunate"],
  ["straniero", "foreign"],
  ["straniera", "foreigner"],
];

writeJson("quests/quest-01-bonus/scenes/04.json", {
  id: "chapter-01-quest-01-bonus-scene-04",
  scene_type: "task",
  screen_type: "matching",
  background: "chapters/01/quests/bonus/bg-task",
  content: {
    title: "Sfida bonus",
    instruction: "Abbina ogni parola italiana al suo equivalente inglese.",
    referenceDocument: null,
    task: {
      prompt: "Collega ogni parola italiana al suo equivalente inglese.",
      sampleSize: 10,
      poolPairs: bonusPairs.map(([leftLabel, rightLabel], i) => ({
        id: `bv${String(i + 1).padStart(2, "0")}`,
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
  scoring: taskScoring("matching", { minRatioToComplete: 0.6 }),
});

console.log("Generated chapter-01 catalog under", ROOT);
