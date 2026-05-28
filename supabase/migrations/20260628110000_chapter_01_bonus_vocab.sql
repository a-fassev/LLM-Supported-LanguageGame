-- Chapter 1 bonus quest (optional for chapter progression, playable after bar quest).
-- Idempotent upsert against existing chapter-01 narrative content.

with chapter_ref as (
  select id
  from public.game_chapters
  where slug = 'chapter-01'
),
upsert_bonus_quest as (
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
    'chapter-01-quest-04-bonus-vocab',
    'Bonus: Parole della lezione 1',
    3,
    '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-01-quest-03-bar"],"prerequisiteLogicalTaskKeys":[]}'::jsonb,
    '{"flow":{"blockBack":false}}'::jsonb,
    true
  from chapter_ref c
  on conflict (chapter_id, slug) do update
  set
    display_name = excluded.display_name,
    order_index = excluded.order_index,
    unlock_rules = excluded.unlock_rules,
    meta_payload = excluded.meta_payload,
    is_active = excluded.is_active,
    updated_at = now()
  returning id
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
  q.id,
  s.order_index,
  s.step_kind,
  s.task_type,
  s.template_key,
  s.logical_task_key,
  s.content_payload::jsonb,
  s.reward_rules::jsonb,
  true
from upsert_bonus_quest q
cross join (
  values
    (
      0,
      'cutscene',
      null::text,
      'cutscene.bonus-intro',
      'chapter-01-q4-cutscene-bonus-intro',
      $q4s0${
        "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-bonus-neutral",
        "beats": [
          { "presentationMode": "narrator", "body": "Hai finito il tuo primo giorno a Bologna. Hai conosciuto la tua nuova classe, hai esplorato il centro e hai imparato tante cose nuove." },
          { "presentationMode": "narrator", "body": "Prima di chiudere il capitolo, mettiti alla prova: quante parole di questa lezione ricordi davvero?" },
          { "presentationMode": "gameInfo", "body": "Risolvi questo compito bonus per guadagnare fette di pizza extra!" }
        ]
      }$q4s0$,
      '{}'
    ),
    (
      1,
      'task',
      'Matching',
      'task.matching',
      'chapter-01-q4-matching-vocab',
      $q4s1${
        "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-01/ph-ts-bonus-neutral",
        "prompt": "Collega ogni parola italiana al suo equivalente inglese.",
        "subtitle": "Lezione 1 — set casuale di 10 parole.",
        "sampleSize": 10,
        "poolPairs": [
          { "id": "vac-01", "leftLabel": "l'agriturismo", "rightLabel": "farm holiday / agritourism" },
          { "id": "vac-02", "leftLabel": "la gita culturale", "rightLabel": "cultural trip / cultural excursion" },
          { "id": "vac-03", "leftLabel": "gli scavi", "rightLabel": "excavations / archaeological site" },
          { "id": "vac-04", "leftLabel": "il parco nazionale", "rightLabel": "national park" },
          { "id": "vac-05", "leftLabel": "la natura", "rightLabel": "nature" },
          { "id": "vac-06", "leftLabel": "la campagna", "rightLabel": "countryside" },
          { "id": "vac-07", "leftLabel": "in campagna", "rightLabel": "in the countryside" },
          { "id": "vac-08", "leftLabel": "il campeggio", "rightLabel": "camping / campsite" },
          { "id": "vac-09", "leftLabel": "la tenda", "rightLabel": "tent" },
          { "id": "vac-10", "leftLabel": "il monte", "rightLabel": "mountain" },
          { "id": "vac-11", "leftLabel": "la cima; in cima", "rightLabel": "summit / peak; at the top" },
          { "id": "vac-12", "leftLabel": "la montagna", "rightLabel": "mountain" },
          { "id": "vac-13", "leftLabel": "il mare", "rightLabel": "sea" },
          { "id": "vac-14", "leftLabel": "la spiaggia", "rightLabel": "beach" },
          { "id": "vac-15", "leftLabel": "in campeggio", "rightLabel": "at the campsite" },
          { "id": "vac-16", "leftLabel": "in piscina", "rightLabel": "at the pool" },
          { "id": "vac-17", "leftLabel": "in spiaggia", "rightLabel": "at the beach" },
          { "id": "vac-18", "leftLabel": "il fiume", "rightLabel": "river" },
          { "id": "vac-19", "leftLabel": "il lago", "rightLabel": "lake" },
          { "id": "vac-20", "leftLabel": "l'ostello (della gioventù)", "rightLabel": "(youth) hostel" },
          { "id": "vac-21", "leftLabel": "la cartina", "rightLabel": "map" },
          { "id": "vac-22", "leftLabel": "andare ... in bici/barca/macchina/treno", "rightLabel": "to go by bike / boat / car / train" },
          { "id": "vac-23", "leftLabel": "andare a cavallo", "rightLabel": "to go horseback riding" },
          { "id": "exp-01", "leftLabel": "l'esperienza", "rightLabel": "experience" },
          { "id": "exp-02", "leftLabel": "la visita; la visita guidata", "rightLabel": "visit; guided tour" },
          { "id": "exp-03", "leftLabel": "visitare (gli scavi)", "rightLabel": "to visit (the excavations)" },
          { "id": "exp-04", "leftLabel": "godere / godersi (la natura)", "rightLabel": "to enjoy (nature)" },
          { "id": "exp-05", "leftLabel": "(fare) il kite surf", "rightLabel": "(to do) kitesurfing" },
          { "id": "exp-06", "leftLabel": "(fare) il trekking", "rightLabel": "(to do) trekking / hiking" },
          { "id": "exp-07", "leftLabel": "la canoa", "rightLabel": "canoe" },
          { "id": "exp-08", "leftLabel": "la barca", "rightLabel": "boat" },
          { "id": "exp-09", "leftLabel": "andare (sul fiume) in canoa/barca", "rightLabel": "to go canoeing / boating (on the river)" },
          { "id": "adv-01", "leftLabel": "di nuovo", "rightLabel": "again" },
          { "id": "adv-02", "leftLabel": "di segreto", "rightLabel": "secretly" },
          { "id": "adv-03", "leftLabel": "di preciso", "rightLabel": "exactly / precisely" },
          { "id": "com-01", "leftLabel": "comunicare", "rightLabel": "to communicate" },
          { "id": "com-02", "leftLabel": "la telefonata", "rightLabel": "phone call" },
          { "id": "com-03", "leftLabel": "la piattaforma (ufficiale)", "rightLabel": "(official) platform" },
          { "id": "com-04", "leftLabel": "internet", "rightLabel": "internet" },
          { "id": "com-05", "leftLabel": "l'accesso (a internet)", "rightLabel": "(internet) access" },
          { "id": "com-06", "leftLabel": "allegare", "rightLabel": "to attach" },
          { "id": "com-07", "leftLabel": "aggiungere", "rightLabel": "to add" },
          { "id": "com-08", "leftLabel": "inviare", "rightLabel": "to send" },
          { "id": "com-09", "leftLabel": "il saluto", "rightLabel": "greeting" },
          { "id": "com-10", "leftLabel": "i miei migliori saluti", "rightLabel": "best regards / kind regards" },
          { "id": "com-11", "leftLabel": "la formula (di saluto iniziale/finale)", "rightLabel": "(opening/closing) greeting formula" },
          { "id": "per-01", "leftLabel": "giovane", "rightLabel": "young" },
          { "id": "per-02", "leftLabel": "anziano, -a", "rightLabel": "elderly / old" },
          { "id": "per-03", "leftLabel": "buono, -a", "rightLabel": "good / kind" },
          { "id": "per-04", "leftLabel": "cattivo, -a", "rightLabel": "bad / mean" },
          { "id": "per-05", "leftLabel": "meraviglioso, -a", "rightLabel": "wonderful / marvelous" },
          { "id": "per-06", "leftLabel": "fantastico, -a", "rightLabel": "fantastic" },
          { "id": "per-07", "leftLabel": "simpatico, -a", "rightLabel": "likeable / nice" },
          { "id": "per-08", "leftLabel": "dolce", "rightLabel": "sweet / gentle" },
          { "id": "per-09", "leftLabel": "fortunato, -a", "rightLabel": "lucky / fortunate" },
          { "id": "per-10", "leftLabel": "straniero, -a", "rightLabel": "foreign / foreigner" }
        ],
        "presentation": {
          "leftLabel": "italiano",
          "rightLabel": "english",
          "shuffleRightOrder": true
        }
      }$q4s1$,
      '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
    )
) as s(order_index, step_kind, task_type, template_key, logical_task_key, content_payload, reward_rules)
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
