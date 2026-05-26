using System;
using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// LLM-evaluated Freitext task (<c>taskType = FreitextLlm</c>).
    /// Uses <see cref="JsonUtility"/> DTO parsing: keep authoring fields primitives + nested weights;
    /// optional <c>string[]</c> in JSON may deserialize inconsistently in Unity—in that case keep rubric text in <c>prompt</c>/<c>instruction</c>.
    /// </summary>
    public sealed class FreitextLlmToolkitStep : IStepView, ISubmitFromShell, IEvaluationGateForTaskCompletion
    {
        private const int AbsoluteMaxCharacters = 8000;

        private readonly bool _uiReady;
        private readonly VisualElement _root;

        private readonly MonoBehaviour _coroutineHost;

        private readonly Label _promptLabel;

        private readonly Label _instructionLabel;

        private readonly TextField _answerField;

        private readonly Label _statsLabel;

        private Coroutine _evaluationRoutine;

        private FreitextLlmContentDto _dto;

        private StepContext _context;

        private Action<StepCompletionRequest> _onRequest;

        private GameProgressApiClient _gameApi;

        private bool _contentReady;

        private bool _interactable = true;

        private bool _evaluating;

        private string _queuedEvaluationGateToken;

        public FreitextLlmToolkitStep(VisualElement host, MonoBehaviour coroutineHost)
        {
            _coroutineHost = coroutineHost;
            _uiReady = ToolkitStepUx.TryMount(host, ToolkitStepTemplatePaths.FreitextLlmTask, "freitext-llm-root", out _root);
            _promptLabel = _uiReady
                ? ToolkitStepUx.QueryOptional<Label>(_root, "task-prompt")
                : null;
            _instructionLabel = _uiReady
                ? ToolkitStepUx.QueryOptional<Label>(_root, "task-instruction")
                : null;
            _answerField = _uiReady
                ? ToolkitStepUx.QueryRequired<TextField>(_root, "task-answer-field", nameof(FreitextLlmToolkitStep))
                : null;
            _statsLabel = _uiReady
                ? ToolkitStepUx.QueryRequired<Label>(_root, "task-stats-label", nameof(FreitextLlmToolkitStep))
                : null;

            if (_answerField != null)
                _answerField.RegisterValueChangedCallback(_ => RefreshStats());
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context;
            _onRequest = onRequest;
            _contentReady = false;
            _evaluating = false;
            _queuedEvaluationGateToken = null;

            if (!ToolkitStepUx.GuardTemplateReady(_uiReady, context, _answerField, _statsLabel))
                return;

            _gameApi = context?.gameProgressApi != null
                ? context.gameProgressApi
                : UnityEngine.Object.FindAnyObjectByType<GameProgressApiClient>();

            if (!TryDeserialize(context?.contentJson, out var dto, out var dtoError))
            {
                Debug.LogWarning($"[FreitextLlmToolkitStep] Invalid contentJson: {dtoError ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(dtoError)
                    ? "Invalid FreitextLlm content."
                    : dtoError);
                return;
            }

            if (!ValidateAuthoringPayload(dto, out var authoringError))
            {
                context?.presentValidationMessage?.Invoke(authoringError);
                return;
            }

            _dto = dto;
            ApplyAuthoringTexts(dto);
            _answerField?.SetValueWithoutNotify(string.Empty);

            RefreshStats();
            _contentReady = true;
        }

        public void SubmitFromShell()
        {
            if (!_contentReady || _evaluating || _dto == null)
                return;

            if (!ValidateClientAnswer(out var clientError))
            {
                if (!string.IsNullOrEmpty(clientError))
                    _context?.presentValidationMessage?.Invoke(clientError);
                return;
            }

            var answerTrimmed = _answerField.value?.Trim() ?? "";

            if (_evaluationRoutine != null)
            {
                _coroutineHost.StopCoroutine(_evaluationRoutine);
                _evaluationRoutine = null;
                _context?.dismissBusyOverlay?.Invoke();
            }

            _evaluationRoutine = _coroutineHost.StartCoroutine(EvaluateAndQueueGateRoutine(answerTrimmed));
        }

        public void SetInteractable(bool interactable)
        {
            _interactable = interactable;
            _answerField?.SetEnabled(_interactable && !_evaluating);
        }

        public void Teardown()
        {
            if (_evaluationRoutine != null)
            {
                _coroutineHost.StopCoroutine(_evaluationRoutine);
                _evaluationRoutine = null;
            }

            _context?.dismissBusyOverlay?.Invoke();

            _root.RemoveFromHierarchy();
            _dto = null;
            _context = null;
            _onRequest = null;
            _queuedEvaluationGateToken = null;
        }

        public bool TryTakeEvaluationGateToken(out string evaluationGateToken)
        {
            evaluationGateToken = _queuedEvaluationGateToken;
            _queuedEvaluationGateToken = null;
            return !string.IsNullOrWhiteSpace(evaluationGateToken);
        }

        private IEnumerator EvaluateAndQueueGateRoutine(string answer)
        {
            try
            {
                if (_gameApi == null || _context == null)
                {
                    _context?.presentValidationMessage?.Invoke("Game API not available.");
                    yield break;
                }

                _evaluating = true;
                SetInteractableSafe(false);
                _context.presentBusyOverlay?.Invoke("Reviewing your writing…");

                GameFreitextLlmEvaluateEnvelope envelope = null;
                var error = string.Empty;
                yield return _gameApi.EvaluateFreitextLlmStep(
                    _context.runId,
                    _context.stepId,
                    answer,
                    env => envelope = env,
                    msg => error = msg);

                _evaluating = false;

                if (envelope == null || !envelope.ok)
                {
                    _context.dismissBusyOverlay?.Invoke();
                    SetInteractableSafe(true);

                    if (GameProgressApiClient.LooksLikeSessionAuthFailure(error))
                        GameFlowController.Instance?.LoadAuth();
                    else if (!string.IsNullOrWhiteSpace(error))
                        _context?.presentValidationMessage?.Invoke(error);
                    else
                        _context?.presentValidationMessage?.Invoke("Scorer request failed.");

                    yield break;
                }

                if (!envelope.isPass)
                {
                    _context.dismissBusyOverlay?.Invoke();
                    SetInteractableSafe(true);

                    var msg = $"{envelope.summaryFeedback}\n\nNext step hint: {envelope.nextStepAdvice}";
                    _context.presentValidationMessage?.Invoke(ClampPresentationMessage(msg));
                    yield break;
                }

                if (string.IsNullOrWhiteSpace(envelope.evaluationGateToken))
                {
                    _context.dismissBusyOverlay?.Invoke();
                    SetInteractableSafe(true);
                    _context?.presentValidationMessage?.Invoke("Server did not release a progression token.");
                    yield break;
                }

                _queuedEvaluationGateToken = envelope.evaluationGateToken.Trim();
                // Keep overlay visible; quest shell will swap the message to "Checking…" on complete.
                _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
            }
            finally
            {
                _evaluationRoutine = null;
            }
        }

        private void ApplyAuthoringTexts(FreitextLlmContentDto dto)
        {
            var prompt = string.IsNullOrWhiteSpace(dto.prompt)
                ? "Write freely using your own wording."
                : dto.prompt.Trim();
            if (_promptLabel != null)
            {
                _promptLabel.style.display = DisplayStyle.Flex;
                _promptLabel.text = prompt;
            }

            ToolkitStepUx.SetOptionalLabel(_instructionLabel, dto.instruction?.Trim());
        }

        private void RefreshStats()
        {
            if (_statsLabel == null || _answerField == null)
                return;

            if (_dto == null)
            {
                _statsLabel.style.display = DisplayStyle.None;
                return;
            }

            var showWord = _dto.showWordCount;
            var showChar = _dto.showCharacterCount;
            var minW = _dto.minWords;
            var maxW = _dto.maxWords;

            if (!showWord && !showChar && minW <= 0 && maxW <= 0)
            {
                _statsLabel.style.display = DisplayStyle.None;
                return;
            }

            _statsLabel.style.display = DisplayStyle.Flex;

            var textValue = _answerField.value ?? string.Empty;

            var parts = string.Empty;

            var needsWordHint = showWord || minW > 0 || maxW > 0;
            if (needsWordHint)
            {
                var wc = WordCount(textValue);

                parts = $"Words: {wc}";

                if (minW > 0 || maxW > 0)
                {
                    parts += " — target ";

                    if (minW > 0 && maxW > 0)
                        parts += $"{minW}-{maxW}";
                    else if (minW > 0)
                        parts += $"≥ {minW}";
                    else
                        parts += $"≤ {maxW}";
                }
            }

            if (showChar)
            {
                if (!string.IsNullOrEmpty(parts))
                    parts += " | ";

                parts += $"Characters: {Mathf.Clamp(textValue.Length, 0, AbsoluteMaxCharacters)}";

                parts += $" / {AbsoluteMaxCharacters}";
            }

            _statsLabel.text = parts;
        }

        private bool ValidateAuthoringPayload(FreitextLlmContentDto dto, out string error)
        {
            error = null;

            if (dto.evaluation == null)
            {
                error = "FreitextLlm content is missing evaluation settings.";
                return false;
            }

            var grammar = Mathf.Max(dto.evaluation.grammarWeight, float.Epsilon);
            var vocab = Mathf.Max(dto.evaluation.vocabularyWeight, float.Epsilon);
            var reg = Mathf.Max(dto.evaluation.registerWeight, float.Epsilon);

            dto.evaluation.grammarWeight = grammar;
            dto.evaluation.vocabularyWeight = vocab;
            dto.evaluation.registerWeight = reg;

            if (dto.evaluation.passThreshold < 0f || dto.evaluation.passThreshold > 1f)
            {
                error = "FreitextLlm passThreshold must be between 0 and 1.";
                return false;
            }

            return true;
        }

        private bool ValidateClientAnswer(out string error)
        {
            error = null;

            var text = _answerField.value?.Trim() ?? "";
            if (text.Length > AbsoluteMaxCharacters)
            {
                error = $"Answers are limited to {AbsoluteMaxCharacters} characters.";
                return false;
            }

            if (string.IsNullOrEmpty(text))
            {
                error = "Please write something before tapping Check.";
                return false;
            }

            var wordCountValue = WordCount(text);

            if (_dto.minWords > 0 && wordCountValue < _dto.minWords)
            {
                error = $"Use at least {_dto.minWords} word(s).";
                return false;
            }

            if (_dto.maxWords > 0 && wordCountValue > _dto.maxWords)
            {
                error = $"Please stay within {_dto.maxWords} word(s).";
                return false;
            }

            return true;
        }

        private static int WordCount(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return 0;

            return text.Trim().Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries).Length;
        }

        private static string ClampPresentationMessage(string text, int maxLen = 1100)
        {
            var t = text?.Trim();
            if (string.IsNullOrEmpty(t))
                return "Almost there — revise your wording and tap Check again.";

            return t.Length <= maxLen ? t : $"{t.Substring(0, maxLen)}…";
        }

        private void SetInteractableSafe(bool interactive)
        {
            _answerField.SetEnabled(interactive && _interactable);
        }

        private static bool TryDeserialize(string rawJson, out FreitextLlmContentDto dto, out string error)
        {
            dto = null;
            error = null;

            if (string.IsNullOrWhiteSpace(rawJson))
            {
                error = "Empty content JSON.";
                return false;
            }

            try
            {
                dto = JsonUtility.FromJson<FreitextLlmContentDto>(rawJson);
            }
            catch (Exception ex)
            {
                error = ex.Message;
                return false;
            }

            if (dto?.evaluation == null)
            {
                error = "Missing evaluation payload.";
                return false;
            }

            return true;
        }
    }
}
