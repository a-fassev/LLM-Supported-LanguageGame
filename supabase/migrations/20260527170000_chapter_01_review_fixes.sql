-- Idempotent review fixes for chapter-01 narrative content (already-deployed DBs).
-- Mirrors corrections in 20260527160000_chapter_01_act1_content.sql.

update public.game_chapters
set
  theme_payload = '{"background":"static/navigation/backgrounds/ph-st-nav-chapter-bg","music":"chapter1-theme","paletteKey":"chapter1"}'::jsonb,
  updated_at = now()
where slug = 'chapter-01';

with quest_ref as (
  select q.id from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-01' and q.slug = 'chapter-01-quest-01-opening-school'
)
insert into public.game_quest_steps (quest_id, order_index, step_kind, task_type, template_key, logical_task_key, content_payload, reward_rules, is_active)
select qr.id, 2, 'task', 'ClozeText', 'task.cloze-text', 'chapter-01-q1-cloze-vacation', $q1s2${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-01/ph-ts-classroom",
  "prompt": "Racconta delle tue vacanze. Completa con le forme giuste dei verbi all'imperfetto o al passato prossimo.",
  "caseSensitive": false,
  "lines": [
    {
      "segments": [
        { "kind": "text", "text": "Quest'estate " },
        { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["sono andato", "sono andata"] },
        { "kind": "text", "text": " in campeggio con la mia famiglia al Lago di Garda. " },
        { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["Era", "era"] },
        { "kind": "text", "text": " la prima volta che " },
        { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["vedevamo", "abbiamo visto"] },
        { "kind": "text", "text": " quel lago e ci " },
        { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["è piaciuto"] },
        { "kind": "text", "text": " moltissimo. Ogni mattina " },
        { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["facevo"] },
        { "kind": "text", "text": " colazione con vista sull'acqua, poi " },
        { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["andavamo"] },
        { "kind": "text", "text": " in spiaggia. Il tempo " },
        { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["era", "Era"] },
        { "kind": "text", "text": " quasi sempre bello, solo un giorno " },
        { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["è piovuto"] },
        { "kind": "text", "text": " così tanto che " },
        { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["abbiamo dovuto"] },
        { "kind": "text", "text": " rimanere in tenda. Una sera " },
        { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["ho conosciuto"] },
        { "kind": "text", "text": " un ragazzo italiano di Verona: " },
        { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["abbiamo parlato"] },
        { "kind": "text", "text": " per ore, anche se il mio italiano non " },
        { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["era", "Era"] },
        { "kind": "text", "text": " ancora perfetto. Quando " },
        { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["sono tornato", "sono tornata"] },
        { "kind": "text", "text": " a casa, " },
        { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["mi sentivo"] },
        { "kind": "text", "text": " un po' triste, ma anche contento/a perché presto " },
        { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["partivo", "sarei partito", "sarei partita"] },
        { "kind": "text", "text": " per Bologna." }
      ]
    }
  ]
}$q1s2$::jsonb, '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb, true
from quest_ref qr
on conflict (quest_id, order_index) do update set
  content_payload = excluded.content_payload,
  updated_at = now();

with quest_ref as (
  select q.id from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-01' and q.slug = 'chapter-01-quest-02-sms-bridge'
)
insert into public.game_quest_steps (quest_id, order_index, step_kind, task_type, template_key, logical_task_key, content_payload, reward_rules, is_active)
select qr.id, 2, 'cutscene', null::text, 'cutscene.map-unlock', 'chapter-01-q2-cutscene-map-unlock', $q2s2${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-school-exterior",
  "beats": [
    { "presentationMode": "innerMonologue", "body": "Matteo non cambia mai. Gli rispondo più tardi, adesso ho voglia di esplorare un po' Bologna. È la mia prima vera giornata libera in città." },
    { "presentationMode": "narrator", "body": "Rimetti il telefono in tasca. La città ti aspetta. Sulla mappa di Bologna compaiono tre nuovi luoghi. Per ora puoi visitare il bar in centro — museo e casa Ferrari arriveranno più avanti nella storia." }
  ],
  "navigation": { "blockBack": true }
}$q2s2$::jsonb, '{}'::jsonb, true
from quest_ref qr
on conflict (quest_id, order_index) do update set
  content_payload = excluded.content_payload,
  updated_at = now();

