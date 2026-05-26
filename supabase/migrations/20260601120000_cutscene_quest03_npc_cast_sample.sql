-- Seed quest-03 intro cutscene with npcCast + npcDialog / innerMonologue beats (idempotent).
update public.game_quest_steps s
set
  content_payload = $json${
    "npcCast": [
      {
        "id": "ricci",
        "displayName": "Prof.ssa Ricci",
        "portraitId": "ricci",
        "side": "right"
      },
      {
        "id": "chiara",
        "displayName": "Chiara",
        "portraitId": "chiara",
        "side": "right"
      }
    ],
    "beats": [
      {
        "presentationMode": "narrator",
        "title": "Scuola",
        "body": "Entriamo in classe. È il primo giorno di italiano."
      },
      {
        "presentationMode": "npcDialog",
        "speakerId": "ricci",
        "body": "Buongiorno a tutti! Oggi parliamo del cibo italiano."
      },
      {
        "presentationMode": "innerMonologue",
        "body": "Forse dovrei alzare la mano… ma ho un po' di paura."
      },
      {
        "presentationMode": "npcDialog",
        "speakerId": "chiara",
        "body": "Pizza e pasta sono i miei preferiti!"
      }
    ]
  }$json$::jsonb,
  updated_at = now()
from public.game_quests q
where s.quest_id = q.id
  and q.slug = 'quest-03'
  and s.order_index = 0
  and s.step_kind = 'cutscene'
  and s.template_key = 'cutscene.intro'
  and s.content_payload @> '{"beats":[{"presentationMode":"narrator","title":"Scuola","body":"Entriamo in classe."}]}'::jsonb
  and jsonb_array_length(s.content_payload -> 'beats') = 1;
