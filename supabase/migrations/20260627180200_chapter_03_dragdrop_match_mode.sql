-- Chapter 3: Made in Italy drag-drop uses multi-item city buckets (matchMode "all").
-- KEEP IN SYNC: targets in 20260627180000_chapter_03_act_content.sql ($q4s4$).

update public.game_quest_steps s
set
  content_payload = jsonb_set(
    s.content_payload,
    '{targets}',
    '[
      { "id": "city-torino", "title": "Torino", "matchMode": "all", "correctItemIds": ["prod-gianduiotto", "prod-fiat", "prod-pinguino"] },
      { "id": "city-bologna", "title": "Bologna", "matchMode": "all", "correctItemIds": ["prod-tortellini", "prod-ragu", "prod-mortadella"] },
      { "id": "city-alba", "title": "Alba", "matchMode": "all", "correctItemIds": ["prod-nutella"] },
      { "id": "city-napoli", "title": "Napoli", "matchMode": "all", "correctItemIds": ["prod-pizza"] },
      { "id": "city-parma", "title": "Parma", "matchMode": "all", "correctItemIds": ["prod-parmigiano", "prod-prosciutto"] },
      { "id": "city-non-italiano", "title": "Non italiano", "matchMode": "all", "correctItemIds": ["prod-spaghetti", "prod-caesar", "prod-hawaiana"] }
    ]'::jsonb,
    false
  ),
  updated_at = now()
where s.logical_task_key = 'chapter-03-q4-dragdrop-made-in-italy';
