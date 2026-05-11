using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Game.Levels
{
    [CreateAssetMenu(fileName = "LevelDefinition", menuName = "ITBL/Level Definition")]
    public sealed class LevelDefinition : ScriptableObject
    {
        public string levelId = "level_1";
        public string displayName = "Level 1";
        public int order = 1;
        public string contentRelativePath = "_Project/Content/Levels/examples/level-a2-school-sequence.example.json";
    }
}
