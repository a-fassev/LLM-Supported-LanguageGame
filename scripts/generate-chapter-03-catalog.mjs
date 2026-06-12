/**
 * Regenerates lib/content/chapters/chapter-03 (Lezione 3) from this file.
 *
 * Run: node scripts/generate-chapter-03-catalog.mjs
 *
 * WARNING: Deletes the entire chapter-03 tree first. Do not hand-edit scene JSON;
 * change this script and re-run. Art keys live under public/content-assets/chapters/03/.
 */
import fs from "node:fs";
import path from "node:path";
import { taskScoring } from "./lib/scoring-defaults.mjs";

const ROOT = path.join(process.cwd(), "lib/content/chapters/chapter-03");
const CHAPTER_ID = "chapter-03";

if (fs.existsSync(ROOT)) {
  fs.rmSync(ROOT, { recursive: true, force: true });
}

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

function tu(text) {
  return `Tu\n${text}`;
}

function npc(name, dialogue) {
  return `${name}\n${dialogue}`;
}

function mcQuestion(id, prompt, optionLabels, correctIndex) {
  const letters = ["a", "b", "c", "d"];
  const correctLetter = letters[correctIndex];
  return {
    id,
    selectionMode: "single",
    preserveOptionOrder: true,
    prompt,
    options: optionLabels.map((label, i) => ({
      id: `${id}-opt-${letters[i]}`,
      label,
    })),
    correctOptionIds: [`${id}-opt-${correctLetter}`],
  };
}

const VOLANTINO_BODY = `Bologna è una delle città più antiche d'Italia. Le sue origini risalgono al VI secolo a.C., quando gli Etruschi fondarono qui una città importante e la chiamarono Felsina. Più tardi, nel IV secolo a.C., arrivarono i Galli Boi. Nel 189 a.C. i Romani fondarono la colonia di Bononia, da cui deriva il nome moderno „Bologna".

Nel 1088 a Bologna nasce l'Università più antica del mondo occidentale: l'Alma Mater Studiorum. Da quasi mille anni studenti da tutta Europa vengono qui per imparare. Per questo motivo Bologna è chiamata „la Dotta".

Tra il 1109 e il 1119 due famiglie nobili — gli Asinelli e i Garisendi — fanno costruire due torri nel centro della città. La Torre degli Asinelli è alta 97,2 metri. La Torre della Garisenda è più bassa (47 metri), ma molto più pendente: anche Dante Alighieri ne parla nella „Divina Commedia".

Un altro simbolo di Bologna sono i portici: in totale 62 chilometri in città. Il portico più lungo è quello di San Luca, con 3.796 metri e ben 666 archi. Dal 28 luglio 2021 i portici sono patrimonio dell'umanità dell'UNESCO.

Bologna ha anche un terzo soprannome: „la Grassa", per la sua famosa tradizione gastronomica. I piatti tipici sono i tortellini, le tagliatelle al ragù e la mortadella.`;

const LORENZO_STORY_BODY = `„In Piemonte si mangia bene. E a Torino (e in tutto il Piemonte) si ama il buon cioccolato. Infatti Torino è la città italiana del cioccolato e ogni anno qui da noi si celebra il festival del cioccolato: il CioccolaTò. I cioccolatini più famosi sono i Gianduiotti — fatti con cacao buono, zucchero e nocciole piemontesi. Per colazione si può mangiare un altro prodotto famoso che si produce ad Alba, una città vicino a Torino: la Nutella. Il primo barattolo di Nutella esce dalla fabbrica nell'aprile del 1964.

A Torino si fanno anche i buoni grissini — un pane croccante fatto a forma di bastoncino. Spesso i grissini si mangiano avvolti in una fetta di prosciutto, ma se qualcuno li preferisce senza, non c'è problema.

A Torino si gioca anche a calcio. Ecco la maglietta della famosa squadra a Torino: la Juventus, oppure la Juve. La squadra non ha solo uno stadio bellissimo e un buon allenatore, ma anche un soprannome interessante: i torinesi la chiamano „Vecchia Signora".

A Torino si possono vedere le Alpi e la Mole Antonelliana — il simbolo di Torino. All'interno della Mole si può visitare il Museo Nazionale del Cinema. Lì ci si può informare sulla storia del cinema, guardare qualche film e passare alcune ore interessanti.

A Torino non si devono perdere i musei! Un consiglio: se si prenota, non si deve fare la fila! Tanti dicono che il Museo Egizio sia qualcosa di spettacolare. Con 30.000 pezzi è il museo egizio più importante dopo quello del Cairo. Lì si possono ammirare opere d'arte dell'antico Egitto.

A Torino si producono automobili. Nel corso degli anni la FIAT — fondata nel 1899 — ha prodotto tanti modelli famosi come la FIAT 500. Fino agli anni '80 la FIAT produceva le sue macchine nel Lingotto. Sul tetto del Lingotto si trova la vecchia pista di collaudo della FIAT. Oggi il Lingotto è un centro polifunzionale con alcuni negozi, bar, ristoranti, cinema ed un centro congressi."`;

