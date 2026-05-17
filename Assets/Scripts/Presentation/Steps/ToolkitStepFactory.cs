using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Builds UI Toolkit step views for the quest shell.</summary>
    public static class ToolkitStepFactory
    {
        /// <param name="stepHost">Visual container (<c>step-host</c>) from quest shell UXML.</param>
        /// <param name="coroutineHost">Owner for steps that need coroutines (e.g. loading textures).</param>
        /// <returns><c>null</c> only when <paramref name="stepHost"/> is <c>null</c>; otherwise a concrete <see cref="IStepView"/>.</returns>
        public static IStepView Create(GameQuestStepDto step, VisualElement stepHost, MonoBehaviour coroutineHost)
        {
            if (stepHost == null)
                return null;

            if (!step.isTask)
                return new CutsceneToolkitStep(stepHost);

            return step.taskType switch
            {
                "DragDrop" => new DragDropToolkitStep(stepHost, coroutineHost),
                "ClozeText" => new ClozeTextToolkitStep(stepHost),
                "MultipleChoice" => new MultipleChoiceToolkitStep(stepHost, coroutineHost),
                "Matching" => new StubToolkitTaskStep(stepHost, step.taskType),
                "FreeText" => new StubToolkitTaskStep(stepHost, step.taskType),
                "RelativeClause" => new StubToolkitTaskStep(stepHost, step.taskType),
                "ErrorSpotting" => new StubToolkitTaskStep(stepHost, step.taskType),
                _ => new StubToolkitTaskStep(stepHost, string.IsNullOrEmpty(step.taskType) ? "Task" : step.taskType),
            };
        }
    }
}
