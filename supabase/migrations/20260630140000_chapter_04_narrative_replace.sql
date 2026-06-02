-- Chapter 4 narrative replace (deployed DB fix).
-- KEEP IN SYNC: dollar-quote payload tags in 20260630120000_chapter_04_act_content.sql
-- Deactivate mistaken Atto-6 quests before upserting Sara/Comacchio content.

update public.game_quest_steps s
set is_active = false, updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where s.quest_id = q.id
  and c.slug = 'chapter-04'
  and q.slug in (
    'chapter-04-quest-02-restaurant-literature',
    'chapter-04-quest-03-sicily-lady',
    'chapter-04-quest-04-piazza-quiz'
  );

update public.game_quests q
set
  is_active = false,
  order_index = case q.slug
    when 'chapter-04-quest-02-restaurant-literature' then 91
    when 'chapter-04-quest-03-sicily-lady' then 92
    when 'chapter-04-quest-04-piazza-quiz' then 93
    else q.order_index
  end,
  updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and c.slug = 'chapter-04'
  and q.slug in (
    'chapter-04-quest-02-restaurant-literature',
    'chapter-04-quest-03-sicily-lady',
    'chapter-04-quest-04-piazza-quiz'
  );

update public.game_quests q
set
  meta_payload = coalesce(q.meta_payload, '{}'::jsonb) || jsonb_build_object(
    'flow',
    coalesce(q.meta_payload->'flow', '{}'::jsonb) || jsonb_build_object(
      'autoStartQuestSlug', 'chapter-04-quest-05-bonus-vocab'
    )
  ),
  updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and c.slug = 'chapter-04'
  and q.slug = 'chapter-04-quest-04-comacchio'
  and q.is_active = true;

