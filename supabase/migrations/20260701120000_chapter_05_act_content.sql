-- Chapter 5 (Atto 5.0–5.3): narrative content from docs/narrative/chapter-5.md
-- Four quests in chapter-05: week bridge, Lucca MC, café debate, formal mail.
-- Idempotent upserts on chapter slug, (chapter_id, quest slug), (quest_id, order_index).

insert into public.game_chapters (slug, display_name, order_index, theme_payload, is_active)
values (
  'chapter-05',
  'Capitolo 5: La gita a Lucca',
  4,
  '{"background":"static/navigation/backgrounds/ph-st-nav-chapter-bg","music":"chapter5-theme","paletteKey":"chapter5"}'::jsonb,
  true
)
on conflict (slug) do update
set
  display_name = excluded.display_name,
  order_index = excluded.order_index,
  theme_payload = excluded.theme_payload,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.game_quests (
  chapter_id,
  slug,
  display_name,
  order_index,
  unlock_rules,
  meta_payload,
  is_active
)
select
  c.id,
  q.slug,
  q.display_name,
  q.order_index,
  q.unlock_rules::jsonb,
  q.meta_payload::jsonb,
  true
from public.game_chapters c
join (
  values
    (
      'chapter-05-quest-01-week-bridge',
      'Novità dalla classe',
      0,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-04-quest-04-comacchio"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":true,"autoStartQuestSlug":"chapter-05-quest-02-lucca-mc"}}'
    ),
    (
      'chapter-05-quest-02-lucca-mc',
      'Perché andare a Lucca?',
      1,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-05-quest-01-week-bridge"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false,"autoStartQuestSlug":"chapter-05-quest-03-cafe-debate"}}'
    ),
    (
      'chapter-05-quest-03-cafe-debate',
      'Al caffè',
      2,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-05-quest-02-lucca-mc"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false,"autoStartQuestSlug":"chapter-05-quest-04-formal-mail"}}'
    ),
    (
      'chapter-05-quest-04-formal-mail',
      'La mail formale',
      3,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-05-quest-03-cafe-debate"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    )
) as q(slug, display_name, order_index, unlock_rules, meta_payload)
  on c.slug = 'chapter-05'
on conflict (chapter_id, slug) do update
set
  display_name = excluded.display_name,
  order_index = excluded.order_index,
  unlock_rules = excluded.unlock_rules,
  meta_payload = excluded.meta_payload,
  is_active = excluded.is_active,
  updated_at = now();

