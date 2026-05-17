namespace LanguageGame.Presentation.Steps
{
    public sealed class ErrorSpottingStepView : TaskStepBase
    {
        protected override bool ValidateBeforeComplete()
        {
            PresentValidationFeedback(UnimplementedTaskMechanicMessage);
            return false;
        }
    }
}
