using System.Text;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Detects whether the shell should send a task attempt payload for server-side pizza scoring.</summary>
    public static class QuestScoringPolicy
    {
    [System.Serializable]
    private struct PizzaSniff
    {
        public string mode;
    }

    [System.Serializable]
    private struct RewardSniff
    {
        public PizzaSniff pizza;
    }

        public static bool ServerScoresPizza(string rewardRulesJson)
        {
            if (string.IsNullOrWhiteSpace(rewardRulesJson))
                return false;

            try
            {
                var dto = UnityEngine.JsonUtility.FromJson<RewardSniff>(rewardRulesJson);
                var m = dto.pizza.mode;
                if (string.IsNullOrWhiteSpace(m))
                    return false;
                return string.Equals(m.Trim(), "scored", System.StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }
    }

    /// <summary>Minimal JSON string escaping for task attempt payloads.</summary>
    public static class TaskAttemptJson
    {
        public static string StringLiteral(string value)
        {
            var s = value ?? string.Empty;
            var sb = new StringBuilder();
            sb.Append('"');
            foreach (var ch in s)
            {
                switch (ch)
                {
                    case '\\':
                        sb.Append("\\\\");
                        break;
                    case '"':
                        sb.Append("\\\"");
                        break;
                    case '\n':
                        sb.Append("\\n");
                        break;
                    case '\r':
                        sb.Append("\\r");
                        break;
                    case '\t':
                        sb.Append("\\t");
                        break;
                    default:
                        if (ch < 32)
                            sb.Append("\\u").Append(((int)ch).ToString("x4"));
                        else
                            sb.Append(ch);
                        break;
                }
            }

            sb.Append('"');
