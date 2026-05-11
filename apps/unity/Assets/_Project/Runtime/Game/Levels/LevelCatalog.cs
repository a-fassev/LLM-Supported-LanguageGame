using System.Collections.Generic;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Game.Levels
{
    [CreateAssetMenu(fileName = "LevelCatalog", menuName = "ITBL/Level Catalog")]
    public sealed class LevelCatalog : ScriptableObject
    {
        public List<LevelDefinition> levels = new();
    }
}