const RIVISTA_BODY = `Made in Italy — I prodotti delle nostre città

Conoscete il vero Made in Italy? Attenzione: alcuni „classici italiani" che troverete all'estero non sono italiani per niente!

Torino (Piemonte)

• Il gianduiotto: il cioccolatino più famoso d'Italia, fatto con cacao, zucchero e nocciole piemontesi.

• La FIAT 500: la macchina simbolo dell'Italia, prodotta dalla FIAT (fondata a Torino nel 1899).

• Il „Pinguino": il primo gelato al mondo su stecco ricoperto di cioccolato, inventato nel 1939.

Bologna (Emilia-Romagna)

• I tortellini: piccola pasta ripiena, simbolo della cucina bolognese.

• Il ragù alla bolognese: la vera salsa di carne per le tagliatelle (mai con gli spaghetti!).

• La mortadella: il salume rosa più famoso d'Italia.

Alba (Piemonte)

• La Nutella: la crema al cioccolato e nocciole, prodotta dalla Ferrero dal 1964.

Napoli (Campania)

• La pizza Margherita: la vera pizza napoletana, con pomodoro, mozzarella di bufala e basilico.

Parma (Emilia-Romagna)

• Il parmigiano reggiano: il „re dei formaggi".

• Il prosciutto di Parma: stagionato per almeno 12 mesi.

⚠ Attenzione! NON sono italiani:

• Spaghetti Bolognese: non esistono in Italia! In Emilia-Romagna il ragù si serve con le tagliatelle.

• Caesar Salad: nasce in Messico negli anni '20.

• Hawaiian Pizza (con ananas): inventata in Canada nel 1962.`;

const bonusPoolPairs = [
  ["il/la residente", "resident / inhabitant"],
  ["il/la pizzaiolo/a", "pizza maker"],
  ["il paese industrializzato", "industrialized country"],
  ["il sud", "the South"],
  ["il nord", "the North"],
  ["settentrionale", "northern"],
  ["meridionale", "southern"],
  ["la veduta", "view / sight"],
  ["la conversazione", "conversation"],
  ["la volontà di (conoscere gente nuova)", "the will to (meet new people)"],
  ["l'imbarazzo della scelta", "spoilt for choice"],
  ["ho l'impressione", "I have the impression"],
  ["la paura (della verifica)", "fear (of the test)"],
  ["la speranza (in voti buoni)", "hope (for good grades)"],
  ["il sentimento", "feeling / sentiment"],
  ["(un') esperienza indimenticabile", "(an) unforgettable experience"],
  ["il/la chiacchierone/a", "chatterbox"],
  ["l'accordo", "agreement"],
  ["per quanto riguarda", "as far as ... is concerned"],
  ["l'appuntamento", "appointment / date"],
  ["la pace; lasciare in pace", "peace; to leave in peace"],
  ["il permesso", "permission"],
  ["il volume", "volume"],
  ["inoltre", "moreover / besides"],
  ["ribelle", "rebellious"],
  ["tranne (che)", "except (for)"],
  ["la guerra", "war"],
  ["chiarire", "to clarify"],
  ["il/la corrispondente", "correspondent / pen friend"],
  ["minimo, -a", "minimum / least"],
  ["interrompere, interrotto", "to interrupt"],
  ["Ti va di ...", "Do you feel like ...?"],
  ["l'impressione f.", "impression"],
  ["caotico, -a", "chaotic"],
  ["il lato", "side"],
  ["la bellezza", "beauty"],
  ["augurarsi", "to wish (for oneself)"],
  ["attraverso prep.", "through / by means of"],
  ["la melodia", "melody"],
  ["un sacco di", "a lot of"],
  ["l'odore m.", "smell / odor"],
  ["l'opinione f.", "opinion"],
  ["prendere sul serio", "to take seriously"],
  ["rispetto a", "compared to"],
  ["andare d'accordo (con qn)", "to get along (with someone)"],
  ["il disordine", "disorder / mess"],
  ["classico, -a", "classical"],
  ["il simbolo", "symbol"],
  ["la manifestazione", "event / demonstration"],
  ["spettacolare", "spectacular"],
  ["aver luogo", "to take place"],
  ["all'aperto", "in the open / outdoors"],
  ["la maschera", "mask"],
  ["indossare", "to wear"],
  ["il cappuccio", "hood"],
  ["il viso", "face"],
  ["il corno", "horn"],
  ["il portafortuna", "lucky charm"],
  ["rappresentare", "to represent"],
  ["la nascita", "birth"],
  ["la tradizione", "tradition"],
  ["il patrono", "patron saint"],
  ["proteggere, protetto", "to protect"],
  ["sciogliersi, sciolto", "to melt / to dissolve"],
  ["il sangue", "blood"],
  ["la sfortuna", "bad luck / misfortune"],
  ["la memoria", "memory"],
  ["contribuire", "to contribute"],
  ["la diffusione", "spreading / diffusion"],
  ["nascondere, nascosto", "to hide"],
  ["la pubblicità", "advertising / publicity"],
  ["innamorato, -a (di)", "in love (with)"],
  ["spedire", "to send"],
  ["la relazione", "relationship / essay"],
  ["il tavolo", "table"],
  ["In quanti siete? – Siamo in quattro.", "How many are you? – We are four."],
  ["buffo, -a", "funny"],
  ["Caspita!", "Wow! / My goodness!"],
  ["delizioso, -a", "delicious"],
  ["goloso, -a; golosone", "greedy (about sweets); greedy (augmentative)"],
  ["il genere", "type / kind / gender"],
  ["tradizionale", "traditional"],
  ["matto, -a (per)", "crazy (about)"],
  ["il cioccolatino", "chocolate (small piece)"],
  ["ripieno, -a", "filled / stuffed"],
  ["mostrare", "to show"],
  ["prendere freddo", "to catch a cold"],
  ["la febbre", "fever"],
  ["il più possibile", "as much as possible"],
  ["il cacao", "cocoa"],
  ["la nocciola", "hazelnut"],
  ["il barattolo", "jar"],
  ["croccante", "crunchy / crispy"],
  ["gustare", "to taste / to enjoy"],
  ["il sale", "salt"],
  ["salato, -a", "salty"],
  ["dolce", "sweet"],
  ["il bastoncino", "stick (small)"],
  ["la fetta", "slice"],
  ["celebrare", "to celebrate"],
  ["la fabbrica", "factory"],
  ["il soprannome", "nickname"],
  ["le Alpi", "the Alps"],
  ["all'interno di ...", "inside of ..."],
  ["la fila; fare la fila", "queue; to queue"],
  ["ammirare", "to admire"],
  ["il pezzo", "piece"],
  ["l'opera", "work (of art) / opera"],
  ["il tetto", "roof"],
  ["storico, -a", "historic / historical"],
  ["numeroso, -a", "numerous"],
  ["automatico, -a", "automatic"],
  ["l'occasione f.", "occasion / opportunity"],
  ["invernale", "winter (adj.) / wintry"],
  ["impiegare", "to take (time) / to employ"],
  ["dare un'occhiata a", "to take a look at"],
  ["il/la proprietario/a", "owner"],
  ["la graduatoria", "ranking"],
  ["confrontare", "to compare"],
  ["ciascuno, -a pron./agg.", "each / every"],
  ["arricchire, -sc-", "to enrich"],
];

