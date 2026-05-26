namespace LanguageGame.Presentation.Steps
{
    /// <summary>Quest shell uses this to advance local beats before server cutscene advance.</summary>
    public interface ICutsceneBeatNavigator
    {
        /// <summary>Moves to next beat when available; returns false on last beat (shell should advance server step).</summary>
        bool TryAdvanceBeat();

        string GetPrimaryCtaLabel();

        bool IsCutsceneBlockBack();

        void OnShellPrimaryPressed();

        void TeardownBeatNavigation();
    }
}
