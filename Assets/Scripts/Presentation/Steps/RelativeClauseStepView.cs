namespace LanguageGame.Presentation.Steps
{
    public sealed class RelativeClauseStepView : TaskStepBase
    {
        protected override bool ValidateBeforeComplete()
        {
            PresentValidationFeedback(UnimplementedTaskMechanicMessage);
            return false;
        }
    }
}
