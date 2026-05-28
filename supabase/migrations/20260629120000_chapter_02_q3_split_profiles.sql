-- Chapter 2 Akt 2.2: split monolithic profiles+identikit SpecialScreen into photo grid + three ClozeText steps.
-- KEEP IN SYNC: q3s1_photo, q3s2_saviano, q3s3_delpiero, q3s4_ferragni must match 20260627150000 chapter-02 quest-03 rows.

with quest_ref as (
  select q.id as quest_id
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-02'
    and q.slug = 'chapter-02-quest-03-school-project'
)
-- Free order_index 2–4 and move bridge/quiz/outro to 5–7.
update public.game_quest_steps s
set order_index = s.order_index + 10, updated_at = now()
from quest_ref qr
where s.quest_id = qr.quest_id
  and s.order_index >= 2;

update public.game_quest_steps s
set order_index = s.order_index - 7, updated_at = now()
from quest_ref qr
where s.quest_id = qr.quest_id
  and s.order_index >= 10;

-- Retire legacy combined SpecialScreen step (replaced by photo + identikit tasks).
update public.game_quest_steps s
set is_active = false, updated_at = now()
from quest_ref qr
where s.quest_id = qr.quest_id
  and s.logical_task_key = 'chapter-02-q3-profiles-identikit';

-- Photo profiles (order 1): replace payload on same slot if row still uses old logical key, else upsert via conflict.
update public.game_quest_steps s
set
  step_kind = 'task',
  task_type = 'SpecialScreen',
  template_key = 'task.special-screen.profiles-photo',
  logical_task_key = 'chapter-02-q3-profiles-photo',
  content_payload = $q3s1_photo${
    "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-desk-home",
    "screenVariant": "photo",
    "title": "Italiani famosi",
    "subtitle": "Apri ogni scheda e leggi il profilo. Usa «→» per passare da una persona all'altra.",
    "photoViewerChrome": {
      "displayMode": "grid4",
      "showCaptions": true,
      "items": [
        { "id": "saviano", "assetId": "static/chapter-02/famous/saviano", "caption": "Roberto Saviano" },
        { "id": "del-piero", "assetId": "static/chapter-02/famous/del-piero", "caption": "Alessandro Del Piero" },
        { "id": "ferragni", "assetId": "static/chapter-02/famous/ferragni", "caption": "Chiara Ferragni" }
      ]
    },
    "blocks": []
  }$q3s1_photo$::jsonb,
  reward_rules = '{}'::jsonb,
  is_active = true,
  updated_at = now()
from quest_ref qr
where s.quest_id = qr.quest_id
  and s.order_index = 1;

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
select
  qr.quest_id,
  v.order_index,
  v.step_kind,
  v.task_type,
  v.template_key,
  v.logical_task_key,
  v.content_payload::jsonb,
  v.reward_rules::jsonb,
  true
