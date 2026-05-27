-- Chapter 2 review fixes (KEEP IN SYNC: q3s1_fix payload must match 20260627150000 q3s1)
-- Post-deploy delta for databases that received pre-review chapter-02 payloads.

update public.game_quest_steps s
set
  content_payload = jsonb_set(
    s.content_payload,
    '{targets,2,correctItemIds}',
    '["f-inizio"]'::jsonb,
    false
  ),
  updated_at = now()
where s.logical_task_key = 'chapter-02-q4-dragdrop-motivation-letter';

update public.game_quest_steps s
set
  content_payload = $q3s1_fix${
    "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-desk-home",
    "screenVariant": "photo",
    "title": "Italiani famosi",
    "subtitle": "Leggi i profili con «→», poi completa l'identikit.",
    "photoViewerChrome": {
      "displayMode": "grid4",
      "items": [
        { "id": "saviano", "assetId": "static/chapter-02/famous/saviano", "caption": "Roberto Saviano" },
        { "id": "del-piero", "assetId": "static/chapter-02/famous/del-piero", "caption": "Alessandro Del Piero" },
        { "id": "ferragni", "assetId": "static/chapter-02/famous/ferragni", "caption": "Chiara Ferragni" }
      ]
    },
    "blocks": [
      {
        "blockType": "stub",
        "stub": {
          "headline": "Roberto Saviano",
          "body": "Roberto Saviano è nato il 22 settembre 1979. Nei suoi articoli e libri racconta normalmente della criminalità organizzata, soprattutto della Camorra. Di sicuro è diventato famoso per il suo libro \"Gomorra\" (2006). Il libro parla della Camorra in Campania perché l'autore è cresciuto in quella zona. Per questo conosce bene i problemi che ci sono lì. Tuttavia è specialmente con la pubblicazione di \"Gomorra\" che la sua vita cammina veloce in un'altra direzione. Da allora non può più vivere senza scorta, cioè senza poliziotti che gli stanno vicino. Se vuole andare al cinema o si sente male e deve andare dal dottore, parla con gli uomini della scorta che lo accompagnano subito. E chiaramente deve chiedere ai suoi \"ragazzi\" se vuole prendere velocemente un caffè al bar. Tutto sommato, non è sempre una vita facile. Saviano però continua a lottare. Non solo non si arrende, ma lavora sodo e fa in continuazione nuove indagini: nel 2020 è uscito il suo ultimo libro \"Gridalo\", un libro con cui chiede a tutti di avere il coraggio di non stare zitti e parlare sempre apertamente dei problemi."
        }
      },
      {
        "blockType": "stub",
        "stub": {
          "headline": "Alessandro Del Piero",
          "body": "Alessandro Del Piero è nato il 9 novembre 1974 a Conegliano, una piccola città in Veneto. Da bambino la sua famiglia non era ricca: il padre lavorava come elettricista e la madre stava a casa. Lui giocava a calcio nelle strade del paese con il fratello maggiore Stefano. A tredici anni è entrato nella squadra giovanile del Padova, e a diciotto anni è arrivato alla Juventus, una delle squadre più famose d'Italia. Ha giocato per la Juventus per diciannove anni: nessun altro giocatore ha fatto la stessa cosa. Per questo i tifosi gli hanno dato il soprannome \"Pinturicchio\" e poi \"Capitano\". Con la Juventus ha vinto molti campionati italiani, ma il momento più bello della sua carriera è arrivato nel 2006: con la nazionale italiana ha vinto la Coppa del Mondo in Germania. Tutti gli italiani ricordano il suo gol nella semifinale contro i tedeschi. Oggi Del Piero non gioca più, ma lavora come commentatore in TV e aiuta i giovani calciatori con la sua fondazione. È sposato con Sonia e ha tre figli."
        }
      },
      {
        "blockType": "stub",
        "stub": {
          "headline": "Chiara Ferragni",
          "body": "Chiara Ferragni è nata il 7 maggio 1987 a Cremona, in Lombardia. Da ragazza studiava legge all'università di Milano, ma la sua vera passione era la moda. Nel 2009, quando aveva solo ventidue anni, ha aperto un blog di moda chiamato \"The Blonde Salad\". All'inizio nessuno credeva nel suo progetto, ma in pochi anni il blog è diventato famosissimo in tutto il mondo. Oggi Chiara è una delle influencer più conosciute del pianeta: sui suoi profili social la seguono milioni di persone. Ha creato anche una sua linea di moda, \"Chiara Ferragni Collection\", con scarpe, vestiti e accessori. Nel 2018 si è sposata con il rapper Fedez in una cerimonia spettacolare in Sicilia. Hanno avuto due figli, Leone e Vittoria, e per anni la loro vita è stata seguita dai fan su Instagram. Nel 2024 però la coppia si è separata e Chiara ha vissuto un periodo difficile, anche per un caso legato a un dolce di Natale, il \"pandoro Balocco\". Però continua a lavorare ed è ancora una delle donne più importanti del mondo della moda in Italia."
        }
      },
      {
        "blockType": "cloze_text",
        "clozeText": {
          "optional": true,
          "prompt": "Identikit: Roberto Saviano — completa con le informazioni del testo.",
          "caseSensitive": false,
          "lines": [
            {
              "segments": [
                { "kind": "text", "text": "nome: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["Roberto Saviano"] },
                { "kind": "text", "text": "\netà (oppure data di nascita): " },
                { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["nato il 22 settembre 1979", "22 settembre 1979"] },
                { "kind": "text", "text": "\nregione d'origine: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["Campania"] },
                { "kind": "text", "text": "\nprofessione: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 48, "correctAnswers": ["scrittore e giornalista", "scrittore", "giornalista"] },
                { "kind": "text", "text": "\nÈ famoso/a perché … " },
                { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha scritto il libro Gomorra", "ha scritto il libro \"Gomorra\"", "ha scritto Gomorra", "ha scritto Gomorra sulla Camorra"] },
                { "kind": "text", "text": "\nparticolarità: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["vive con la scorta della polizia", "vive con la scorta"] }
              ]
            }
          ]
        }
      },
      {
        "blockType": "cloze_text",
        "clozeText": {
          "optional": true,
          "prompt": "Identikit: Alessandro Del Piero — completa con le informazioni del testo.",
          "caseSensitive": false,
          "lines": [
            {
              "segments": [
                { "kind": "text", "text": "nome: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["Alessandro Del Piero"] },
                { "kind": "text", "text": "\netà (oppure data di nascita): " },
                { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["nato il 9 novembre 1974", "9 novembre 1974"] },
                { "kind": "text", "text": "\nregione d'origine: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["Veneto"] },
                { "kind": "text", "text": "\nprofessione: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 48, "correctAnswers": ["calciatore", "commentatore TV", "calciatore e commentatore TV"] },
                { "kind": "text", "text": "\nÈ famoso/a perché … " },
                { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha giocato diciannove anni nella Juventus", "ha vinto la Coppa del Mondo nel 2006", "ha giocato nella Juventus per diciannove anni"] },
                { "kind": "text", "text": "\nparticolarità: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha una fondazione per giovani calciatori", "fondazione per giovani calciatori"] }
              ]
            }
          ]
        }
      },
      {
        "blockType": "cloze_text",
        "clozeText": {
          "optional": true,
          "prompt": "Identikit: Chiara Ferragni — completa con le informazioni del testo.",
          "caseSensitive": false,
          "lines": [
            {
              "segments": [
                { "kind": "text", "text": "nome: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["Chiara Ferragni"] },
                { "kind": "text", "text": "\netà (oppure data di nascita): " },
                { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["nata il 7 maggio 1987", "7 maggio 1987"] },
                { "kind": "text", "text": "\nregione d'origine: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["Lombardia"] },
                { "kind": "text", "text": "\nprofessione: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 48, "correctAnswers": ["influencer", "imprenditrice di moda", "influencer e imprenditrice di moda"] },
                { "kind": "text", "text": "\nÈ famoso/a perché … " },
                { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha aperto il blog The Blonde Salad", "è una delle influencer più conosciute al mondo", "The Blonde Salad"] },
                { "kind": "text", "text": "\nparticolarità: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha la sua linea di moda Chiara Ferragni Collection", "Chiara Ferragni Collection"] }
              ]
            }
          ]
        }
      }
    ]
  }$q3s1_fix$::jsonb,
  updated_at = now()
where s.logical_task_key = 'chapter-02-q3-profiles-identikit';
