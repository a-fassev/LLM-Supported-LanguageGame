using System;
using LanguageGame.Application;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Placeholder UI Toolkit step for task types without a dedicated implementation yet.</summary>
    public sealed class StubToolkitTaskStep : IStepView, ISubmitFromShell
    {
        private const string DefaultStubBody =
            "This step type is not available yet. Check will show a short message.";

        private const string DefaultStubValidation = "This task type is not implemented yet.";

        private const string MissingFactoryBody =
            "This step could not be loaded. Leave the quest from the menu and try again.";

        private const string MissingFactoryValidation =
            "This step could not be loaded. Leave the quest and try again.";

        private readonly VisualElement _root;
        private readonly string _validationMessage;

        private StepContext _context;

        public StubToolkitTaskStep(VisualElement host, string taskTypeLabel)
            : this(
                host,
                string.IsNullOrEmpty(taskTypeLabel) ? "Task" : taskTypeLabel,
                DefaultStubBody,
                DefaultStubValidation)
        {
        }

        /// <summary>
        /// Fallback when <see cref="ToolkitStepFactory.Create"/> unexpectedly returns null (e.g. missing step host).
        /// </summary>
        public static StubToolkitTaskStep CreateMissingFactoryFallback(VisualElement host, GameQuestStepDto step)
        {
            string title = step != null && !string.IsNullOrEmpty(step.taskType)
                ? $"Unavailable ({step.taskType})"
                : "Step unavailable";
            return new StubToolkitTaskStep(host, title, MissingFactoryBody, MissingFactoryValidation);
        }

        private StubToolkitTaskStep(VisualElement host, string titleText, string bodyText, string validationMessage)
        {
            _validationMessage = validationMessage ?? DefaultStubValidation;
            _root = new VisualElement();
            _root.style.flexGrow = 1;
            _root.AddToClassList("lg-muted-panel");
            _root.AddToClassList("lg-task-template-root");
            _root.style.paddingTop = 16;
            _root.style.paddingBottom = 16;
            _root.style.paddingLeft = 16;
            _root.style.paddingRight = 16;

            var title = new Label(titleText ?? "Task");
            title.AddToClassList("lg-task-prompt");
            title.style.marginBottom = 12;
            _root.Add(title);

            var body = new Label(bodyText ?? DefaultStubBody);
            body.AddToClassList("lg-task-meta");
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
            _context?.presentValidationMessage?.Invoke(_validationMessage);
        }

        public void Teardown()
        {
            _context = null;
            _root?.RemoveFromHierarchy();
        }
    }
}
