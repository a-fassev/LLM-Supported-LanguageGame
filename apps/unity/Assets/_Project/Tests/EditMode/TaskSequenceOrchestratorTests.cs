using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.Game.Content;
using ITBL.LanguageGame.Runtime.Game.Flow;
using ITBL.LanguageGame.Runtime.Game.Modes;
using ITBL.LanguageGame.Runtime.Infrastructure.Persistence;
using NUnit.Framework;

namespace ITBL.LanguageGame.Tests.EditMode
{
    public sealed class TaskSequenceOrchestratorTests
    {
        [Test]
        public async Task Submit_AdvancesAcrossTasks_AndFinishesLevel()
        {
            LevelContentDocument document = new()
            {
                levelId = "level-test",
                version = 1,
                displayName = "Level Test",
                difficulty = "easy",
                taskOrder = new List<string> { "mc-1", "match-1" },
                levelCompletionRule = new LevelCompletionRuleConfig { mode = "all_required" },
                tasks = new List<LevelTaskDefinition>
                {
                    new()
                    {
                        taskId = "mc-1",
                        taskType = "multiple_choice",
                        prompt = "MC",
                        question = "Q",
                        choices = new List<MultipleChoiceOption> { new() { id = "a", label = "A" }, new() { id = "b", label = "B" } },
                        correctChoiceId = "a",
                        scoring = new TaskScoringConfig { policy = "strict_binary", maxPoints = 1, passThreshold = 1f },
                    },
                    new()
                    {
                        taskId = "match-1",
                        taskType = "matching",
                        prompt = "Match",
                        leftItems = new List<string> { "uno", "due" },
                        rightItems = new List<string> { "one", "two" },
                        correctPairs = new List<MatchingPair>
                        {
                            new() { left = "uno", right = "one" },
                            new() { left = "due", right = "two" },
                        },
                        scoring = new TaskScoringConfig { policy = "partial_points", maxPoints = 2, passThreshold = 0.5f },
                    },
                },
            };

            LevelModeRegistry registry = new(new ILevelMode[]
            {
                new MultipleChoiceMode(),
                new MatchingMode(),
            });
            TaskSequenceOrchestrator orchestrator = new(document, registry);

            TaskSubmission firstSubmission = new();
            firstSubmission.Values.Add("a");
            TaskStepOutcome first = await orchestrator.SubmitAsync(firstSubmission);
            Assert.IsTrue(first.AdvancedToNextTask);
            Assert.IsFalse(first.LevelFinished);

            TaskSubmission secondSubmission = new();
            secondSubmission.Values.Add("uno=>one");
            secondSubmission.Values.Add("due=>two");
            TaskStepOutcome second = await orchestrator.SubmitAsync(secondSubmission);
            Assert.IsTrue(second.LevelFinished);
            Assert.IsTrue(second.LevelPassed);
            Assert.Greater(orchestrator.GetTotalScoreEarned(), 0);
        }

        [Test]
        public async Task Submit_DoesNotConsumeAttempt_WhenEvaluationFails()
        {
            LevelContentDocument document = new()
            {
                levelId = "level-llm",
                version = 1,
                displayName = "Level LLM",
                difficulty = "easy",
                taskOrder = new List<string> { "llm-1" },
                levelCompletionRule = new LevelCompletionRuleConfig { mode = "all_required" },
                tasks = new List<LevelTaskDefinition>
                {
                    new()
                    {
                        taskId = "llm-1",
                        taskType = "llm_free_text",
                        prompt = "Antworten",
                        evaluationCriteria = new List<string> { "Kriterium" },
                        targetStructures = new List<string>(),
                        scoring = new TaskScoringConfig { policy = "threshold_pass", maxPoints = 4, passThreshold = 0.5f },
                    },
                },
            };

            LevelModeRegistry registry = new(new ILevelMode[] { new FailingLlmMode() });
            TaskSequenceOrchestrator orchestrator = new(document, registry);

            TaskStepOutcome outcome = await orchestrator.SubmitAsync(new TaskSubmission { RawText = "Test" });
            Assert.IsFalse(outcome.IsAccepted);
            Assert.AreEqual(AppErrorCode.NetworkTimeout, outcome.ErrorCode);
            Assert.AreEqual(0, orchestrator.TaskStates[0].AttemptsUsed);
        }

