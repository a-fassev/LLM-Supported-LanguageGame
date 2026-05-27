using LanguageGame.Application;
using LanguageGame.Presentation.Steps;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    internal static class ToolkitLeaderboardUx
    {
        private const string PlayerRowPath = "UI/LearningToolkit/Templates/Parts/Leaderboard/LeaderboardPlayerRowPart";
        private const string TeamSummaryPath = "UI/LearningToolkit/Templates/Parts/Leaderboard/LeaderboardTeamSummaryPart";
        private const string TeamSectionHeaderPath =
            "UI/LearningToolkit/Templates/Parts/Leaderboard/LeaderboardTeamSectionHeaderPart";

        public static bool TryAddPlayerRow(VisualElement host, GameLeaderboardPlayerEntryDto row)
        {
            if (host == null || row == null)
                return false;

            if (!ToolkitStepUx.TryMount(host, PlayerRowPath, "leaderboard-player-row", out var root))
                return false;

            SetLabel(root, "rank-label", $"#{row.rank}");
            SetLabel(root, "username-label", row.username ?? string.Empty);
            SetLabel(root, "team-label", FormatTeam(row.team));
            SetLabel(root, "score-label", row.totalSlices.ToString());

            if (row.isSelf)
                root.AddToClassList("lg-leaderboard-row--self");

            if (row.team == "blue")
                root.AddToClassList("lg-leaderboard-row--blue");
            else if (row.team == "red")
                root.AddToClassList("lg-leaderboard-row--red");

            return true;
        }

        public static bool TryAddTeamSummaryCard(VisualElement host, GameLeaderboardTeamEntryDto row)
        {
            if (host == null || row == null)
                return false;

            if (!ToolkitStepUx.TryMount(host, TeamSummaryPath, "leaderboard-team-summary-card", out var root))
                return false;

            SetLabel(root, "team-title-label", $"{FormatTeam(row.team)} · Rank #{row.rank}");
            SetLabel(root, "team-body-label", $"{row.totalSlices} team slices · {row.memberCount} players");

            if (row.team == "blue")
                root.AddToClassList("lg-leaderboard-team--blue");
            else if (row.team == "red")
                root.AddToClassList("lg-leaderboard-team--red");

            root.style.marginBottom = 8;
            return true;
        }

        public static bool TryAddTeamSectionHeader(VisualElement host, string title)
        {
            if (host == null)
                return false;

            if (!ToolkitStepUx.TryMount(host, TeamSectionHeaderPath, "leaderboard-team-section-header", out var root))
                return false;

            SetLabel(root, "team-section-title-label", title ?? string.Empty);
            return true;
        }

        private static void SetLabel(VisualElement root, string name, string text)
        {
            var label = root.Q<Label>(name);
            if (label != null)
                label.text = text ?? string.Empty;
        }

        private static string FormatTeam(string team) =>
            team == "blue" ? "Team Blue" : team == "red" ? "Team Red" : team ?? string.Empty;
    }
}
