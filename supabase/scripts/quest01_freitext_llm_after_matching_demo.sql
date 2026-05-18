-- Inserts a FreitextLlm demo task for quest-01 immediately after Matching demo (`quest-01-matching-demo`).
-- Bumps later steps by +1. Safe to re-run: skips when logical_task_key `quest-01-freitext-llm-demo` already exists.

do $$
declare
  v_quest_id uuid;
  v_match_order int;
  v_ins_order int;
  v_exists boolean;
  v_bump int;
begin
  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
    and is_active = true
  limit 1;

  if v_quest_id is null then
    raise notice 'quest01_freitext_llm: quest-01 not found; skipping';
    return;
  end if;

  select exists (
    select 1
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-freitext-llm-demo'
  )
  into v_exists;

  if v_exists then
    raise notice 'quest01_freitext_llm: quest-01-freitext-llm-demo already present; skipping';
    return;
  end if;

  select s.order_index
  into v_match_order
  from public.game_quest_steps s
  where s.quest_id = v_quest_id
    and s.logical_task_key = 'quest-01-matching-demo'
    and s.is_active = true
  limit 1;

  if v_match_order is null then
    raise notice 'quest01_freitext_llm: quest-01-matching-demo not found; skipping';
    return;
  end if;

  v_ins_order := v_match_order + 1;

  select coalesce(max(s.order_index), 0) + 10000
  into v_bump
  from public.game_quest_steps s
  where s.quest_id = v_quest_id;

  -- Two-phase bump: unique (quest_id, order_index) + non-negative check forbid single-pass +1.
  update public.game_quest_steps
  set
    order_index = order_index + v_bump,
    updated_at = now()
  where quest_id = v_quest_id
    and order_index >= v_ins_order;

  update public.game_quest_steps
  set
    order_index = order_index - v_bump + 1,
    updated_at = now()
  where quest_id = v_quest_id
    and order_index >= v_ins_order + v_bump;

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
  values (
    v_quest_id,
    v_ins_order,
    'task',
    'FreitextLlm',
    'task.freitext.llm',
    'quest-01-freitext-llm-demo',
    $ft${
      "prompt": "Scrivi in italiano 2–3 frasi sul tuo mestiere dei sogni. Usa almeno un pronome relativo (es.: «Il lavoro che sceglieresti…» oppure «Un mestiere dove…»).",
      "instruction": "Puoi anche spiegare in tedesco perché questo passo sia difficile, ma la parte obbligatoria è la formulazione italiana sopra.",
      "targetLanguage": "it-CH",
      "showWordCount": true,
      "showCharacterCount": true,
      "minWords": 12,
      "maxWords": 90,
      "evaluation": {
        "grammarWeight": 1,
        "vocabularyWeight": 1,
        "registerWeight": 1,
        "passThreshold": 0.68,
        "registerTarget": "neutral",
        "scoringPolicy": "threshold_pass",
        "maxPoints": 5,
        "evaluationCriteria": [
          "Morphology and sentence agreement stay consistent for A2/B1 learner Italian",
          "Word choice aligns with professions + relative clauses",
          "Tone fits classroom explanatory register"
        ],
        "targetStructures": [
          "relative pronouns (che, cui, dove)",
          "job titles (il dottore, l'ingegnere)",
          "short descriptions with essere / fare"
        ]
      }
    }$ft$::jsonb,
    '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb,
    true
  );
end $$;
