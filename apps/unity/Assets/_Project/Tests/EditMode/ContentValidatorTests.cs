using ITBL.LanguageGame.Runtime.Game.Content;
using NUnit.Framework;

namespace ITBL.LanguageGame.Tests.EditMode
{
    public sealed class ContentValidatorTests
    {
        [Test]
        public void Validate_ReturnsSuccess_ForWellFormedDocument()
        {
            LevelContentDocument document = new()
            {
                levelId = "test-level",
                version = 1,
                displayName = "Test Level",
                difficulty = "easy",
                taskOrder = new System.Collections.Generic.List<string> { "t1" },
                levelCompletionRule = new LevelCompletionRuleConfig { mode = "all_required" },
                tasks = new System.Collections.Generic.List<LevelTaskDefinition>
                {
                    new()
                    {
                        taskId = "t1",
                        taskType = "multiple_choice",
                        prompt = "Prompt",
                        question = "Question",
                        choices = new System.Collections.Generic.List<MultipleChoiceOption>
                        {
                            new() { id = "a", label = "A" },
                            new() { id = "b", label = "B" },
                        },
                        correctChoiceId = "a",
                        scoring = new TaskScoringConfig { policy = "strict_binary", maxPoints = 1, passThreshold = 1f },
                    },
                },
            };

            ContentValidationResult result = new ContentValidator().Validate(document);
            Assert.IsTrue(result.IsValid, result.Message);
        }

        [Test]
        public void Validate_ReturnsFailure_ForUnsupportedContentVersion()
        {
            LevelContentDocument document = new()
            {
                levelId = "test-level",
                version = 99,
                displayName = "Test Level",
                difficulty = "easy",
                taskOrder = new System.Collections.Generic.List<string> { "t1" },
                levelCompletionRule = new LevelCompletionRuleConfig { mode = "all_required" },
                tasks = new System.Collections.Generic.List<LevelTaskDefinition> { BuildTask("t1") },
            };

            ContentValidationResult result = new ContentValidator().Validate(document);
            Assert.IsFalse(result.IsValid);
            StringAssert.Contains("Unsupported level content version", result.Message);
            StringAssert.Contains("99", result.Message);
        }

        [Test]
        public void Validate_ReturnsFailure_ForDuplicateTaskIds()
        {
            LevelContentDocument document = new()
            {
                levelId = "test-level",
                version = 1,
                displayName = "Test Level",
                difficulty = "easy",
                taskOrder = new System.Collections.Generic.List<string> { "t1" },
                levelCompletionRule = new LevelCompletionRuleConfig { mode = "all_required" },
                tasks = new System.Collections.Generic.List<LevelTaskDefinition>
                {
                    BuildTask("t1"),
                    BuildTask("t1"),
                },
            };

            ContentValidationResult result = new ContentValidator().Validate(document);
            Assert.IsFalse(result.IsValid);
        }

        [Test]
        public void Validate_ReturnsSuccess_ForLlmWordGuessTask()
        {
            LevelContentDocument document = new()
            {
                levelId = "llm-level",
                version = 1,
                displayName = "LLM Level",
                difficulty = "easy",
                taskOrder = new System.Collections.Generic.List<string> { "llm-guess-1" },
                levelCompletionRule = new LevelCompletionRuleConfig { mode = "all_required" },
                tasks = new System.Collections.Generic.List<LevelTaskDefinition>
                {
                    new()
                    {
                        taskId = "llm-guess-1",
                        taskType = "llm_word_guess",
                        prompt = "Beschreibe das Wort",
                        targetWord = "mela",
                        maxGuessAttempts = 3,
                        scoring = new TaskScoringConfig { policy = "threshold_pass", maxPoints = 5, passThreshold = 0.5f },
                    },
                },
            };

            ContentValidationResult result = new ContentValidator().Validate(document);
            Assert.IsTrue(result.IsValid, result.Message);
        }

        private static LevelTaskDefinition BuildTask(string taskId)
        {
            return new LevelTaskDefinition
            {
                taskId = taskId,
                taskType = "multiple_choice",
                prompt = "Prompt",
                question = "Question",
                choices = new System.Collections.Generic.List<MultipleChoiceOption>
                {
                    new() { id = "a", label = "A" },
                    new() { id = "b", label = "B" },
                },
                correctChoiceId = "a",
                scoring = new TaskScoringConfig { policy = "strict_binary", maxPoints = 1, passThreshold = 1f },
            };
        }
    }
}
