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

            if (!string.IsNullOrEmpty(templateKey))
            {
                for (var i = 0; i < entries.Count; i++)
                {
                    var entry = entries[i];
                    if (entry == null || entry.prefab == null || string.IsNullOrEmpty(entry.templateKey))
                        continue;

                    if (string.Equals(entry.templateKey, templateKey, StringComparison.Ordinal))
                    {
                        prefab = entry.prefab;
                        return true;
                    }
                }
            }

            if (!string.IsNullOrEmpty(taskType))
            {
                for (var i = 0; i < entries.Count; i++)
                {
                    var entry = entries[i];
                    if (entry == null || entry.prefab == null || string.IsNullOrEmpty(entry.taskType))
                        continue;

                    if (string.Equals(entry.taskType, taskType, StringComparison.OrdinalIgnoreCase))
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
