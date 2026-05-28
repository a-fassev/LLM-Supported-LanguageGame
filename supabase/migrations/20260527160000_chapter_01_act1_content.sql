-- Chapter 1 (Akt 1.0–1.3): narrative content from docs/narrative/chapter-1.md
-- Three quests in chapter-01; auto-start chain Q1 -> Q2 -> Q3; Q3 returns to overview.
-- Idempotent upserts on chapter slug, (chapter_id, quest slug), (quest_id, order_index).

insert into public.game_chapters (slug, display_name, order_index, theme_payload, is_active)
values (
  'chapter-01',
  'Capitolo 1: Bologna',
  0,
  '{"background":"static/navigation/backgrounds/ph-st-nav-chapter-bg","music":"chapter1-theme","paletteKey":"chapter1"}'::jsonb,
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
      'chapter-01-quest-01-opening-school',
      'Akt 1.0–1.1: Camera tua e Liceo Galvani',
      0,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":[],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":true,"autoStartQuestSlug":"chapter-01-quest-02-sms-bridge"}}'
    ),
    (
      'chapter-01-quest-02-sms-bridge',
      'Akt 1.2: Davanti alla scuola',
      1,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-01-quest-01-opening-school"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":true,"autoStartQuestSlug":"chapter-01-quest-03-bar"}}'
    ),
    (
      'chapter-01-quest-03-bar',
      'Akt 1.3: Bar in centro',
      2,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-01-quest-02-sms-bridge"],"prerequisiteLogicalTaskKeys":[]}',
      $bar_meta${
        "referenceDocument": {
          "documentId": "brochure-grotte-castellana",
          "title": "Le Grotte di Castellana",
          "bodyText": "La visita alle Grotte di Castellana — aperte tutto l'anno — è possibile con guide turistiche.\n\nCi sono due itinerari: l'itinerario parziale della lunghezza di un chilometro e della durata di 50 minuti, l'itinerario completo della lunghezza di tre chilometri e della durata di quasi due ore.\n\nLa temperatura, costante tutto l'anno, è di circa 18 °C, mentre il tasso di umidità è superiore al 90%.\n\nLa Grave, prima e più grande caverna del sistema sotterraneo, è l'unico ambiente naturalmente collegato con l'esterno: 100 metri di lunghezza, per 50 di larghezza, per 60 di profondità.\n\nLa parte delle grotte aperta al pubblico è costituita da ambienti molto vari per forma e dimensioni. Stalattiti, stalagmiti, colonne, preziosi cristalli occhieggiano ovunque.\n\nInfine, l'ultima e più bella caverna del sistema sotterraneo, la Grotta Bianca, definita per la ricchezza e il biancore dell'alabastro, è la più splendente del mondo.",
          "buttonLabel": "Leggi la brochure"
        },
        "flow": {
          "blockBack": false
        }
      }$bar_meta$
    )
) as q(slug, display_name, order_index, unlock_rules, meta_payload)
  on c.slug = 'chapter-01'
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
  where c.slug = 'chapter-01'
    and q.slug in (
      'chapter-01-quest-01-opening-school',
      'chapter-01-quest-02-sms-bridge',
      'chapter-01-quest-03-bar'
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
      -- Quest 1: opening + classroom
      (
        'chapter-01-quest-01-opening-school',
        0,
        'cutscene',
        null::text,
        'cutscene.opening',
        'chapter-01-q1-cutscene-opening',
        $q1s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-bedroom",
          "beats": [
            { "presentationMode": "narrator", "body": "Benvenuto/a a Bologna." },
            { "presentationMode": "narrator", "body": "Sei in Italia per un anno di scambio. Vivi qui, nella casa della famiglia Ferrari, in una città che ancora non conosci. Domani sarà il tuo primo giorno al Liceo Galvani." },
            { "presentationMode": "narrator", "body": "Questa è la tua camera. Adesso è ancora vuota, ma con il tempo si riempirà di ricordi, oggetti e souvenir delle tue avventure." },
            { "presentationMode": "gameInfo", "body": "Durante il gioco completerai diversi compiti per la scuola e per le persone che incontrerai. Per ogni compito risolto, il tuo zaino diventa più pieno di colore. (Hai perso lo zaino il primo giorno!)" },
            { "presentationMode": "gameInfo", "body": "Per i compiti riceverai fette di pizza. Puoi usarle per personalizzare il tuo avatar con nuovi vestiti e accessori." },
            { "presentationMode": "gameInfo", "body": "Sulla mappa di Bologna puoi scegliere dove andare. Alcuni posti si aprono solo dopo certi eventi." }
          ],
          "navigation": { "blockBack": true }
        }$q1s0$,
        '{}'
      ),
      (
        'chapter-01-quest-01-opening-school',
        1,
        'cutscene',
        null::text,
        'cutscene.classroom-intro',
        'chapter-01-q1-cutscene-classroom',
        $q1s1${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-classroom",
          "npcCast": [
            { "id": "ricci", "displayName": "Prof.ssa Ricci", "portraitId": "ricci", "side": "right" },
            { "id": "chiara", "displayName": "Chiara", "portraitId": "chiara", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "narrator", "body": "Sei in Italia per un anno di scambio. Oggi è il tuo primo giorno al Liceo Galvani di Bologna. Lunedì mattina, ore 8:00. Entri in classe: gli studenti chiacchierano, qualcuno ti guarda con curiosità." },
            { "presentationMode": "npcDialog", "speakerId": "ricci", "body": "Buongiorno a tutti! Bentornati! Spero che le vacanze siano andate bene. Oggi cominciamo con una cosa semplice: ognuno di voi racconta qualcosa delle vacanze estive. Chi vuole iniziare?" },
            { "presentationMode": "npcDialog", "speakerId": "chiara", "body": "Inizio io, prof! Quest'estate sono stata in Sicilia con la mia famiglia. Faceva un caldo pazzesco, ma il mare era bellissimo. E tu? Sei nuovo/a, vero? Da dove vieni?" },
            { "presentationMode": "innerMonologue", "body": "Tutti mi guardano. Devo raccontare qualcosa anch'io delle mie vacanze..." }
          ],
          "navigation": { "blockBack": true }
        }$q1s1$,
        '{}'
      ),
      (
        'chapter-01-quest-01-opening-school',
        2,
        'task',
        'ClozeText',
        'task.cloze-text',
        'chapter-01-q1-cloze-vacation',
        $q1s2${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-01/ph-ts-classroom",
          "prompt": "Racconta delle tue vacanze. Completa con le forme giuste dei verbi all'imperfetto o al passato prossimo.",
          "caseSensitive": false,
          "lines": [
            {
              "segments": [
                { "kind": "text", "text": "Quest'estate " },
                { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["sono andato", "sono andata"] },
                { "kind": "text", "text": " in campeggio con la mia famiglia al Lago di Garda. " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["Era", "era"] },
                { "kind": "text", "text": " la prima volta che " },
                { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["vedevamo", "abbiamo visto"] },
                { "kind": "text", "text": " quel lago e ci " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["è piaciuto"] },
                { "kind": "text", "text": " moltissimo. Ogni mattina " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["facevo"] },
                { "kind": "text", "text": " colazione con vista sull'acqua, poi " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["andavamo"] },
                { "kind": "text", "text": " in spiaggia. Il tempo " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["era", "Era"] },
                { "kind": "text", "text": " quasi sempre bello, solo un giorno " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["è piovuto"] },
                { "kind": "text", "text": " così tanto che " },
                { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["abbiamo dovuto"] },
                { "kind": "text", "text": " rimanere in tenda. Una sera " },
                { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["ho conosciuto"] },
                { "kind": "text", "text": " un ragazzo italiano di Verona: " },
                { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["abbiamo parlato"] },
                { "kind": "text", "text": " per ore, anche se il mio italiano non " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["era", "Era"] },
                { "kind": "text", "text": " ancora perfetto. Quando " },
                { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["sono tornato", "sono tornata"] },
                { "kind": "text", "text": " a casa, " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["mi sentivo"] },
                { "kind": "text", "text": " un po' triste, ma anche contento/a perché presto " },
                { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["partivo", "sarei partito", "sarei partita"] },
                { "kind": "text", "text": " per Bologna." }
              ]
            }
          ]
        }$q1s2$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-01-quest-01-opening-school',
        3,
        'cutscene',
        null::text,
        'cutscene.bridge',
        'chapter-01-q1-cutscene-after-cloze',
        $q1s3${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-classroom",
          "npcCast": [
            { "id": "ricci", "displayName": "Prof.ssa Ricci", "portraitId": "ricci", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "narrator", "body": "Dopo il tuo racconto, la prof.ssa Ricci sorride e prende un foglio dalla cattedra." },
            { "presentationMode": "npcDialog", "speakerId": "ricci", "body": "Bravissimo/a! A proposito di viaggi: ho qui un articolo di una rivista tedesca con consigli per i turisti in Italia. Però... qualcosa non torna. Ci sono degli errori. Riuscite a trovarli?" }
          ],
          "navigation": { "blockBack": true }
        }$q1s3$,
        '{}'
      ),
      (
        'chapter-01-quest-01-opening-school',
        4,
        'task',
        'ErrorSpotting',
        'task.error-spotting',
        'chapter-01-q1-error-spotting-customs',
        $q1s4${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-01/ph-ts-classroom",
          "prompt": "Leggi il testo e trova i 5 errori sulle abitudini italiane al bar e al ristorante. Clicca sulle informazioni sbagliate.",
          "instruction": "Seleziona ogni errore, poi scrivi la forma corretta in italiano.",
          "expectedErrorRange": { "min": 5, "max": 5 },
          "segments": [
            { "id": "a1", "text": "In Italia, se vuoi risparmiare al bar, ", "isError": false },
            { "id": "a2", "text": "siediti sempre a un tavolino", "isError": true, "acceptedCorrections": ["bisogna stare in piedi al banco per risparmiare"], "hint": "Al bar conviene stare al banco, non al tavolo." },
            { "id": "a3", "text": ": il prezzo è lo stesso che al banco. Per quanto riguarda il caffè, ", "isError": false },
            { "id": "a4", "text": "gli italiani bevono il cappuccino a tutte le ore del giorno", "isError": true, "acceptedCorrections": ["gli italiani bevono il cappuccino solo la mattina"], "hint": "Il cappuccino si beve di mattina, non dopo pranzo o cena." },
            { "id": "a5", "text": ", anche dopo pranzo e dopo cena. Al ristorante, quando arrivi, ", "isError": false },
            { "id": "a6", "text": "scegli tu stesso il tavolo", "isError": true, "acceptedCorrections": ["si aspetta che il personale assegni il tavolo"], "hint": "Di solito aspetti che ti accompagnino al tavolo." },
            { "id": "a7", "text": " senza aspettare. Un pasto italiano normale è composto da ", "isError": false },
            { "id": "a8", "text": "un solo piatto, di solito pizza o pasta", "isError": true, "acceptedCorrections": ["più portate in un pasto completo"], "hint": "Un pasto completo ha più portate." },
            { "id": "a9", "text": ". Se mangi con gli amici, ognuno paga il proprio: ", "isError": false },
            { "id": "a10", "text": "il conto separato è la regola in Italia", "isError": true, "acceptedCorrections": ["si paga insieme", "si paga in comune"], "hint": "Spesso si divide il conto in gruppo, non sempre separato." },
            { "id": "a11", "text": ". La mancia non è obbligatoria, ma sulla ricevuta si trova spesso il \"coperto\", una piccola somma per il pane e il servizio.", "isError": false }
          ]
        }$q1s4$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-01-quest-01-opening-school',
        5,
        'cutscene',
        null::text,
        'cutscene.outro',
        'chapter-01-q1-cutscene-outro',
        $q1s5${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-classroom",
          "npcCast": [
            { "id": "ricci", "displayName": "Prof.ssa Ricci", "portraitId": "ricci", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "ricci", "body": "Perfetto, avete trovato tutto. Vedete, conoscere una cultura significa anche conoscere i piccoli dettagli. Bene, per oggi basta. Ci vediamo giovedì!" },
            { "presentationMode": "narrator", "body": "La campanella suona. Esci dalla classe con gli altri studenti e ti dirigi verso l'uscita della scuola." }
          ],
          "navigation": { "blockBack": true }
        }$q1s5$,
        '{}'
      ),

      -- Quest 2: SMS bridge
      (
        'chapter-01-quest-02-sms-bridge',
        0,
        'cutscene',
        null::text,
        'cutscene.school-exit',
        'chapter-01-q2-cutscene-school-exit',
        $q2s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-school-exterior",
          "beats": [
            { "presentationMode": "narrator", "body": "Davanti al Liceo Galvani. Il sole è alto, gli studenti escono in gruppi. Stai per andare via quando il telefono vibra in tasca." },
            { "presentationMode": "innerMonologue", "body": "È Matteo, mio cugino di Palermo. Mi scrive sempre quando succede qualcosa di importante. Vediamo cosa racconta..." }
          ],
          "navigation": { "blockBack": true }
        }$q2s0$,
        '{}'
      ),
      (
        'chapter-01-quest-02-sms-bridge',
        1,
        'task',
        'SpecialScreenSms',
        'task.special-screen.sms',
        'chapter-01-q2-sms-cloze',
        $q2s1${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-01/ph-ts-school-exterior",
          "screenVariant": "sms",
          "smsChrome": {
            "chatHeaderTitle": "Matteo",
            "messages": [
              {
                "direction": "incoming",
                "author": "Matteo",
                "hostsEmbeddedMechanic": true,
                "embeddedMechanicBlockIndex": 0,
                "text": ""
              }
            ]
          },
          "blocks": [
            {
              "blockType": "cloze_text",
              "clozeText": {
                "prompt": "Leggi il messaggio di Matteo e scegli il pronome personale giusto e metti i verbi al passato prossimo.",
                "caseSensitive": false,
                "lines": [
                  {
                    "segments": [
                      { "kind": "text", "text": "Ciao cugino/a! " },
                      { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["ti", "Ti"] },
                      { "kind": "text", "text": " scrivo solo poche frasi perché vado di fretta. Il nostro prof di matematica " },
                      { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["ci ha dato", "Ci ha dato"] },
                      { "kind": "text", "text": " tantissimi compiti già il primo giorno … " },
                      { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["gli abbiamo detto", "Gli abbiamo detto"] },
                      { "kind": "text", "text": " che non è giusto, ma lo conosci, non " },
                      { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["gli", "Gli"] },
                      { "kind": "text", "text": " interessa. Ti salutano i miei genitori, a pranzo " },
                      { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["mi hanno detto", "Mi hanno detto"] },
                      { "kind": "text", "text": " che " },
                      { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["gli hai mandato", "Gli hai mandato"] },
                      { "kind": "text", "text": " un'e-mail. E poi Giulia …! " },
                      { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["le ho promesso", "Le ho promesso"] },
                      { "kind": "text", "text": " di mandar" },
                      { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["le", "Le"] },
                      { "kind": "text", "text": " non solo i suoi saluti, ma anche un bacio da parte di Cinzia. Vogliamo dir" },
                      { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["ti", "Ti"] },
                      { "kind": "text", "text": " tutti che " },
                      { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["ci", "Ci"] },
                      { "kind": "text", "text": " manchi! A presto, M." }
                    ]
                  }
                ]
              }
            }
          ]
        }$q2s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-01-quest-02-sms-bridge',
        2,
        'cutscene',
        null::text,
        'cutscene.map-unlock',
        'chapter-01-q2-cutscene-map-unlock',
        $q2s2${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-school-exterior",
          "beats": [
            { "presentationMode": "innerMonologue", "body": "Matteo non cambia mai. Gli rispondo più tardi, adesso ho voglia di esplorare un po' Bologna. È la mia prima vera giornata libera in città." },
            { "presentationMode": "narrator", "body": "Rimetti il telefono in tasca. La città ti aspetta. Sulla mappa di Bologna compaiono tre nuovi luoghi. Per ora puoi visitare il bar in centro — museo e casa Ferrari arriveranno più avanti nella storia." }
          ],
          "navigation": { "blockBack": true }
        }$q2s2$,
        '{}'
      ),

      -- Quest 3: bar
      (
        'chapter-01-quest-03-bar',
        0,
        'cutscene',
        null::text,
        'cutscene.bar-intro',
        'chapter-01-q3-cutscene-bar-intro',
        $q3s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-bar-interior",
          "npcCast": [
            { "id": "tonio", "displayName": "Tonio", "portraitId": "tonio", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "narrator", "body": "Cammini per le vie del centro di Bologna, sotto i portici. Hai sete e decidi di fermarti in un piccolo bar. Dentro c'è odore di caffè e di cornetti appena fatti." },
            { "presentationMode": "npcDialog", "speakerId": "tonio", "body": "Ciao, ragazzo/a! Cosa ti posso offrire? Un caffè, un'acqua? ... Aspetta, non ti ho mai visto qui. Sei nuovo/a a Bologna?" },
            { "presentationMode": "innerMonologue", "body": "Sì, sono appena arrivato/a. Studio al Liceo Galvani." },
            { "presentationMode": "npcDialog", "speakerId": "tonio", "body": "Ah, benvenuto/a allora! Io sono Tonio. Il bar è mio, ma io non sono di Bologna. Vengo dalla Puglia, da un paesino vicino a Castellana Grotte. Lo conosci? No? Eh, è un posto incredibile. Ci sono delle grotte sotterranee tra le più belle del mondo. Aspetta, ti faccio vedere una cosa..." },
            { "presentationMode": "narrator", "body": "Tonio prende una brochure dal bancone e te la passa." }
          ]
        }$q3s0$,
        '{}'
      ),
      (
        'chapter-01-quest-03-bar',
        1,
        'task',
        'DragDrop',
        'task.drag-drop',
        'chapter-01-q3-dragdrop-word-families',
        $q3s1${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-01/ph-ts-bar-interior",
          "prompt": "Per ogni parola di partenza, trova la parola della stessa famiglia che trovi nel testo della brochure.",
          "subtitle": "Trascina la parola corretta in ogni casella.",
          "shuffleItemOrder": true,
          "requireBankEmpty": true,
          "items": [
            { "id": "w-visita", "label": "la visita" },
            { "id": "w-aperte", "label": "aperte" },
            { "id": "w-profondita", "label": "la profondità" },
            { "id": "w-larghezza", "label": "la larghezza" },
            { "id": "w-umidita", "label": "l'umidità" },
            { "id": "w-durata", "label": "la durata" },
            { "id": "w-parziale", "label": "parziale" },
            { "id": "w-lunghezza", "label": "la lunghezza" }
          ],
          "targets": [
            { "id": "t-visitare", "title": "(v.) visitare", "correctItemIds": ["w-visita"] },
            { "id": "t-aprire", "title": "(v.) aprire", "correctItemIds": ["w-aperte"] },
            { "id": "t-profondo", "title": "(agg.) profondo", "correctItemIds": ["w-profondita"] },
            { "id": "t-largo", "title": "(agg.) largo", "correctItemIds": ["w-larghezza"] },
            { "id": "t-umido", "title": "(agg.) umido", "correctItemIds": ["w-umidita"] },
            { "id": "t-durata", "title": "(sost.) durata", "correctItemIds": ["w-durata"] },
            { "id": "t-parzialita", "title": "(sost.) parzialità", "correctItemIds": ["w-parziale"] },
            { "id": "t-lungo", "title": "(agg.) lungo", "correctItemIds": ["w-lunghezza"] }
          ],
          "presentation": { "targetMode": "blocks", "sourceLabel": "Parole", "targetLabel": "Famiglie" }
        }$q3s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-01-quest-03-bar',
        2,
        'cutscene',
        null::text,
        'cutscene.bar-bridge-1',
        'chapter-01-q3-cutscene-after-word-families',
        $q3s2${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-bar-interior",
          "npcCast": [
            { "id": "tonio", "displayName": "Tonio", "portraitId": "tonio", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "tonio", "body": "Bravissimo/a! Sai, mia nipote studia l'inglese a scuola e mi ha detto che molte parole italiane assomigliano a parole inglesi. Lei ha fatto una lista, ma ha mescolato tutto! Mi aiuti a rimettere le coppie in ordine?" }
          ]
        }$q3s2$,
        '{}'
      ),
      (
        'chapter-01-quest-03-bar',
        3,
        'task',
        'Matching',
        'task.matching',
        'chapter-01-q3-matching-en-it',
        $q3s3${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-01/ph-ts-bar-interior",
          "prompt": "Collega ogni parola inglese alla parola italiana corrispondente.",
          "subtitle": "Usa la brochure se ti serve aiuto con il vocabolario.",
          "leftItems": [
            { "id": "en-cave", "label": "cave" },
            { "id": "en-route", "label": "route" },
            { "id": "en-itinerary", "label": "itinerary" },
            { "id": "en-exterior", "label": "exterior" },
            { "id": "en-column", "label": "column" },
            { "id": "en-explorer", "label": "explorer" }
          ],
          "rightItems": [
            { "id": "it-grotta", "label": "la grotta" },
            { "id": "it-percorso", "label": "il percorso" },
            { "id": "it-itinerario", "label": "l'itinerario" },
            { "id": "it-esterno", "label": "l'esterno" },
            { "id": "it-colonna", "label": "la colonna" },
            { "id": "it-esploratore", "label": "l'esploratore" }
          ],
          "correctPairs": [
            { "leftItemId": "en-cave", "rightItemId": "it-grotta" },
            { "leftItemId": "en-route", "rightItemId": "it-percorso" },
            { "leftItemId": "en-itinerary", "rightItemId": "it-itinerario" },
            { "leftItemId": "en-exterior", "rightItemId": "it-esterno" },
            { "leftItemId": "en-column", "rightItemId": "it-colonna" },
            { "leftItemId": "en-explorer", "rightItemId": "it-esploratore" }
          ],
          "presentation": {
            "leftLabel": "inglese",
            "rightLabel": "italiano",
            "shuffleRightOrder": true
          }
        }$q3s3$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-01-quest-03-bar',
        4,
        'cutscene',
        null::text,
        'cutscene.bar-bridge-2',
        'chapter-01-q3-cutscene-before-numbers',
        $q3s4${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-bar-interior",
          "npcCast": [
            { "id": "tonio", "displayName": "Tonio", "portraitId": "tonio", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "tonio", "body": "Perfetto! Vedi, le lingue si assomigliano più di quanto pensiamo. Ah, un'ultima cosa: nella brochure ci sono tanti numeri, ma mia nipote dice che non si capisce bene cosa significano. Mi aiuti a spiegarli?" }
          ]
        }$q3s4$,
        '{}'
      ),
      (
        'chapter-01-quest-03-bar',
        5,
        'task',
        'DragDrop',
        'task.drag-drop',
        'chapter-01-q3-dragdrop-numbers',
        $q3s5${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-01/ph-ts-bar-interior",
          "prompt": "Trascina ogni numero con la sua unità di misura accanto alla frase giusta.",
          "subtitle": "Leggi la brochure per trovare le informazioni corrette.",
          "shuffleItemOrder": true,
          "requireBankEmpty": true,
          "items": [
            { "id": "n1", "label": "1 chilometro" },
            { "id": "n2", "label": "3 chilometri" },
            { "id": "n3", "label": "50 minuti" },
            { "id": "n4", "label": "2 ore" },
            { "id": "n5", "label": "18 gradi" },
            { "id": "n6", "label": "90 per cento" },
            { "id": "n7", "label": "100 metri" },
            { "id": "n8", "label": "50 metri (larghezza)" },
            { "id": "n9", "label": "60 metri" }
          ],
          "targets": [
            { "id": "m1", "title": "è lungo l'itinerario parziale", "correctItemIds": ["n1"] },
            { "id": "m2", "title": "è lungo l'itinerario completo", "correctItemIds": ["n2"] },
            { "id": "m3", "title": "dura la visita se fai il primo itinerario", "correctItemIds": ["n3"] },
            { "id": "m4", "title": "dura la visita se fai il secondo itinerario", "correctItemIds": ["n4"] },
            { "id": "m5", "title": "è la temperatura nella grotta", "correctItemIds": ["n5"] },
            { "id": "m6", "title": "è l'umidità nella grotta", "correctItemIds": ["n6"] },
            { "id": "m7", "title": "è lunga la più grande caverna della grotta", "correctItemIds": ["n7"] },
            { "id": "m8", "title": "è larga la più grande caverna della grotta", "correctItemIds": ["n8"] },
            { "id": "m9", "title": "è profonda la più grande caverna della grotta", "correctItemIds": ["n9"] }
          ],
          "presentation": { "targetMode": "blocks", "sourceLabel": "Numeri", "targetLabel": "Significato" }
        }$q3s5$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-01-quest-03-bar',
        6,
        'cutscene',
        null::text,
        'cutscene.bar-outro',
        'chapter-01-q3-cutscene-outro',
        $q3s6${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-01/ph-cs-bar-interior",
          "npcCast": [
            { "id": "tonio", "displayName": "Tonio", "portraitId": "tonio", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "tonio", "body": "Grandissimo/a! Mi hai aiutato tanto, grazie! Tieni, il caffè te lo offro io. E se torni in Puglia un giorno, passa a trovarmi al mio paese, eh!" },
            { "presentationMode": "gameInfo", "body": "Hai completato tutte le attività al bar!" },
            { "presentationMode": "innerMonologue", "body": "Che tipo simpatico, Tonio. Bologna mi piace già. Ora però è ora di andare: voglio ancora vedere qualcos'altro prima di sera." },
            { "presentationMode": "narrator", "body": "Esci dal bar. Sulla mappa restano ancora due luoghi da visitare: il museo della città e la casa della famiglia Ferrari." }
          ]
        }$q3s6$,
        '{}'
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

-- Retire greenfield/demo quests so chapter overview shows only narrative Act 1 rows.
update public.game_quest_steps s
set is_active = false, updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where s.quest_id = q.id
  and c.slug = 'chapter-01'
  and q.slug in ('quest-01', 'quest-02');

update public.game_quests q
set is_active = false, updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and c.slug = 'chapter-01'
  and q.slug in ('quest-01', 'quest-02');
