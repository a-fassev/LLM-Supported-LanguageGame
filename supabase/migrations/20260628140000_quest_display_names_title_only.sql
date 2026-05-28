-- Quest display names: Italian titles only (no "Akt", ranges, or "Bonus:" prefixes).
-- Idempotent updates by quest slug.

update public.game_quests q
set display_name = v.title_only, updated_at = now()
from (
  values
    ('chapter-01-quest-01-opening-school', 'Camera tua e Liceo Galvani'),
    ('chapter-01-quest-02-sms-bridge', 'Davanti alla scuola'),
    ('chapter-01-quest-03-bar', 'Bar in centro'),
    ('chapter-01-quest-04-bonus-vocab', 'Parole della lezione 1'),
    ('chapter-02-quest-01-morning-bridge', 'La mattina a casa'),
    ('chapter-02-quest-02-nutelleria', 'Nutelleria con Dario'),
    ('chapter-02-quest-03-school-project', 'Progetto scolastico a casa'),
    ('chapter-02-quest-04-restaurant', 'Trattoria da Marini'),
    ('chapter-02-quest-05-bonus-vocab', 'Parole della lezione 2'),
    ('chapter-03-quest-01-morning-bridge', 'Camera tua'),
    ('chapter-03-quest-02-museum', 'Museo della Storia di Bologna'),
    ('chapter-03-quest-03-valentina', 'La guida Valentina'),
    ('chapter-03-quest-04-cioccoshow', 'Cioccoshow in piazza Maggiore'),
    ('chapter-03-quest-05-bonus-vocab', 'Parole della lezione 3')
) as v(slug, title_only)
where q.slug = v.slug;
