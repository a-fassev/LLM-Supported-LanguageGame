namespace ITBL.LanguageGame.Runtime.Infrastructure.Persistence
{
    public interface IPlayerProfileRepository
    {
        PlayerProfile Load();
        void Save(PlayerProfile profile);
    }
}
