-- Convert legacy cutscenes that had title but no body (skipped by prior beats migration).

update public.game_quest_steps s
set
  content_payload = jsonb_strip_nulls(
    jsonb_build_object(
    'beats',
    jsonb_build_array(
      jsonb_strip_nulls(
        jsonb_build_object(
          'presentationMode', 'narrator',
          'title', nullif(trim(s.content_payload ->> 'title'), ''),
          'subtitle', nullif(trim(s.content_payload ->> 'subtitle'), ''),
          'body',
          coalesce(
            nullif(trim(s.content_payload ->> 'body'), ''),
            nullif(trim(s.content_payload ->> 'title'), ''),
            '…'
          )
        )
      )
    ),
    'navigation',
    case
      when coalesce(s.content_payload ->> 'primaryCtaLabel', '') <> '' then
        jsonb_build_object('primaryCtaLabel', s.content_payload ->> 'primaryCtaLabel')
      else null
    end
    )
  ),
  updated_at = now()
where s.step_kind = 'cutscene'
  and s.is_active = true
  and not (s.content_payload ? 'beats')
  and coalesce(nullif(trim(s.content_payload ->> 'body'), ''), '') = ''
  and (
    coalesce(nullif(trim(s.content_payload ->> 'title'), ''), '') <> ''
    or s.content_payload ? 'title'
  );
