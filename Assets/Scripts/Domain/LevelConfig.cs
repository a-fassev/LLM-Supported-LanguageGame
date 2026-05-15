using System;
using System.Collections.Generic;
using UnityEngine;

namespace LanguageGame.Domain
{
    /// <summary>
    /// One step in a level: task kind plus placeholder copy (real content comes later).
    /// </summary>
    [Serializable]
    public struct TaskSlot
    {
        public TaskType taskType;

        [TextArea(1, 3)]
        public string placeholderLabel;
    }

    /// <summary>
    /// Admin-editable definition of a level: ordered tasks inside the reusable level scene.
    /// </summary>
    [CreateAssetMenu(fileName = "LevelConfig", menuName = "LanguageGame/Level Config", order = 0)]
    public class LevelConfig : ScriptableObject
    {
        [SerializeField] private string displayName;
        [SerializeField] private List<TaskSlot> tasks = new List<TaskSlot>();

        public string DisplayName => string.IsNullOrEmpty(displayName) ? name : displayName;

        public IReadOnlyList<TaskSlot> Tasks => tasks;

        public int TaskCount => tasks?.Count ?? 0;

        public bool TryGetTask(int index, out TaskSlot slot)
        {
            if (tasks == null || index < 0 || index >= tasks.Count)
            {
                slot = default;
                return false;
            }

            slot = tasks[index];
            return true;
        }
    }
}
