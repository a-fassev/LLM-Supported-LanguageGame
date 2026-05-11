namespace ITBL.LanguageGame.Runtime.Game.Content
{
    public sealed class LevelContentLoadResult
    {
        public static LevelContentLoadResult Success(LevelContentDocument document)
        {
            return new LevelContentLoadResult(document, true, string.Empty);
        }

        public static LevelContentLoadResult Fail(string error)
        {
            return new LevelContentLoadResult(null, false, error);
        }

        private LevelContentLoadResult(LevelContentDocument document, bool isSuccess, string error)
        {
            Document = document;
            IsSuccess = isSuccess;
            Error = error;
        }

        public LevelContentDocument Document { get; }
        public bool IsSuccess { get; }
        public string Error { get; }
    }
}
