namespace LanguageGame.Presentation.Steps
{
    public sealed class FreeTextStepView : TaskStepBase
    {
        protected override bool ValidateBeforeComplete()
        {
            PresentValidationFeedback(UnimplementedTaskMechanicMessage);
            return false;
        }
    }
}
