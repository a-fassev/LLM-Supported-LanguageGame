      (
        'chapter-04-quest-03-mail-consolation',
        0,
        'cutscene',
        null::text,
        'cutscene.mail-intro',
        'chapter-04-q3-cutscene-intro',
        $q3s0${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bedroom-desk-evening",
  "beats": [
    {
      "presentationMode": "narrator",
      "body": "Sei tornato/a nella tua camera a casa Ferrari. È sera, la lampada sulla scrivania illumina il laptop."
    },
    {
      "presentationMode": "innerMonologue",
      "body": "Ho cercato un articolo in tedesco su come consolare qualcuno con il mal d'amore. Prendo i consigli più importanti e scrivo una mail in italiano a Sara."
    }
  ]
}$q3s0$,
        '{}'
      ),      (
        'chapter-04-quest-03-mail-consolation',
        1,
        'task',
        'FreitextLlm',
        'task.freitext.llm',
        'chapter-04-q3-freitext-mail-sara',
        $q3s1${
  "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-04/ph-ts-bedroom-desk-evening",
  "prompt": "Scrivi una mail di consolazione a Sara",
  "instruction": "Riassumi almeno 3-4 consigli dell'articolo in italiano. Saluto informale, congiuntivo/infinito, 80-120 parole circa.",
  "referenceDocument": {
    "documentId": "articolo-liebeskummer-de",
    "title": "Wie tröste ich jemanden bei Liebeskummer?",
    "bodyText": "Wie tröste ich jemanden bei Liebeskummer?\n\nDaniela van Santen ist Liebeskummer-Coach. Zu ihr kommen Menschen, die vor lauter Liebeskrankheit nicht mehr weiterwissen. Auf die Frage, was das Wichtigste beim Trösten sei, rät sie: „Zuhören, zuhören, zuhören, trösten und nachfragen, wie es so geht. Und zwar immer und immer wieder.\"\n\nUnglücklich Verliebte neigen oft dazu, die Geschichten, die sie belasten, so oft zu erzählen, bis man sie simultan mitsprechen kann.\n\nFünf Tipps für den perfekten Liebeskummertrost:\n1. Zuhören, Zuhören und fragen! Auch wenn der Betroffene die Geschichte zum 100sten Mal erzählt, muss man da als guter Freund/gute Freundin durch. Mit der eigenen Meinung hinter dem Berg halten.\n2. Sprich auf keinen Fall über deine eigenen Erfahrungen.\n3. Behalte Sprüche wie „Das wird schon wieder\" für dich.\n4. Sich die Rachegedanken des Gegenübers anzuhören ist eine Sache — zu ermuntern oder sogar beim Umsetzen zu helfen, strikt verboten.\n5. Bitte niemals von der eigenen glücklichen Beziehung erzählen.",
    "buttonLabel": "Articolo originale"
  },
  "targetLanguage": "it",
  "showWordCount": true,
  "showCharacterCount": true,
  "minWords": 60,
  "maxWords": 180,
  "evaluation": {
    "grammarWeight": 1,
    "vocabularyWeight": 1,
    "registerWeight": 1,
    "passThreshold": 0.65,
    "registerTarget": "informal",
    "scoringPolicy": "threshold_pass",
    "maxPoints": 5,
    "evaluationCriteria": [
      "At least three tips from the German article transferred to Italian",
      "Adapted to Sara's breakup situation; empathetic informal tone",
      "Correct congiuntivo after volere che / pensare che / è importante che; infinito where needed",
      "Informal greeting and closing (Cara Sara / Un abbraccio)"
    ],
    "targetStructures": [
      "Sprachmittlung Deutsch–Italienisch",
      "congiuntivo e infinito",
      "e-mail informale"
    ]
  }
}$q3s1$,
        '{"pizza":{"mode":"scored","maxSlices":2,"minRatioToComplete":0.01,"rounding":"floor","mapping":{"kind":"linear"}},"backpack":{"mode":"first_completion","value":1}}'
      ),      (
        'chapter-04-quest-03-mail-consolation',
        2,
        'cutscene',
        null::text,
        'cutscene.mail-outro',
        'chapter-04-q3-cutscene-outro',
        $q3s2${
  "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-04/ph-cs-bedroom-desk-evening",
  "beats": [
    {
      "presentationMode": "innerMonologue",
      "body": "Salvo... invio! Spero che la aiuti un po'."
    },
    {
      "presentationMode": "narrator",
      "body": "Chiudi il laptop. Domattina sulla mappa sarà visibile un nuovo messaggio da Sara."
    }
  ]
}$q3s2$,
        '{}'
      ),