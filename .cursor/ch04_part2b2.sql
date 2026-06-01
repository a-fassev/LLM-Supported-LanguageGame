      (
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

-- Retire mistaken Atto-6 parallel quests seeded under chapter-04
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
set is_active = false, updated_at = now()
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
