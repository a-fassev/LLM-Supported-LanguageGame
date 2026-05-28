using System;
using LanguageGame.Application;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Placeholder UI Toolkit step for task types without a dedicated implementation yet.</summary>
    public sealed class StubToolkitTaskStep : IStepView, ISubmitFromShell
    {
        private const string DefaultStubBody =
            "Questo tipo di attività non è ancora disponibile. Tocca Controlla per un messaggio.";

        private const string DefaultStubValidation = "Questo tipo di attività non è ancora implementato.";

        private const string MissingFactoryBody =
            "Impossibile caricare questo passo. Esci dalla missione dal menu e riprova.";

        private const string MissingFactoryValidation =
            "Impossibile caricare questo passo. Esci dalla missione e riprova.";

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
                ? $"Non disponibile ({step.taskType})"
                : "Passo non disponibile";
            return new StubToolkitTaskStep(host, title, MissingFactoryBody, MissingFactoryValidation);
        }

        private StubToolkitTaskStep(VisualElement host, string titleText, string bodyText, string validationMessage)
        {
            _validationMessage = validationMessage ?? DefaultStubValidation;
            _root = new VisualElement();
            _root.AddToClassList("lg-task-template-layout");

            var title = new Label(titleText ?? "Attività");
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
