namespace LanguageGame.Presentation.Steps
{
    public sealed class MultipleChoiceStepView : TaskStepBase
    {
        protected override bool ValidateBeforeComplete()
        {
            PresentValidationFeedback(UnimplementedTaskMechanicMessage);
            return false;
        }
    }
}
