namespace LanguageGame.Presentation
{
    /// <summary>Task or cutscene quest shell; only one active at a time.</summary>
    public interface IQuestStepShellPresenter
    {
        bool IsMounted { get; }

        void Mount();

        void Unmount();

        void RefreshUi();
    }
}