// --- chapter + quests ---
writeJson("chapter.json", {
  id: CHAPTER_ID,
  title: "Tra storia e cioccolato",
  order: 3,
  locked: false,
  quests: ["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"],
  background: "chapters/03/chapter/bg-missions",
});

const quests = [
  {
    id: "quest-01",
    title: "La mattina a casa",
    order: 1,
    kind: "main",
    requiresQuestId: null,
    background: "chapters/03/quests/01/bg-overview",
    bgRoom: "chapters/03/quests/01/bg-room-morning",
  },
  {
    id: "quest-02",
    title: "Il Museo della Storia",
    order: 2,
    kind: "main",
    requiresQuestId: "quest-01",
    background: "chapters/03/quests/02/bg-overview",
    bgMuseum: "chapters/03/quests/02/bg-museum-hall",
  },
  {
    id: "quest-03",
    title: "La guida al museo",
    order: 3,
    kind: "main",
    requiresQuestId: "quest-02",
    background: "chapters/03/quests/03/bg-overview",
    bgSide: "chapters/03/quests/03/bg-museum-side",
  },
  {
    id: "quest-04",
    title: "La Cioccoshow",
    order: 4,
    kind: "main",
    requiresQuestId: "quest-03",
    background: "chapters/03/quests/04/bg-overview",
    bgPiazza: "chapters/03/quests/04/bg-piazza-cioccoshow",
  },
  {
    id: "quest-01-bonus",
    title: "Extra: parole della lezione 3",
    order: 5,
    kind: "bonus",
    requiresQuestId: "quest-04",
    background: "chapters/03/quests/bonus/bg-overview",
    bgBonus: "chapters/03/quests/bonus/bg-neutral",
    bgTask: "chapters/03/quests/bonus/bg-task",
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
    "Una nuova giornata a Bologna. Ti svegli, la luce entra calda dalla finestra. Sulla scrivania ci sono i tuoi libri di scuola per la prossima lezione e accanto, il tuo zaino — già un bel po' pieno di colore.",
  ),
);
writeJson(
  "quests/quest-01/scenes/02.json",
  story(
    CHAPTER_ID,
    "quest-01",
    2,
    q1bg,
    tu(
      "Oggi non ho compiti. Ma la signora Ferrari ieri sera mi ha parlato di un museo che devo assolutamente vedere se voglio capire davvero Bologna: il Museo della Storia di Bologna. Una buona occasione per imparare un po' di storia.",
    ),
  ),
);
writeJson(
  "quests/quest-01/scenes/03.json",
  story(
    CHAPTER_ID,
    "quest-01",
    3,
    q1bg,
    "Prendi lo zaino e esci di casa. Attraversi i portici verso il centro: il Museo della Storia di Bologna ti aspetta — è il momento di scoprire duemila anni di storia.",
  ),
);

// --- quest-02 (6 story + 1 MC) ---
const q2bg = quests[1].bgMuseum;

writeJson(
  "quests/quest-02/scenes/01.json",
  story(
    CHAPTER_ID,
    "quest-02",
    1,
    q2bg,
    "Entri nel Museo della Storia di Bologna. La sala è tranquilla, nelle vetrine ci sono mappe antiche, monete e cocci di terracotta. Alle pareti, immagini di torri medievali e una grande mappa del centro storico.",
  ),
);
writeJson(
  "quests/quest-02/scenes/02.json",
  story(
    CHAPTER_ID,
    "quest-02",
    2,
    q2bg,
    tu("Vediamo cosa si può scoprire qui. All'ingresso ho visto dei volantini con le informazioni principali — eccoli."),
  ),
);
writeJson(
  "quests/quest-02/scenes/03.json",
  story(
    CHAPTER_ID,
    "quest-02",
    3,
    q2bg,
    `Prendi un volantino dallo stand all'ingresso. Sulla copertina c'è scritto: „Bologna — duemila anni di storia".`,
  ),
);
writeJson(
  "quests/quest-02/scenes/04.json",
  story(
    CHAPTER_ID,
    "quest-02",
    4,
    q2bg,
    tu("Interessante. Vediamo quanto mi ricordo di tutto questo — alla fine della mostra c'è un piccolo quiz per i visitatori."),
  ),
);

