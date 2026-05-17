using System;
using System.Collections.Generic;
using UnityEngine;

namespace LanguageGame.Presentation.Steps
{
    [CreateAssetMenu(fileName = "StepTemplateCatalog", menuName = "LanguageGame/Step Template Catalog", order = 1)]
    public class StepTemplateCatalog : ScriptableObject
    {
        [Serializable]
        public sealed class Entry
        {
            public string templateKey;
            public string taskType;
            public GameObject prefab;
        }

        [SerializeField] private List<Entry> entries = new List<Entry>();

        public bool TryResolve(string templateKey, string taskType, out GameObject prefab)
        {
            prefab = null;
            var trimmedTemplateKey = (templateKey ?? string.Empty).Trim();
            var trimmedTaskType = (taskType ?? string.Empty).Trim();

            if (trimmedTemplateKey.Length > 0)
            {
                for (var i = 0; i < entries.Count; i++)
                {
                    var entry = entries[i];
                    if (entry == null || entry.prefab == null)
                        continue;
                    var entryKey = (entry.templateKey ?? string.Empty).Trim();
                    if (entryKey.Length == 0)
                        continue;

                    if (string.Equals(entryKey, trimmedTemplateKey, StringComparison.OrdinalIgnoreCase))
                    {
                        prefab = entry.prefab;
                        return true;
                    }
                }
            }

            if (trimmedTaskType.Length > 0)
            {
                for (var i = 0; i < entries.Count; i++)
                {
                    var entry = entries[i];
                    if (entry == null || entry.prefab == null)
                        continue;
                    var entryTask = (entry.taskType ?? string.Empty).Trim();
                    if (entryTask.Length == 0)
                        continue;

                    if (string.Equals(entryTask, trimmedTaskType, StringComparison.OrdinalIgnoreCase))
                    {
                        prefab = entry.prefab;
                        return true;
                    }
                }
            }

            return false;
        }
    }
}
