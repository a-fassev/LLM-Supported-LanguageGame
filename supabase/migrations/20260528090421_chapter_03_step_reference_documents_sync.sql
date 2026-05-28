-- Chapter 3 sync: move Cioccoshow reference docs to step-level payloads.
-- KEEP IN SYNC with supabase migration applied on dev: chapter_03_step_reference_documents_sync.
-- Idempotent by design; safe for re-apply.

with quest as (
  select q.id
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-03'
    and q.slug = 'chapter-03-quest-04-cioccoshow'
)
update public.game_quests q
set
  meta_payload = jsonb_set(
    coalesce(q.meta_payload, '{}'::jsonb) - 'referenceDocument',
    '{flow}',
    '{"blockBack":false}'::jsonb,
    true
  ),
  updated_at = now()
from quest
where q.id = quest.id;

with quiz_step as (
  select s.id
  from public.game_quest_steps s
  join public.game_quests q on q.id = s.quest_id
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-03'
    and s.logical_task_key = 'chapter-03-q4-quiz-torino'
)
update public.game_quest_steps s
set
  content_payload = jsonb_set(
    coalesce(s.content_payload, '{}'::jsonb),
    '{referenceDocument}',
    '{
      "documentId":"lorenzo-torino-racconto",
      "title":"La storia di Lorenzo: Torino, la mia città",
      "bodyText":"Io sono Lorenzo e sono nato a Torino. A casa mia il cioccolato è quasi una religione: i gianduiotti sono il simbolo della città e a novembre c''è anche il festival CioccolaTò. Per preparare il gianduiotto servono cacao, zucchero e nocciole piemontesi, e il sapore è davvero speciale. Se invece parliamo di crema da spalmare, la Nutella è nata ad Alba nel 1964: non proprio a Torino, ma sempre qui in Piemonte.\n\nTorino però non è solo dolci. Qui si mangiano anche i grissini e, quando si parla di calcio, quasi tutti tifano Juventus, la «Vecchia Signora». Dalla città si vedono bene le Alpi e in centro c''è la Mole Antonelliana: dentro puoi visitare il Museo Nazionale del Cinema. E poi c''è il Lingotto, uno dei luoghi storici della FIAT, perché Torino è famosa anche per le automobili.\n\nInsomma, Torino è una città piena di gusto, sport, cultura e storia industriale.",
      "buttonLabel":"Leggi il racconto"
    }'::jsonb,
    true
  ),
  updated_at = now()
from quiz_step
where s.id = quiz_step.id;

with drag_step as (
  select s.id
  from public.game_quest_steps s
  join public.game_quests q on q.id = s.quest_id
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-03'
    and s.logical_task_key = 'chapter-03-q4-dragdrop-made-in-italy'
)
update public.game_quest_steps s
set
  content_payload = jsonb_set(
    coalesce(s.content_payload, '{}'::jsonb),
    '{referenceDocument}',
    '{
      "documentId":"rivista-made-in-italy",
      "title":"Made in Italy — I prodotti delle nostre città",
      "bodyText":"Conoscete il vero Made in Italy? In questa edizione vi presentiamo i prodotti più famosi e da dove vengono davvero. Attenzione: alcuni «classici italiani» che troverete all''estero non sono italiani per niente!\n\nTorino (Piemonte): il gianduiotto; la FIAT 500; il «Pinguino» (gelato su stecco, inventato nel 1939 a Torino).\n\nBologna (Emilia-Romagna): i tortellini; il ragù alla bolognese; la mortadella.\n\nAlba (Piemonte): la Nutella (dal 1964).\n\nNapoli (Campania): la pizza Margherita (patrimonio UNESCO dal 2017).\n\nParma (Emilia-Romagna): il parmigiano reggiano; il prosciutto di Parma.\n\nNON sono italiani: Spaghetti Bolognese; Caesar Salad; Hawaiian Pizza (con ananas).",
      "buttonLabel":"Vedi la rivista"
    }'::jsonb,
    true
  ),
  updated_at = now()
from drag_step
where s.id = drag_step.id;