writeJson("quests/quest-02/scenes/05.json", {
  id: `${CHAPTER_ID}-quest-02-scene-05`,
  scene_type: "task",
  screen_type: "multiple_choice",
  background: q2bg,
  content: {
    title: "Quiz: Bologna, duemila anni di storia",
    instruction:
      "Leggi attentamente il volantino. Poi rispondi alle domande. Usa il documento se ti serve.",
    referenceDocument: {
      title: "Bologna — duemila anni di storia",
      body: VOLANTINO_BODY,
    },
    task: {
      prompt:
        "Leggi attentamente il volantino. Poi rispondi alle domande sulla storia di Bologna. Per ogni domanda, scegli la risposta giusta.",
      questions: [
        mcQuestion(
          "museum-q1",
          "Chi ha fondato la città che oggi si chiama Bologna?",
          [
            "I Romani, nel 189 a.C.",
            "Gli Etruschi, nel VI secolo a.C.",
            "I Galli Boi, nel IV secolo a.C.",
          ],
          1,
        ),
        mcQuestion(
          "museum-q2",
          "Come si chiamava Bologna ai tempi degli Etruschi?",
          ["Bononia", "Felsina", "Alma Mater"],
          1,
        ),
        mcQuestion(
          "museum-q3",
          "In che anno è stata fondata l'Università di Bologna?",
          ["Nel 189 a.C.", "Nel 1088", "Nel 1119"],
          1,
        ),
        mcQuestion(
          "museum-q4",
          "Qual è il soprannome di Bologna che si riferisce all'università?",
          ["La Grassa", "La Rossa", "La Dotta"],
          2,
        ),
        mcQuestion(
          "museum-q5",
          "Quanto è alta la Torre degli Asinelli?",
          ["47 metri", "97,2 metri", "666 metri"],
          1,
        ),
        mcQuestion(
          "museum-q6",
          "Da quando i portici di Bologna sono patrimonio dell'umanità dell'UNESCO?",
          ["Dal 1088", "Dal 1964", "Dal 2021"],
          2,
        ),
      ],
    },
  },
  scoring: taskScoring("multiple_choice", { minRatioToComplete: 0.67 }),
});

writeJson(
  "quests/quest-02/scenes/06.json",
  story(
    CHAPTER_ID,
    "quest-02",
    6,
    q2bg,
    tu(
      "Fatto. Bologna è davvero una città speciale — l'università più antica d'Europa, le torri, i portici... Vediamo cos'altro c'è da scoprire.",
    ),
  ),
);
writeJson(
  "quests/quest-02/scenes/07.json",
  story(
    CHAPTER_ID,
    "quest-02",
    7,
    q2bg,
    "Continui a camminare per la sala. In un angolo c'è un piccolo gruppo di visitatori intorno a una donna con un cartellino. Parla con energia e gesticola. Diventi curioso/a e ti avvicini.",
  ),
);

// --- quest-03 (14 story + 3 tasks) ---
const q3bg = quests[2].bgSide;

writeJson(
  "quests/quest-03/scenes/01.json",
  story(
    CHAPTER_ID,
    "quest-03",
    1,
    q3bg,
    `Nella saletta laterale c'è una giovane donna con un cartellino arancione: „Valentina — Guida turistica". Davanti a lei una piccola vetrina con manifesti colorati: figure di cioccolato, bancarelle in una piazza, bambini sorridenti con il viso pieno di cacao.`,
  ),
);
writeJson(
  "quests/quest-03/scenes/02.json",
  story(
    CHAPTER_ID,
    "quest-03",
    2,
    q3bg,
    npc(
      "Valentina",
      `„...e per questo penso che chi è a Bologna in questa settimana debba assolutamente andare alla Cioccoshow. Non è solo una fiera — è una festa per tutta la città!"`,
    ),
  ),
);
writeJson(
  "quests/quest-03/scenes/03.json",
  story(CHAPTER_ID, "quest-03", 3, q3bg, tu("Cioccoshow? Non ne ho mai sentito parlare. Ascolto un po' meglio.")),
);
writeJson(
  "quests/quest-03/scenes/04.json",
  story(
    CHAPTER_ID,
    "quest-03",
    4,
    q3bg,
    npc(
      "Valentina",
      `„Ah, benvenuto/a! Vieni più vicino, sto spiegando ai nostri visitatori la Cioccoshow. È la più importante fiera del cioccolato in Italia, e si tiene ogni anno in piazza Maggiore. Spero proprio che tu non te la perda!"`,
    ),
  ),
);
writeJson(
  "quests/quest-03/scenes/05.json",
  story(
    CHAPTER_ID,
    "quest-03",
    5,
    q3bg,
    tu('„Raccontami di più! Cosa succede esattamente?"'),
  ),
);
writeJson(
  "quests/quest-03/scenes/06.json",
  story(
    CHAPTER_ID,
    "quest-03",
    6,
    q3bg,
    npc(
      "Valentina",
      `„In piazza troverai decine di bancarelle dove i maestri cioccolatieri di tutta Italia presentano le loro creazioni. Credo che tu assaggi del cioccolato come non l'hai mai mangiato. E penso che molti visitatori vengano da altre città — incontrerai gente di Milano, Torino, Firenze."`,
    ),
  ),
);
writeJson(
  "quests/quest-03/scenes/07.json",
  story(
    CHAPTER_ID,
    "quest-03",
    7,
    q3bg,
    tu(
      `Questa donna parla in modo strano — sempre con „credo che", „spero che", „penso che"... Ah, giusto: dopo queste espressioni si usa il congiuntivo. Devo esercitarmi anch'io.`,
    ),
  ),
);
writeJson(
  "quests/quest-03/scenes/08.json",
  story(
    CHAPTER_ID,
    "quest-03",
    8,
    q3bg,
    npc(
      "Valentina",
      `„Senti, prima di lasciarti andare alla Cioccoshow, facciamo un piccolo esercizio insieme. Ho qui un dialogo tra alcuni amici miei. Mi aiuti a completarlo?"`,
    ),
  ),
);

