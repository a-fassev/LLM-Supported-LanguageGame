-- Nutelleria cloze: split dialogue into multiple lines[] rows for readable UITK layout.
-- KEEP IN SYNC: q2s1_lines payload must match gap order in 20260627150000 q2s1 (single-line version).

update public.game_quest_steps s
set
  content_payload = $q2s1_lines${
    "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-nutelleria-interior",
    "prompt": "Parla con Dario del suo sogno. Scegli l'avverbio o l'aggettivo, poi completa con i possessivi (con o senza articolo) e i verbi al futuro.",
    "caseSensitive": false,
    "lines": [
      {
        "segments": [
          { "kind": "text", "text": "Tu: Allora, com'è andata con l'archeologa?\nDario: " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["Benissimo", "benissimo"] },
          { "kind": "text", "text": "! Sai, ho deciso che " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["farò", "faro"] },
          { "kind": "text", "text": " l'archeologo anch'io!" }
        ]
      },
      {
        "segments": [
          { "kind": "text", "text": "Tu: Davvero? Ma non " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["avrai", "Avrai"] },
          { "kind": "text", "text": " bisogno di voti più alti per farlo? Sono questi che ti " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["mancano", "Mancano"] },
          { "kind": "text", "text": "." }
        ]
      },
      {
        "segments": [
          { "kind": "text", "text": "Dario: Sì, certo. Da domani " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["studierò", "studiero"] },
          { "kind": "text", "text": " tutti i giorni. Così gli insegnanti mi " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["daranno", "Daranno"] },
          { "kind": "text", "text": " " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["buoni", "Buoni"] },
          { "kind": "text", "text": " voti. " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["I miei", "i miei"] },
          { "kind": "text", "text": " genitori " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["saranno", "Saranno"] },
          { "kind": "text", "text": " contentissimi. Che dici: " },
          { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["la", "La"] },
          { "kind": "text", "text": " mamma mi " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["comprerà", "comprera"] },
          { "kind": "text", "text": " il libro sull'archeologia che abbiamo visto ieri? " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["Prenderò", "prenderò", "prendero"] },
          { "kind": "text", "text": " un " },
          { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["buon", "Buon"] },
          { "kind": "text", "text": " voto naturalmente! " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["Smetterò", "smetterò", "smettero"] },
          { "kind": "text", "text": " anche di chiacchierare con gli altri, anche se " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["sarà", "sara", "Sarà"] },
          { "kind": "text", "text": " " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["difficile", "Difficile"] },
          { "kind": "text", "text": "." }
        ]
      },
      {
        "segments": [
          { "kind": "text", "text": "Tu: Così alla fine " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["farai", "Farai"] },
          { "kind": "text", "text": " un'ottima maturità. Non " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["sarà", "sara", "Sarà"] },
          { "kind": "text", "text": " mica " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["facile", "Facile"] },
          { "kind": "text", "text": "." }
        ]
      },
      {
        "segments": [
          { "kind": "text", "text": "Dario: Ma che cosa " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["penserete", "Penserete"] },
          { "kind": "text", "text": " voi di questa " },
          { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["mia", "Mia"] },
          { "kind": "text", "text": " idea?" }
        ]
      },
      {
        "segments": [
          { "kind": "text", "text": "Tu: Boh, la " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["accetteranno", "Accetteranno"] },
          { "kind": "text", "text": "." }
        ]
      },
      {
        "segments": [
          { "kind": "text", "text": "Dario: E tu? Sai già cosa " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["farai", "Farai"] },
          { "kind": "text", "text": " dopo " },
          { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["la", "La"] },
          { "kind": "text", "text": " maturità?" }
        ]
      },
      {
        "segments": [
          { "kind": "text", "text": "Tu: Sì, ho già una mezza idea su " },
          { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["il mio", "Il mio"] },
          { "kind": "text", "text": " futuro. Sai che mi piace molto la musica e proprio ieri ho sentito un'intervista...\nDario: Ah, interessante, dimmi tutto. " },
          { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["Potremmo", "potremmo"] },
          { "kind": "text", "text": " mangiare qualcosa insieme e tu racconti. Che ne dici?" }
        ]
      }
    ]
  }$q2s1_lines$::jsonb,
  updated_at = now()
where s.logical_task_key = 'chapter-02-q2-cloze-archeologo';
