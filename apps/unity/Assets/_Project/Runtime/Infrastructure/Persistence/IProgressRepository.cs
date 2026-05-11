namespace ITBL.LanguageGame.Runtime.Infrastructure.Persistence
{
    public interface IProgressRepository
    {
        ProgressSnapshot Load();
        void Save(ProgressSnapshot snapshot);
    }
}
