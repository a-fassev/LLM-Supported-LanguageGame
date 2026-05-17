namespace LanguageGame.Presentation.Steps
{
    public sealed class MatchingStepView : TaskStepBase
    {
        protected override bool ValidateBeforeComplete()
        {
            PresentValidationFeedback(UnimplementedTaskMechanicMessage);
            return false;
        }
    }
}
