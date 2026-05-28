-- Chapter 2 (Akt 2.0–2.3 + bonus): narrative content from docs/narrative/chapter-2.md
-- Five quests in chapter-02: bridge (2.0), Nutelleria / school project / restaurant (parallel after bridge), bonus vocab.
-- Idempotent upserts on chapter slug, (chapter_id, quest slug), (quest_id, order_index).

insert into public.game_chapters (slug, display_name, order_index, theme_payload, is_active)
values (
  'chapter-02',
  'Capitolo 2: Giornata libera',
  1,
  '{"background":"static/navigation/backgrounds/ph-st-nav-chapter-bg","music":"chapter2-theme","paletteKey":"chapter2"}'::jsonb,
  true
)
on conflict (slug) do update
set
  display_name = excluded.display_name,
  order_index = excluded.order_index,
  theme_payload = excluded.theme_payload,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.game_quests (
  chapter_id,
  slug,
  display_name,
  order_index,
  unlock_rules,
  meta_payload,
  is_active
)
select
  c.id,
  q.slug,
  q.display_name,
  q.order_index,
  q.unlock_rules::jsonb,
  q.meta_payload::jsonb,
  true
from public.game_chapters c
join (
  values
    (
      'chapter-02-quest-01-morning-bridge',
      'Akt 2.0: La mattina a casa',
      0,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-01-quest-03-bar"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":true}}'
    ),
    (
      'chapter-02-quest-02-nutelleria',
      'Akt 2.1: Nutelleria con Dario',
      1,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-02-quest-01-morning-bridge"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    ),
    (
      'chapter-02-quest-03-school-project',
      'Akt 2.2: Progetto scolastico a casa',
      2,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-02-quest-01-morning-bridge"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    ),
    (
      'chapter-02-quest-04-restaurant',
      'Akt 2.3: Trattoria da Marini',
      3,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-02-quest-01-morning-bridge"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    ),
    (
      'chapter-02-quest-05-bonus-vocab',
      'Bonus: Parole della lezione 2',
      4,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-02-quest-02-nutelleria","chapter-02-quest-03-school-project","chapter-02-quest-04-restaurant"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    )
) as q(slug, display_name, order_index, unlock_rules, meta_payload)
  on c.slug = 'chapter-02'
on conflict (chapter_id, slug) do update
set
  display_name = excluded.display_name,
  order_index = excluded.order_index,
  unlock_rules = excluded.unlock_rules,
  meta_payload = excluded.meta_payload,
  is_active = excluded.is_active,
  updated_at = now();

with quest_refs as (
  select q.id, q.slug
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where c.slug = 'chapter-02'
    and q.slug in (
      'chapter-02-quest-01-morning-bridge',
      'chapter-02-quest-02-nutelleria',
      'chapter-02-quest-03-school-project',
      'chapter-02-quest-04-restaurant',
      'chapter-02-quest-05-bonus-vocab'
    )
),
seed_steps as (
  select
    qr.id as quest_id,
    s.order_index,
    s.step_kind,
    s.task_type,
    s.template_key,
    s.logical_task_key,
    s.content_payload::jsonb,
    s.reward_rules::jsonb
  from quest_refs qr
  join (
    values
      -- Quest 1: morning bridge (Akt 2.0)
      (
        'chapter-02-quest-01-morning-bridge',
        0,
        'cutscene',
        null::text,
        'cutscene.morning-bridge',
        'chapter-02-q1-cutscene-morning-bridge',
        $q1s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-bedroom-morning",
          "beats": [
            { "presentationMode": "narrator", "body": "Hai dormito bene nella tua nuova camera. La signora Ferrari ti ha lasciato la colazione in tavola: pane, marmellata, un cappuccino." },
            { "presentationMode": "innerMonologue", "body": "Oggi ho un po' di tempo libero. Devo finire un progetto per la scuola su un italiano famoso. E poi ho letto che un ristorante qui in centro cerca personale per l'estate — magari vado a vedere. Ma prima voglio fare un giro per la città..." },
            { "presentationMode": "narrator", "body": "Sulla mappa di Bologna si illuminano tre nuovi posti: una Nutelleria nel centro, la tua casa (per il progetto di scuola) e un ristorante in centro. Scegli dove andare per primo." }
          ],
          "navigation": { "blockBack": true }
        }$q1s0$,
        '{}'
      ),

      -- Quest 2: Nutelleria (Akt 2.1)
      (
        'chapter-02-quest-02-nutelleria',
        0,
        'cutscene',
        null::text,
        'cutscene.nutelleria-intro',
        'chapter-02-q2-cutscene-nutelleria-intro',
        $q2s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-nutelleria-interior",
          "npcCast": [
            { "id": "dario", "displayName": "Dario", "portraitId": "dario", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "narrator", "body": "Cammini sotto i portici e ti fermi davanti a un locale che hai sentito nominare tante volte: la Nutelleria. Profumo di crêpe e di cioccolato. Entri e ti siedi a un tavolino vicino alla finestra." },
            { "presentationMode": "narrator", "body": "A un tavolo vicino c'è un ragazzo che riconosci subito: è Dario, un compagno della tua nuova classe al Liceo Galvani. Ti vede e ti fa un cenno con la mano." },
            { "presentationMode": "npcDialog", "speakerId": "dario", "body": "Ehi, ciao! Anche tu qui? Vieni, siediti con me. Non posso credere a quello che mi è successo oggi!" },
            { "presentationMode": "innerMonologue", "body": "Ciao Dario! Cosa è successo?" },
            { "presentationMode": "npcDialog", "speakerId": "dario", "body": "Ho appena parlato con Elena, un'amica di mia madre. Lei fa l'archeologa e mi ha raccontato del suo lavoro. È stato bellissimo! Sai, ho deciso: da grande voglio fare l'archeologo anch'io!" },
            { "presentationMode": "innerMonologue", "body": "Dario sembra davvero entusiasta. Vediamo se i suoi piani sono realistici..." }
          ]
        }$q2s0$,
        '{}'
      ),
      (
        'chapter-02-quest-02-nutelleria',
        1,
        'task',
        'ClozeText',
        'task.cloze-text',
        'chapter-02-q2-cloze-archeologo',
        $q2s1${
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
                { "kind": "text", "text": " l'archeologo anch'io!\nTu: Davvero? Ma non " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["avrai", "Avrai"] },
                { "kind": "text", "text": " bisogno di voti più alti per farlo? Sono questi che ti " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["mancano", "Mancano"] },
                { "kind": "text", "text": ".\nDario: Sì, certo. Da domani " },
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
                { "kind": "text", "text": ".\nTu: Così alla fine " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["farai", "Farai"] },
                { "kind": "text", "text": " un'ottima maturità. Non " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["sarà", "sara", "Sarà"] },
                { "kind": "text", "text": " mica " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["facile", "Facile"] },
                { "kind": "text", "text": ".\nDario: Ma che cosa " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["penserete", "Penserete"] },
                { "kind": "text", "text": " voi di questa " },
                { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["mia", "Mia"] },
                { "kind": "text", "text": " idea?\nTu: Boh, la " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["accetteranno", "Accetteranno"] },
                { "kind": "text", "text": ".\nDario: E tu? Sai già cosa " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["farai", "Farai"] },
                { "kind": "text", "text": " dopo " },
                { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["la", "La"] },
                { "kind": "text", "text": " maturità?\nTu: Sì, ho già una mezza idea su " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["il mio", "Il mio"] },
                { "kind": "text", "text": " futuro. Sai che mi piace molto la musica e proprio ieri ho sentito un'intervista...\nDario: Ah, interessante, dimmi tutto. " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["Potremmo", "potremmo"] },
                { "kind": "text", "text": " mangiare qualcosa insieme e tu racconti. Che ne dici?" }
              ]
            }
          ]
        }$q2s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-02-quest-02-nutelleria',
        2,
        'cutscene',
        null::text,
        'cutscene.nutelleria-professions-bridge',
        'chapter-02-q2-cutscene-professions-bridge',
        $q2s2${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-nutelleria-interior",
          "npcCast": [
            { "id": "dario", "displayName": "Dario", "portraitId": "dario", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "dario", "body": "Sai, dopo il discorso con Elena ho pensato a tante cose. Per esempio: ma tu in Germania, conosci tanti mestieri diversi? Adesso te ne dico qualcuno e tu mi spieghi cosa fanno. Usa frasi con che, cui o dove, così pratichiamo un po'." }
          ]
        }$q2s2$,
        '{}'
      ),
      (
        'chapter-02-quest-02-nutelleria',
        3,
        'task',
        'FreitextLlm',
        'task.freitext.llm',
        'chapter-02-q2-freitext-professions',
        $q2s3${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-nutelleria-interior",
          "prompt": "Descrivi ogni professione con almeno una frase completa. Usa che, cui o dove almeno una volta per professione.",
          "instruction": "Professioni: l'architetto / l'architetto donna; il/la giornalista; il medico; il/la giardiniere/a. Esempio: «L'architetto è una persona che progetta case e edifici.»",
          "targetLanguage": "it",
          "showWordCount": true,
          "showCharacterCount": true,
          "minWords": 20,
          "maxWords": 200,
          "evaluation": {
            "grammarWeight": 1,
            "vocabularyWeight": 1,
            "registerWeight": 1,
            "passThreshold": 0.68,
            "registerTarget": "neutral",
            "scoringPolicy": "threshold_pass",
            "maxPoints": 5,
            "evaluationCriteria": [
              "Correct use of relative pronouns che, cui, dove in Italian B1 sentences",
              "Plausible job descriptions for architect, journalist, doctor, gardener",
              "Morphology and agreement appropriate for learner Italian"
            ],
            "targetStructures": [
              "relative pronouns (che, cui, dove)",
              "profession vocabulary (architetto, giornalista, medico, giardiniere)",
              "descriptive sentences with essere / lavorare"
            ]
          }
        }$q2s3$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-02-quest-02-nutelleria',
        4,
        'cutscene',
        null::text,
        'cutscene.nutelleria-outro',
        'chapter-02-q2-cutscene-outro',
        $q2s4${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-nutelleria-interior",
          "npcCast": [
            { "id": "dario", "displayName": "Dario", "portraitId": "dario", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "dario", "body": "Sei bravissimo/a! Senti, io devo andare, ho ancora molte cose da fare. Ci vediamo domani a scuola, eh! E grazie per la chiacchierata." },
            { "presentationMode": "innerMonologue", "body": "Che entusiasmo, Dario. Forse anch'io dovrei pensare di più al mio futuro. Ma adesso ho cose più urgenti: i compiti di scuola mi aspettano a casa, e cercavo anche un lavoretto per l'estate..." },
            { "presentationMode": "narrator", "body": "Esci dalla Nutelleria. Sulla mappa restano ancora due luoghi importanti per oggi: la casa della famiglia Ferrari, dove ti aspettano i compiti, e un ristorante in centro che cerca personale per l'estate." }
          ]
        }$q2s4$,
        '{}'
      ),

      -- Quest 3: school project (Akt 2.2)
      (
        'chapter-02-quest-03-school-project',
        0,
        'cutscene',
        null::text,
        'cutscene.school-project-intro',
        'chapter-02-q3-cutscene-school-intro',
        $q3s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-desk-home",
          "beats": [
            { "presentationMode": "narrator", "body": "Torni a casa della famiglia Ferrari. La signora Ferrari ti saluta dalla cucina e ti ricorda che hai i compiti da fare. Sali in camera tua, accendi il computer e apri il portale della scuola." },
            { "presentationMode": "innerMonologue", "body": "Ecco il primo vero compito per il Liceo Galvani. La Signora Wagner ci ha chiesto di scegliere un italiano famoso, di leggere il profilo e di fare un identikit. E dopo c'è anche un quiz su altre persone famose. Vediamo chi sono..." },
            { "presentationMode": "gameInfo", "body": "Clicca su ciascuna scheda per leggere il profilo. Quando hai letto i tre testi, scegli una persona e completa il suo identikit." }
          ]
        }$q3s0$,
        '{}'
      ),
      (
        'chapter-02-quest-03-school-project',
        1,
        'task',
        'SpecialScreen',
        'task.special-screen.profiles-identikit',
        'chapter-02-q3-profiles-identikit',
        $q3s1${
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
        }$q3s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-02-quest-03-school-project',
        2,
        'cutscene',
        null::text,
        'cutscene.school-quiz-bridge',
        'chapter-02-q3-cutscene-quiz-bridge',
        $q3s2${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-desk-home",
          "beats": [
            { "presentationMode": "innerMonologue", "body": "Bene, l'identikit è pronto. Adesso il quiz: la Signora Wagner ha preparato anche un gioco \"Chi sono io?\" con altre persone famose italiane. Vediamo se riesco a indovinare..." }
          ]
        }$q3s2$,
        '{}'
      ),
      (
        'chapter-02-quest-03-school-project',
        3,
        'task',
        'MultipleChoice',
        'task.multiple-choice',
        'chapter-02-q3-quiz-famous-italians',
        $q3s3${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-desk-home",
          "prompt": "Italiani famosi: il quiz",
          "subtitle": "Metti i pronomi relativi e il participio passato, poi abbina la persona.",
          "questions": [
            {
              "id": "q1-grammar",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "1. Chi è la donna molto famosa ___ ha ___ (fondare) la casa dei bambini nel 1907?" }],
              "options": [
                { "id": "a", "label": "che / ha fondato" },
                { "id": "b", "label": "di cui / ha fondato" },
                { "id": "c", "label": "che / hanno fondato" },
                { "id": "d", "label": "dove / è fondato" }
              ],
              "correctOptionIds": ["a"]
            },
            {
              "id": "q1-person",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "1. La frase completa si riferisce a:" }],
              "options": [
                { "id": "montessori", "label": "Maria Montessori", "assetId": "static/chapter-02/famous/montessori" },
                { "id": "colombo", "label": "Cristoforo Colombo", "assetId": "static/chapter-02/famous/colombo" },
                { "id": "verdi", "label": "Giuseppe Verdi", "assetId": "static/chapter-02/famous/verdi" },
                { "id": "michelangelo", "label": "Michelangelo Buonarroti", "assetId": "static/chapter-02/famous/michelangelo" },
                { "id": "ferrante", "label": "Elena Ferrante", "assetId": "static/chapter-02/famous/ferrante" },
                { "id": "davinci", "label": "Leonardo da Vinci", "assetId": "static/chapter-02/famous/da-vinci" }
              ],
              "correctOptionIds": ["montessori"]
            },
            {
              "id": "q2-grammar",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "2. Dove ___ (arrivare) le tre caravelle di questo uomo ___ parliamo ancora oggi?" }],
              "options": [
                { "id": "a", "label": "sono arrivate / di cui" },
                { "id": "b", "label": "sono arrivati / che" },
                { "id": "c", "label": "è arrivato / dove" },
                { "id": "d", "label": "sono arrivate / che" }
              ],
              "correctOptionIds": ["a"]
            },
            {
              "id": "q2-person",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "2. La frase completa si riferisce a:" }],
              "options": [
                { "id": "montessori", "label": "Maria Montessori", "assetId": "static/chapter-02/famous/montessori" },
                { "id": "colombo", "label": "Cristoforo Colombo", "assetId": "static/chapter-02/famous/colombo" },
                { "id": "verdi", "label": "Giuseppe Verdi", "assetId": "static/chapter-02/famous/verdi" },
                { "id": "michelangelo", "label": "Michelangelo Buonarroti", "assetId": "static/chapter-02/famous/michelangelo" },
                { "id": "ferrante", "label": "Elena Ferrante", "assetId": "static/chapter-02/famous/ferrante" },
                { "id": "davinci", "label": "Leonardo da Vinci", "assetId": "static/chapter-02/famous/da-vinci" }
              ],
              "correctOptionIds": ["colombo"]
            },
            {
              "id": "q3-grammar",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "3. Chi è il musicista ___ nel 1800 ha ___ (fare) il politico?" }],
              "options": [
                { "id": "a", "label": "che / ha fatto" },
                { "id": "b", "label": "cui / ha fatto" },
                { "id": "c", "label": "che / hanno fatto" },
                { "id": "d", "label": "dove / è fatto" }
              ],
              "correctOptionIds": ["a"]
            },
            {
              "id": "q3-person",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "3. La frase completa si riferisce a:" }],
              "options": [
                { "id": "montessori", "label": "Maria Montessori", "assetId": "static/chapter-02/famous/montessori" },
                { "id": "colombo", "label": "Cristoforo Colombo", "assetId": "static/chapter-02/famous/colombo" },
                { "id": "verdi", "label": "Giuseppe Verdi", "assetId": "static/chapter-02/famous/verdi" },
                { "id": "michelangelo", "label": "Michelangelo Buonarroti", "assetId": "static/chapter-02/famous/michelangelo" },
                { "id": "ferrante", "label": "Elena Ferrante", "assetId": "static/chapter-02/famous/ferrante" },
                { "id": "davinci", "label": "Leonardo da Vinci", "assetId": "static/chapter-02/famous/da-vinci" }
              ],
              "correctOptionIds": ["verdi"]
            },
            {
              "id": "q4-grammar",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "4. Chi è l'artista ___ conosciamo un dipinto molto famoso ___ si chiama \"La Gioconda\"?" }],
              "options": [
                { "id": "a", "label": "di cui / che" },
                { "id": "b", "label": "che / di cui" },
                { "id": "c", "label": "cui / dove" },
                { "id": "d", "label": "che / che" }
              ],
              "correctOptionIds": ["a"]
            },
            {
              "id": "q4-person",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "4. La frase completa si riferisce a:" }],
              "options": [
                { "id": "montessori", "label": "Maria Montessori", "assetId": "static/chapter-02/famous/montessori" },
                { "id": "colombo", "label": "Cristoforo Colombo", "assetId": "static/chapter-02/famous/colombo" },
                { "id": "verdi", "label": "Giuseppe Verdi", "assetId": "static/chapter-02/famous/verdi" },
                { "id": "michelangelo", "label": "Michelangelo Buonarroti", "assetId": "static/chapter-02/famous/michelangelo" },
                { "id": "ferrante", "label": "Elena Ferrante", "assetId": "static/chapter-02/famous/ferrante" },
                { "id": "davinci", "label": "Leonardo da Vinci", "assetId": "static/chapter-02/famous/da-vinci" }
              ],
              "correctOptionIds": ["davinci"]
            },
            {
              "id": "q5-grammar",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "5. Come si chiama lo scultore ___ ha ___ (creare) il David di Firenze?" }],
              "options": [
                { "id": "a", "label": "che / ha creato" },
                { "id": "b", "label": "cui / ha creato" },
                { "id": "c", "label": "che / hanno creato" },
                { "id": "d", "label": "dove / è creato" }
              ],
              "correctOptionIds": ["a"]
            },
            {
              "id": "q5-person",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "5. La frase completa si riferisce a:" }],
              "options": [
                { "id": "montessori", "label": "Maria Montessori", "assetId": "static/chapter-02/famous/montessori" },
                { "id": "colombo", "label": "Cristoforo Colombo", "assetId": "static/chapter-02/famous/colombo" },
                { "id": "verdi", "label": "Giuseppe Verdi", "assetId": "static/chapter-02/famous/verdi" },
                { "id": "michelangelo", "label": "Michelangelo Buonarroti", "assetId": "static/chapter-02/famous/michelangelo" },
                { "id": "ferrante", "label": "Elena Ferrante", "assetId": "static/chapter-02/famous/ferrante" },
                { "id": "davinci", "label": "Leonardo da Vinci", "assetId": "static/chapter-02/famous/da-vinci" }
              ],
              "correctOptionIds": ["michelangelo"]
            },
            {
              "id": "q6-grammar",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "6. Come si chiama la scrittrice, famosissima in tutto il mondo, ___ ha ___ (scrivere) quattro romanzi su Napoli e ___ non si sa molto?" }],
              "options": [
                { "id": "a", "label": "che / ha scritto / di cui" },
                { "id": "b", "label": "di cui / ha scritto / che" },
                { "id": "c", "label": "che / hanno scritto / cui" },
                { "id": "d", "label": "dove / è scritto / che" }
              ],
              "correctOptionIds": ["a"]
            },
            {
              "id": "q6-person",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "6. La frase completa si riferisce a:" }],
              "options": [
                { "id": "montessori", "label": "Maria Montessori", "assetId": "static/chapter-02/famous/montessori" },
                { "id": "colombo", "label": "Cristoforo Colombo", "assetId": "static/chapter-02/famous/colombo" },
                { "id": "verdi", "label": "Giuseppe Verdi", "assetId": "static/chapter-02/famous/verdi" },
                { "id": "michelangelo", "label": "Michelangelo Buonarroti", "assetId": "static/chapter-02/famous/michelangelo" },
                { "id": "ferrante", "label": "Elena Ferrante", "assetId": "static/chapter-02/famous/ferrante" },
                { "id": "davinci", "label": "Leonardo da Vinci", "assetId": "static/chapter-02/famous/da-vinci" }
              ],
              "correctOptionIds": ["ferrante"]
            }
          ]
        }$q3s3$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-02-quest-03-school-project',
        4,
        'cutscene',
        null::text,
        'cutscene.school-outro',
        'chapter-02-q3-cutscene-outro',
        $q3s4${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-desk-home",
          "beats": [
            { "presentationMode": "innerMonologue", "body": "Fatto! La Signora Wagner sarà contenta. Adesso però ho davvero fame, e penso che c'è ancora una cosa da fare oggi: quel ristorante in centro cerca personale per l'estate..." },
            { "presentationMode": "narrator", "body": "Salvi il compito sul portale della scuola e chiudi il computer. Sulla mappa di Bologna resta un ultimo posto da visitare oggi: il ristorante." }
          ]
        }$q3s4$,
        '{}'
      ),

      -- Quest 4: restaurant (Akt 2.3)
      (
        'chapter-02-quest-04-restaurant',
        0,
        'cutscene',
        null::text,
        'cutscene.restaurant-intro',
        'chapter-02-q4-cutscene-restaurant-intro',
        $q4s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-restaurant-interior",
          "npcCast": [
            { "id": "marini", "displayName": "Signor Marini", "portraitId": "marini", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "narrator", "body": "Esci di nuovo nel pomeriggio. Sotto i portici, vicino a Piazza Maggiore, trovi il ristorante di cui ti ha parlato la signora Ferrari: \"Trattoria da Marini\". All'ingresso c'è un cartello: Cercasi personale per la stagione estiva — luglio e agosto." },
            { "presentationMode": "innerMonologue", "body": "Bene. Lavorare durante l'estate non sarebbe male. Posso guadagnare qualcosa e migliorare il mio italiano. Entriamo." },
            { "presentationMode": "narrator", "body": "Entri nel ristorante. Un uomo sulla cinquantina, con il grembiule bianco, sta pulendo un tavolo vicino alla finestra. Ti vede e si avvicina." },
            { "presentationMode": "npcDialog", "speakerId": "marini", "body": "Buongiorno! Vuoi mangiare qualcosa? In questo momento la cucina è chiusa, riapriamo più tardi." },
            { "presentationMode": "innerMonologue", "body": "Buongiorno, no, scusi… Ho visto il cartello fuori. Cerco un lavoretto per l'estate." },
            { "presentationMode": "npcDialog", "speakerId": "marini", "body": "Ah, perfetto! Stiamo cercando ragazzi/e per la stagione estiva. Hai con te una lettera di motivazione?" },
            { "presentationMode": "innerMonologue", "body": "Non ancora, ma ho il portatile. Posso prepararla adesso?" },
            { "presentationMode": "npcDialog", "speakerId": "marini", "body": "Certo, siediti pure. Quando hai finito, me la mandi via email e poi parliamo un po'. Ah, e visto che siamo un ristorante: ti farò anche qualche domanda sui piatti italiani, eh!" },
            { "presentationMode": "innerMonologue", "body": "Va bene. Apro il computer. Ci sono delle formule fisse che si usano sempre nelle lettere formali: devo solo scegliere quelle giuste." }
          ]
        }$q4s0$,
        '{}'
      ),
      (
        'chapter-02-quest-04-restaurant',
        1,
        'task',
        'DragDrop',
        'task.drag-drop',
        'chapter-02-q4-dragdrop-motivation-letter',
        $q4s1${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-restaurant-interior",
          "prompt": "Completa la lettera di motivazione con le formule giuste.",
          "subtitle": "Trascina le espressioni dalla lista nelle lacune.",
          "shuffleItemOrder": true,
          "requireBankEmpty": true,
          "items": [
            { "id": "f-gentili", "label": "Gentili Signore e Signori," },
            { "id": "f-cassari", "label": "Gentile Signora Cassari," },
            { "id": "f-devalli", "label": "Gentile Signor De Valli," },
            { "id": "f-egregio", "label": "Egregio Direttore," },
            { "id": "f-dottoressa", "label": "Stimata Dottoressa," },
            { "id": "f-candidarmi", "label": "con la presente desidero candidarmi …" },
            { "id": "f-chiedere", "label": "vorrei chiedere/presentare …" },
            { "id": "f-inizio", "label": "all'inizio / per primo" },
            { "id": "f-poi", "label": "poi / più tardi …" },
            { "id": "f-inoltre", "label": "inoltre / in più / …" },
            { "id": "f-infine", "label": "infine / alla fine" },
            { "id": "f-contattami", "label": "Se desidera/Se desiderate ulteriori informazioni, non esiti/non esitate a contattarmi." },
            { "id": "f-saluti-cordiali", "label": "In attesa di una Vostra gentile risposta, invio i miei più cordiali saluti" },
            { "id": "f-notizie", "label": "Gradirei molto ricevere presto Vostre notizie." },
            { "id": "f-saluti-distinti", "label": "RingraziandoVi anticipatamente, porgo i miei più distinti saluti." }
          ],
          "targets": [
            { "id": "t1", "title": "(1) Anrede", "correctItemIds": ["f-gentili", "f-cassari", "f-devalli", "f-egregio", "f-dottoressa"] },
            { "id": "t2", "title": "(2) … presentare la mia candidatura per un lavoretto …", "correctItemIds": ["f-candidarmi", "f-chiedere"] },
            { "id": "t3", "title": "(3) … ho sedici anni e frequento …", "correctItemIds": ["f-inizio"] },
            { "id": "t4", "title": "(4) … ho già lavorato come babysitter …", "correctItemIds": ["f-inoltre"] },
            { "id": "t5", "title": "(5) … sono una persona molto motivata …", "correctItemIds": ["f-poi"] },
            { "id": "t6", "title": "(6) … non esiti a contattarmi.", "correctItemIds": ["f-contattami"] },
            { "id": "t7", "title": "(7) Schlussformel", "correctItemIds": ["f-saluti-cordiali", "f-notizie", "f-saluti-distinti"] }
          ],
          "presentation": { "targetMode": "blocks", "sourceLabel": "Formule", "targetLabel": "Lettera" }
        }$q4s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-02-quest-04-restaurant',
        2,
        'cutscene',
        null::text,
        'cutscene.restaurant-menu-bridge',
        'chapter-02-q4-cutscene-menu-bridge',
        $q4s2${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-restaurant-interior",
          "npcCast": [
            { "id": "marini", "displayName": "Signor Marini", "portraitId": "marini", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "narrator", "body": "Salvi la lettera e la mandi all'indirizzo email del ristorante. Pochi secondi dopo, il Signor Marini apre il suo telefono, legge il messaggio e si avvicina al tuo tavolo con un sorriso." },
            { "presentationMode": "npcDialog", "speakerId": "marini", "body": "Bene, bene! Bella lettera. Adesso però la prova vera: se vuoi lavorare qui da Marini, devi conoscere un po' la nostra cucina. Ti faccio vedere il nostro menù. Descrivimi com'è strutturato un menù italiano: cosa sono le varie parti? Usa frasi con che, cui o dove, va bene?" }
          ]
        }$q4s2$,
        '{}'
      ),
      (
        'chapter-02-quest-04-restaurant',
        3,
        'task',
        'FreitextLlm',
        'task.freitext.llm',
        'chapter-02-q4-freitext-menu',
        $q4s3${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-restaurant-interior",
          "prompt": "Descrivi ogni parte del menù con almeno una frase completa. Usa che, cui o dove almeno una volta per categoria.",
          "instruction": "Categorie: gli antipasti; i primi piatti; i secondi piatti (con contorni); le pizze; i dolci. Esempio: «Gli antipasti sono piccoli piatti che si mangiano all'inizio del pasto.»",
          "targetLanguage": "it",
          "showWordCount": true,
          "showCharacterCount": true,
          "minWords": 25,
          "maxWords": 250,
          "evaluation": {
            "grammarWeight": 1,
            "vocabularyWeight": 1,
            "registerWeight": 1,
            "passThreshold": 0.68,
            "registerTarget": "neutral",
            "scoringPolicy": "threshold_pass",
            "maxPoints": 5,
            "evaluationCriteria": [
              "Correct use of relative pronouns che, cui, dove",
              "Plausible descriptions of Italian menu course order and contents",
              "B1-level grammar and vocabulary for restaurant context"
            ],
            "targetStructures": [
              "relative pronouns (che, cui, dove)",
              "menu vocabulary (antipasti, primi, secondi, pizze, dolci)",
              "descriptive sentences about food courses"
            ]
          }
        }$q4s3$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-02-quest-04-restaurant',
        4,
        'cutscene',
        null::text,
        'cutscene.restaurant-outro',
        'chapter-02-q4-cutscene-outro',
        $q4s4${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-restaurant-interior",
          "npcCast": [
            { "id": "marini", "displayName": "Signor Marini", "portraitId": "marini", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "marini", "body": "Bravissimo/a! Si vede che hai studiato bene. Senti, mi piaci. Per l'estate ti posso prendere come aiuto in sala. Adesso vai a casa, parla con la tua famiglia ospitante e poi ci sentiamo. Ah, e tieni: il primo caffè da Marini te lo offro io!" },
            { "presentationMode": "innerMonologue", "body": "Che giornata! Ho conosciuto meglio Bologna, ho fatto i compiti, ho trovato anche un lavoretto per l'estate. Non è male, sono appena arrivato/a!" },
            { "presentationMode": "narrator", "body": "Esci dal ristorante. Il sole tramonta sui portici di Bologna. Il prossimo capitolo della tua avventura ti aspetta presto." }
          ]
        }$q4s4$,
        '{}'
      ),

      -- Quest 5: bonus vocabulary matching
      (
        'chapter-02-quest-05-bonus-vocab',
        0,
        'cutscene',
        null::text,
        'cutscene.bonus-intro',
        'chapter-02-q5-cutscene-bonus-intro',
        $q5s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-02/ph-cs-bonus-neutral",
          "beats": [
            { "presentationMode": "narrator", "body": "Hai completato il secondo capitolo della tua avventura a Bologna. Hai parlato del futuro con un nuovo amico, hai conosciuto tre italiani famosi e hai fatto domanda per il tuo primo lavoretto." },
            { "presentationMode": "gameInfo", "body": "Prima di chiudere il capitolo, mettiti alla prova: quante parole di questa lezione ricordi davvero? Risolvi questo compito bonus per guadagnare fette di pizza extra!" }
          ]
        }$q5s0$,
        '{}'
      ),
      (
        'chapter-02-quest-05-bonus-vocab',
        1,
        'task',
        'Matching',
        'task.matching',
        'chapter-02-q5-matching-vocab',
        $q5s1${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-02/ph-ts-bonus-neutral",
          "prompt": "Collega ogni parola italiana al suo equivalente inglese.",
          "subtitle": "Lezione 2 — vocabolario.",
          "leftItems": [
            { "id": "it-professione", "label": "la professione" },
            { "id": "it-archeologo", "label": "l'archeologo" },
            { "id": "it-medico", "label": "il medico" },
            { "id": "it-giornalista", "label": "il/la giornalista" },
            { "id": "it-architetto", "label": "l'architetto" },
            { "id": "it-scorta", "label": "fare la scorta a" },
            { "id": "it-liceo-ling", "label": "il liceo linguistico" },
            { "id": "it-mano", "label": "la mano" },
            { "id": "it-disponibile", "label": "disponibile" },
            { "id": "it-frigorifero", "label": "il frigorifero" }
          ],
          "rightItems": [
            { "id": "en-profession", "label": "profession / occupation" },
            { "id": "en-archaeologist", "label": "archaeologist" },
            { "id": "en-doctor", "label": "doctor / physician" },
            { "id": "en-journalist", "label": "journalist" },
            { "id": "en-architect", "label": "architect" },
            { "id": "en-bodyguard", "label": "to provide bodyguard protection for" },
            { "id": "en-linguistic-hs", "label": "linguistic high school" },
            { "id": "en-hand", "label": "hand" },
            { "id": "en-available", "label": "available" },
            { "id": "en-refrigerator", "label": "refrigerator" }
          ],
          "correctPairs": [
            { "leftItemId": "it-professione", "rightItemId": "en-profession" },
            { "leftItemId": "it-archeologo", "rightItemId": "en-archaeologist" },
            { "leftItemId": "it-medico", "rightItemId": "en-doctor" },
            { "leftItemId": "it-giornalista", "rightItemId": "en-journalist" },
            { "leftItemId": "it-architetto", "rightItemId": "en-architect" },
            { "leftItemId": "it-scorta", "rightItemId": "en-bodyguard" },
            { "leftItemId": "it-liceo-ling", "rightItemId": "en-linguistic-hs" },
            { "leftItemId": "it-mano", "rightItemId": "en-hand" },
            { "leftItemId": "it-disponibile", "rightItemId": "en-available" },
            { "leftItemId": "it-frigorifero", "rightItemId": "en-refrigerator" }
          ],
          "presentation": {
            "leftLabel": "italiano",
            "rightLabel": "english",
            "shuffleRightOrder": true
          }
        }$q5s1$,
        '{"pizza":{"mode":"flat","value":3},"backpack":{"mode":"first_completion","value":1}}'
      )
  ) as s(
    quest_slug,
    order_index,
    step_kind,
    task_type,
    template_key,
    logical_task_key,
    content_payload,
    reward_rules
  )
    on s.quest_slug = qr.slug
)
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
  ss.quest_id,
  ss.order_index,
  ss.step_kind,
  ss.task_type,
  ss.template_key,
  ss.logical_task_key,
  ss.content_payload,
  ss.reward_rules,
  true
from seed_steps ss
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

-- Retire greenfield/demo quests so chapter overview shows only narrative Act 2 rows.
update public.game_quest_steps s
set is_active = false, updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where s.quest_id = q.id
  and c.slug = 'chapter-02'
  and q.slug in ('quest-03', 'quest-04');

update public.game_quests q
set is_active = false, updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and c.slug = 'chapter-02'
  and q.slug in ('quest-03', 'quest-04');