insert into public.game_chapters (slug, display_name, order_index, theme_payload, is_active)
values (
  'chapter-04',
  'Capitolo 4: Sara e l''amicizia',
  3,
  '{"background":"static/navigation/backgrounds/ph-st-nav-chapter-bg","music":"chapter4-theme","paletteKey":"chapter4"}'::jsonb,
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
      'chapter-04-quest-01-morning-bridge',
      'Camera tua',
      0,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-03-quest-04-cioccoshow"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":true,"autoStartQuestSlug":"chapter-04-quest-02-sara-giardini"}}'
    ),
    (
      'chapter-04-quest-02-sara-giardini',
      'Sara ai Giardini Margherita',
      1,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-04-quest-01-morning-bridge"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    ),
    (
      'chapter-04-quest-03-mail-consolation',
      'Una mail per consolare Sara',
      2,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-04-quest-02-sara-giardini"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    ),
    (
      'chapter-04-quest-04-comacchio',
      'L''invito a Comacchio',
      3,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-04-quest-03-mail-consolation"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false,"autoStartQuestSlug":"chapter-04-quest-05-bonus-vocab"}}'
    ),
    (
      'chapter-04-quest-05-bonus-vocab',
      'Bonus: Parole della lezione 4',
      4,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-04-quest-04-comacchio"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    )
) as q(slug, display_name, order_index, unlock_rules, meta_payload)
  on c.slug = 'chapter-04'
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
      ),      (
        'chapter-04-quest-03-mail-consolation',
        0,
        'cutscene',
        null::text,
        'cutscene.mail-intro',
        'chapter-04-q3-cutscene-intro',
        $q3s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bedroom-desk-evening",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Sei tornato/a nella tua camera a casa Ferrari. È sera, la lampada sulla scrivania illumina il laptop."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Ho cercato un articolo in tedesco su come consolare qualcuno con il mal d'amore. Prendo i consigli più importanti e scrivo una mail in italiano a Sara."
    }
  ]
}$q3s0$,
        '{}'
      ),      (
        'chapter-04-quest-03-mail-consolation',
        1,
        'task',
        'FreitextLlm',
        'task.freitext.llm',
        'chapter-04-q3-freitext-mail-sara',
        $q3s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-04/ph-ts-bedroom-desk-evening",
  "prompt": "Scrivi una mail di consolazione a Sara",
  "instruction": "Riassumi almeno 3-4 consigli dell'articolo in italiano. Saluto informale, congiuntivo/infinito, 80-120 parole circa.",
  "referenceDocument": {
    "documentId": "articolo-liebeskummer-de",
    "title": "Wie tröste ich jemanden bei Liebeskummer?",
    "bodyText": "Wie tröste ich jemanden bei Liebeskummer?\n\nDaniela van Santen ist Liebeskummer-Coach. Zu ihr kommen Menschen, die vor lauter Liebeskrankheit nicht mehr weiterwissen. Auf die Frage, was das Wichtigste beim Trösten sei, rät sie: „Zuhören, zuhören, zuhören, trösten und nachfragen, wie es so geht. Und zwar immer und immer wieder.\"\n\nUnglücklich Verliebte neigen oft dazu, die Geschichten, die sie belasten, so oft zu erzählen, bis man sie simultan mitsprechen kann.\n\nFünf Tipps für den perfekten Liebeskummertrost:\n1. Zuhören, Zuhören und fragen! Auch wenn der Betroffene die Geschichte zum 100sten Mal erzählt, muss man da als guter Freund/gute Freundin durch. Mit der eigenen Meinung hinter dem Berg halten.\n2. Sprich auf keinen Fall über deine eigenen Erfahrungen.\n3. Behalte Sprüche wie „Das wird schon wieder\" für dich.\n4. Sich die Rachegedanken des Gegenübers anzuhören ist eine Sache — zu ermuntern oder sogar beim Umsetzen zu helfen, strikt verboten.\n5. Bitte niemals von der eigenen glücklichen Beziehung erzählen.",
    "buttonLabel": "Articolo originale"
  },
  "targetLanguage": "it",
  "showWordCount": true,
  "showCharacterCount": true,
  "minWords": 60,
  "maxWords": 180,
  "evaluation": {
    "grammarWeight": 1,
    "vocabularyWeight": 1,
    "registerWeight": 1,
    "passThreshold": 0.65,
    "registerTarget": "informal",
    "scoringPolicy": "threshold_pass",
    "maxPoints": 5,
    "evaluationCriteria": [
      "At least three tips from the German article transferred to Italian",
      "Adapted to Sara's breakup situation; empathetic informal tone",
      "Correct congiuntivo after volere che / pensare che / è importante che; infinito where needed",
      "Informal greeting and closing (Cara Sara / Un abbraccio)"
    ],
    "targetStructures": [
      "Sprachmittlung Deutsch–Italienisch",
      "congiuntivo e infinito",
      "e-mail informale"
    ]
  }
}$q3s1$,
        '{"pizza":{"mode":"scored","maxSlices":2,"minRatioToComplete":0.01,"rounding":"floor","mapping":{"kind":"linear"}},"backpack":{"mode":"first_completion","value":1}}'
      ),      (
        'chapter-04-quest-03-mail-consolation',
        2,
        'cutscene',
        null::text,
        'cutscene.mail-outro',
        'chapter-04-q3-cutscene-outro',
        $q3s2${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bedroom-desk-evening",
  "beats": [
    {
      "presentationMode": "innerMonologue",
      "body": "Salvo... invio! Spero che la aiuti un po'."
    },
    {
      "presentationMode": "narrator",
      "body": "Chiudi il laptop. Domattina sulla mappa sarà visibile un nuovo messaggio da Sara."
    }
  ]
}$q3s2$,
        '{}'
      ),      (
        'chapter-04-quest-04-comacchio',
        0,
        'cutscene',
        null::text,
        'cutscene.comacchio-intro',
        'chapter-04-q4-cutscene-intro',
        $q4s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bedroom-morning",
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
      "body": "La mattina dopo ti svegli e vedi un messaggio vocale sul telefono. È di Sara."
    },
    {
      "presentationMode": "npcDialog",
      "speakerId": "sara",
      "body": "Ho letto la tua mail ieri sera — mi ha aiutato tantissimo. Ti inoltro l'invito di Giulia per un weekend a Comacchio!"
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Comacchio? Diamo un'occhiata all'invito."
    }
  ]
}$q4s0$,
        '{}'
      ),      (
        'chapter-04-quest-04-comacchio',
        1,
        'task',
        'MultipleChoice',
        'task.multiple-choice',
        'chapter-04-q4-mc-invito',
        $q4s1${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bedroom-morning",
  "prompt": "Hai capito l'invito?",
  "subtitle": "Leggi l'invito di Giulia e rispondi.",
  "referenceDocument": {
    "documentId": "invito-comacchio",
    "title": "INVITO — Comacchio",
    "bodyText": "INVITO — Divertiti nella Pianura Padana!\n\nCome superare la fine di una storia d'amore e rinascere più forti di prima! Un weekend a Comacchio — i rimedi contro il mal d'amore esistono davvero!\n\nVietati sono però i pensieri negativi e la nostalgia!\n\nSi chiamano cioccolato, gelato, ballare, fenicotteri, risotto di mare, spaghetti ai crostacei (la nostra specialità!!!) e budino (non guasta mai). Ma soprattutto ... AMICIZIA!\n\nTi invito a visitare la mia bellissima città, la „piccola Venezia\" con tutti i suoi canali. Comacchio nasce e vive tra terra e acqua. Da una parte trovi il mare, dall'altra Il Parco del Delta del Po.\n\nChe ne dici? La sera andiamo al cinema, in pizzeria o restiamo a casa per una festa in pigiama e mangiamo un chilo di Nutella... scegli tu!\n\nTutto sommato sarà il weekend ideale per due ragazze favolose come noi! La vita è bella nonostante tutto — perciò ne dobbiamo approfittare pienamente! TVB Giulia\n\nProgramma — 5 passi:\n(A) Cinque spiagge ideali per relax e per cancellare i ricordi tristi.\n(B) Ponte degli Sbirri, Palazzo Bellini, Trepponti.\n(C) Il tramonto sull'orizzonte.\n(D) Passeggiata al Loggiato dei Cappuccini e bici (fenicotteri).\n(E) Brutto tempo: Museo d'Arte Contemporanea Remo Brindisi (Picasso, Warhol, De Chirico).",
    "buttonLabel": "Vedi l'invito"
  },
  "questions": [
    {
      "id": "cq1",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "1. Perché Giulia invita Sara (e te) a Comacchio?"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "Per festeggiare il compleanno di Giulia."
        },
        {
          "id": "b",
          "label": "Per aiutare Sara a superare il mal d'amore."
        },
        {
          "id": "c",
          "label": "Per visitare il Parco Nazionale del Po insieme."
        }
      ],
      "correctOptionIds": [
        "b"
      ]
    },
    {
      "id": "cq2",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "2. Quante spiagge ci sono vicino a Comacchio?"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "Tre"
        },
        {
          "id": "b",
          "label": "Cinque"
        },
        {
          "id": "c",
          "label": "Sette"
        }
      ],
      "correctOptionIds": [
        "b"
      ]
    },
    {
      "id": "cq3",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "3. Qual è una specialità della cucina di Giulia?"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "Il risotto di mare e gli spaghetti ai crostacei"
        },
        {
          "id": "b",
          "label": "I tortellini al ragù e la mortadella"
        },
        {
          "id": "c",
          "label": "La pizza Margherita e il gelato al cioccolato"
        }
      ],
      "correctOptionIds": [
        "a"
      ]
    },
    {
      "id": "cq4",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        {
          "kind": "text",
          "text": "4. Cosa propone Giulia in caso di brutto tempo?"
        }
      ],
      "options": [
        {
          "id": "a",
          "label": "Restare a casa per una festa in pigiama con la Nutella"
        },
        {
          "id": "b",
          "label": "Andare al Museo d'Arte Contemporanea Remo Brindisi"
        },
        {
          "id": "c",
          "label": "Visitare il Trepponti e il Palazzo Bellini"
        }
      ],
      "correctOptionIds": [
        "b"
      ]
    }
  ]
}$q4s1$,
        '{"pizza":{"mode":"scored","maxSlices":2,"minRatioToComplete":0.01,"rounding":"floor","mapping":{"kind":"linear"}},"backpack":{"mode":"first_completion","value":1}}'
      ),      (
        'chapter-04-quest-04-comacchio',
        2,
        'task',
        'SpecialScreenSms',
        'task.special-screen.sms',
        'chapter-04-q4-sms-mamma',
        $q4s2${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bedroom-morning",
  "screenVariant": "sms",
  "referenceDocument": {
    "documentId": "invito-comacchio",
    "title": "INVITO — Comacchio",
    "bodyText": "INVITO — Divertiti nella Pianura Padana!\n\nCome superare la fine di una storia d'amore e rinascere più forti di prima! Un weekend a Comacchio — i rimedi contro il mal d'amore esistono davvero!\n\nVietati sono però i pensieri negativi e la nostalgia!\n\nSi chiamano cioccolato, gelato, ballare, fenicotteri, risotto di mare, spaghetti ai crostacei (la nostra specialità!!!) e budino (non guasta mai). Ma soprattutto ... AMICIZIA!\n\nTi invito a visitare la mia bellissima città, la „piccola Venezia\" con tutti i suoi canali. Comacchio nasce e vive tra terra e acqua. Da una parte trovi il mare, dall'altra Il Parco del Delta del Po.\n\nChe ne dici? La sera andiamo al cinema, in pizzeria o restiamo a casa per una festa in pigiama e mangiamo un chilo di Nutella... scegli tu!\n\nTutto sommato sarà il weekend ideale per due ragazze favolose come noi! La vita è bella nonostante tutto — perciò ne dobbiamo approfittare pienamente! TVB Giulia\n\nProgramma — 5 passi:\n(A) Cinque spiagge ideali per relax e per cancellare i ricordi tristi.\n(B) Ponte degli Sbirri, Palazzo Bellini, Trepponti.\n(C) Il tramonto sull'orizzonte.\n(D) Passeggiata al Loggiato dei Cappuccini e bici (fenicotteri).\n(E) Brutto tempo: Museo d'Arte Contemporanea Remo Brindisi (Picasso, Warhol, De Chirico).",
    "buttonLabel": "Vedi l'invito"
  },
  "smsChrome": {
    "chatHeaderTitle": "Mamma",
    "messages": [
      {
        "direction": "outgoing",
        "author": "Tu",
        "hostsEmbeddedMechanic": true,
        "embeddedMechanicBlockIndex": 0,
        "text": "Mamma, ascolta che bello!"
      }
    ]
  },
  "blocks": [
    {
      "blockType": "cloze_text",
      "clozeText": {
        "prompt": "Completa i messaggi per raccontare l'invito a tua mamma.",
        "caseSensitive": false,
        "lines": [
          {
            "segments": [
              {
                "kind": "text",
                "text": "1. Giulia è grande! Mi ha "
              },
              {
                "kind": "gap",
                "placeholder": "…",
                "maxLength": 80,
                "correctAnswers": [
                  "invitata a Comacchio",
                  "invitata a passare un weekend a Comacchio"
                ]
              }
            ]
          },
          {
            "segments": [
              {
                "kind": "text",
                "text": "2. Giulia ha preparato un "
              },
              {
                "kind": "gap",
                "placeholder": "…",
                "maxLength": 80,
                "correctAnswers": [
                  "programma fantastico",
                  "invito con cinque passi"
                ]
              }
            ]
          },
          {
            "segments": [
              {
                "kind": "text",
                "text": "3. Comacchio si chiama anche "
              },
              {
                "kind": "gap",
                "placeholder": "…",
                "maxLength": 80,
                "correctAnswers": [
                  "„piccola Venezia\"",
                  "piccola Venezia"
                ]
              }
            ]
          },
          {
            "segments": [
              {
                "kind": "text",
                "text": "4. Ci sono cinque "
              },
              {
                "kind": "gap",
                "placeholder": "…",
                "maxLength": 80,
                "correctAnswers": [
                  "spiagge",
                  "spiagge ideali per il relax"
                ]
              }
            ]
          },
          {
            "segments": [
              {
                "kind": "text",
                "text": "5. Se il tempo sarà brutto, "
              },
              {
                "kind": "gap",
                "placeholder": "…",
                "maxLength": 80,
                "correctAnswers": [
                  "andiamo al museo",
                  "andiamo al Museo Remo Brindisi"
                ]
              }
            ]
          },
          {
            "segments": [
              {
                "kind": "text",
                "text": "6. La sera andiamo "
              },
              {
                "kind": "gap",
                "placeholder": "…",
                "maxLength": 80,
                "correctAnswers": [
                  "al cinema",
                  "in pizzeria",
                  "a una festa in pigiama"
                ]
              }
            ]
          },
          {
            "segments": [
              {
                "kind": "text",
                "text": "7. Lei ha scritto di quattro "
              },
              {
                "kind": "gap",
                "placeholder": "…",
                "maxLength": 80,
                "correctAnswers": [
                  "passi contro il mal d'amore",
                  "passi"
                ]
              }
            ]
          },
          {
            "segments": [
              {
                "kind": "text",
                "text": "8. Vietati sono "
              },
              {
                "kind": "gap",
                "placeholder": "…",
                "maxLength": 80,
                "correctAnswers": [
                  "i pensieri negativi e la nostalgia",
                  "pensieri negativi"
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}$q4s2$,
        '{"pizza":{"mode":"scored","maxSlices":2,"minRatioToComplete":0.01,"rounding":"floor","mapping":{"kind":"linear"}},"backpack":{"mode":"first_completion","value":1}}'
      ),      (
        'chapter-04-quest-04-comacchio',
        3,
        'cutscene',
        null::text,
        'cutscene.comacchio-outro',
        'chapter-04-q4-cutscene-outro',
        $q4s3${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bedroom-morning",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Metti via il telefono. È ora di un piccolo esercizio di vocabolario prima di chiudere il capitolo."
    },
    {
      "presentationMode": "gameInfo",
      "body": "Hai aiutato Sara, le hai scritto una mail e hai ricevuto un invito per Comacchio!"
    }
  ]
}$q4s3$,
        '{}'
      ),      (
        'chapter-04-quest-05-bonus-vocab',
        0,
        'cutscene',
        null::text,
        'cutscene.bonus-intro',
        'chapter-04-q5-cutscene-bonus-intro',
        $q5s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bonus-neutral",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Hai completato il quarto capitolo della tua avventura a Bologna."
    },
    {
      "presentationMode": "gameInfo",
      "body": "Prima di chiudere il capitolo, mettiti alla prova: quante parole di questa lezione ricordi davvero? Risolvi questo compito bonus per guadagnare fette di pizza extra!"
    }
  ]
}$q5s0$,
        '{}'
      ),      (
        'chapter-04-quest-05-bonus-vocab',
        1,
        'task',
        'Matching',
        'task.matching',
        'chapter-04-q5-matching-vocab',
        $q5s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-04/ph-ts-bonus-neutral",
  "prompt": "Collega ogni parola italiana al suo equivalente inglese.",
  "subtitle": "Lezione 4 — set casuale di 10 parole.",
  "sampleSize": 10,
  "poolPairs": [
    {
      "id": "v01",
      "leftLabel": "la regione autonoma",
      "rightLabel": "autonomous region"
    },
    {
      "id": "v02",
      "leftLabel": "il divertimento",
      "rightLabel": "amusement / fun"
    },
    {
      "id": "v03",
      "leftLabel": "il poeta",
      "rightLabel": "poet"
    },
    {
      "id": "v04",
      "leftLabel": "il/la musicista",
      "rightLabel": "musician"
    },
    {
      "id": "v05",
      "leftLabel": "il successo",
      "rightLabel": "success"
    },
    {
      "id": "v06",
      "leftLabel": "la poesia",
      "rightLabel": "poetry / poem"
    },
    {
      "id": "v07",
      "leftLabel": "innamorarsi (di)",
      "rightLabel": "to fall in love (with)"
    },
    {
      "id": "v08",
      "leftLabel": "lasciare",
      "rightLabel": "to leave"
    },
    {
      "id": "v09",
      "leftLabel": "l'emozione",
      "rightLabel": "emotion"
    },
    {
      "id": "v10",
      "leftLabel": "rivolere (il partner)",
      "rightLabel": "to want one's partner back"
    },
    {
      "id": "v11",
      "leftLabel": "piangere",
      "rightLabel": "to cry"
    },
    {
      "id": "v12",
      "leftLabel": "il mal d'amore",
      "rightLabel": "lovesickness / heartache"
    },
    {
      "id": "v13",
      "leftLabel": "l'amicizia",
      "rightLabel": "friendship"
    },
    {
      "id": "v14",
      "leftLabel": "vietare",
      "rightLabel": "to forbid"
    },
    {
      "id": "v15",
      "leftLabel": "la nostalgia",
      "rightLabel": "nostalgia"
    },
    {
      "id": "v16",
      "leftLabel": "il canale",
      "rightLabel": "channel / canal"
    },
    {
      "id": "v17",
      "leftLabel": "da una parte ... dall'altra",
      "rightLabel": "on one hand ... on the other"
    },
    {
      "id": "v18",
      "leftLabel": "il pigiama",
      "rightLabel": "pyjamas"
    },
    {
      "id": "v19",
      "leftLabel": "favoloso, -a",
      "rightLabel": "fabulous"
    },
    {
      "id": "v20",
      "leftLabel": "nonostante",
      "rightLabel": "in spite of"
    },
    {
      "id": "v21",
      "leftLabel": "TVB (Ti voglio bene)",
      "rightLabel": "I love you (friendship)"
    },
    {
      "id": "v22",
      "leftLabel": "cancellare",
      "rightLabel": "to cancel / to delete"
    },
    {
      "id": "v23",
      "leftLabel": "il ricordo",
      "rightLabel": "memory / souvenir"
    },
    {
      "id": "v24",
      "leftLabel": "il tramonto",
      "rightLabel": "sunset"
    },
    {
      "id": "v25",
      "leftLabel": "l'orizzonte",
      "rightLabel": "horizon"
    },
    {
      "id": "v26",
      "leftLabel": "il rimedio",
      "rightLabel": "remedy"
    },
    {
      "id": "v27",
      "leftLabel": "la Pianura Padana",
      "rightLabel": "the Po Valley"
    },
    {
      "id": "v28",
      "leftLabel": "disperato, -a",
      "rightLabel": "desperate"
    },
    {
      "id": "v29",
      "leftLabel": "tirare su",
      "rightLabel": "to cheer up"
    },
    {
      "id": "v30",
      "leftLabel": "guastare",
      "rightLabel": "to spoil"
    },
    {
      "id": "v31",
      "leftLabel": "pentirsi di qc.",
      "rightLabel": "to regret something"
    },
    {
      "id": "v32",
      "leftLabel": "lasciarsi",
      "rightLabel": "to break up"
    },
    {
      "id": "v33",
      "leftLabel": "il senso",
      "rightLabel": "sense / meaning"
    },
    {
      "id": "v34",
      "leftLabel": "estivo, -a",
      "rightLabel": "summery"
    },
    {
      "id": "v35",
      "leftLabel": "girare",
      "rightLabel": "to wander / to go around"
    },
    {
      "id": "v36",
      "leftLabel": "sopportare",
      "rightLabel": "to endure"
    },
    {
      "id": "v37",
      "leftLabel": "considerare",
      "rightLabel": "to consider"
    },
    {
      "id": "v38",
      "leftLabel": "il bacio",
      "rightLabel": "kiss"
    },
    {
      "id": "v39",
      "leftLabel": "proibire",
      "rightLabel": "to forbid"
    },
    {
      "id": "v40",
      "leftLabel": "condividere",
      "rightLabel": "to share"
    },
    {
      "id": "v41",
      "leftLabel": "il benessere",
      "rightLabel": "wellbeing"
    },
    {
      "id": "v42",
      "leftLabel": "garantire",
      "rightLabel": "to guarantee"
    },
    {
      "id": "v43",
      "leftLabel": "celebre",
      "rightLabel": "famous"
    },
    {
      "id": "v44",
      "leftLabel": "il ponte",
      "rightLabel": "bridge"
    },
    {
      "id": "v45",
      "leftLabel": "l'aeroporto",
      "rightLabel": "airport"
    },
    {
      "id": "v46",
      "leftLabel": "la magia",
      "rightLabel": "magic"
    },
    {
      "id": "v47",
      "leftLabel": "rispettare",
      "rightLabel": "to respect"
    }
  ],
  "presentation": {
    "leftLabel": "italiano",
    "rightLabel": "english",
    "shuffleRightOrder": true
  }
}$q5s1$,
        '{"pizza":{"mode":"flat","value":3},"backpack":{"mode":"first_completion","value":1}}'
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

-- Retire mistaken Atto-6 parallel quests (free order_index for narrative quests)
update public.game_quest_steps s
set is_active = false, updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where s.quest_id = q.id
  and c.slug = 'chapter-04'
  and q.slug in (
    'chapter-04-quest-02-restaurant-literature',
    'chapter-04-quest-03-sicily-lady',
    'chapter-04-quest-04-piazza-quiz'
  );

update public.game_quests q
set
  is_active = false,
  order_index = case q.slug
    when 'chapter-04-quest-02-restaurant-literature' then 91
    when 'chapter-04-quest-03-sicily-lady' then 92
    when 'chapter-04-quest-04-piazza-quiz' then 93
    else q.order_index
  end,
  updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and c.slug = 'chapter-04'
  and q.slug in (
    'chapter-04-quest-02-restaurant-literature',
    'chapter-04-quest-03-sicily-lady',
    'chapter-04-quest-04-piazza-quiz'
  );

-- Retire greenfield demo quests under chapter-04
update public.game_quest_steps s
set is_active = false, updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where s.quest_id = q.id
  and c.slug = 'chapter-04'
  and q.slug in ('quest-01', 'quest-02');

update public.game_quests q
set is_active = false, updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and c.slug = 'chapter-04'
  and q.slug in ('quest-01', 'quest-02');