writeJson("quests/quest-03/scenes/09.json", {
  id: `${CHAPTER_ID}-quest-03-scene-09`,
  scene_type: "task",
  screen_type: "cloze",
  background: q3bg,
  content: {
    title: "Due chiacchiere",
    instruction:
      "Completa il dialogo con le forme del congiuntivo presente o passato dei verbi tra parentesi.",
    referenceDocument: null,
    task: {
      prompt:
        "Completa il dialogo con le forme del congiuntivo presente o passato dei verbi tra parentesi.",
      caseSensitive: false,
      lines: [
        {
          segments: [
            { kind: "text", text: "Elisa:        Mi dispiace che Franca non " },
            gap(["sia venuta", "Sia venuta"]),
            { kind: "text", text: " (venire) con noi ieri.\n\nTiziana:    Non sta bene. Penso che " },
            gap(["abbia preso", "Abbia preso"]),
            { kind: "text", text: " (prendere) freddo e ora " },
            gap(["abbia", "Abbia"]),
            { kind: "text", text: " (avere) la febbre.\n\nCarlo:        Poverina! Credi che non " },
            gap(["venga", "Venga"]),
            { kind: "text", text: " (venire) neanche alla festa di Cinzia stasera?\n\nTiziana:    È probabile che non ci " },
            gap(["riesca", "Riesca"]),
            { kind: "text", text: " (riuscire). A proposito di festa. Ho l'impressione che tu, Carlo, " },
            gap(["ti sia divertito", "Ti sia divertito"]),
            { kind: "text", text: " (divertirsi) molto ieri sera.\n\nElisa:        Ah ah, non credo che lui " },
            gap(["abbia ballato", "Abbia ballato"]),
            { kind: "text", text: " (lui, ballare) mai così tanto ad una festa!\n\nEnzo:        Allora non penso che il nostro caro Carlo " },
            gap(["manci", "Manci"]),
            { kind: "text", text: " (mancare) alla festa di Cinzia.\n\nTiziana:    Sì, anch'io credo che tu non " },
            gap(["voglia", "Voglia"]),
            { kind: "text", text: " (volere) perdere questa ottima occasione stasera." },
          ],
        },
      ],
    },
  },
  scoring: taskScoring("cloze", { minRatioToComplete: 0.78 }),
});

writeJson(
  "quests/quest-03/scenes/10.json",
  story(
    CHAPTER_ID,
    "quest-03",
    10,
    q3bg,
    npc(
      "Valentina",
      `„Caspita! Parli davvero bene l'italiano. Vieni, lascia che ti mostri ancora una cosa — qualcosa che mi piace particolarmente della nostra lingua."`,
    ),
  ),
);
writeJson(
  "quests/quest-03/scenes/11.json",
  story(
    CHAPTER_ID,
    "quest-03",
    11,
    q3bg,
    "Valentina va verso una lavagna alla parete. Sopra ci sono parole diverse con piccole frecce e desinenze differenti.",
  ),
);
writeJson(
  "quests/quest-03/scenes/12.json",
  story(
    CHAPTER_ID,
    "quest-03",
    12,
    q3bg,
    npc(
      "Valentina",
      `„Guarda: in italiano possiamo cambiare tutto il significato di una parola con poche sillabe alla fine. Da casa diventa casetta — una piccola casa accogliente. Da libro diventa librone — un enorme volume. E da ragazzo... beh, a volte un ragazzaccio, un birichino!"`,
    ),
  ),
);
writeJson(
  "quests/quest-03/scenes/13.json",
  story(
    CHAPTER_ID,
    "quest-03",
    13,
    q3bg,
    tu(
      "Giusto — sono gli accrescitivi e i diminutivi. Con -ino, -etto, -ello si rende qualcosa più piccolo o più carino, con -one si rende più grande. Guardiamo meglio.",
    ),
  ),
);

const matchingPairs = [
  ["pizza", "pizzetta (piccola)"],
  ["cioccolato", "cioccolatino (piccolo)"],
  ["palazzo", "palazzone (grande)"],
  ["goloso", "golosone (molto goloso)"],
  ["libro", "librone (grande)"],
  ["casa", "casetta (piccola e carina)"],
  ["ragazzo", "ragazzaccio (cattivo / birichino)"],
  ["tavolo", "tavolino (piccolo)"],
];

writeJson("quests/quest-03/scenes/14.json", {
  id: `${CHAPTER_ID}-quest-03-scene-14`,
  scene_type: "task",
  screen_type: "matching",
  background: q3bg,
  content: {
    title: "Accrescitivi e diminutivi — Teil A",
    instruction: "Collega ogni parola di partenza alla sua forma derivata.",
    referenceDocument: null,
    task: {
      prompt:
        "Collega ogni parola di partenza alla sua forma derivata (accrescitivo o diminutivo). Attenzione al significato!",
      leftItems: matchingPairs.map(([left], i) => ({
        id: `left-${i + 1}`,
        label: left,
      })),
      rightItems: matchingPairs.map(([, right], i) => ({
        id: `right-${i + 1}`,
        label: right,
      })),
      correctPairs: matchingPairs.map((_, i) => ({
        leftItemId: `left-${i + 1}`,
        rightItemId: `right-${i + 1}`,
      })),
      presentation: {
        leftLabel: "Parola di partenza",
        rightLabel: "Forma derivata",
        shuffleRightOrder: true,
      },
    },
  },
  scoring: taskScoring("matching", { minRatioToComplete: 0.75 }),
});

