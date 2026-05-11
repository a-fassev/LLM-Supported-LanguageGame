using System.Collections.Generic;
using ITBL.LanguageGame.Runtime.Game.Content;

namespace ITBL.LanguageGame.Runtime.Game.Modes
{
    public sealed class LevelModeRegistry
    {
        private readonly Dictionary<TaskType, ILevelMode> _modes = new();
        private readonly ILevelMode _unsupportedMode = new UnsupportedTaskMode();

        public LevelModeRegistry(IEnumerable<ILevelMode> modes)
        {
            foreach (ILevelMode mode in modes)
            {
                if (mode != null)
                {
                    _modes[mode.SupportedType] = mode;
                }
            }
        }

        public ILevelMode Resolve(TaskType taskType)
        {
            return _modes.TryGetValue(taskType, out ILevelMode mode) ? mode : _unsupportedMode;
        }
    }
}
