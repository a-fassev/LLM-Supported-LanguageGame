-- Chapter 3 (Akt 3.0–3.3 + bonus): narrative content from docs/narrative/chapter-3.md
-- Five quests in chapter-03: bridge, museum, Valentina, Cioccoshow, bonus vocab.
-- Idempotent upserts on chapter slug, (chapter_id, quest slug), (quest_id, order_index).

insert into public.game_chapters (slug, display_name, order_index, theme_payload, is_active)
values (
  'chapter-03',
  'Capitolo 3: Storia e cioccolato',
  2,
  '{"background":"static/navigation/backgrounds/ph-st-nav-chapter-bg","music":"chapter3-theme","paletteKey":"chapter3"}'::jsonb,
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
      'chapter-03-quest-01-morning-bridge',
      'Akt 3.0: Camera tua',
      0,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-02-quest-04-restaurant"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":true,"autoStartQuestSlug":"chapter-03-quest-02-museum"}}'
    ),
    (
      'chapter-03-quest-02-museum',
      'Akt 3.1: Museo della Storia di Bologna',
      1,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-03-quest-01-morning-bridge"],"prerequisiteLogicalTaskKeys":[]}',
      $museum_meta${
        "referenceDocument": {
          "documentId": "volantino-bologna-storia",
          "title": "Bologna — duemila anni di storia",
          "bodyText": "Bologna è una delle città più antiche d'Italia. Le sue origini risalgono al VI secolo a.C., quando gli Etruschi fondarono qui una città importante e la chiamarono Felsina. Felsina era un centro economico e culturale dell'Etruria padana. Più tardi, nel IV secolo a.C., i Galli Boi, un popolo celtico, conquistarono la città. Infine, nel 189 a.C., arrivarono i Romani e fondarono la colonia di Bononia, da cui deriva il nome moderno «Bologna».\n\nNel 1088 a Bologna nasce l'Università più antica del mondo occidentale: l'Alma Mater Studiorum. Da quasi mille anni studenti da tutta Europa vengono qui per imparare. Per questo motivo Bologna è chiamata «la Dotta» (= die Gelehrte).\n\nTra il 1109 e il 1119 due famiglie nobili — gli Asinelli e i Garisendi — fanno costruire due torri altissime nel centro della città. La Torre degli Asinelli è alta 97,2 metri ed è una delle torri medievali più alte d'Italia. La Torre della Garisenda è più bassa (47 metri) ma molto più pendente: nel Trecento è stata accorciata per motivi di sicurezza. Dante Alighieri parla della Garisenda nella sua «Divina Commedia».\n\nUn altro simbolo di Bologna sono i portici. In totale ci sono 62 chilometri di portici in città, di cui circa 40 nel centro storico. Il portico più lungo è quello di San Luca, con i suoi 3.796 metri e ben 666 archi. Il 28 luglio 2021 i portici di Bologna sono diventati patrimonio dell'umanità dell'UNESCO.\n\nBologna ha anche un terzo soprannome: «la Grassa» (= die Fette), per la sua tradizione gastronomica. I piatti tipici sono i tortellini, le tagliatelle al ragù e la famosa mortadella. Buon appetito!",
          "buttonLabel": "Vedi il volantino"
        },
        "flow": {
          "blockBack": false,
          "autoStartQuestSlug": "chapter-03-quest-03-valentina"
        }
      }$museum_meta$
    ),
    (
      'chapter-03-quest-03-valentina',
      'Akt 3.2: La guida Valentina',
      2,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-03-quest-02-museum"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false,"autoStartQuestSlug":"chapter-03-quest-04-cioccoshow"}}'
    ),
    (
      'chapter-03-quest-04-cioccoshow',
      'Akt 3.3: Cioccoshow in piazza Maggiore',
      3,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-03-quest-03-valentina"],"prerequisiteLogicalTaskKeys":[]}',
      $rivista_meta${
        "flow": {
          "blockBack": false
        }
      }$rivista_meta$
    ),
    (
      'chapter-03-quest-05-bonus-vocab',
      'Bonus: Parole della lezione 3',
      4,
      '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":["chapter-03-quest-04-cioccoshow"],"prerequisiteLogicalTaskKeys":[]}',
      '{"flow":{"blockBack":false}}'
    )
) as q(slug, display_name, order_index, unlock_rules, meta_payload)
  on c.slug = 'chapter-03'
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
  where c.slug = 'chapter-03'
    and q.slug in (
      'chapter-03-quest-01-morning-bridge',
      'chapter-03-quest-02-museum',
      'chapter-03-quest-03-valentina',
      'chapter-03-quest-04-cioccoshow',
      'chapter-03-quest-05-bonus-vocab'
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
      (
        'chapter-03-quest-01-morning-bridge',
        0,
        'cutscene',
        null::text,
        'cutscene.morning-bridge',
        'chapter-03-q1-cutscene-morning-bridge',
        $q1s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-bedroom-morning",
          "beats": [
            { "presentationMode": "narrator", "body": "Un nuovo giorno a Bologna. Ti svegli, la luce entra calda dalla finestra. Sulla scrivania ci sono i tuoi libri di scuola per la prossima lezione e accanto, il tuo zaino — già un bel po' pieno di colore." },
            { "presentationMode": "innerMonologue", "body": "Oggi non ho compiti. Ma la signora Ferrari ieri sera mi ha parlato di un museo che devo assolutamente vedere se voglio capire davvero Bologna: il Museo della Storia di Bologna. Una buona occasione per imparare un po' di storia." },
            { "presentationMode": "narrator", "body": "Sulla mappa di Bologna si illumina un nuovo posto: il Museo della Storia di Bologna." }
          ],
          "navigation": { "blockBack": true }
        }$q1s0$,
        '{}'
      )
      ,
      (
        'chapter-03-quest-02-museum',
        0,
        'cutscene',
        null::text,
        'cutscene.museum-intro',
        'chapter-03-q2-cutscene-museum-intro',
        $q2s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-museum-interior",
          "beats": [
            { "presentationMode": "narrator", "body": "Entri nel Museo della Storia di Bologna. La sala è tranquilla, nelle vetrine ci sono mappe antiche, monete e cocci di terracotta. Alle pareti, immagini di torri medievali e una grande mappa del centro storico." },
            { "presentationMode": "innerMonologue", "body": "Vediamo cosa si può scoprire qui. All'ingresso c'era un volantino con le informazioni principali — me lo prendo." },
            { "presentationMode": "narrator", "body": "Prendi un volantino dallo stand all'ingresso. Sulla copertina c'è scritto: «Bologna — duemila anni di storia»." },
            { "presentationMode": "innerMonologue", "body": "Interessante. Vediamo quanto mi ricordo di tutto questo — alla fine della mostra c'è un piccolo quiz per i visitatori." }
          ]
        }$q2s0$,
        '{}'
      ),
      (
        'chapter-03-quest-02-museum',
        1,
        'task',
        'MultipleChoice',
        'task.multiple-choice',
        'chapter-03-q2-quiz-bologna-storia',
        $q2s1${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-03/ph-ts-museum-interior",
          "prompt": "Quiz: Bologna, duemila anni di storia",
          "subtitle": "Leggi il volantino, poi scegli la risposta giusta per ogni domanda.",
          "questions": [
            {
              "id": "mq1",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "1. Chi ha fondato la città che oggi si chiama Bologna?" }],
              "options": [
                { "id": "a", "label": "I Romani, nel 189 a.C." },
                { "id": "b", "label": "Gli Etruschi, nel VI secolo a.C." },
                { "id": "c", "label": "I Galli Boi, nel IV secolo a.C." }
              ],
              "correctOptionIds": ["b"]
            },
            {
              "id": "mq2",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "2. Come si chiamava Bologna ai tempi degli Etruschi?" }],
              "options": [
                { "id": "a", "label": "Bononia" },
                { "id": "b", "label": "Felsina" },
                { "id": "c", "label": "Alma Mater" }
              ],
              "correctOptionIds": ["b"]
            },
            {
              "id": "mq3",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "3. In che anno è stata fondata l'Università di Bologna?" }],
              "options": [
                { "id": "a", "label": "Nel 189 a.C." },
                { "id": "b", "label": "Nel 1088" },
                { "id": "c", "label": "Nel 1119" }
              ],
              "correctOptionIds": ["b"]
            },
            {
              "id": "mq4",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "4. Qual è il soprannome di Bologna che si riferisce all'università?" }],
              "options": [
                { "id": "a", "label": "La Grassa" },
                { "id": "b", "label": "La Rossa" },
                { "id": "c", "label": "La Dotta" }
              ],
              "correctOptionIds": ["c"]
            },
            {
              "id": "mq5",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "5. Quanto è alta la Torre degli Asinelli?" }],
              "options": [
                { "id": "a", "label": "47 metri" },
                { "id": "b", "label": "97,2 metri" },
                { "id": "c", "label": "666 metri" }
              ],
              "correctOptionIds": ["b"]
            },
            {
              "id": "mq6",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "6. Da quando i portici di Bologna sono patrimonio dell'umanità dell'UNESCO?" }],
              "options": [
                { "id": "a", "label": "Dal 1088" },
                { "id": "b", "label": "Dal 1964" },
                { "id": "c", "label": "Dal 2021" }
              ],
              "correctOptionIds": ["c"]
            }
          ]
        }$q2s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-03-quest-02-museum',
        2,
        'cutscene',
        null::text,
        'cutscene.museum-bridge-valentina',
        'chapter-03-q2-cutscene-museum-bridge',
        $q2s2${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-museum-interior",
          "beats": [
            { "presentationMode": "innerMonologue", "body": "Fatto. Bologna è davvero una città speciale — l'università più antica d'Europa, le torri, i portici... Vediamo cos'altro c'è da scoprire." },
            { "presentationMode": "narrator", "body": "Continui a camminare per la sala. In un angolo c'è un piccolo gruppo di visitatori intorno a una donna con un cartellino. Parla con energia e gesticola. Diventi curioso/a e ti avvicini." }
          ]
        }$q2s2$,
        '{}'
      )
      ,
      (
        'chapter-03-quest-03-valentina',
        0,
        'cutscene',
        null::text,
        'cutscene.valentina-intro',
        'chapter-03-q3-cutscene-valentina-intro',
        $q3s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-museum-side-room",
          "npcCast": [
            { "id": "valentina", "displayName": "Valentina", "portraitId": "valentina", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "narrator", "body": "Nella saletta laterale c'è una giovane donna con un cartellino arancione: «Valentina — Guida turistica». Davanti a lei una piccola vetrina con manifesti colorati: figure di cioccolato, bancarelle in una piazza, bambini sorridenti con il viso pieno di cacao." },
            { "presentationMode": "npcDialog", "speakerId": "valentina", "body": "...e per questo penso che chi è a Bologna in questa settimana debba assolutamente andare alla Cioccoshow. Non è solo una fiera — è una festa per tutta la città!" },
            { "presentationMode": "innerMonologue", "body": "Cioccoshow? Non ne ho mai sentito parlare. Ascolto un po' meglio." },
            { "presentationMode": "npcDialog", "speakerId": "valentina", "body": "Ah, benvenuto/a! Vieni più vicino, sto spiegando ai nostri visitatori la Cioccoshow. È la più importante fiera del cioccolato in Italia, e si tiene ogni anno in piazza Maggiore. Spero proprio che tu non te la perda!" },
            { "presentationMode": "innerMonologue", "body": "Questa donna parla in modo strano — sempre con «credo che», «spero che», «penso che»... Ah, giusto: dopo queste espressioni si usa il congiuntivo. Devo esercitarmi anch'io." },
            { "presentationMode": "npcDialog", "speakerId": "valentina", "body": "Senti, prima di lasciarti andare alla Cioccoshow, facciamo un piccolo esercizio insieme. Ho qui un dialogo tra alcuni amici miei. Mi aiuti a completarlo?" }
          ]
        }$q3s0$,
        '{}'
      ),
      (
        'chapter-03-quest-03-valentina',
        1,
        'task',
        'ClozeText',
        'task.cloze-text',
        'chapter-03-q3-cloze-congiuntivo',
        $q3s1${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-03/ph-ts-museum-side-room",
          "prompt": "Due chiacchiere — completa con il congiuntivo presente o passato.",
          "caseSensitive": false,
          "lines": [
            {
              "segments": [
                { "kind": "text", "text": "Elisa: Mi dispiace che Franca non " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["sia venuta"] },
                { "kind": "text", "text": " con noi ieri.\nTiziana: Non sta bene. Penso che " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["abbia preso"] },
                { "kind": "text", "text": " freddo e ora " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["abbia"] },
                { "kind": "text", "text": " la febbre.\nCarlo: Poverina! Credi che non " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["venga"] },
                { "kind": "text", "text": " neanche alla festa di Cinzia stasera?\nTiziana: È probabile che non ci " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["riesca"] },
                { "kind": "text", "text": ". A proposito di festa. Ho l'impressione che tu, Carlo, " },
                { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["ti sia divertito"] },
                { "kind": "text", "text": " molto ieri sera.\nElisa: Ah ah, non credo che lui " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["abbia ballato"] },
                { "kind": "text", "text": " mai così tanto ad una festa!\nEnzo: Allora non penso che il nostro caro Carlo " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["manchi"] },
                { "kind": "text", "text": " alla festa di Cinzia.\nTiziana: Sì, anch'io credo che tu non " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["voglia"] },
                { "kind": "text", "text": " perdere questa ottima occasione stasera." }
              ]
            }
          ]
        }$q3s1$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-03-quest-03-valentina',
        2,
        'cutscene',
        null::text,
        'cutscene.valentina-suffixes',
        'chapter-03-q3-cutscene-suffixes',
        $q3s2${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-museum-side-room",
          "npcCast": [
            { "id": "valentina", "displayName": "Valentina", "portraitId": "valentina", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "valentina", "body": "Bravo/Brava! Parli davvero bene l'italiano. Vieni, lascia che ti mostri ancora una cosa — qualcosa che mi piace particolarmente della nostra lingua." },
            { "presentationMode": "narrator", "body": "Valentina va verso una lavagna alla parete. Sopra ci sono parole diverse con piccole frecce e desinenze differenti." },
            { "presentationMode": "npcDialog", "speakerId": "valentina", "body": "Guarda: in italiano possiamo cambiare tutto il significato di una parola con poche sillabe alla fine. Da casa diventa casetta — una piccola casa accogliente. Da libro diventa librone — un enorme volume." },
            { "presentationMode": "innerMonologue", "body": "Giusto — sono gli accrescitivi e i diminutivi. Con -ino, -etto, -ello si rende qualcosa più piccolo o più carino, con -one si rende più grande." }
          ]
        }$q3s2$,
        '{}'
      ),
      (
        'chapter-03-quest-03-valentina',
        3,
        'task',
        'Matching',
        'task.matching',
        'chapter-03-q3-matching-suffixes',
        $q3s3${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-03/ph-ts-museum-side-room",
          "prompt": "Accrescitivi e diminutivi — collega ogni parola alla forma derivata.",
          "subtitle": "Attenzione al significato!",
          "leftItems": [
            { "id": "base-pizza", "label": "pizza" },
            { "id": "base-cioccolato", "label": "cioccolato" },
            { "id": "base-palazzo", "label": "palazzo" },
            { "id": "base-goloso", "label": "goloso" },
            { "id": "base-libro", "label": "libro" },
            { "id": "base-casa", "label": "casa" },
            { "id": "base-ragazzo", "label": "ragazzo" },
            { "id": "base-tavolo", "label": "tavolo" }
          ],
          "rightItems": [
            { "id": "der-pizzetta", "label": "pizzetta (piccola)" },
            { "id": "der-cioccolatino", "label": "cioccolatino (piccolo)" },
            { "id": "der-palazzone", "label": "palazzone (grande)" },
            { "id": "der-golosone", "label": "golosone (molto goloso)" },
            { "id": "der-librone", "label": "librone (grande)" },
            { "id": "der-casetta", "label": "casetta (piccola e carina)" },
            { "id": "der-ragazzaccio", "label": "ragazzaccio (birichino)" },
            { "id": "der-tavolino", "label": "tavolino (piccolo)" }
          ],
          "correctPairs": [
            { "leftItemId": "base-pizza", "rightItemId": "der-pizzetta" },
            { "leftItemId": "base-cioccolato", "rightItemId": "der-cioccolatino" },
            { "leftItemId": "base-palazzo", "rightItemId": "der-palazzone" },
            { "leftItemId": "base-goloso", "rightItemId": "der-golosone" },
            { "leftItemId": "base-libro", "rightItemId": "der-librone" },
            { "leftItemId": "base-casa", "rightItemId": "der-casetta" },
            { "leftItemId": "base-ragazzo", "rightItemId": "der-ragazzaccio" },
            { "leftItemId": "base-tavolo", "rightItemId": "der-tavolino" }
          ],
          "presentation": {
            "leftLabel": "parola di partenza",
            "rightLabel": "forma derivata",
            "shuffleRightOrder": true
          }
        }$q3s3$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-03-quest-03-valentina',
        4,
        'task',
        'ClozeText',
        'task.cloze-text',
        'chapter-03-q3-cloze-suffixes',
        $q3s4${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-03/ph-ts-museum-side-room",
          "prompt": "Completa le frasi di Valentina sulla Cioccoshow. Forma la parola con -ino, -etto, -ello o -one.",
          "caseSensitive": false,
          "lines": [
            {
              "segments": [
                { "kind": "text", "text": "1. Sulla piazza c'è un tavolo " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["tavolone"] },
                { "kind": "text", "text": " enorme con tutti i tipi di cioccolato." }
              ]
            },
            {
              "segments": [
                { "kind": "text", "text": "2. Ti consiglio di assaggiare un pezzo " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["pezzetto"] },
                { "kind": "text", "text": " piccolo di cioccolato fondente prima di scegliere." }
              ]
            },
            {
              "segments": [
                { "kind": "text", "text": "3. Vedrai, dopo un'ora alla Cioccoshow tutti diventiamo dei golosi " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["golosoni"] },
                { "kind": "text", "text": "!" }
              ]
            },
            {
              "segments": [
                { "kind": "text", "text": "4. Per i bambini c'è una zona speciale con tante case " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["casette"] },
                { "kind": "text", "text": " di cioccolato." }
              ]
            },
            {
              "segments": [
                { "kind": "text", "text": "5. Lo stand della Nutella è in un palazzo " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["palazzone"] },
                { "kind": "text", "text": " di vetro al centro della piazza." }
              ]
            },
            {
              "segments": [
                { "kind": "text", "text": "6. Compra un libro " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["libretto", "librone"] },
                { "kind": "text", "text": " con tutte le ricette al cioccolato — è un bel souvenir!" }
              ]
            }
          ]
        }$q3s4$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-03-quest-03-valentina',
        5,
        'cutscene',
        null::text,
        'cutscene.valentina-outro',
        'chapter-03-q3-cutscene-outro',
        $q3s5${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-museum-side-room",
          "npcCast": [
            { "id": "valentina", "displayName": "Valentina", "portraitId": "valentina", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "valentina", "body": "Perfetto! Hai capito tutto. Se questo pomeriggio non hai impegni, vai davvero alla Cioccoshow. Oggi è il primo giorno, piazza Maggiore sarà piena di gente. Non te ne pentirai!" },
            { "presentationMode": "innerMonologue", "body": "La Cioccoshow in piazza Maggiore... mi sembra proprio quello che mi serve oggi. Cioccolato e gente da tutta Italia — perché no?" },
            { "presentationMode": "narrator", "body": "Esci dal Museo della Storia di Bologna. Sulla mappa di Bologna si illumina un nuovo posto: la Cioccoshow in piazza Maggiore." }
          ]
        }$q3s5$,
        '{}'
      )
      ,
      (
        'chapter-03-quest-04-cioccoshow',
        0,
        'cutscene',
        null::text,
        'cutscene.piazza-intro',
        'chapter-03-q4-cutscene-piazza-intro',
        $q4s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-piazza-maggiore",
          "beats": [
            { "presentationMode": "narrator", "body": "Arrivi in piazza Maggiore. Già da lontano vedi ombrelloni colorati, senti vociare e senti l'odore di cioccolato — cioccolato ovunque. Famiglie si fanno strada tra le bancarelle, bambini assaggiano con le dita appiccicose." },
            { "presentationMode": "innerMonologue", "body": "Mamma mia, Valentina aveva ragione. Qui c'è proprio movimento." }
          ]
        }$q4s0$,
        '{}'
      ),
      (
        'chapter-03-quest-04-cioccoshow',
        1,
        'cutscene',
        null::text,
        'cutscene.lorenzo-intro',
        'chapter-03-q4-cutscene-lorenzo-intro',
        $q4s1${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-piazza-maggiore",
          "npcCast": [
            { "id": "lorenzo", "displayName": "Lorenzo Conti", "portraitId": "lorenzo", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "narrator", "body": "A una bancarella con cioccolato fondente c'è un uomo sui trentacinque anni, sciarpa azzurra, giacca di pelle. Assaggia un pezzo di cioccolato, chiude gli occhi e annuisce con soddisfazione. Poi ti vede." },
            { "presentationMode": "npcDialog", "speakerId": "lorenzo", "body": "Ehi, ciao! L'hai già provato questo? È il gianduiotto, l'originale di Torino. Se devi mangiare un solo pezzo di cioccolato nella tua vita, mangia questo. Dai, te ne offro uno!" },
            { "presentationMode": "innerMonologue", "body": "Grazie! Sembri uno che se ne intende." },
            { "presentationMode": "npcDialog", "speakerId": "lorenzo", "body": "Io? Sono Lorenzo, vengo da Torino. E a Torino... beh, diciamo che il cioccolato l'abbiamo praticamente inventato noi. Ma non solo quello — abbiamo fatto tante cose che oggi sono famose in tutto il mondo. Hai tempo? Te ne racconto un po'." },
            { "presentationMode": "innerMonologue", "body": "Un torinese che si vanta di Torino — interessante. Sentiamo cos'ha da dire." }
          ]
        }$q4s1$,
        '{}'
      ),
      (
        'chapter-03-quest-04-cioccoshow',
        2,
        'task',
        'MultipleChoice',
        'task.multiple-choice',
        'chapter-03-q4-quiz-torino',
        $q4s2${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-03/ph-ts-piazza-maggiore",
          "prompt": "La storia di Lorenzo: Torino, la mia città",
          "subtitle": "Leggi il racconto di Lorenzo, poi rispondi alle domande.",
          "referenceDocument": {
            "documentId": "lorenzo-torino-racconto",
            "title": "La storia di Lorenzo: Torino, la mia città",
            "bodyText": "Io sono Lorenzo e sono nato a Torino. A casa mia il cioccolato è quasi una religione: i gianduiotti sono il simbolo della città e a novembre c'è anche il festival CioccolaTò. Per preparare il gianduiotto servono cacao, zucchero e nocciole piemontesi, e il sapore è davvero speciale. Se invece parliamo di crema da spalmare, la Nutella è nata ad Alba nel 1964: non proprio a Torino, ma sempre qui in Piemonte.\n\nTorino però non è solo dolci. Qui si mangiano anche i grissini e, quando si parla di calcio, quasi tutti tifano Juventus, la «Vecchia Signora». Dalla città si vedono bene le Alpi e in centro c'è la Mole Antonelliana: dentro puoi visitare il Museo Nazionale del Cinema. E poi c'è il Lingotto, uno dei luoghi storici della FIAT, perché Torino è famosa anche per le automobili.\n\nInsomma, Torino è una città piena di gusto, sport, cultura e storia industriale.",
            "buttonLabel": "Leggi il racconto"
          },
          "instruction": "Lorenzo ti racconta: a Torino si ama il buon cioccolato (Gianduiotti, CioccolaTò). La Nutella nasce ad Alba nel 1964. Si mangiano i grissini, si tifa per la Juventus («Vecchia Signora»). Si vedono le Alpi e la Mole Antonelliana con il Museo del Cinema. Si producono automobili FIAT (Lingotto).",
          "questions": [
            {
              "id": "tq1",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "1. Per fare i gianduiotti si ha bisogno di…" }],
              "options": [
                { "id": "a", "label": "cacao, zucchero e nocciole piemontesi" },
                { "id": "b", "label": "cioccolato bianco, latte e fragole" },
                { "id": "c", "label": "caffè, zucchero e mandorle" }
              ],
              "correctOptionIds": ["a"]
            },
            {
              "id": "tq2",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "2. La Nutella nasce…" }],
              "options": [
                { "id": "a", "label": "a Torino nel 1899" },
                { "id": "b", "label": "ad Alba nel 1964" },
                { "id": "c", "label": "a Milano negli anni '80" }
              ],
              "correctOptionIds": ["b"]
            },
            {
              "id": "tq3",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "3. Come si chiama la famosa squadra di calcio di Torino?" }],
              "options": [
                { "id": "a", "label": "il Torino o «Vecchia Signora»" },
                { "id": "b", "label": "la Juventus o «Juve», soprannominata «Vecchia Signora»" },
                { "id": "c", "label": "il Lingotto" }
              ],
              "correctOptionIds": ["b"]
            },
            {
              "id": "tq4",
              "selectionMode": "single",
              "preserveOptionOrder": true,
              "stem": [{ "kind": "text", "text": "4. Cosa si può fare all'interno della Mole Antonelliana?" }],
              "options": [
                { "id": "a", "label": "si possono comprare gianduiotti" },
                { "id": "b", "label": "si possono ammirare opere d'arte dell'antico Egitto" },
                { "id": "c", "label": "si può visitare il Museo Nazionale del Cinema" }
              ],
              "correctOptionIds": ["c"]
            }
          ]
        }$q4s2$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-03-quest-04-cioccoshow',
        3,
        'task',
        'ClozeText',
        'task.cloze-text',
        'chapter-03-q4-cloze-si-impersonale',
        $q4s3${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-03/ph-ts-piazza-maggiore",
          "prompt": "Scoprire una nuova città — completa con i verbi alla forma impersonale (si + 3ª persona).",
          "caseSensitive": false,
          "lines": [
            {
              "segments": [
                { "kind": "text", "text": "Per scoprire una nuova città " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["si compra"] },
                { "kind": "text", "text": " una " },
                { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["buona"] },
                { "kind": "text", "text": " guida della città o " },
                { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["ci si informa"] },
                { "kind": "text", "text": " in internet prima del viaggio. In questo modo " },
                { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["si possono avere"] },
                { "kind": "text", "text": " molte attrazioni già prima di visitare la nuova città. Ma se " },
                { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["si vuole conoscere"] },
                { "kind": "text", "text": " veramente bene la città, " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["si fa"] },
                { "kind": "text", "text": " una " },
                { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["buona"] },
                { "kind": "text", "text": " visita guidata. Se " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["si chiama"] },
                { "kind": "text", "text": " l'ufficio del turismo, " },
                { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["si possono trovare"] },
                { "kind": "text", "text": " delle " },
                { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["buone"] },
                { "kind": "text", "text": " informazioni utili. Nell'ufficio del turismo " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["si compra"] },
                { "kind": "text", "text": " una pianta della città. In questo modo " },
                { "kind": "gap", "placeholder": "…", "maxLength": 20, "correctAnswers": ["non si perdono"] },
                { "kind": "text", "text": " facilmente tutti i monumenti. Per scoprire le specialità, " },
                { "kind": "gap", "placeholder": "…", "maxLength": 12, "correctAnswers": ["si mangia"] },
                { "kind": "text", "text": " nei " },
                { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["buoni"] },
                { "kind": "text", "text": " ristoranti e " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["si comprano"] },
                { "kind": "text", "text": " i prodotti tipici. Se " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["si seguono"] },
                { "kind": "text", "text": " questi " },
                { "kind": "gap", "placeholder": "…", "maxLength": 8, "correctAnswers": ["buoni"] },
                { "kind": "text", "text": " consigli, " },
                { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["ci si gode"] },
                { "kind": "text", "text": " a pieno la nuova città." }
              ]
            }
          ]
        }$q4s3$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-03-quest-04-cioccoshow',
        4,
        'task',
        'DragDrop',
        'task.drag-drop',
        'chapter-03-q4-dragdrop-made-in-italy',
        $q4s4${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-03/ph-ts-piazza-maggiore",
          "prompt": "Made in Italy: i prodotti delle città",
          "subtitle": "Trascina ogni prodotto sulla città giusta. I falsi italiani vanno in «Non italiano».",
          "referenceDocument": {
            "documentId": "rivista-made-in-italy",
            "title": "Made in Italy — I prodotti delle nostre città",
            "bodyText": "Conoscete il vero Made in Italy? In questa edizione vi presentiamo i prodotti più famosi e da dove vengono davvero. Attenzione: alcuni «classici italiani» che troverete all'estero non sono italiani per niente!\n\nTorino (Piemonte): il gianduiotto; la FIAT 500; il «Pinguino» (gelato su stecco, inventato nel 1939 a Torino).\n\nBologna (Emilia-Romagna): i tortellini; il ragù alla bolognese; la mortadella.\n\nAlba (Piemonte): la Nutella (dal 1964).\n\nNapoli (Campania): la pizza Margherita (patrimonio UNESCO dal 2017).\n\nParma (Emilia-Romagna): il parmigiano reggiano; il prosciutto di Parma.\n\nNON sono italiani: Spaghetti Bolognese; Caesar Salad; Hawaiian Pizza (con ananas).",
            "buttonLabel": "Vedi la rivista"
          },
          "shuffleItemOrder": true,
          "requireBankEmpty": true,
          "items": [
            { "id": "prod-gianduiotto", "label": "il gianduiotto" },
            { "id": "prod-fiat", "label": "la FIAT 500" },
            { "id": "prod-pinguino", "label": "il Pinguino" },
            { "id": "prod-tortellini", "label": "i tortellini" },
            { "id": "prod-ragu", "label": "il ragù alla bolognese" },
            { "id": "prod-mortadella", "label": "la mortadella" },
            { "id": "prod-nutella", "label": "la Nutella" },
            { "id": "prod-pizza", "label": "la pizza Margherita" },
            { "id": "prod-parmigiano", "label": "il parmigiano reggiano" },
            { "id": "prod-prosciutto", "label": "il prosciutto di Parma" },
            { "id": "prod-spaghetti", "label": "gli spaghetti bolognese" },
            { "id": "prod-caesar", "label": "la Caesar Salad" },
            { "id": "prod-hawaiana", "label": "la pizza hawaiana" }
          ],
          "targets": [
            { "id": "city-torino", "title": "Torino", "matchMode": "all", "correctItemIds": ["prod-gianduiotto", "prod-fiat", "prod-pinguino"] },
            { "id": "city-bologna", "title": "Bologna", "matchMode": "all", "correctItemIds": ["prod-tortellini", "prod-ragu", "prod-mortadella"] },
            { "id": "city-alba", "title": "Alba", "matchMode": "all", "correctItemIds": ["prod-nutella"] },
            { "id": "city-napoli", "title": "Napoli", "matchMode": "all", "correctItemIds": ["prod-pizza"] },
            { "id": "city-parma", "title": "Parma", "matchMode": "all", "correctItemIds": ["prod-parmigiano", "prod-prosciutto"] },
            { "id": "city-non-italiano", "title": "Non italiano", "matchMode": "all", "correctItemIds": ["prod-spaghetti", "prod-caesar", "prod-hawaiana"] }
          ],
          "presentation": { "targetMode": "blocks", "sourceLabel": "Prodotti", "targetLabel": "Città" }
        }$q4s4$,
        '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'
      ),
      (
        'chapter-03-quest-04-cioccoshow',
        5,
        'cutscene',
        null::text,
        'cutscene.cioccoshow-outro',
        'chapter-03-q4-cutscene-outro',
        $q4s5${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-piazza-maggiore",
          "npcCast": [
            { "id": "lorenzo", "displayName": "Lorenzo Conti", "portraitId": "lorenzo", "side": "right" }
          ],
          "beats": [
            { "presentationMode": "npcDialog", "speakerId": "lorenzo", "body": "Molto bene, ce l'hai fatta! La rivista puoi tenerla, un piccolo souvenir da Bologna. E se vieni a Torino: scrivimi, ti faccio vedere la città!" },
            { "presentationMode": "innerMonologue", "body": "Che giornata. Ho conosciuto un nuovo festival, ho incontrato qualcuno di nuovo e ho anche imparato qualcosa sull'Italia che prima non sapevo." },
            { "presentationMode": "narrator", "body": "Esci dalla piazza Maggiore. Il sole comincia a tramontare dietro la Basilica di San Petronio. Nel tuo zaino: una rivista con il titolo «Made in Italy»." }
          ]
        }$q4s5$,
        '{}'
      ),
      (
        'chapter-03-quest-05-bonus-vocab',
        0,
        'cutscene',
        null::text,
        'cutscene.bonus-intro',
        'chapter-03-q5-cutscene-bonus-intro',
        $q5s0${
          "sceneBackgroundAsset": "static/cutscene-backgrounds/chapter-03/ph-cs-bonus-neutral",
          "beats": [
            { "presentationMode": "narrator", "body": "Hai finito il terzo capitolo della tua avventura a Bologna. Hai scoperto la storia della città, hai partecipato a una festa italiana e hai incontrato un torinese che ti ha mostrato «la sua» Italia." },
            { "presentationMode": "gameInfo", "body": "Prima di chiudere il capitolo, mettiti alla prova: quante parole di questa lezione ricordi davvero? Risolvi questo compito bonus per guadagnare fette di pizza extra!" }
          ]
        }$q5s0$,
        '{}'
      ),
      (
        'chapter-03-quest-05-bonus-vocab',
        1,
        'task',
        'Matching',
        'task.matching',
        'chapter-03-q5-matching-vocab',
        $q5s1${
          "sceneBackgroundAsset": "static/task-scene-backgrounds/chapter-03/ph-ts-bonus-neutral",
          "prompt": "Collega ogni parola italiana al suo equivalente inglese.",
          "subtitle": "Lezione 3 — vocabolario (set fisso per questa versione).",
          "leftItems": [
            { "id": "it-nord", "label": "il nord" },
            { "id": "it-sud", "label": "il sud" },
            { "id": "it-delizioso", "label": "delizioso, -a" },
            { "id": "it-golosone", "label": "golosone" },
            { "id": "it-tradizione", "label": "la tradizione" },
            { "id": "it-patrono", "label": "il patrono" },
            { "id": "it-celebrare", "label": "celebrare" },
            { "id": "it-ammirare", "label": "ammirare" },
            { "id": "it-storico", "label": "storico, -a" },
            { "id": "it-matto", "label": "matto, -a (per)" }
          ],
          "rightItems": [
            { "id": "en-north", "label": "the North" },
            { "id": "en-south", "label": "the South" },
            { "id": "en-delicious", "label": "delicious" },
            { "id": "en-greedy-aug", "label": "greedy (augmentative)" },
            { "id": "en-tradition", "label": "tradition" },
            { "id": "en-patron", "label": "patron saint" },
            { "id": "en-celebrate", "label": "to celebrate" },
            { "id": "en-admire", "label": "to admire" },
            { "id": "en-historic", "label": "historic / historical" },
            { "id": "en-crazy", "label": "crazy (about)" }
          ],
          "correctPairs": [
            { "leftItemId": "it-nord", "rightItemId": "en-north" },
            { "leftItemId": "it-sud", "rightItemId": "en-south" },
            { "leftItemId": "it-delizioso", "rightItemId": "en-delicious" },
            { "leftItemId": "it-golosone", "rightItemId": "en-greedy-aug" },
            { "leftItemId": "it-tradizione", "rightItemId": "en-tradition" },
            { "leftItemId": "it-patrono", "rightItemId": "en-patron" },
            { "leftItemId": "it-celebrare", "rightItemId": "en-celebrate" },
            { "leftItemId": "it-ammirare", "rightItemId": "en-admire" },
            { "leftItemId": "it-storico", "rightItemId": "en-historic" },
            { "leftItemId": "it-matto", "rightItemId": "en-crazy" }
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

-- No greenfield demo quests exist under chapter-03 slug in the base migration.