        [Test]
        public async Task Submit_ReturnsRetryAvailable_WhenTaskNotPassedYet()
        {
            LevelContentDocument document = new()
            {
                levelId = "level-retry",
                version = 1,
                displayName = "Retry Level",
                difficulty = "easy",
                taskOrder = new List<string> { "mc-1" },
                levelCompletionRule = new LevelCompletionRuleConfig { mode = "all_required" },
                tasks = new List<LevelTaskDefinition>
                {
                    new()
                    {
                        taskId = "mc-1",
                        taskType = "multiple_choice",
                        prompt = "Waehle die richtige Antwort",
                        question = "Quale parola e corretta?",
                        choices = new List<MultipleChoiceOption>
                        {
                            new() { id = "a", label = "sbagliata" },
                            new() { id = "b", label = "corretta" },
                        },
                        correctChoiceId = "b",
                        maxAttempts = 2,
                        scoring = new TaskScoringConfig { policy = "strict_binary", maxPoints = 1, passThreshold = 1f },
                    },
                },
            };

            LevelModeRegistry registry = new(new ILevelMode[] { new MultipleChoiceMode() });
            TaskSequenceOrchestrator orchestrator = new(document, registry);

            TaskSubmission wrong = new();
            wrong.Values.Add("a");
            TaskStepOutcome wrongOutcome = await orchestrator.SubmitAsync(wrong);

            Assert.IsTrue(wrongOutcome.IsAccepted);
            Assert.IsTrue(wrongOutcome.CanRetry);
            Assert.IsFalse(wrongOutcome.TaskCompleted);
            Assert.AreEqual(1, orchestrator.TaskStates[0].AttemptsUsed);

            TaskSubmission correct = new();
            correct.Values.Add("b");
            TaskStepOutcome correctOutcome = await orchestrator.SubmitAsync(correct);

            Assert.IsTrue(correctOutcome.LevelFinished);
            Assert.IsTrue(correctOutcome.LevelPassed);
        }

        [Test]
        public async Task Submit_EndsLevel_WhenMaxAttemptsExceededWithoutPass()
        {
            LevelContentDocument document = new()
            {
                levelId = "level-max",
                version = 1,
                displayName = "Max Attempts",
                difficulty = "easy",
                taskOrder = new List<string> { "mc-1", "mc-2" },
                levelCompletionRule = new LevelCompletionRuleConfig { mode = "all_required" },
                tasks = new List<LevelTaskDefinition>
                {
                    new()
                    {
                        taskId = "mc-1",
                        taskType = "multiple_choice",
                        prompt = "Waehle",
                        question = "Test?",
                        choices = new List<MultipleChoiceOption>
                        {
                            new() { id = "a", label = "falsch" },
                            new() { id = "b", label = "richtig" },
                        },
                        correctChoiceId = "b",
                        maxAttempts = 2,
                        scoring = new TaskScoringConfig { policy = "strict_binary", maxPoints = 1, passThreshold = 1f },
                    },
                    new()
                    {
                        taskId = "mc-2",
                        taskType = "multiple_choice",
                        prompt = "Zwei",
                        question = "Test 2?",
                        choices = new List<MultipleChoiceOption>
                        {
                            new() { id = "x", label = "x" },
                            new() { id = "y", label = "y" },
                        },
                        correctChoiceId = "y",
                        scoring = new TaskScoringConfig { policy = "strict_binary", maxPoints = 1, passThreshold = 1f },
                    },
                },
            };

            LevelModeRegistry registry = new(new ILevelMode[] { new MultipleChoiceMode() });
            TaskSequenceOrchestrator orchestrator = new(document, registry);

            TaskSubmission wrong = new();
            wrong.Values.Add("a");
            TaskStepOutcome first = await orchestrator.SubmitAsync(wrong);
            Assert.IsTrue(first.CanRetry);

            TaskStepOutcome second = await orchestrator.SubmitAsync(wrong);
            Assert.IsTrue(second.LevelFinished);
            Assert.IsFalse(second.LevelPassed);
            Assert.IsTrue(orchestrator.IsFinished);
            Assert.IsNull(orchestrator.CurrentTask);
        }

