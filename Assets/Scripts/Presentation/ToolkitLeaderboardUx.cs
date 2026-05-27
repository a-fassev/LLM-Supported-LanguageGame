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
            SetLabel(root, "pizza-wallet-value", row.totalSlices.ToString());
            SetLabel(root, "backpack-wallet-value", row.totalBackpackPieces.ToString());

            BindTeamDot(root, row.team);
            WalletHudBinder.ApplyHudBadgesIn(root);

            return true;
        }

        private static void BindTeamDot(VisualElement rowRoot, string team)
        {
            var dot = rowRoot.Q<VisualElement>("team-dot");
            if (dot == null)
                return;

            dot.RemoveFromClassList("lg-leaderboard-team-dot--visible");
            dot.RemoveFromClassList("lg-leaderboard-team-dot--blue");
            dot.RemoveFromClassList("lg-leaderboard-team-dot--red");

            dot.AddToClassList("lg-leaderboard-team-dot--visible");
            if (team == "blue")
                dot.AddToClassList("lg-leaderboard-team-dot--blue");
            else if (team == "red")
                dot.AddToClassList("lg-leaderboard-team-dot--red");
        }

        public static bool TryAddTeamSummaryCard(VisualElement host, GameLeaderboardTeamEntryDto row)
        {
            if (host == null || row == null)
                return false;

            if (!ToolkitStepUx.TryMount(host, TeamSummaryPath, "leaderboard-team-summary-card", out var root))
                return false;

            SetLabel(root, "rank-label", $"#{row.rank}");
            SetLabel(root, "team-name-label", FormatTeam(row.team));
            SetLabel(root, "team-meta-label", FormatTeamMemberCount(row.memberCount));
            SetLabel(root, "pizza-wallet-value", row.totalSlices.ToString());
            SetLabel(root, "backpack-wallet-value", row.totalBackpackPieces.ToString());

            BindTeamDot(root, row.team);
            WalletHudBinder.ApplyHudBadgesIn(root);

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

        private static string FormatTeam(string team) => LearningToolkitChromeUx.FormatTeamDisplayLabel(team);

        private static string FormatTeamMemberCount(int memberCount) =>
            memberCount == 1 ? "1 giocatore" : $"{memberCount} giocatori";
    }
}
