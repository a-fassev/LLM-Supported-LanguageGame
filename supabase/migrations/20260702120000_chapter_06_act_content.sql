-- Chapter 6 (Atto 6.0–6.3): narrative content from docs/narrative/chapter-6.md
-- Four quests in chapter-06: bridge, restaurant literature / sicily lady (parallel), piazza finale.
-- Idempotent upserts on chapter slug, (chapter_id, quest slug), (quest_id, order_index).

insert into public.game_chapters (slug, display_name, order_index, theme_payload, is_active)
values (
  'chapter-06',
  'Capitolo 6: Ultima parte a Bologna',
  5,
  '{"background":"static/navigation/backgrounds/ph-st-nav-chapter-bg","music":"chapter6-theme","paletteKey":"chapter6"}'::jsonb,
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
      'chapter-06-quest-01-morning-bridge',
      'Camera tua',
      0,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-05-quest-04-formal-mail"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":true}}'
    ),
    (
      'chapter-06-quest-02-restaurant-literature',
      'Al ristorante',
      1,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-06-quest-01-morning-bridge"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    ),
    (
      'chapter-06-quest-03-sicily-lady',
      'La signora siciliana',
      2,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-06-quest-01-morning-bridge"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    ),
    (
      'chapter-06-quest-04-piazza-quiz',
      'Quiz in piazza',
      3,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-06-quest-02-restaurant-literature","chapter-06-quest-03-sicily-lady"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    )
) as q(slug, display_name, order_index, unlock_rules, meta_payload)
  on c.slug = 'chapter-06'
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
  where c.slug = 'chapter-06'
    and q.slug in (
      'chapter-06-quest-01-morning-bridge',
      'chapter-06-quest-02-restaurant-literature',
      'chapter-06-quest-03-sicily-lady',
      'chapter-06-quest-04-piazza-quiz'
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
        'chapter-06-quest-01-morning-bridge',
        0,
        'cutscene',
        null::text,
        'cutscene.morning-bridge',
        'chapter-06-q1-cutscene-bridge',
        $q1s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-06/ph-cs-bedroom-morning",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "È arrivata la conferma della professoressa. Inizia l'ultima parte del tuo percorso a Bologna."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Oggi ho due tappe: il turno al ristorante e un incontro al parco."
    },
    {
      "presentationMode": "narrator",
      "body": "Sulla mappa si accendono due pin nello stesso momento."
    }
  ]
}$q1s0$,
        '{}'
      ),
      (
        'chapter-06-quest-02-restaurant-literature',
        0,
        'cutscene',
        null::text,
        'cutscene.restaurant-literature-intro',
        'chapter-06-q2-cutscene-intro',
        $q2s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-06/ph-cs-restaurant-interior",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Tra due ordinazioni noti un libro aperto: \"Bianca come il latte, rossa come il sangue\"."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Leggo solo un momento... ma il testo mi cattura subito."
    }
  ]
}$q2s0$,
        '{}'
      ),
      (
        'chapter-06-quest-02-restaurant-literature',
        1,
        'task',
        'Matching',
        'task.matching',
        'chapter-06-q2-matching-line-ref',
        $q2s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-06/ph-ts-restaurant-interior",
  "prompt": "Prof per sempre!",
  "subtitle": "Trova nel testo le frasi giuste e indica la riga.",
  "referenceDocument": {
    "documentId": "scambio-s112-prof",
    "title": "Testo — p. 112/113",
    "bodyText": "1 È il Sognatore. Merda. Ci mancava solo\n2 questa [...].\n3 \"Salve, prof, cosa ho fatto?\" [...].\n4 Sorride.\n5 \"Ho deciso di passare a trovarti, magari ti\n6 andava di finire il discorso dell'altro giorno.\"\n7 Ecco, lo sapevo. I prof sono prof fino alla\n8 morte, devono farti le lezioni anche sotto\n9 casa tua.\n10 \"Prof, lasciamo perdere il discorso dell'altra\n11 volta...\" [...].\n12 \"Andiamo a prendere un gelato.\"\n13 Mi sorride. Sì, ha detto così: un ge-la-to.\n14 I prof mangiano il gelato. Sì, i prof mangiano\n15 il gelato e si sporcano la bocca come fanno\n16 tutti gli altri.\n17 \"Il suo blog è bello, a volte un po' troppo\n18 filosofico, ma quando posso lo leggo.\"\n19 Il prof ringrazia continuando a leccare il suo\n20 gelato al pistacchio e al caffè - soliti gusti\n21 pallosi da prof - e mi ricorda Terminator che\n22 lecca le mie scarpe da tennis.\n23 \"Allora, cosa ti è successo l'altro giorno?\"\n24 Lo sapevo che non mollava la presa. I prof\n25 sono come i boa, ti si arrotolano attorno\n26 quando sei distratto, poi aspettano che butti\n27 fuori l'aria e stringono, e a ogni espirazione\n28 stringono di più, [...].\n29 \"Ma a lei che gliene importa, prof?\"\n30 Il Sognatore mi guarda fisso negli occhi.\n31 \"Forse avevi bisogno di una mano, di un\n32 consiglio ...",
    "buttonLabel": "Leggi il testo"
  },
  "leftItems": [
    {
      "id": "s1",
      "label": "1) I prof non ti lasciano mai in pace."
    },
    {
      "id": "s2",
      "label": "2) Anche i prof possono essere curiosi."
    },
    {
      "id": "s3",
      "label": "3) I prof non mangiano in modo strano."
    },
    {
      "id": "s4",
      "label": "4) I prof devono sempre spiegare tutto a tutti."
    },
    {
      "id": "s5",
      "label": "5) I prof amano anche aiutare gli altri."
    }
  ],
  "rightItems": [
    {
      "id": "r23",
      "label": "r. 23"
    },
    {
      "id": "r24",
      "label": "r. 24"
    },
    {
      "id": "r15-16",
      "label": "r. 15-16"
    },
    {
      "id": "r8-9",
      "label": "r. 8-9"
    },
    {
      "id": "r31-32",
      "label": "r. 31-32"
    }
  ],
  "correctPairs": [
    {
      "leftItemId": "s1",
      "rightItemId": "r24"
    },
    {
      "leftItemId": "s2",
      "rightItemId": "r23"
    },
    {
      "leftItemId": "s3",
      "rightItemId": "r15-16"
    },
    {
      "leftItemId": "s4",
      "rightItemId": "r8-9"
    },
    {
      "leftItemId": "s5",
      "rightItemId": "r31-32"
    }
  ],
  "presentation": {
    "leftLabel": "affermazione",
    "rightLabel": "riga",
    "shuffleRightOrder": true
  }
}$q2s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-06-quest-02-restaurant-literature',
        2,
        'task',
        'Matching',
        'task.matching',
        'chapter-06-q2-matching-interview',
        $q2s2${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-06/ph-ts-restaurant-interior",
  "prompt": "Intervista con D'Avenia",
  "subtitle": "Associa le risposte alle domande corrette.",
  "referenceDocument": {
    "documentId": "scambio-s114-interview",
    "title": "Risposte — p. 114",
    "bodyText": "Cari amici tedeschi, grazie per le vostre domande! Mi fa molto piacere sapere che leggete i miei libri. Ecco le mie risposte:\n\n1) Questa non è una domanda difficile, proprio ieri ho finito nuovamente di leggere l'Odissea di Omero.\n2) Una domanda facile, perché vita e morte sono gli unici temi che non mi annoiano.\n3) Non veramente, comunque c'è sempre un po' dello scrittore in ogni personaggio.\n4) Entrambi in modo eccitante, sia l'inizio sia la fine.\n5) Insegno naturalmente!\n6) Non so se oggi scriverò. Da una settimana sono piuttosto pigro.\n7) I miei consigli? Scrivere, scrivere, scrivere – non avere mai paura! E soprattutto leggere moltissimo.\n8) Sì, ma questo è ancora un segreto. Forse ne sentirete parlare a breve. A presto, Alessandro D'Avenia.",
    "buttonLabel": "Leggi le risposte"
  },
  "leftItems": [
    {
      "id": "q1",
      "label": "1) Qual è stato l'ultimo libro che ha letto?"
    },
    {
      "id": "q2",
      "label": "2) Perché ha scelto un tema così difficile?"
    },
    {
      "id": "q3",
      "label": "3) Si identifica con il personaggio del professore?"
    },
    {
      "id": "q4",
      "label": "4) Come vive l'inizio e la fine di un libro?"
    },
    {
      "id": "q5",
      "label": "5) Che cosa fa quando non scrive?"
    },
    {
      "id": "q6",
      "label": "6) Oggi scriverà ancora qualcosa?"
    },
    {
      "id": "q7",
      "label": "7) Che cosa consiglia ai giovani scrittori?"
    },
    {
      "id": "q8",
      "label": "8) Ha già un nuovo progetto?"
    }
  ],
  "rightItems": [
    {
      "id": "a1",
      "label": "1) Ultimo libro: l'Odissea di Omero."
    },
    {
      "id": "a2",
      "label": "2) Vita e morte sono gli unici temi che non annoiano."
    },
    {
      "id": "a3",
      "label": "3) Non del tutto; c'è sempre un po' dello scrittore."
    },
    {
      "id": "a4",
      "label": "4) Inizio e fine sono entrambi eccitanti."
    },
    {
      "id": "a5",
      "label": "5) Insegna."
    },
    {
      "id": "a6",
      "label": "6) Non sa se oggi scriverà; è pigro."
    },
    {
      "id": "a7",
      "label": "7) Scrivere e leggere moltissimo."
    },
    {
      "id": "a8",
      "label": "8) Nuovo progetto ancora segreto."
    }
  ],
  "correctPairs": [
    {
      "leftItemId": "q1",
      "rightItemId": "a1"
    },
    {
      "leftItemId": "q2",
      "rightItemId": "a2"
    },
    {
      "leftItemId": "q3",
      "rightItemId": "a3"
    },
    {
      "leftItemId": "q4",
      "rightItemId": "a4"
    },
    {
      "leftItemId": "q5",
      "rightItemId": "a5"
    },
    {
      "leftItemId": "q6",
      "rightItemId": "a6"
    },
    {
      "leftItemId": "q7",
      "rightItemId": "a7"
    },
    {
      "leftItemId": "q8",
      "rightItemId": "a8"
    }
  ],
  "presentation": {
    "leftLabel": "domanda",
    "rightLabel": "risposta",
    "shuffleRightOrder": true
  }
}$q2s2$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-06-quest-02-restaurant-literature',
        3,
        'task',
        'FreitextLlm',
        'task.freitext.llm',
        'chapter-06-q2-freitext-indirect',
        $q2s3${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-06/ph-ts-restaurant-interior",
  "prompt": "Discorso indiretto",
  "instruction": "Scrivi 3-5 frasi al discorso indiretto al presente usando le risposte dell'autore nel testo di riferimento.",
  "referenceDocument": {
    "documentId": "scambio-s114-interview",
    "title": "Risposte — p. 114",
    "bodyText": "Cari amici tedeschi, grazie per le vostre domande! Mi fa molto piacere sapere che leggete i miei libri. Ecco le mie risposte:\n\n1) Questa non è una domanda difficile, proprio ieri ho finito nuovamente di leggere l'Odissea di Omero.\n2) Una domanda facile, perché vita e morte sono gli unici temi che non mi annoiano.\n3) Non veramente, comunque c'è sempre un po' dello scrittore in ogni personaggio.\n4) Entrambi in modo eccitante, sia l'inizio sia la fine.\n5) Insegno naturalmente!\n6) Non so se oggi scriverò. Da una settimana sono piuttosto pigro.\n7) I miei consigli? Scrivere, scrivere, scrivere – non avere mai paura! E soprattutto leggere moltissimo.\n8) Sì, ma questo è ancora un segreto. Forse ne sentirete parlare a breve. A presto, Alessandro D'Avenia.",
    "buttonLabel": "Leggi le risposte"
  },
  "targetLanguage": "it",
  "showWordCount": true,
  "showCharacterCount": true,
  "minWords": 35,
  "maxWords": 220,
  "evaluation": {
    "grammarWeight": 1,
    "vocabularyWeight": 1,
    "registerWeight": 1,
    "passThreshold": 0.68,
    "registerTarget": "neutral",
    "scoringPolicy": "threshold_pass",
    "maxPoints": 5,
    "evaluationCriteria": [
      "Correct introductory formulas (ha detto che / ha spiegato che / ha affermato che)",
      "Correct adaptation of tenses and pronouns in reported speech at present",
      "At least three content points faithful to D'Avenia's answers in the source text"
    ],
    "targetStructures": [
      "discorso indiretto al presente",
      "verbi introduttivi (dire, spiegare, affermare, chiedere)",
      "concordanza di tempi e pronomi"
    ]
  }
}$q2s3$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-06-quest-02-restaurant-literature',
        4,
        'cutscene',
        null::text,
        'cutscene.restaurant-literature-outro',
        'chapter-06-q2-cutscene-outro',
        $q2s4${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-06/ph-cs-restaurant-interior",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Chiudi il libro e torni al lavoro con la testa piena di idee."
    }
  ]
}$q2s4$,
        '{}'
      ),
      (
        'chapter-06-quest-03-sicily-lady',
        0,
        'cutscene',
        null::text,
        'cutscene.sicily-lady-intro',
        'chapter-06-q3-cutscene-intro',
        $q3s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-06/ph-cs-park-cafe",
  "npcCast": [
    {
      "id": "signora-siciliana",
      "displayName": "Signora siciliana",
      "portraitId": "signora-siciliana",
      "side": "right"
    }
  ],
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "La signora ti mostra foto della Sicilia sul tablet e aspetta una risposta precisa."
    },
    {
      "presentationMode": "npcDialog",
      "speakerId": "signora-siciliana",
      "body": "Non basta dire mi piace: dimmi perché proprio quello."
    }
  ]
}$q3s0$,
        '{}'
      ),
      (
        'chapter-06-quest-03-sicily-lady',
        1,
        'task',
        'SpecialScreen',
        'task.special-screen.profiles-photo',
        'chapter-06-q3-photo-sicily',
        $q3s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-06/ph-ts-park-cafe",
  "screenVariant": "photo",
  "title": "Luoghi in Sicilia",
  "subtitle": "Guarda le foto e ricorda i nomi dei luoghi.",
  "photoViewerChrome": {
    "displayMode": "grid4",
    "showCaptions": true,
    "items": [
      {
        "id": "palermo-cat",
        "assetId": "static/chapter-06/sicily/palermo-cathedral",
        "caption": "Palermo — Cattedrale"
      },
      {
        "id": "palermo-markets",
        "assetId": "static/chapter-06/sicily/palermo-markets",
        "caption": "Palermo — mercati"
      },
      {
        "id": "monreale",
        "assetId": "static/chapter-06/sicily/monreale-cathedral",
        "caption": "Monreale — Cattedrale"
      },
      {
        "id": "agrigento",
        "assetId": "static/chapter-06/sicily/agrigento-temples",
        "caption": "Agrigento — Valle dei Templi"
      },
      {
        "id": "piazza-armerina",
        "assetId": "static/chapter-06/sicily/piazza-armerina-villa",
        "caption": "Piazza Armerina — Villa Romana"
      },
      {
        "id": "scala-turchi",
        "assetId": "static/chapter-06/sicily/scala-dei-turchi",
        "caption": "Scala dei Turchi"
      },
      {
        "id": "trapani",
        "assetId": "static/chapter-06/sicily/trapani",
        "caption": "Trapani — saline e città barocca"
      }
    ]
  },
  "blocks": []
}$q3s1$,
        '{}'
      ),
      (
        'chapter-06-quest-03-sicily-lady',
        2,
        'task',
        'ClozeText',
        'task.cloze-text',
        'chapter-06-q3-cloze-cleft',
        $q3s2${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-06/ph-ts-park-cafe",
  "prompt": "È in Sicilia che voglio andare!",
  "subtitle": "Completa quattro frasi con la messa in rilievo (è ... che / non sono ... che ...).",
  "caseSensitive": false,
  "lines": [
    {
      "segments": [
        {
          "kind": "text",
          "text": "1) A Trapani è "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 32,
          "correctAnswers": [
            "la città barocca",
            "la citta barocca"
          ]
        },
        {
          "kind": "text",
          "text": " che vorrei vedere perché "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 48,
          "correctAnswers": [
            "questa città non l'ho vista ancora",
            "questa citta non l'ho vista ancora"
          ]
        },
        {
          "kind": "text",
          "text": "."
        }
      ]
    },
    {
      "segments": [
        {
          "kind": "text",
          "text": "2) Non sono "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 24,
          "correctAnswers": [
            "le saline",
            "Le saline"
          ]
        },
        {
          "kind": "text",
          "text": " che mi interessano perché "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 56,
          "correctAnswers": [
            "le saline le ho visitate già tante volte",
            "le saline le ho visitate gia tante volte"
          ]
        },
        {
          "kind": "text",
          "text": "."
        }
      ]
    },
    {
      "segments": [
        {
          "kind": "text",
          "text": "3) A Piazza Armerina sono "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 24,
          "correctAnswers": [
            "i mosaici",
            "I mosaici"
          ]
        },
        {
          "kind": "text",
          "text": " che vorrei vedere perché "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 40,
          "correctAnswers": [
            "i mosaici li trovo affascinanti",
            "I mosaici li trovo affascinanti"
          ]
        },
        {
          "kind": "text",
          "text": "."
        }
      ]
    },
    {
      "segments": [
        {
          "kind": "text",
          "text": "4) A Palermo è "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 40,
          "correctAnswers": [
            "il Palazzo della Giustizia",
            "Il Palazzo della Giustizia"
          ]
        },
        {
          "kind": "text",
          "text": " che vorrei visitare perché "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 72,
          "correctAnswers": [
            "questo posto l'ho visto tante volte nei documentari su Giovanni Falcone",
            "questo posto l'ho visto tante volte nei documentari su giovanni falcone"
          ]
        },
        {
          "kind": "text",
          "text": "."
        }
      ]
    }
  ]
}$q3s2$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-06-quest-03-sicily-lady',
        3,
        'cutscene',
        null::text,
        'cutscene.sicily-lady-outro',
        'chapter-06-q3-cutscene-outro',
        $q3s3${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-06/ph-cs-park-cafe",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "La signora annuisce soddisfatta: \"Perfetto, adesso è chiarissimo.\""
    }
  ]
}$q3s3$,
        '{}'
      ),
      (
        'chapter-06-quest-04-piazza-quiz',
        0,
        'cutscene',
        null::text,
        'cutscene.piazza-quiz-intro',
        'chapter-06-q4-cutscene-intro',
        $q4s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-06/ph-cs-piazza-maggiore",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "In piazza c'è un grande quiz pubblico sull'Italia. Tutti partecipano: studenti, famiglie, turisti."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Ultima prova. Dopo questo, il percorso è completo."
    }
  ]
}$q4s0$,
        '{}'
      ),
      (
        'chapter-06-quest-04-piazza-quiz',
        1,
        'task',
        'MultipleChoice',
        'task.multiple-choice',
        'chapter-06-q4-quiz-italiana',
        $q4s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-06/ph-ts-piazza-maggiore",
  "prompt": "Quiz all'italiana",
  "subtitle": "Risolvi tutte le 16 domande del quiz.",
  "questions": [
    {
      "id": "q1",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "1. La Notte Rosa si festeggia:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "in Puglia."
        },
        {
          "id": "b",
          "label": "in Toscana."
        },
        {
          "id": "c",
          "label": "in Emilia Romagna."
        }
      ],
      "correctOptionIds": [
        "c"
      ]
    },
    {
      "id": "q2",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "2. La Puglia è una regione italiana:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "del nord."
        },
        {
          "id": "b",
          "label": "del centro."
        },
        {
          "id": "c",
          "label": "del sud."
        }
      ],
      "correctOptionIds": [
        "c"
      ]
    },
    {
      "id": "q3",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "3. Nominate tre città etrusche che si trovano al centro d'Italia:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "Volterra, Cerveteri, Milano."
        },
        {
          "id": "b",
          "label": "Cerveteri, Arezzo, Orvieto."
        },
        {
          "id": "c",
          "label": "Arezzo, Orvieto, Lucca."
        }
      ],
      "correctOptionIds": [
        "b"
      ]
    },
    {
      "id": "q4",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "4. Chi ha inventato l'eTwinning?"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "Il Prof. Ghilliardi."
        },
        {
          "id": "b",
          "label": "La sezione \"Scambi internazionali\" dell'Ufficio Scuola."
        },
        {
          "id": "c",
          "label": "La Commissione Europea."
        }
      ],
      "correctOptionIds": [
        "c"
      ]
    },
    {
      "id": "q5",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "5. Roberto Saviano è famoso perché:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "è spesso in TV."
        },
        {
          "id": "b",
          "label": "lavora per i Carabinieri."
        },
        {
          "id": "c",
          "label": "si impegna contro la mafia."
        }
      ],
      "correctOptionIds": [
        "c"
      ]
    },
    {
      "id": "q6",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "6. Comacchio è famosa per:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "la pizza."
        },
        {
          "id": "b",
          "label": "i canali."
        },
        {
          "id": "c",
          "label": "le mandorle."
        }
      ],
      "correctOptionIds": [
        "b"
      ]
    },
    {
      "id": "q7",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "7. A Torino è nato/a:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "la Nutella."
        },
        {
          "id": "b",
          "label": "la pizza Margherita."
        },
        {
          "id": "c",
          "label": "il Pinguino."
        }
      ],
      "correctOptionIds": [
        "c"
      ]
    },
    {
      "id": "q8",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "8. Italo Svevo è un autore importante di:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "Milano."
        },
        {
          "id": "b",
          "label": "Trieste."
        },
        {
          "id": "c",
          "label": "Roma."
        }
      ],
      "correctOptionIds": [
        "b"
      ]
    },
    {
      "id": "q9",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "9. Trova l'intruso! Quale attrazione turistica non si trova a Napoli?"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "Piazza Plebiscito."
        },
        {
          "id": "b",
          "label": "Teatro San Carlo."
        },
        {
          "id": "c",
          "label": "Mole Antonelliana."
        }
      ],
      "correctOptionIds": [
        "c"
      ]
    },
    {
      "id": "q10",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "10. Treja è il nome di:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "un cinema nel centro di Roma."
        },
        {
          "id": "b",
          "label": "un parco avventura a un'ora di macchina da Roma."
        },
        {
          "id": "c",
          "label": "un quartiere di Trieste."
        }
      ],
      "correctOptionIds": [
        "b"
      ]
    },
    {
      "id": "q11",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "11. Il primo Circolo dei Lettori è nato a:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "Roma."
        },
        {
          "id": "b",
          "label": "Palermo."
        },
        {
          "id": "c",
          "label": "Torino."
        }
      ],
      "correctOptionIds": [
        "c"
      ]
    },
    {
      "id": "q12",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "12. Margherita Hack amava:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "la carne."
        },
        {
          "id": "b",
          "label": "le stelle."
        },
        {
          "id": "c",
          "label": "la chiesa cattolica."
        }
      ],
      "correctOptionIds": [
        "b"
      ]
    },
    {
      "id": "q13",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "13. Palermo si trova:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "in Piemonte."
        },
        {
          "id": "b",
          "label": "in Sicilia."
        },
        {
          "id": "c",
          "label": "nel Lazio."
        }
      ],
      "correctOptionIds": [
        "b"
      ]
    },
    {
      "id": "q14",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "14. Al Ferrara Buskers Festival:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "si presentano musicisti ed artisti."
        },
        {
          "id": "b",
          "label": "vediamo nuovissimi film italiani per i giovani."
        },
        {
          "id": "c",
          "label": "puoi mangiare specialità della zona Padana."
        }
      ],
      "correctOptionIds": [
        "a"
      ]
    },
    {
      "id": "q15",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "15. Quale regola è sbagliata? Il calcio storico:"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "si gioca sull'erba."
        },
        {
          "id": "b",
          "label": "si gioca in tutto con 54 giocatori."
        },
        {
          "id": "c",
          "label": "non conosce intervalli e dura 50 minuti."
        }
      ],
      "correctOptionIds": [
        "a"
      ]
    },
    {
      "id": "q16",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "16. Che cosa ha detto Goethe sulla Sicilia?"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "\"L'Italia, senza la Sicilia, non lascia alcuna immagine nell'anima: qui comincia tutto.\""
        },
        {
          "id": "b",
          "label": "\"L'Italia, senza la Sicilia, è solo un paese banale.\""
        },
        {
          "id": "c",
          "label": "\"La Sicilia è la chiave di tutto: qui comincia tutto.\""
        }
      ],
      "correctOptionIds": [
        "a"
      ]
    }
  ]
}$q4s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-06-quest-04-piazza-quiz',
        2,
        'cutscene',
        null::text,
        'cutscene.piazza-quiz-finale',
        'chapter-06-q4-cutscene-finale',
        $q4s2${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-06/ph-cs-piazza-maggiore",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Hai finito il quiz. Lo zaino è completo e in camera compaiono tutti gli oggetti finali."
    }
  ]
}$q4s2$,
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

-- Retire greenfield demo quests if present under chapter-06.
update public.game_quest_steps s
set is_active = false, updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where s.quest_id = q.id
  and c.slug = 'chapter-06'
  and q.slug in ('quest-01', 'quest-02');

update public.game_quests q
set is_active = false, updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and c.slug = 'chapter-06'
  and q.slug in ('quest-01', 'quest-02');