from quest_ref qr
cross join (
  values
    (
      2,
      'task',
      'ClozeText',
      'task.cloze-text',
      'chapter-02-q3-identikit-saviano',
      $q3s2_saviano${
        "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-desk-home",
        "prompt": "Identikit: Roberto Saviano — completa con le informazioni del profilo.",
        "referenceDocument": {
          "documentId": "profile-saviano",
          "title": "Roberto Saviano",
          "buttonLabel": "Leggi il profilo",
          "bodyText": "Roberto Saviano è nato il 22 settembre 1979. Nei suoi articoli e libri racconta normalmente della criminalità organizzata, soprattutto della Camorra. Di sicuro è diventato famoso per il suo libro \"Gomorra\" (2006). Il libro parla della Camorra in Campania perché l'autore è cresciuto in quella zona. Per questo conosce bene i problemi che ci sono lì. Tuttavia è specialmente con la pubblicazione di \"Gomorra\" che la sua vita cammina veloce in un'altra direzione. Da allora non può più vivere senza scorta, cioè senza poliziotti che gli stanno vicino. Se vuole andare al cinema o si sente male e deve andare dal dottore, parla con gli uomini della scorta che lo accompagnano subito. E chiaramente deve chiedere ai suoi \"ragazzi\" se vuole prendere velocemente un caffè al bar. Tutto sommato, non è sempre una vita facile. Saviano però continua a lottare. Non solo non si arrende, ma lavora sodo e fa in continuazione nuove indagini: nel 2020 è uscito il suo ultimo libro \"Gridalo\", un libro con cui chiede a tutti di avere il coraggio di non stare zitti e parlare sempre apertamente dei problemi."
        },
        "caseSensitive": false,
        "lines": [
          { "segments": [{ "kind": "text", "text": "nome: " }, { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["Roberto Saviano"] }] },
          { "segments": [{ "kind": "text", "text": "età (oppure data di nascita): " }, { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["nato il 22 settembre 1979", "22 settembre 1979"] }] },
          { "segments": [{ "kind": "text", "text": "regione d'origine: " }, { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["Campania"] }] },
          { "segments": [{ "kind": "text", "text": "professione: " }, { "kind": "gap", "placeholder": "…", "maxLength": 48, "correctAnswers": ["scrittore e giornalista", "scrittore", "giornalista"] }] },
          { "segments": [{ "kind": "text", "text": "È famoso/a perché … " }, { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha scritto il libro Gomorra", "ha scritto il libro \"Gomorra\"", "ha scritto Gomorra", "ha scritto Gomorra sulla Camorra"] }] },
          { "segments": [{ "kind": "text", "text": "particolarità: " }, { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["vive con la scorta della polizia", "vive con la scorta"] }] }
        ]
      }$q3s2_saviano$,
      '{"pizza":{"mode":"flat","value":1}}'
    ),
    (
      3,
      'task',
      'ClozeText',
      'task.cloze-text',
      'chapter-02-q3-identikit-del-piero',
      $q3s3_delpiero${
        "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-desk-home",
        "prompt": "Identikit: Alessandro Del Piero — completa con le informazioni del profilo.",
        "referenceDocument": {
          "documentId": "profile-del-piero",
          "title": "Alessandro Del Piero",
          "buttonLabel": "Leggi il profilo",
          "bodyText": "Alessandro Del Piero è nato il 9 novembre 1974 a Conegliano, una piccola città in Veneto. Da bambino la sua famiglia non era ricca: il padre lavorava come elettricista e la madre stava a casa. Lui giocava a calcio nelle strade del paese con il fratello maggiore Stefano. A tredici anni è entrato nella squadra giovanile del Padova, e a diciotto anni è arrivato alla Juventus, una delle squadre più famose d'Italia. Ha giocato per la Juventus per diciannove anni: nessun altro giocatore ha fatto la stessa cosa. Per questo i tifosi gli hanno dato il soprannome \"Pinturicchio\" e poi \"Capitano\". Con la Juventus ha vinto molti campionati italiani, ma il momento più bello della sua carriera è arrivato nel 2006: con la nazionale italiana ha vinto la Coppa del Mondo in Germania. Tutti gli italiani ricordano il suo gol nella semifinale contro i tedeschi. Oggi Del Piero non gioca più, ma lavora come commentatore in TV e aiuta i giovani calciatori con la sua fondazione. È sposato con Sonia e ha tre figli."
        },
        "caseSensitive": false,
        "lines": [
          { "segments": [{ "kind": "text", "text": "nome: " }, { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["Alessandro Del Piero"] }] },
          { "segments": [{ "kind": "text", "text": "età (oppure data di nascita): " }, { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["nato il 9 novembre 1974", "9 novembre 1974"] }] },
          { "segments": [{ "kind": "text", "text": "regione d'origine: " }, { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["Veneto"] }] },
          { "segments": [{ "kind": "text", "text": "professione: " }, { "kind": "gap", "placeholder": "…", "maxLength": 48, "correctAnswers": ["calciatore", "commentatore TV", "calciatore e commentatore TV"] }] },
          { "segments": [{ "kind": "text", "text": "È famoso/a perché … " }, { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha giocato diciannove anni nella Juventus", "ha vinto la Coppa del Mondo nel 2006", "ha giocato nella Juventus per diciannove anni"] }] },
          { "segments": [{ "kind": "text", "text": "particolarità: " }, { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha una fondazione per giovani calciatori", "fondazione per giovani calciatori"] }] }
        ]
      }$q3s3_delpiero$,
      '{"pizza":{"mode":"flat","value":1}}'
    ),
    (
      4,
      'task',
      'ClozeText',
      'task.cloze-text',
      'chapter-02-q3-identikit-ferragni',
      $q3s4_ferragni${
        "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-desk-home",
        "prompt": "Identikit: Chiara Ferragni — completa con le informazioni del profilo.",
        "referenceDocument": {
          "documentId": "profile-ferragni",
          "title": "Chiara Ferragni",
          "buttonLabel": "Leggi il profilo",
          "bodyText": "Chiara Ferragni è nata il 7 maggio 1987 a Cremona, in Lombardia. Da ragazza studiava legge all'università di Milano, ma la sua vera passione era la moda. Nel 2009, quando aveva solo ventidue anni, ha aperto un blog di moda chiamato \"The Blonde Salad\". All'inizio nessuno credeva nel suo progetto, ma in pochi anni il blog è diventato famosissimo in tutto il mondo. Oggi Chiara è una delle influencer più conosciute del pianeta: sui suoi profili social la seguono milioni di persone. Ha creato anche una sua linea di moda, \"Chiara Ferragni Collection\", con scarpe, vestiti e accessori. Nel 2018 si è sposata con il rapper Fedez in una cerimonia spettacolare in Sicilia. Hanno avuto due figli, Leone e Vittoria, e per anni la loro vita è stata seguita dai fan su Instagram. Nel 2024 però la coppia si è separata e Chiara ha vissuto un periodo difficile, anche per un caso legato a un dolce di Natale, il \"pandoro Balocco\". Però continua a lavorare ed è ancora una delle donne più importanti del mondo della moda in Italia."
        },
        "caseSensitive": false,
        "lines": [
          { "segments": [{ "kind": "text", "text": "nome: " }, { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["Chiara Ferragni"] }] },
          { "segments": [{ "kind": "text", "text": "età (oppure data di nascita): " }, { "kind": "gap", "placeholder": "…", "maxLength": 32, "correctAnswers": ["nata il 7 maggio 1987", "7 maggio 1987"] }] },
          { "segments": [{ "kind": "text", "text": "regione d'origine: " }, { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["Lombardia"] }] },
          { "segments": [{ "kind": "text", "text": "professione: " }, { "kind": "gap", "placeholder": "…", "maxLength": 48, "correctAnswers": ["influencer", "imprenditrice di moda", "influencer e imprenditrice di moda"] }] },
          { "segments": [{ "kind": "text", "text": "È famoso/a perché … " }, { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha aperto il blog The Blonde Salad", "è una delle influencer più conosciute al mondo", "The Blonde Salad"] }] },
          { "segments": [{ "kind": "text", "text": "particolarità: " }, { "kind": "gap", "placeholder": "…", "maxLength": 80, "correctAnswers": ["ha la sua linea di moda Chiara Ferragni Collection", "Chiara Ferragni Collection"] }] }
        ]
      }$q3s4_ferragni$,
      '{"pizza":{"mode":"flat","value":1},"backpack":{"mode":"first_completion","value":1}}'
    )
) as v(
  order_index,
  step_kind,
  task_type,
  template_key,
  logical_task_key,
  content_payload,
  reward_rules
)
on conflict (quest_id, order_index) do update
set
  step_kind = excluded.step_kind,
  task_type = excluded.task_type,
  template_key = excluded.template_key,
  logical_task_key = excluded.logical_task_key,
  content_payload = excluded.content_payload,
  reward_rules = excluded.reward_rules,
  is_active = excluded.is_active,
  updated_at = now();
