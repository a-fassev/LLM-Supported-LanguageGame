using System;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Placeholder UI Toolkit step for task types without a dedicated implementation yet.</summary>
    public sealed class StubToolkitTaskStep : IStepView, ISubmitFromShell
    {
        private const string UnimplementedMessage = "This task type is not implemented yet.";

        private readonly VisualElement _root;

        private StepContext _context;

        public StubToolkitTaskStep(VisualElement host, string taskTypeLabel)
        {
            _root = new VisualElement();
            _root.style.flexGrow = 1;
            _root.AddToClassList("lg-muted-panel");
            _root.style.paddingTop = 16;
            _root.style.paddingBottom = 16;
            _root.style.paddingLeft = 16;
            _root.style.paddingRight = 16;

            var title = new Label(string.IsNullOrEmpty(taskTypeLabel) ? "Task" : taskTypeLabel);
            title.AddToClassList("lg-heading-screen");
            title.style.marginBottom = 12;
            _root.Add(title);

            var body = new Label("This step type is not available yet. Check will show a short message.");
            body.AddToClassList("lg-text-body");
            body.AddToClassList("lg-text-muted");
            body.style.whiteSpace = WhiteSpace.Normal;
            _root.Add(body);

            host.Add(_root);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> _)
        {
            _context = context;
        }

        public void SetInteractable(bool interactable)
        {
        }

        public void SubmitFromShell()
        {
            _context?.presentValidationMessage?.Invoke(UnimplementedMessage);
        }

        public void Teardown()
        {
            _context = null;
            _root?.RemoveFromHierarchy();
        }
    }
}