writeJson("quests/quest-03/scenes/15.json", {
  id: `${CHAPTER_ID}-quest-03-scene-15`,
  scene_type: "task",
  screen_type: "cloze",
  background: q3bg,
  content: {
    title: "Accrescitivi e diminutivi — Teil B",
    instruction:
      "Completa le frasi di Valentina sulla Cioccoshow. Forma dalla parola tra parentesi la forma giusta con -ino, -etto, -ello o -one.",
    referenceDocument: null,
    task: {
      prompt:
        "Completa le frasi di Valentina sulla Cioccoshow. Forma dalla parola tra parentesi la forma giusta con -ino, -etto, -ello o -one.",
      caseSensitive: false,
      lines: [
        {
          segments: [
            { kind: "text", text: "1. Sulla piazza c'è un (tavolo) " },
            gap(["tavolone", "Tavolone"]),
            { kind: "text", text: " enorme con tutti i tipi di cioccolato.\n\n2. Ti consiglio di assaggiare un (pezzo) " },
            gap(["pezzetto", "Pezzetto"]),
            { kind: "text", text: " piccolo di cioccolato fondente prima di scegliere.\n\n3. Vedrai, dopo un'ora alla Cioccoshow tutti diventiamo dei (goloso) " },
            gap(["golosoni", "Golosoni"]),
            { kind: "text", text: "!\n\n4. Per i bambini c'è una zona speciale con tante (casa) " },
            gap(["casette", "Casette"]),
            { kind: "text", text: " di cioccolato.\n\n5. Lo stand della Nutella è in un (palazzo) " },
            gap(["palazzone", "Palazzone"]),
            { kind: "text", text: " di vetro al centro della piazza.\n\n6. Compra un (libro) " },
            gap(["libretto", "Libretto", "librone", "Librone"]),
            { kind: "text", text: " con tutte le ricette al cioccolato — è un bel souvenir!" },
          ],
        },
      ],
    },
  },
  scoring: taskScoring("cloze", { minRatioToComplete: 0.83 }),
});

writeJson(
  "quests/quest-03/scenes/16.json",
  story(
    CHAPTER_ID,
    "quest-03",
    16,
    q3bg,
    npc(
      "Valentina",
      `„Perfetto! Hai capito tutto. Ah, adesso devo tornare dal mio gruppo — andiamo alla prossima sala. Ma senti: se questo pomeriggio non hai impegni, vai davvero alla Cioccoshow. Oggi è il primo giorno, piazza Maggiore sarà piena di gente. Non te ne pentirai!"`,
    ),
  ),
);
writeJson(
  "quests/quest-03/scenes/17.json",
  story(
    CHAPTER_ID,
    "quest-03",
    17,
    q3bg,
    tu(
      "La Cioccoshow in piazza Maggiore... mi sembra proprio quello che mi serve oggi. Cioccolato e gente da tutta Italia — perché no?",
    ),
  ),
);

// --- quest-04 (15 story + 3 tasks) ---
const q4bg = quests[3].bgPiazza;

writeJson(
  "quests/quest-04/scenes/01.json",
  story(
    CHAPTER_ID,
    "quest-04",
    1,
    q4bg,
    "Arrivi in piazza Maggiore. Già da lontano vedi ombrelloni colorati, senti vociare e senti l'odore di cioccolato — cioccolato ovunque. Famiglie si fanno strada tra le bancarelle, bambini assaggiano con le dita appiccicose, i cioccolatieri chiamano i passanti con le loro specialità.",
  ),
);
writeJson(
  "quests/quest-04/scenes/02.json",
  story(CHAPTER_ID, "quest-04", 2, q4bg, tu("Mamma mia, Valentina aveva ragione. Qui c'è proprio movimento.")),
);
writeJson(
  "quests/quest-04/scenes/03.json",
  story(
    CHAPTER_ID,
    "quest-04",
    3,
    q4bg,
    "A una bancarella con cioccolato fondente c'è un uomo sui trentacinque anni, sciarpa azzurra, giacca di pelle. Assaggia un pezzo di cioccolato, chiude gli occhi e annuisce con soddisfazione. Poi ti vede.",
  ),
);
writeJson(
  "quests/quest-04/scenes/04.json",
  story(
    CHAPTER_ID,
    "quest-04",
    4,
    q4bg,
    npc(
      "Lorenzo Conti",
      `„Ehi, ciao! L'hai già provato questo? È il gianduiotto, l'originale di Torino. Se devi mangiare un solo pezzo di cioccolato nella tua vita, mangia questo. Dai, te ne offro uno!"`,
    ),
  ),
);
writeJson(
  "quests/quest-04/scenes/05.json",
  story(CHAPTER_ID, "quest-04", 5, q4bg, tu('„Grazie! Sembri uno che se ne intende."')),
);
writeJson(
  "quests/quest-04/scenes/06.json",
  story(
    CHAPTER_ID,
    "quest-04",
    6,
    q4bg,
    npc(
      "Lorenzo Conti",
      `„Io? Sono Lorenzo, vengo da Torino. E a Torino... beh, diciamo che il cioccolato l'abbiamo praticamente inventato noi. Ma non solo quello — abbiamo fatto tante cose che oggi sono famose in tutto il mondo. Hai tempo? Te ne racconto un po'."`,
    ),
  ),
);
writeJson(
  "quests/quest-04/scenes/07.json",
  story(
    CHAPTER_ID,
    "quest-04",
    7,
    q4bg,
    tu("Un torinese che si vanta di Torino — interessante. Sentiamo cos'ha da dire."),
  ),
);

