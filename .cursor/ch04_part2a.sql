with quest_refs as (
  select q.id, q.slug
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-04'
    and q.slug in (
      'chapter-04-quest-01-morning-bridge',
      'chapter-04-quest-02-sara-giardini',
      'chapter-04-quest-03-mail-consolation',
      'chapter-04-quest-04-comacchio',
      'chapter-04-quest-05-bonus-vocab'
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
        'chapter-04-quest-01-morning-bridge',
        0,
        'cutscene',
        null::text,
        'cutscene.morning-bridge',
        'chapter-04-q1-cutscene-bridge',
        $q1s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bedroom-morning",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Un nuovo giorno a Bologna. Il sole entra caldo nella tua camera. Sulla scrivania ci sono i ricordi dei tuoi giorni precedenti: la rivista «Made in Italy» di Lorenzo, il volantino del Museo della Storia di Bologna."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Oggi è sabato — niente scuola. La signora Ferrari ieri mi ha detto che i Giardini Margherita sono particolarmente belli in questo periodo: fiori d'estate, tanta gente fuori. Una bella giornata per una passeggiata."
    },
    {
      "presentationMode": "narrator",
      "body": "Sulla mappa di Bologna si illumina un nuovo posto: i Giardini Margherita."
    }
  ]
}$q1s0$,
        '{}'
      ),      (
        'chapter-04-quest-02-sara-giardini',
        0,
        'cutscene',
        null::text,
        'cutscene.sara-giardini-intro',
        'chapter-04-q2-cutscene-intro',
        $q2s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-giardini-margherita",
  "npcCast": [
    {
      "id": "sara",
      "displayName": "Sara",
      "portraitId": "sara",
      "side": "right"
    }
  ],
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Cammini per i Giardini Margherita. Il sole splende, le famiglie fanno picnic sull'erba. Su una panchina vicino al laghetto c'è Sara — una compagna di classe del Liceo Galvani. Sembra triste."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Era in Sicilia con Marco la settimana scorsa. Adesso non sembra che abbia bei ricordi. Vado a salutarla."
    },
    {
      "presentationMode": "npcDialog",
      "speakerId": "sara",
      "body": "Oh ciao... sì, certo. Scusami, sono un po' giù oggi. È da quando sono tornata da Palermo... Ma dai, raccontami tu! Senti, ho ancora qualche foto della Sicilia sul telefono — vuoi vedere?"
    },
    {
      "presentationMode": "npcDialog",
      "speakerId": "sara",
      "body": "Queste tre le ho già descritte per il mio diario. Ma per quest'ultima non trovo le parole... mi aiuteresti tu? Descrivimela in italiano!"
    }
  ]
}$q2s0$,
        '{}'
      ),      (
        'chapter-04-quest-02-sara-giardini',
        1,
        'task',
        'SpecialScreen',
        'task.special-screen.sara-photos',
        'chapter-04-q2-photo-sicily',
        $q2s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-04/ph-ts-giardini-margherita",
  "screenVariant": "photo",
  "title": "Le foto di Sara in Sicilia",
  "subtitle": "Guarda le quattro foto. Tre hanno già una descrizione; la quarta la scriverai tu nel passo successivo.",
  "photoViewerChrome": {
    "displayMode": "grid4",
    "showCaptions": true,
    "items": [
      {
        "id": "foto-a",
        "assetId": "static/chapter-04/sicily/scala-dei-turchi",
        "caption": "Acqua Verde — parco acquatico vicino a Palermo"
      },
      {
        "id": "foto-b",
        "assetId": "static/chapter-04/sicily/palermo-markets",
        "caption": "Al mercato di Palermo — succo d'arancia fresco"
      },
      {
        "id": "foto-c",
        "assetId": "static/chapter-04/sicily/monreale-cathedral",
        "caption": "Il mercato della Vucciria — frutta coloratissima"
      },
      {
        "id": "foto-d",
        "assetId": "static/chapter-04/sicily/palermo-cathedral",
        "caption": "La cattedrale di Palermo — da descrivere"
      }
    ]
  },
  "blocks": []
}$q2s1$,
        '{}'
      ),      (
        'chapter-04-quest-02-sara-giardini',
        2,
        'task',
        'FreitextLlm',
        'task.freitext.llm',
        'chapter-04-q2-freitext-foto-d',
        $q2s2${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-04/ph-ts-giardini-margherita",
  "prompt": "Le foto di Sara",
  "instruction": "Scrivi almeno 2-3 frasi per descrivere la foto D (la cattedrale di Palermo). Usa un vocabolario vario e fai attenzione ai verbi.",
  "targetLanguage": "it",
  "showWordCount": true,
  "showCharacterCount": true,
  "minWords": 15,
  "maxWords": 120,
  "evaluation": {
    "grammarWeight": 1,
    "vocabularyWeight": 1,
    "registerWeight": 1,
    "passThreshold": 0.65,
    "registerTarget": "informal",
    "scoringPolicy": "threshold_pass",
    "maxPoints": 5,
    "evaluationCriteria": [
      "Plausible B1 description of Palermo cathedral photo (architecture, horse carriage, atmosphere)",
      "Varied vocabulary; correct verb forms and agreement",
      "At least two complete sentences about the image"
    ],
    "targetStructures": [
      "descrizione di un'immagine",
      "presente indicativo / condizionale di cortesia",
      "aggettivi e avverbi"
    ]
  }
}$q2s2$,
        '{"pizza":{"mode":"scored","maxSlices":2,"minRatioToComplete":0.01,"rounding":"floor","mapping":{"kind":"linear"}},"backpack":{"mode":"first_completion","value":1}}'
      ),      (
        'chapter-04-quest-02-sara-giardini',
        3,
        'task',
        'ClozeText',
        'task.cloze-text',
        'chapter-04-q2-cloze-sara-marco',
        $q2s3${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-04/ph-ts-giardini-margherita",
  "prompt": "Sara rivuole Marco?",
  "subtitle": "Wortbank: che — cui — mi — più — proprio. Metti i verbi al congiuntivo o all'infinito.",
  "caseSensitive": false,
  "lines": [
    {
      "segments": [
        {
          "kind": "text",
          "text": "Sara: Senti, io rivorrei Marco. Per me è importante "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 24,
          "correctAnswers": [
            "io conosca",
            "che io conosca"
          ]
        },
        {
          "kind": "text",
          "text": " la verità e "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 24,
          "correctAnswers": [
            "tu mi aiuti",
            "che tu mi aiuti"
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
          "text": "Tu: Marco sarebbe "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 16,
          "correctAnswers": [
            "proprio"
          ]
        },
        {
          "kind": "text",
          "text": " stupido, perché tu sei mille volte "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 8,
          "correctAnswers": [
            "più"
          ]
        },
        {
          "kind": "text",
          "text": " bella di lei. È meglio "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 32,
          "correctAnswers": [
            "che tu non sappia"
          ]
        },
        {
          "kind": "text",
          "text": " la verità, Sara."
        }
      ]
    },
    {
      "segments": [
        {
          "kind": "text",
          "text": "Sara: Basta "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 24,
          "correctAnswers": [
            "che io vada"
          ]
        },
        {
          "kind": "text",
          "text": " "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 8,
          "correctAnswers": [
            "al"
          ]
        },
        {
          "kind": "text",
          "text": " bar "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 8,
          "correctAnswers": [
            "che"
          ]
        },
        {
          "kind": "text",
          "text": " gli piacciono "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 8,
          "correctAnswers": [
            "di",
            "per"
          ]
        },
        {
          "kind": "text",
          "text": " sapere se è uscito con lei. "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 24,
          "correctAnswers": [
            "Mi accompagni",
            "mi accompagni"
          ]
        },
        {
          "kind": "text",
          "text": "?"
        }
      ]
    },
    {
      "segments": [
        {
          "kind": "text",
          "text": "Tu: È importante "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 24,
          "correctAnswers": [
            "che tu guardi"
          ]
        },
        {
          "kind": "text",
          "text": " avanti. È meglio "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 32,
          "correctAnswers": [
            "di non pensare"
          ]
        },
        {
          "kind": "text",
          "text": " più "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 8,
          "correctAnswers": [
            "a"
          ]
        },
        {
          "kind": "text",
          "text": " quello stupido. È improbabile "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 40,
          "correctAnswers": [
            "che Marco e Laura vadano"
          ]
        },
        {
          "kind": "text",
          "text": " negli stessi bar in "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 8,
          "correctAnswers": [
            "cui"
          ]
        },
        {
          "kind": "text",
          "text": " andavate voi."
        }
      ]
    },
    {
      "segments": [
        {
          "kind": "text",
          "text": "Sara: È bellissimo "
        },
        {
          "kind": "gap",
          "placeholder": "…",
          "maxLength": 24,
          "correctAnswers": [
            "di avere"
          ]
        },
        {
          "kind": "text",
          "text": " un'amica come te."
        }
      ]
    }
  ]
}$q2s3$,
        '{"pizza":{"mode":"scored","maxSlices":2,"minRatioToComplete":0.01,"rounding":"floor","mapping":{"kind":"linear"}},"backpack":{"mode":"first_completion","value":1}}'
      ),      (
        'chapter-04-quest-02-sara-giardini',
        4,
        'task',
        'ErrorSpotting',
        'task.error-spotting',
        'chapter-04-q2-error-spotting-congiuntivo',
        $q2s4${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-04/ph-ts-giardini-margherita",
  "prompt": "Trova gli errori",
  "instruction": "In ogni frase c'è un verbo sbagliato (congiuntivo vs infinito), tranne una frase corretta. Clicca sul verbo sbagliato e scrivi la forma giusta.",
  "expectedErrorRange": {
    "min": 4,
    "max": 4
  },
  "counterCaption": "Errori da correggere: {count}",
  "segments": [
    {
      "id": "e1a",
      "text": "1. „Voglio che ",
      "isError": false
    },
    {
      "id": "e1b",
      "text": "io dimentichi",
      "isError": true,
      "acceptedCorrections": [
        "dimenticare"
      ],
      "hint": "Stesso soggetto → infinito senza che."
    },
    {
      "id": "e1c",
      "text": " Marco al più presto.\"",
      "isError": false
    },
    {
      "id": "e2a",
      "text": "2. „Spero ",
      "isError": false
    },
    {
      "id": "e2b",
      "text": "di Marco mi chiami",
      "isError": true,
      "acceptedCorrections": [
        "che Marco mi chiami"
      ],
      "hint": "Soggetti diversi → che + congiuntivo."
    },
    {
      "id": "e2c",
      "text": " stasera.\"",
      "isError": false
    },
    {
      "id": "e3",
      "text": "3. Penso di essere stata troppo gelosa con lui. (Frase corretta.)",
      "isError": false
    },
    {
      "id": "e4a",
      "text": "4. „È meglio che io non ",
      "isError": false
    },
    {
      "id": "e4b",
      "text": "vedere",
      "isError": true,
      "acceptedCorrections": [
        "veda",
        "che io non veda"
      ],
      "hint": "Dopo è meglio che → congiuntivo."
    },
    {
      "id": "e4c",
      "text": " Marco a scuola domani.\"",
      "isError": false
    },
    {
      "id": "e5a",
      "text": "5. „Ti ringrazio ",
      "isError": false
    },
    {
      "id": "e5b",
      "text": "di tu sei",
      "isError": true,
      "acceptedCorrections": [
        "che tu sei"
      ],
      "hint": "Soggetti diversi → che + indicativo."
    },
    {
      "id": "e5c",
      "text": " una buona amica.\"",
      "isError": false
    }
  ]
}$q2s4$,
        '{"pizza":{"mode":"scored","maxSlices":2,"minRatioToComplete":0.01,"rounding":"floor","mapping":{"kind":"linear"}},"backpack":{"mode":"first_completion","value":1}}'
      ),      (
        'chapter-04-quest-02-sara-giardini',
        5,
        'cutscene',
        null::text,
        'cutscene.sara-giardini-outro',
        'chapter-04-q2-cutscene-outro',
        $q2s5${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-giardini-margherita",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Saluti Sara con un abbraccio. Sulla mappa si illumina un nuovo posto: casa della famiglia Ferrari (la sera)."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Stasera le scrivo una mail. Ho letto un articolo tedesco sul mal d'amore — potrei riassumerle le idee principali."
    }
  ]
}$q2s5$,
        '{}'
      ),