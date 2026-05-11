using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Game.Levels
{
    public static class LevelCatalogProvider
    {
        public static IReadOnlyList<LevelDescriptor> Load()
        {
            LevelCatalog catalog = Resources.Load<LevelCatalog>("LevelCatalog");
            if (catalog != null && catalog.levels != null && catalog.levels.Count > 0)
            {
                return catalog.levels
                    .Where(level => level != null && !string.IsNullOrWhiteSpace(level.levelId))
                    .OrderBy(level => level.order)
                    .Select(level => new LevelDescriptor(level.levelId, level.displayName, level.order, level.contentRelativePath))
                    .ToList();
            }

            return new List<LevelDescriptor>
            {
                new("level_1", "Level 1: Einstieg", 1, "_Project/Content/Levels/examples/level-a2-school-sequence.example.json"),
                new("level_2", "Level 2: Erweiterung", 2, "_Project/Content/Levels/examples/level-a2-school-sequence.example.json"),
            };
        }
    }

    public readonly struct LevelDescriptor
    {
        public LevelDescriptor(string levelId, string displayName, int order, string contentRelativePath)
        {
            LevelId = levelId;
            DisplayName = displayName;
            Order = order;
            ContentRelativePath = contentRelativePath;
        }

        public string LevelId { get; }
        public string DisplayName { get; }
        public int Order { get; }
        public string ContentRelativePath { get; }
    }
}