writeJson("quests/quest-04/scenes/08.json", {
  id: `${CHAPTER_ID}-quest-04-scene-08`,
  scene_type: "task",
  screen_type: "multiple_choice",
  background: q4bg,
  content: {
    title: "La storia di Lorenzo: Torino, la mia città",
    instruction:
      "Leggi attentamente la storia di Lorenzo. Poi rispondi alle domande. Usa il documento se ti serve.",
    referenceDocument: {
      title: "Lorenzo Conti racconta",
      body: LORENZO_STORY_BODY,
    },
    task: {
      prompt:
        "Lorenzo ti racconta della sua città Torino e di cosa l'Italia ha regalato al mondo. Leggi attentamente. Poi rispondi alle domande.",
      questions: [
        mcQuestion(
          "lorenzo-q1",
          "Per fare i gianduiotti si ha bisogno di…",
          [
            "cacao, zucchero e nocciole piemontesi",
            "cioccolato bianco, latte e fragole",
            "caffè, zucchero e mandorle",
          ],
          0,
        ),
        mcQuestion(
          "lorenzo-q2",
          "La Nutella nasce…",
          ["a Torino nel 1899", "ad Alba nel 1964", "a Milano negli anni '80"],
          1,
        ),
        mcQuestion(
          "lorenzo-q3",
          "Come si chiama la famosa squadra di calcio di Torino?",
          [
            'il Torino o „Vecchia Signora"',
            'la Juventus o „Juve", soprannominata „Vecchia Signora"',
            "il Lingotto",
          ],
          1,
        ),
        mcQuestion(
          "lorenzo-q4",
          "Cosa si può fare all'interno della Mole Antonelliana?",
          [
            "si possono comprare gianduiotti",
            "si possono ammirare opere d'arte dell'antico Egitto",
            "si può visitare il Museo Nazionale del Cinema",
          ],
          2,
        ),
      ],
    },
  },
  scoring: taskScoring("multiple_choice", { minRatioToComplete: 0.75 }),
});

writeJson(
  "quests/quest-04/scenes/09.json",
  story(
    CHAPTER_ID,
    "quest-04",
    9,
    q4bg,
    npc(
      "Lorenzo Conti",
      `„Molto bene! Hai ascoltato con attenzione. Ma sai qual è la cosa bella? In Italia si fanno le cose in un certo modo — un po' diverso ovunque, ma sempre all'italiana. Come si dice da voi a casa? In Italia si vive così, in Italia si mangia così, in Italia si beve così. Proviamo a formularlo insieme."`,
    ),
  ),
);
writeJson(
  "quests/quest-04/scenes/10.json",
  story(
    CHAPTER_ID,
    "quest-04",
    10,
    q4bg,
    tu(
      "Intende il si impersonale: in Italia si mangia, si beve, si parla... Con questa forma si esprime come si fa qualcosa in generale. Proviamo.",
    ),
  ),
);

writeJson("quests/quest-04/scenes/11.json", {
  id: `${CHAPTER_ID}-quest-04-scene-11`,
  scene_type: "task",
  screen_type: "cloze",
  background: q4bg,
  content: {
    title: "Scoprire una nuova città",
    instruction:
      "Tiziana ha trovato dei buoni consigli. Completa con i verbi alla forma impersonale. Wortbank: chiamare · comprare/comprarsi (3x) · dovere/mangiare · fare · godersi · informarsi · potere/avere · potere/conoscere · potere/trovare · volere/conoscere · non/perdersi · seguire",
    referenceDocument: null,
    task: {
      prompt:
        "Tiziana ha trovato dei buoni consigli. Completa con i verbi alla forma impersonale.",
      caseSensitive: false,
      lines: [
        {
          segments: [
            { kind: "text", text: "Per scoprire una nuova città " },
            gap(["si compra", "Si compra"]),
            { kind: "text", text: " una " },
            gap(["buona", "Buona"]),
            { kind: "text", text: " guida della città o " },
            gap(["ci si informa", "Ci si informa"]),
            { kind: "text", text: " in internet prima del viaggio. In questo modo " },
            gap(["si possono avere", "Si possono avere"]),
            { kind: "text", text: " molte attrazioni già prima di visitare la nuova città. Ma se " },
            gap(["si vuole conoscere", "Si vuole conoscere"]),
            { kind: "text", text: " veramente bene la città, " },
            gap(["si fa", "Si fa"]),
            { kind: "text", text: " una " },
            gap(["buona", "Buona"]),
            { kind: "text", text: " visita guidata. Se " },
            gap(["si chiama", "Si chiama"]),
            { kind: "text", text: " l'ufficio del turismo, " },
            gap(["si possono trovare", "Si possono trovare"]),
            { kind: "text", text: " delle " },
            gap(["buone", "Buone"]),
            { kind: "text", text: " informazioni utili. Nell'ufficio del turismo " },
            gap(["si compra", "Si compra"]),
            { kind: "text", text: " una pianta della città. In questo modo " },
            gap(["non si perdono", "Non si perdono"]),
            { kind: "text", text: " facilmente tutti i monumenti. Per scoprire le specialità, " },
            gap(["si mangia", "Si mangia"]),
            { kind: "text", text: " nei " },
            gap(["buoni", "Buoni"]),
            { kind: "text", text: " ristoranti e " },
            gap(["si comprano", "Si comprano"]),
            { kind: "text", text: " i prodotti tipici. Se " },
            gap(["si seguono", "Si seguono"]),
            { kind: "text", text: " questi " },
            gap(["buoni", "Buoni"]),
            { kind: "text", text: " consigli, " },
            gap(["ci si gode", "Ci si gode"]),
            { kind: "text", text: " a pieno la nuova città." },
          ],
        },
      ],
    },
  },
  scoring: taskScoring("cloze", { minRatioToComplete: 0.85 }),
});

