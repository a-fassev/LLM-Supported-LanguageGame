using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Builds UI Toolkit step views for quest shell (Wave 2).</summary>
    public static class ToolkitStepFactory
    {
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
