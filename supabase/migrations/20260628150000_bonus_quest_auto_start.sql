-- After the last main story quest in each chapter, auto-start the optional bonus vocab quest.
-- Bonus remains optional for chapter unlock (OPTIONAL_CHAPTER_QUEST_SLUGS on the web API).

update public.game_quests q
set
  meta_payload = coalesce(q.meta_payload, '{}'::jsonb) || jsonb_build_object(
    'flow',
    coalesce(q.meta_payload->'flow', '{}'::jsonb) || jsonb_build_object('autoStartQuestSlug', v.auto_start_slug)
  ),
  updated_at = now()
from public.game_chapters c
join (
  values
    ('chapter-01', 'chapter-01-quest-03-bar', 'chapter-01-quest-04-bonus-vocab'),
    ('chapter-02', 'chapter-02-quest-02-nutelleria', 'chapter-02-quest-05-bonus-vocab'),
    ('chapter-02', 'chapter-02-quest-03-school-project', 'chapter-02-quest-05-bonus-vocab'),
    ('chapter-02', 'chapter-02-quest-04-restaurant', 'chapter-02-quest-05-bonus-vocab'),
    ('chapter-03', 'chapter-03-quest-04-cioccoshow', 'chapter-03-quest-05-bonus-vocab'),
    ('chapter-04', 'chapter-04-quest-04-comacchio', 'chapter-04-quest-05-bonus-vocab')
) as v(chapter_slug, quest_slug, auto_start_slug)
  on c.slug = v.chapter_slug
where q.chapter_id = c.id
  and q.slug = v.quest_slug
  and q.is_active = true;
