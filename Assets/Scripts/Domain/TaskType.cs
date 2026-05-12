namespace LanguageGame.Domain
{
    /// <summary>
    /// Identifies each task type in the game. Maps 1:1 to a Level scene.
    /// </summary>
    public enum TaskType
    {
        ErrorSpotting,
        DragDrop,
        ClozeText,
        Matching,
        MultipleChoice,
        FreeText,
        RelativeClause
    }
}
