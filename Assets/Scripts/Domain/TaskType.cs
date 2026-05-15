namespace LanguageGame.Domain
{
    /// <summary>
    /// Identifies each task kind in the game. Levels may contain multiple tasks of any mix of types.
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
