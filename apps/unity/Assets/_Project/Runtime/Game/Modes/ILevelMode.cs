using ITBL.LanguageGame.Runtime.Game.Content;
using System.Threading;
using System.Threading.Tasks;

namespace ITBL.LanguageGame.Runtime.Game.Modes
{
    public interface ILevelMode
    {
        TaskType SupportedType { get; }
        Task<TaskResult> EvaluateAsync(
            LevelTaskDefinition task,
            TaskSubmission submission,
            CancellationToken cancellationToken = default);
    }
}