with quest_refs as (
  select q.id, q.slug
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-05'
    and q.slug in (
      'chapter-05-quest-01-week-bridge',
      'chapter-05-quest-02-lucca-mc',
      'chapter-05-quest-03-cafe-debate',
      'chapter-05-quest-04-formal-mail'
    )
),
seed_steps as (
  select
    qr.id as quest_id,
    s.order_index,
    s.step_kind,
    s.task_type,
    s.template_key,
    s.logical_task_key,
    s.content_payload::jsonb,
    s.reward_rules::jsonb
  from quest_refs qr
  join (
    values
      (
        'chapter-05-quest-01-week-bridge',
        0,
        'cutscene',
        null::text,
        'cutscene.week-bridge',
        'chapter-05-q1-cutscene-bridge',
        $q1s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-05/ph-cs-bedroom-afternoon",
  "npcCast": [
    { "id": "sara", "displayName": "Sara", "portraitId": "sara", "side": "right" }
  ],
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Dopo il weekend a Comacchio inizia una nuova settimana. Stai sistemando lo zaino quando il telefono vibra."
    },
    {
      "presentationMode": "npcDialog",
      "speakerId": "sara",
      "body": "Novità importante: quest'anno possiamo proporre una gita più grande. Hai tempo?"
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Se prepariamo bene gli argomenti, possiamo davvero incidere sulla decisione."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Sì, passa da me. Facciamo un piano serio."
    },
    {
      "presentationMode": "narrator",
      "body": "Dopo pochi minuti Sara arriva con stampe e pagine evidenziate."
    }
  ]
}$q1s0$,
        '{}'
      ),
      (
        'chapter-05-quest-02-lucca-mc',
        0,
        'cutscene',
        null::text,
        'cutscene.lucca-mc-intro',
        'chapter-05-q2-cutscene-intro',
        $q2s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-05/ph-cs-bedroom-afternoon",
  "npcCast": [
    { "id": "sara", "displayName": "Sara", "portraitId": "sara", "side": "right" }
  ],
  "beats": [
    {
      "presentationMode": "npcDialog",
      "speakerId": "sara",
      "body": "Prima della discussione in classe dobbiamo essere sicuri di aver capito tutto."
    },
    {
      "presentationMode": "narrator",
      "body": "Mettete sul tavolo la lettera di Simone e la pubblicità del pacchetto per gruppi scolastici."
    },
    {
      "presentationMode": "npcDialog",
      "speakerId": "sara",
      "body": "Rispondiamo con precisione, poi andiamo al caffè."
    }
  ]
}$q2s0$,
        '{}'
      ),
      (
        'chapter-05-quest-02-lucca-mc',
        1,
        'task',
        'MultipleChoice',
        'task.multiple-choice',
        'chapter-05-q2-mc-lucca-texts',
        $q2s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-05/ph-ts-bedroom-afternoon",
  "prompt": "Perché andare a Lucca?",
  "subtitle": "Leggi il testo A e il testo B e rispondi alle cinque domande.",
  "referenceDocument": {
    "documentId": "scambio-s104-s105",
    "title": "Testi — p. 104/105",
    "bodyText": "TESTO A (S. 104_B1): Simone e il Lucca Comics and Games\n\nSimone è anche un grande fan del Lucca Comics and Games. Lui e i suoi amici lo frequentano tutti gli anni. Simone vuole convincere la sua insegnante di storia dell'arte a fare una gita al Lucca Comics and Games. Perciò le scrive un'e-mail.\n\nGentile Professoressa, ha mai sentito del Lucca Comics and Games? Fra un po' avrà di nuovo luogo questo bellissimo festival a Lucca. Perché Le parlo del festival adesso?\n\nQuest'anno faremo una gita scolastica, ma non abbiamo ancora deciso dove e, secondo me, quella sarebbe la meta perfetta, abbia fiducia in noi.\n\nSarebbe davvero bello andare a Lucca. Ci dia, per favore, la possibilità di partecipare al Lucca Comics. Ci siamo meritati un premio perché quest'anno ci siamo comportati veramente bene! Questo festival è divertentissimo! Vedrà! Piacerà anche a Lei.\n\nPotremmo vestirci tutti come i personaggi dei fumetti, La prego, sia gentile e si vesta anche Lei come noi, così potremmo trascorrere insieme una bellissima giornata a Lucca, una delle più belle città culturali che io conosca.\n\nSicuramente interessantissima anche per Lei che insegna storia dell'arte! Non finisca per dirci di no! Esaudisca il nostro desiderio! Mi dica se è d'accordo ad andare al Lucca Comics. Si conceda anche Lei tre giornate diverse e ci porti a vedere il festival dei fumetti più famoso in Italia! Stia tranquilla! Faremo i bravi. Forse potrebbe venire con noi anche il professor Mori che è toscano. Le allego il programma del festival, così mi dice che ne pensa. Saluti, Simone.\n\n---\n\nTESTO B (S. 105): Offerta speciale per gruppi scolastici\n\nDa sempre organizzare una gita scolastica rappresenta una sfida per insegnanti e studenti. Si devono mettere d'accordo tra di loro persone di età diverse, con gusti e interessi diversi, ma bisogna soprattutto rispettare le disposizioni ministeriali.\n\nNoi lavoriamo per voi e vi proponiamo una meta in grado di soddisfare tutti: dal Ministro dell'Istruzione e della Ricerca all'ultimo degli studenti. Un viaggio a LUCCA!!! DUE GIORNI AL LUCCA COMICS AND GAMES!!!\n\nVisitate tutti gli stand di video-giochi e fumetti. Divertitevi insieme agli altri cosplayer. Non perdetevi la caccia al tesoro tra le mura storiche e scoprite la storia di Lucca. Partecipate al gioco per vincere una cena per tutta la classe. Scaricate l'app del Lucca Comics e sfidate la fortuna. Fate i selfie con i vostri eroi e le vostre eroine dei fumetti.\n\nLuogo dell'evento: Lucca, piazza Napoleone. Pacchetto: treno Roma–Lucca (andata/ritorno) + prenotazione albergo + biglietto festival. Prezzo: 250,00 € a persona. Invito finale: consultare sito/commenti e prenotare rapidamente.",
    "buttonLabel": "Leggi i testi"
  },
  "questions": [
    {
      "id": "lq1",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [{ "kind": "text", "text": "1. Qual è il punto centrale dell'offerta?" }],
      "options": [
        { "id": "a", "label": "Una settimana al mare con attività sportive" },
        { "id": "b", "label": "Due giorni al Lucca Comics and Games con attività del festival" },
        { "id": "c", "label": "Solo visite a musei senza festival" }
      ],
      "correctOptionIds": ["b"]
    },
    {
      "id": "lq2",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [{ "kind": "text", "text": "2. Quale elemento è incluso nel pacchetto?" }],
      "options": [
        { "id": "a", "label": "Volo Bologna–Lucca e pensione completa" },
        { "id": "b", "label": "Treno andata/ritorno, prenotazione albergo e biglietto festival" },
        { "id": "c", "label": "Solo ingresso al festival" }
      ],
      "correctOptionIds": ["b"]
    },
    {
      "id": "lq3",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [{ "kind": "text", "text": "3. Quale argomento della lettera parla direttamente alla prof?" }],
      "options": [
        { "id": "a", "label": "La classe vuole saltare le lezioni" },
        { "id": "b", "label": "Lucca offre anche valore culturale e artistico" },
        { "id": "c", "label": "La classe vuole comprare gadget" }
      ],
      "correctOptionIds": ["b"]
    },
    {
      "id": "lq4",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [{ "kind": "text", "text": "4. Qual è il ruolo dei genitori?" }],
      "options": [
        { "id": "a", "label": "Non devono essere informati" },
        { "id": "b", "label": "Devono essere informati e dare il consenso" },
        { "id": "c", "label": "Decide tutto solo la prof" }
      ],
      "correctOptionIds": ["b"]
    },
    {
      "id": "lq5",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [{ "kind": "text", "text": "5. Qual è l'obiettivo comunicativo complessivo?" }],
      "options": [
        { "id": "a", "label": "Ottenere un sì motivato per una gita scolastica formale" },
        { "id": "b", "label": "Organizzare un viaggio privato senza scuola" },
        { "id": "c", "label": "Criticare l'evento su internet" }
      ],
      "correctOptionIds": ["a"]
    }
  ]
}$q2s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-05-quest-02-lucca-mc',
        2,
        'cutscene',
        null::text,
        'cutscene.lucca-mc-outro',
        'chapter-05-q2-cutscene-outro',
        $q2s2${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-05/ph-cs-bedroom-afternoon",
  "npcCast": [
    { "id": "sara", "displayName": "Sara", "portraitId": "sara", "side": "right" }
  ],
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Confrontate le risposte e chiudete i fogli."
    },
    {
      "presentationMode": "npcDialog",
      "speakerId": "sara",
      "body": "Perfetto. Adesso possiamo discutere in modo serio."
    }
  ]
}$q2s2$,
        '{}'
      ),
      (
        'chapter-05-quest-03-cafe-debate',
        0,
        'cutscene',
        null::text,
        'cutscene.cafe-intro',
        'chapter-05-q3-cutscene-intro',
        $q3s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-05/ph-cs-giardini-cafe",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Il caffè è pieno. Sul tavolo ci sono appunti, mappe e screenshot del festival."
    },
    {
      "presentationMode": "narrator",
      "body": "Lucca è bella, però Firenze con il calcio storico è unica."
    },
    {
      "presentationMode": "narrator",
      "body": "Mettiamo tutto in ordine: pro e contro, poi rifiniamo le frasi."
    }
  ]
}$q3s0$,
        '{}'
      ),
      (
        'chapter-05-quest-03-cafe-debate',
        1,
        'task',
        'DragDrop',
        'task.drag-drop',
        'chapter-05-q3-dragdrop-pro-contro',
        $q3s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-05/ph-ts-giardini-cafe",
  "prompt": "Pro e contro",
  "subtitle": "Trascina ogni affermazione nella casella giusta (Lucca PRO / Lucca CONTRO / Firenze PRO / Firenze CONTRO).",
  "shuffleItemOrder": true,
  "requireBankEmpty": true,
  "items": [
    { "id": "card-1", "label": "Il pacchetto scuola include viaggio e alloggio." },
    { "id": "card-2", "label": "Una parte della classe preferisce eventi sportivi." },
    { "id": "card-3", "label": "Lucca unisce festival e patrimonio culturale." },
    { "id": "card-4", "label": "Il calcio storico è una tradizione locale molto forte." },
    { "id": "card-5", "label": "Per alcuni il cosplay non è motivante." },
    { "id": "card-6", "label": "Firenze sembra più familiare ad alcuni compagni." },
    { "id": "card-7", "label": "Su Lucca abbiamo già argomenti testuali pronti." },
    { "id": "card-8", "label": "C'è il rischio di dedicare poco tempo ad altre visite." }
  ],
  "targets": [
    { "id": "lucca-pro", "title": "Lucca PRO", "matchMode": "all", "correctItemIds": ["card-1", "card-3", "card-7"] },
    { "id": "lucca-contro", "title": "Lucca CONTRO", "matchMode": "all", "correctItemIds": ["card-5", "card-8"] },
    { "id": "firenze-pro", "title": "Firenze PRO", "matchMode": "all", "correctItemIds": ["card-2", "card-4", "card-6"] },
    { "id": "firenze-contro", "title": "Firenze CONTRO", "matchMode": "all", "correctItemIds": [] }
  ],
  "presentation": { "targetMode": "blocks", "sourceLabel": "Affermazioni", "targetLabel": "Categorie" }
}$q3s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-05-quest-03-cafe-debate',
        2,
        'task',
        'ClozeText',
        'task.cloze-text',
        'chapter-05-q3-cloze-aggettivo',
        $q3s2${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-05/ph-ts-giardini-cafe",
  "prompt": "Posizione dell'aggettivo",
  "subtitle": "Completa ogni frase nel punto indicato (prima o dopo il nome).",
  "caseSensitive": false,
  "lines": [
    {
      "segments": [
        { "kind": "text", "text": "Giulio è " },
        { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["un solo", "Un solo"] },
        { "kind": "text", "text": " studente in classe." }
      ]
    },
    {
      "segments": [
        { "kind": "text", "text": "Sofia è " },
        { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["una povera", "Una povera"] },
        { "kind": "text", "text": " ragazza." }
      ]
    },
    {
      "segments": [
        { "kind": "text", "text": "Rita e Franco sono amici " },
        { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["vecchi", "Vecchi"] },
        { "kind": "text", "text": "." }
      ]
    },
    {
      "segments": [
        { "kind": "text", "text": "Nando è un ragazzo " },
        { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["solo", "Solo"] },
        { "kind": "text", "text": "." }
      ]
    },
    {
      "segments": [
        { "kind": "text", "text": "È un evento " },
        { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["caro", "Caro"] },
        { "kind": "text", "text": "." }
      ]
    },
    {
      "segments": [
        { "kind": "text", "text": "Parla di " },
        { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["un vecchio", "Un vecchio"] },
        { "kind": "text", "text": " amico." }
      ]
    }
  ]
}$q3s2$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-05-quest-03-cafe-debate',
        3,
        'cutscene',
        null::text,
        'cutscene.cafe-outro',
        'chapter-05-q3-cutscene-outro',
        $q3s3${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-05/ph-cs-giardini-cafe",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Avete deciso il messaggio principale. È il momento della mail formale."
    }
  ]
}$q3s3$,
        '{}'
      ),
      (
        'chapter-05-quest-04-formal-mail',
        0,
        'cutscene',
        null::text,
        'cutscene.mail-intro',
        'chapter-05-q4-cutscene-intro',
        $q4s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-05/ph-cs-bedroom-afternoon",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "La casa è silenziosa. Apri il portatile e riprendi la lista degli argomenti."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Tono corretto, forme giuste, nessuna imprecisione."
    }
  ]
}$q4s0$,
        '{}'
      ),
      (
        'chapter-05-quest-04-formal-mail',
        1,
        'task',
        'ClozeText',
        'task.cloze-text',
        'chapter-05-q4-cloze-mail',
        $q4s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-05/ph-ts-bedroom-desk-evening",
  "prompt": "Mail formale",
  "subtitle": "Completa la lettera con pronomi e verbi all'imperativo di cortesia.",
  "caseSensitive": false,
  "referenceDocument": {
    "documentId": "scambio-s106-b2",
    "title": "Testo di riferimento — p. 106",
    "bodyText": "Caro Simone, la tua idea sembra piuttosto interessante, ma non pensare che sia facile organizzare una gita. Innanzitutto come reagiranno i tuoi compagni di classe alla tua proposta?\n\nChiedigli cosa ne pensano, fammi sapere se sono d'accordo, e se saranno d'accordo i vostri genitori (ci vogliono anche le loro autorizzazioni!). Dammi almeno tre motivi per cui dovrei portarvi a Lucca! Scrivili insieme ai tuoi compagni, discutetene e poi inviatemi la vostra risposta entro lunedì. Così vi dirò se possiamo andarci.\n\nMa prima di tutto chiariscimi questi tre punti: 1) Quanti giorni volete stare a Lucca e quanto tempo volete passare al festival? 2) Con quale mezzo di trasporto vorrete viaggiare (andata e ritorno)? 3) Quanto tempo ci rimarrà per i musei e per le chiese?\n\nInsomma, informati bene su tutto, prima di prendere una decisione! Cordiali saluti, Anna-Viviana Bardelli. P.S.: Non mi piace per niente la tua idea di pubblicare tutto in internet! Pensa prima alle possibili conseguenze!",
    "buttonLabel": "Leggi il testo"
  },
  "lines": [
    {
      "segments": [
        { "kind": "text", "text": "Egregio Dirigente scolastico, Gentile Professor Sallusti,\n\n" },
        { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["Le", "le"] },
        { "kind": "text", "text": " scriviamo questa lettera per presentar" },
        { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["Le", "le"] },
        { "kind": "text", "text": " un progetto. Anche se Lei è molto impegnato, " },
        { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["ci", "Ci"] },
        { "kind": "text", "text": " conceda cinque minuti del Suo tempo e " },
        { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["legga", "Legga"] },
        { "kind": "text", "text": " quello che Le proponiamo.\n\nAbbiamo pensato di andare a Lucca per partecipare al festival, ma non " },
        { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["pensi", "Pensi"] },
        { "kind": "text", "text": " che vogliamo solo divertirci.\n\n" },
        { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["Si ricordi", "si ricordi"] },
        { "kind": "text", "text": " che la nostra classe si è sempre comportata bene.\n\nPer favore, non " },
        { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["ci proibisca", "Ci proibisca"] },
        { "kind": "text", "text": " di organizzare la gita e " },
        { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["ci risponda", "Ci risponda"] },
        { "kind": "text", "text": " il prima possibile.\n\nLa ringraziamo molto per la Sua cortese attenzione.\n\nDistinti saluti, gli studenti della 2C" }
      ]
    }
  ]
}$q4s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-05-quest-04-formal-mail',
        2,
        'task',
        'Matching',
        'task.matching',
        'chapter-05-q4-matching-imperativo',
        $q4s2${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-05/ph-ts-bedroom-desk-evening",
  "prompt": "Imperativi di cortesia",
  "subtitle": "Collega ogni infinito alla forma corretta dell'imperativo di cortesia (Lei).",
  "leftItems": [
    { "id": "inf-essere", "label": "essere" },
    { "id": "inf-avere", "label": "avere" },
    { "id": "inf-andare", "label": "andare" },
    { "id": "inf-dare", "label": "dare" },
    { "id": "inf-dire", "label": "dire" },
    { "id": "inf-fare", "label": "fare" },
    { "id": "inf-stare", "label": "stare" },
    { "id": "inf-sapere", "label": "sapere" }
  ],
  "rightItems": [
    { "id": "imp-sia", "label": "sia" },
    { "id": "imp-abbia", "label": "abbia" },
    { "id": "imp-vada", "label": "vada" },
    { "id": "imp-dia", "label": "dia" },
    { "id": "imp-dica", "label": "dica" },
    { "id": "imp-faccia", "label": "faccia" },
    { "id": "imp-stia", "label": "stia" },
    { "id": "imp-sappia", "label": "sappia" }
  ],
  "correctPairs": [
    { "leftItemId": "inf-essere", "rightItemId": "imp-sia" },
    { "leftItemId": "inf-avere", "rightItemId": "imp-abbia" },
    { "leftItemId": "inf-andare", "rightItemId": "imp-vada" },
    { "leftItemId": "inf-dare", "rightItemId": "imp-dia" },
    { "leftItemId": "inf-dire", "rightItemId": "imp-dica" },
    { "leftItemId": "inf-fare", "rightItemId": "imp-faccia" },
    { "leftItemId": "inf-stare", "rightItemId": "imp-stia" },
    { "leftItemId": "inf-sapere", "rightItemId": "imp-sappia" }
  ]
}$q4s2$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-05-quest-04-formal-mail',
        3,
        'cutscene',
        null::text,
        'cutscene.mail-outro',
        'chapter-05-q4-cutscene-outro',
        $q4s3${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-05/ph-cs-bedroom-afternoon",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Premi \"Invia\". Dopo pochi secondi arriva la conferma di ricezione."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Fatto. Si apre il prossimo atto."
    }
  ]
}$q4s3$,
        '{}'
      )
  ) as s(
    quest_slug,
    order_index,
    step_kind,
    task_type,
    template_key,
    logical_task_key,
    content_payload,
    reward_rules
  )
    on s.quest_slug = qr.slug
)
insert into public.game_quest_steps (
  quest_id,
  order_index,
  step_kind,
  task_type,
  template_key,
  logical_task_key,
  content_payload,
  reward_rules,
  is_active
)
select
  ss.quest_id,
  ss.order_index,
  ss.step_kind,
  ss.task_type,
  ss.template_key,
  ss.logical_task_key,
  ss.content_payload,
  ss.reward_rules,
  true
from seed_steps ss
on conflict (quest_id, order_index) do update
set
  step_kind = excluded.step_kind,
  task_type = excluded.task_type,
  template_key = excluded.template_key,
  logical_task_key = excluded.logical_task_key,
  content_payload = excluded.content_payload,
  reward_rules = excluded.reward_rules,
  is_active = excluded.is_active,
  updated_at = now();

-- Offer chapter 5 bridge after chapter 4 finale.
with quest_ref as (
  select q.id
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-04'
    and q.slug = 'chapter-04-quest-04-piazza-quiz'
)
update public.game_quests q
set
  meta_payload = jsonb_set(
    coalesce(q.meta_payload, '{}'::jsonb),
    '{flow}',
    coalesce(q.meta_payload->'flow', '{}'::jsonb)
      || '{"autoStartQuestSlug":"chapter-05-quest-01-week-bridge"}'::jsonb,
    true
  ),
  updated_at = now()
from quest_ref r
where q.id = r.id;