with quest_ref as (
  select q.id from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-01' and q.slug = 'chapter-01-quest-03-bar'
)
insert into public.game_quest_steps (quest_id, order_index, step_kind, task_type, template_key, logical_task_key, content_payload, reward_rules, is_active)
select qr.id, s.order_index, s.step_kind, s.task_type, s.template_key, s.logical_task_key, s.content_payload::jsonb, s.reward_rules::jsonb, true
from quest_ref qr
cross join (
  values
    (
      1,
      'task',
      'DragDrop',
      'task.drag-drop',
      'chapter-01-q3-dragdrop-word-families',
      $q3s1${
        "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-01/ph-ts-bar-interior",
        "prompt": "Per ogni parola di partenza, trova la parola della stessa famiglia che trovi nel testo della brochure.",
        "subtitle": "Trascina la parola corretta in ogni casella.",
        "shuffleItemOrder": true,
        "requireBankEmpty": true,
        "items": [
          { "id": "w-visita", "label": "la visita" },
          { "id": "w-aperte", "label": "aperte" },
          { "id": "w-profondita", "label": "la profondità" },
          { "id": "w-larghezza", "label": "la larghezza" },
          { "id": "w-umidita", "label": "l'umidità" },
          { "id": "w-durata", "label": "la durata" },
          { "id": "w-parziale", "label": "parziale" },
          { "id": "w-lunghezza", "label": "la lunghezza" }
        ],
        "targets": [
          { "id": "t-visitare", "title": "(v.) visitare", "correctItemIds": ["w-visita"] },
          { "id": "t-aprire", "title": "(v.) aprire", "correctItemIds": ["w-aperte"] },
          { "id": "t-profondo", "title": "(agg.) profondo", "correctItemIds": ["w-profondita"] },
          { "id": "t-largo", "title": "(agg.) largo", "correctItemIds": ["w-larghezza"] },
          { "id": "t-umido", "title": "(agg.) umido", "correctItemIds": ["w-umidita"] },
          { "id": "t-durata", "title": "(sost.) durata", "correctItemIds": ["w-durata"] },
          { "id": "t-parzialita", "title": "(sost.) parzialità", "correctItemIds": ["w-parziale"] },
          { "id": "t-lungo", "title": "(agg.) lungo", "correctItemIds": ["w-lunghezza"] }
        ],
        "presentation": { "targetMode": "blocks", "sourceLabel": "Parole", "targetLabel": "Famiglie" }
      }$q3s1$,
      '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
    ),
    (
      6,
      'cutscene',
      null::text,
      'cutscene.bar-outro',
      'chapter-01-q3-cutscene-outro',
      $q3s6${
        "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-bar-interior",
        "npcCast": [
          { "id": "tonio", "displayName": "Tonio", "portraitId": "tonio", "side": "right" }
        ],
        "beats": [
          { "presentationMode": "npcDialog", "speakerId": "tonio", "body": "Grandissimo/a! Mi hai aiutato tanto, grazie! Tieni, il caffè te lo offro io. E se torni in Puglia un giorno, passa a trovarmi al mio paese, eh!" },
          { "presentationMode": "gameInfo", "body": "Hai completato tutte le attività al bar!" },
          { "presentationMode": "innerMonologue", "body": "Che tipo simpatico, Tonio. Bologna mi piace già. Ora però è ora di andare: voglio ancora vedere qualcos'altro prima di sera." },
          { "presentationMode": "narrator", "body": "Esci dal bar. Sulla mappa restano ancora due luoghi da visitare: il museo della città e la casa della famiglia Ferrari." }
        ]
      }$q3s6$,
      '{}'
    )
) as s(order_index, step_kind, task_type, template_key, logical_task_key, content_payload, reward_rules)
on conflict (quest_id, order_index) do update set
  content_payload = excluded.content_payload,
  updated_at = now();

update public.game_quest_steps s
set is_active = false, updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where s.quest_id = q.id
  and c.slug = 'chapter-01'
  and q.slug in ('quest-01', 'quest-02');

update public.game_quests q
set is_active = false, updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and c.slug = 'chapter-01'
  and q.slug in ('quest-01', 'quest-02');
