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

