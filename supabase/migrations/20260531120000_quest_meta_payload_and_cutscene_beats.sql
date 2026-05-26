-- Quest-level meta_payload (reference document, flow flags) and cutscene beats[] contract.
-- Converts legacy cutscene payloads (root title/body) to unified beats[] shape.

alter table public.game_quests
  add column if not exists meta_payload jsonb not null default '{}'::jsonb;

comment on column public.game_quests.meta_payload is
  'Quest chrome: referenceDocument, flow.blockBack, flow.autoStartQuestSlug (validated by API).';

-- Legacy cutscene rows -> beats[] (idempotent for rows already migrated).
update public.game_quest_steps s
set
  content_payload = (
    jsonb_strip_nulls(
      jsonb_build_object(
        'beats',
        jsonb_build_array(
          jsonb_strip_nulls(
            jsonb_build_object(
              'presentationMode', 'narrator',
              'title', s.content_payload ->> 'title',
              'subtitle', s.content_payload ->> 'subtitle',
              'body', s.content_payload ->> 'body'
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
    )
  ),
  updated_at = now()
where s.step_kind = 'cutscene'
  and s.is_active = true
  and not (s.content_payload ? 'beats')
  and coalesce(s.content_payload ->> 'body', '') <> '';
