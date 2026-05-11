using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.Game.Content;
using ITBL.LanguageGame.Runtime.Game.Modes;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Game.Levels
{
    public partial class LevelSceneController
    {
        internal void DrawLevelTaskHud()
        {
            GUI.Box(new Rect(20, 20, 760, 580), "Level Runtime (WP3)");
            GUI.Label(new Rect(35, 50, 700, 25), $"Aktives Level: {_activeLevelId}");
            GUI.Label(new Rect(35, 72, 700, 25), $"Status: {_statusMessage}");
            GUI.Label(new Rect(35, 94, 700, 25), $"UI-Zustand: {_uxState}");
            if (_isSubmitting)
            {
                GUI.Label(new Rect(35, 116, 700, 25), "Bitte warten: Antwort wird bewertet ...");
            }

            if (!GameRoot.IsReady || _orchestrator == null)
            {
                GUI.Label(new Rect(35, 122, 700, 25), "Runtime ist noch nicht bereit.");
                if (GUI.Button(new Rect(35, 157, 220, 35), "Zurueck zum Hub"))
                {
                    GameRoot.Services.SceneRouter.LoadScene(GameSceneId.MainHub);
                }

                return;
            }

            if (_orchestrator.IsFinished)
            {
                int totalEarned = _orchestrator.GetTotalScoreEarned();
                int totalMax = _orchestrator.GetTotalScoreMax();
                GUI.Label(new Rect(35, 127, 700, 25), $"Level abgeschlossen. Score: {totalEarned}/{totalMax}");
                if (GUI.Button(new Rect(35, 162, 220, 35), "Zurueck zum Hub"))
                {
                    GameRoot.Services.SceneRouter.LoadScene(GameSceneId.MainHub);
                }

                return;
            }

            LevelTaskDefinition task = _orchestrator.CurrentTask;
            if (task == null)
            {
                GUI.Label(new Rect(35, 127, 700, 25), "Keine aktive Aufgabe gefunden.");
                return;
            }

            if (task.taskId != _activeTaskId)
            {
                ResetInputsForTask(task);
            }

            GUI.Label(new Rect(35, 127, 700, 25), $"Task {_orchestrator.CurrentTaskIndex + 1}: {task.taskId} ({task.taskType})");
            GUI.Label(new Rect(35, 149, 700, 25), task.prompt);

            float y = 182f;
            switch (task.ResolveTaskType())
            {
                case TaskType.MultipleChoice:
                    GUI.Label(new Rect(35, y, 700, 25), task.question);
                    y += 30f;
                    foreach (MultipleChoiceOption option in task.choices)
                    {
                        if (GUI.Button(new Rect(35, y, 350, 28), option.label))
                        {
                            TaskSubmission submission = CreateSubmission();
                            submission.Values.Add(option.id);
                            SubmitCurrentTask(submission);
                        }

                        y += 34f;
                    }

                    break;
                case TaskType.Matching:
                    GUI.Label(new Rect(35, y, 700, 25), "Format pro Zeile: linker Begriff => rechter Begriff");
                    y += 30f;
                    foreach (string left in task.leftItems)
                    {
                        _matchingInputs.TryGetValue(left, out string value);
                        GUI.Label(new Rect(35, y, 140, 25), left);
                        _matchingInputs[left] = GUI.TextField(new Rect(180, y, 240, 25), value ?? string.Empty);
                        y += 32f;
                    }

                    if (GUI.Button(new Rect(35, y + 5f, 220, 30), "Matching pruefen"))
                    {
                        TaskSubmission submission = CreateSubmission();
                        foreach (System.Collections.Generic.KeyValuePair<string, string> pair in _matchingInputs)
                        {
                            submission.Values.Add($"{pair.Key}=>{pair.Value}");
                        }

                        SubmitCurrentTask(submission);
                    }

                    break;
                case TaskType.ClozeText:
                    GUI.Label(new Rect(35, y, 700, 25), task.templateText);
                    y += 34f;
                    foreach (ClozeGapDefinition gap in task.gaps)
                    {
                        _clozeInputs.TryGetValue(gap.gapId, out string value);
                        GUI.Label(new Rect(35, y, 140, 25), gap.gapId);
                        _clozeInputs[gap.gapId] = GUI.TextField(new Rect(180, y, 240, 25), value ?? string.Empty);
                        y += 32f;
                    }

                    if (GUI.Button(new Rect(35, y + 5f, 220, 30), "Luecken pruefen"))
                    {
                        TaskSubmission submission = CreateSubmission();
                        foreach (ClozeGapDefinition gap in task.gaps)
                        {
                            _clozeInputs.TryGetValue(gap.gapId, out string value);
                            submission.Values.Add(value ?? string.Empty);
                        }

                        SubmitCurrentTask(submission);
                    }

                    break;
                case TaskType.ErrorHunt:
                    GUI.Label(new Rect(35, y, 700, 25), task.textWithError);
                    y += 32f;
                    _freeTextInput = GUI.TextField(new Rect(35, y, 680, 28), _freeTextInput);
                    if (GUI.Button(new Rect(35, y + 40f, 220, 30), "Korrektur pruefen"))
                    {
                        SubmitCurrentTask(CreateSubmission(_freeTextInput));
                    }

                    break;
                case TaskType.DragDrop:
                    GUI.Label(new Rect(35, y, 700, 25), "Gib die Reihenfolge als CSV ein (z. B. io,mangio,pane)");
                    y += 30f;
                    GUI.Label(new Rect(35, y, 700, 25), $"Tokens: {string.Join(", ", task.tokens)}");
                    y += 30f;
                    _dragDropInput = GUI.TextField(new Rect(35, y, 680, 28), _dragDropInput);
                    if (GUI.Button(new Rect(35, y + 40f, 220, 30), "Reihenfolge pruefen"))
                    {
                        TaskSubmission submission = CreateSubmission();
                        foreach (string token in _dragDropInput.Split(',', System.StringSplitOptions.RemoveEmptyEntries))
                        {
                            submission.Values.Add(token.Trim());
                        }

                        SubmitCurrentTask(submission);
                    }

                    break;
                case TaskType.LlmFreeText:
                    GUI.Label(new Rect(35, y, 700, 25), "Schreibe deine Antwort frei auf Italienisch:");
                    y += 32f;
                    _freeTextInput = GUI.TextField(new Rect(35, y, 680, 28), _freeTextInput);
                    if (GUI.Button(new Rect(35, y + 40f, 260, 30), "Antwort bewerten"))
                    {
                        SubmitCurrentTask(CreateSubmission(_freeTextInput));
                    }

                    break;
                case TaskType.LlmWordGuess:
                    GUI.Label(new Rect(35, y, 700, 25), "Beschreibe das Zielwort auf Italienisch:");
                    y += 32f;
                    _freeTextInput = GUI.TextField(new Rect(35, y, 680, 28), _freeTextInput);
                    GUI.Label(new Rect(35, y + 35f, 700, 25), $"Max. Versuche: {task.maxGuessAttempts}");
                    if (GUI.Button(new Rect(35, y + 65f, 260, 30), "Beschreibung pruefen"))
                    {
                        SubmitCurrentTask(CreateSubmission(_freeTextInput));
                    }

                    break;
                default:
                    GUI.Label(new Rect(35, y, 700, 25), "Dieser Modus wird aktuell nicht ausgewertet.");
                    _freeTextInput = GUI.TextField(new Rect(35, y + 35f, 680, 28), _freeTextInput);
                    if (GUI.Button(new Rect(35, y + 75f, 260, 30), "Als nicht unterstuetzt markieren"))
                    {
                        SubmitCurrentTask(CreateSubmission(_freeTextInput));
                    }

                    break;
            }

            if (GUI.Button(new Rect(540, 530, 195, 35), "Zurueck zum Hub"))
            {
                GameRoot.Services.SceneRouter.LoadScene(GameSceneId.MainHub);
            }

            bool showRetry = !_isSubmitting && _uxState == LevelUxState.RetryAvailable && _lastSubmission != null;
            if (showRetry && GUI.Button(new Rect(330, 530, 195, 35), "Erneut versuchen"))
            {
                _ = RetryLastSubmissionAsync();
            }
        }
    }
}