writeJson(
  "quests/quest-04/scenes/12.json",
  story(
    CHAPTER_ID,
    "quest-04",
    12,
    q4bg,
    npc(
      "Lorenzo Conti",
      `„Bravissimo/a! Senti, ho qualcosa per te. Io lavoro anche per una piccola rivista che si chiama ‚Made in Italy'. Presentiamo prodotti e invenzioni italiane — cosa viene davvero dall'Italia e cosa la gente pensa erroneamente che sia italiano. Tieni, prendi un numero."`,
    ),
  ),
);
writeJson(
  "quests/quest-04/scenes/13.json",
  story(
    CHAPTER_ID,
    "quest-04",
    13,
    q4bg,
    "Lorenzo prende una rivista colorata dalla sua borsa e te la passa. Sulla copertina: una cartina d'Italia con piccoli simboli, un espresso, una pizza, un Pinguino al cioccolato, una FIAT 500.",
  ),
);
writeJson(
  "quests/quest-04/scenes/14.json",
  story(
    CHAPTER_ID,
    "quest-04",
    14,
    q4bg,
    npc(
      "Lorenzo Conti",
      `„Dai un'occhiata. E poi ti faccio una proposta: ti mostro una mappa con vari prodotti — tu li devi associare alla città giusta. Ma attenzione: alcuni prodotti non sono italiani per niente! Quelli li devi riconoscere."`,
    ),
  ),
);

const dragItems = [
  { id: "gianduiotto", label: "il gianduiotto" },
  { id: "fiat500", label: "la FIAT 500" },
  { id: "pinguino", label: "il Pinguino (gelato su stecco)" },
  { id: "tortellini", label: "i tortellini" },
  { id: "ragu", label: "il ragù alla bolognese" },
  { id: "mortadella", label: "la mortadella" },
  { id: "nutella", label: "la Nutella" },
  { id: "pizza-margherita", label: "la pizza Margherita" },
  { id: "parmigiano", label: "il parmigiano reggiano" },
  { id: "prosciutto-parma", label: "il prosciutto di Parma" },
  { id: "spaghetti-bolognese", label: "gli spaghetti bolognese" },
  { id: "caesar-salad", label: "la Caesar Salad" },
  { id: "pizza-hawaiana", label: "la pizza hawaiana (con ananas)" },
];

writeJson("quests/quest-04/scenes/15.json", {
  id: `${CHAPTER_ID}-quest-04-scene-15`,
  scene_type: "task",
  screen_type: "drag_drop",
  background: q4bg,
  content: {
    title: "Made in Italy: i prodotti delle città",
    instruction:
      `Trascina ogni prodotto dalla rivista sulla città da cui viene. Se un prodotto non è italiano, trascinalo nel campo „Non italiano". Usa la rivista se ti serve.`,
    referenceDocument: {
      title: "Made in Italy — I prodotti delle nostre città",
      body: RIVISTA_BODY,
    },
    task: {
      prompt:
        `Trascina ogni prodotto dalla rivista sulla città da cui viene. Se un prodotto non è italiano, trascinalo nel campo „Non italiano".`,
      presentation: { targetMode: "blocks" },
      shuffleItemOrder: true,
      items: dragItems,
      targets: [
        {
          id: "torino",
          title: "Torino",
          matchMode: "all",
          correctItemIds: ["gianduiotto", "fiat500", "pinguino"],
        },
        {
          id: "bologna",
          title: "Bologna",
          matchMode: "all",
          correctItemIds: ["tortellini", "ragu", "mortadella"],
        },
        {
          id: "alba",
          title: "Alba",
          matchMode: "all",
          correctItemIds: ["nutella"],
        },
        {
          id: "napoli",
          title: "Napoli",
          matchMode: "all",
          correctItemIds: ["pizza-margherita"],
        },
        {
          id: "parma",
          title: "Parma",
          matchMode: "all",
          correctItemIds: ["parmigiano", "prosciutto-parma"],
        },
        {
          id: "non-italiano",
          title: "Non italiano",
          matchMode: "all",
          correctItemIds: ["spaghetti-bolognese", "caesar-salad", "pizza-hawaiana"],
        },
      ],
    },
  },
  scoring: taskScoring("drag_drop", { minRatioToComplete: 0.69 }),
});

writeJson(
  "quests/quest-04/scenes/16.json",
  story(
    CHAPTER_ID,
    "quest-04",
    16,
    q4bg,
    npc(
      "Lorenzo Conti",
      `„Molto bene, ce l'hai fatta! E hai anche riconosciuto i ‚falsi italiani' — molti turisti cadono in trappola lì. Senti, la rivista puoi tenerla, un piccolo souvenir da Bologna. E se vieni a Torino: scrivimi, ti faccio vedere la città!"`,
    ),
  ),
);
writeJson(
  "quests/quest-04/scenes/17.json",
  story(
    CHAPTER_ID,
    "quest-04",
    17,
    q4bg,
    tu(
      "Che giornata. Ho conosciuto un nuovo festival, ho incontrato qualcuno di nuovo e ho anche imparato qualcosa sull'Italia che prima non sapevo. E mi porto a casa la rivista — come ricordo.",
    ),
  ),
);
writeJson(
  "quests/quest-04/scenes/18.json",
  story(
    CHAPTER_ID,
    "quest-04",
    18,
    q4bg,
    `Esci dalla piazza Maggiore. Il sole comincia a tramontare dietro la Basilica di San Petronio. Nel tuo zaino: una rivista con il titolo „Made in Italy".`,
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
    `Hai finito il terzo capitolo della tua avventura a Bologna. Hai scoperto la storia della città, hai partecipato a una festa italiana e hai incontrato un torinese che ti ha mostrato „la sua" Italia.`,
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
    "Risolvi questo compito bonus per guadagnare fette di pizza extra!",
  ),
);

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
      prompt: "Collega ogni parola italiana al suo equivalente inglese.",
      sampleSize: 10,
      poolPairs: bonusPoolPairs.map(([leftLabel, rightLabel], i) => ({
        id: `ch03v${String(i + 1).padStart(3, "0")}`,
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

console.log("Generated chapter-03 catalog under", ROOT);
