using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.Infrastructure.Persistence;
using NUnit.Framework;

namespace ITBL.LanguageGame.Tests.EditMode
{
    public sealed class PersistenceRepositoryFactoryTests
    {
        [Test]
        public void Create_UsesLocalRepositories_WhenProviderIsUnknown()
        {
            JsonSaveStore store = new(new UserFacingErrorState());
            PersistenceRepositories repositories = PersistenceRepositoryFactory.Create("mystery", store);

            Assert.IsInstanceOf<JsonProgressRepository>(repositories.ProgressRepository);
            Assert.IsInstanceOf<JsonPlayerProfileRepository>(repositories.PlayerProfileRepository);
        }

        [Test]
        public void Create_FallsBackToLocal_WhenProviderIsSupabase()
        {
            JsonSaveStore store = new(new UserFacingErrorState());
            PersistenceRepositories repositories = PersistenceRepositoryFactory.Create("supabase", store);

            Assert.IsInstanceOf<JsonProgressRepository>(repositories.ProgressRepository);
            Assert.IsInstanceOf<JsonPlayerProfileRepository>(repositories.PlayerProfileRepository);
        }
    }
}
