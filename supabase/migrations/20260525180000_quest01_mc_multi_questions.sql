-- Extend quest-01 MultipleChoice demo: several questions (single- and multi-select).
-- Applies to the row created by 20260524120000_quest01_multiple_choice_after_dragdrop.sql.

update public.game_quest_steps
set
  content_payload = $mc${
  "prompt": "Saluti e colori",
  "subtitle": "Rispondi a tutte le domande, poi premi Check.",
  "questions": [
    {
      "id": "q1",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "stem": [
        { "kind": "text", "text": "È mattina e incontri l'insegnante in classe. Cosa dici?" }
      ],
      "options": [
        { "id": "a", "label": "Buongiorno!" },
        { "id": "b", "label": "Buonanotte!" },
        { "id": "c", "label": "A dopo!" },
        { "id": "d", "label": "Arrivederci!" }
      ],
      "correctOptionIds": ["a"]
    },
    {
      "id": "q2",
      "selectionMode": "multiple",
      "preserveOptionOrder": true,
      "stem": [
        { "kind": "text", "text": "Quali colori sono nel tricolore italiano? (Più di una risposta.)" }
      ],
      "options": [
        { "id": "verde", "label": "Verde" },
        { "id": "bianco", "label": "Bianco" },
        { "id": "rosso", "label": "Rosso" },
        { "id": "blu", "label": "Blu" }
      ],
      "correctOptionIds": ["verde", "bianco", "rosso"]
    },
    {
      "id": "q3",
      "selectionMode": "single",
      "stem": [
        { "kind": "text", "text": "Cosa significa «Grazie»?" }
      ],
      "options": [
        { "id": "x", "label": "Grazie / Danke" },
        { "id": "y", "label": "Ciao / Auf Wiedersehen" },
        { "id": "z", "label": "Per favore / Bitte" }
      ],
      "correctOptionIds": ["x"]
    }
  ]
}$mc$::jsonb,
  updated_at = now()
where logical_task_key = 'quest-01-multiple-choice-demo';