        [Test]
        public async Task ApplyResume_RestoresProgress_AndContinuesSequence()
        {
            LevelContentDocument document = new()
            {
                levelId = "level-resume",
                version = 1,
                displayName = "Resume",
                difficulty = "easy",
                taskOrder = new List<string> { "mc-1", "mc-2" },
                levelCompletionRule = new LevelCompletionRuleConfig { mode = "all_required" },
                tasks = new List<LevelTaskDefinition>
                {
                    new()
                    {
                        taskId = "mc-1",
                        taskType = "multiple_choice",
                        prompt = "Eins",
                        question = "Test?",
                        choices = new List<MultipleChoiceOption>
                        {
                            new() { id = "a", label = "richtig" },
                            new() { id = "b", label = "falsch" },
                        },
                        correctChoiceId = "a",
                        scoring = new TaskScoringConfig { policy = "strict_binary", maxPoints = 1, passThreshold = 1f },
                    },
                    new()
                    {
                        taskId = "mc-2",
                        taskType = "multiple_choice",
                        prompt = "Zwei",
                        question = "Test 2?",
                        choices = new List<MultipleChoiceOption>
                        {
                            new() { id = "x", label = "x" },
                            new() { id = "y", label = "y" },
                        },
                        correctChoiceId = "y",
                        scoring = new TaskScoringConfig { policy = "strict_binary", maxPoints = 1, passThreshold = 1f },
                    },
                },
            };

            LevelModeRegistry registry = new(new ILevelMode[] { new MultipleChoiceMode() });
            TaskSequenceOrchestrator orchestrator = new(document, registry);

            TaskSubmission firstSubmission = new();
            firstSubmission.Values.Add("a");
            await orchestrator.SubmitAsync(firstSubmission);

            LevelAttemptEntry attempt = new()
            {
                levelId = document.levelId,
                attemptId = "attempt-test",
                isCompleted = false,
                isPassed = false,
                currentTaskIndex = orchestrator.CurrentTaskIndex,
                tasks = new List<TaskAttemptEntry>(),
            };

            foreach (TaskRuntimeState state in orchestrator.TaskStates)
            {
                attempt.tasks.Add(new TaskAttemptEntry
                {
                    taskId = state.TaskId,
                    attemptsUsed = state.AttemptsUsed,
                    passed = state.IsPassed,
                    scoreEarned = state.BestScore,
                    scoreMax = state.ScoreMax,
                    completed = state.IsCompleted,
                });
            }

            TaskSequenceOrchestrator resumed = new(document, registry);
            resumed.ApplyResume(attempt);

            Assert.AreEqual("mc-2", resumed.CurrentTask.taskId);

            TaskSubmission secondSubmission = new();
            secondSubmission.Values.Add("y");
            TaskStepOutcome outcome = await resumed.SubmitAsync(secondSubmission);

            Assert.IsTrue(outcome.LevelFinished);
            Assert.IsTrue(outcome.LevelPassed);
        }

        private sealed class FailingLlmMode : ILevelMode
        {
            public TaskType SupportedType => TaskType.LlmFreeText;

            public Task<TaskResult> EvaluateAsync(
                LevelTaskDefinition task,
                TaskSubmission submission,
                CancellationToken cancellationToken = default)
            {
                return Task.FromResult(new TaskResult
                {
                    IsEvaluationError = true,
                    ErrorCode = AppErrorCode.NetworkTimeout,
                    RetryRecommended = true,
                    Feedback = "Timeout",
                });
            }
        }
    }
}
