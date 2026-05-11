namespace ITBL.LanguageGame.Runtime.Infrastructure.Persistence
{
    public sealed class JsonProgressRepository : IProgressRepository
    {
        private readonly JsonSaveStore _store;

        public JsonProgressRepository(JsonSaveStore store)
        {
            _store = store;
        }

        public ProgressSnapshot Load()
        {
            return _store.Load().progress ?? new ProgressSnapshot();
        }

        public void Save(ProgressSnapshot snapshot)
        {
            SaveData saveData = _store.Load();
            saveData.progress = snapshot ?? new ProgressSnapshot();
            _store.Save(saveData);
        }
    }
}
