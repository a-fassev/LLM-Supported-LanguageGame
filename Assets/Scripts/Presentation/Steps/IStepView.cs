using System;

namespace LanguageGame.Presentation.Steps
{
    public interface IStepView
    {
        void Bind(StepContext context, Action<StepCompletionRequest> onRequest);
        void SetInteractable(bool interactable);
        void Teardown();
    }
}
