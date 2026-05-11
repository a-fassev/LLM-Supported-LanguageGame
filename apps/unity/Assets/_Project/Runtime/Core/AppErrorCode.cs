namespace ITBL.LanguageGame.Runtime.Core
{
    public enum AppErrorCode
    {
        None = 0,
        ContentInvalid = 1,
        TaskConfigInvalid = 2,
        NetworkTimeout = 3,
        ApiUnavailable = 4,
        ApiInvalidResponse = 5,
        SceneLoadFailed = 6,
        PersistenceLoadFailed = 7,
        PersistenceSaveFailed = 8,
    }
}
