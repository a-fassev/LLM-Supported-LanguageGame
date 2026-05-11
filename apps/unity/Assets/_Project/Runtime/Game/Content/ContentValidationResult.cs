namespace ITBL.LanguageGame.Runtime.Game.Content
{
    public sealed class ContentValidationResult
    {
        public static ContentValidationResult Success()
        {
            return new ContentValidationResult(true, string.Empty);
        }

        public static ContentValidationResult Fail(string message)
        {
            return new ContentValidationResult(false, message);
        }

        private ContentValidationResult(bool isValid, string message)
        {
            IsValid = isValid;
            Message = message;
        }

        public bool IsValid { get; }
        public string Message { get; }
    }
}
