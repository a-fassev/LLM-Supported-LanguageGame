namespace LanguageGame.Presentation.Steps
{
    /// <summary>Cutscene shell uses this to advance local beats before server cutscene advance.</summary>
    public interface ICutsceneBeatNavigator
    {
        /// <summary>False when <c>contentJson</c> could not be parsed; shell must not advance the server step.</summary>
        bool IsContentValid { get; }

        /// <summary>Moves to next beat when available; returns false on last beat (shell should advance server step).</summary>
        bool TryAdvanceBeat();

        string GetPrimaryCtaLabel();

        bool IsCutsceneBlockBack();

        void OnShellPrimaryPressed();

        void TeardownBeatNavigation();
    }
}
