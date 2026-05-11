namespace ITBL.LanguageGame.Runtime.Infrastructure.Persistence
{
    public sealed class JsonPlayerProfileRepository : IPlayerProfileRepository
    {
        private readonly JsonSaveStore _store;

        public JsonPlayerProfileRepository(JsonSaveStore store)
        {
            _store = store;
        }

        public PlayerProfile Load()
        {
            return _store.Load().profile ?? new PlayerProfile();
        }

        public void Save(PlayerProfile profile)
        {
            SaveData saveData = _store.Load();
            saveData.profile = profile ?? new PlayerProfile();
            _store.Save(saveData);
        }
    }
}
