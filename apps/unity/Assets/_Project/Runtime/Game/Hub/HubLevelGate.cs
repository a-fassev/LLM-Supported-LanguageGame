using ITBL.LanguageGame.Runtime.Infrastructure.Persistence;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Game.Hub
{
    public sealed class HubLevelGate
    {
        public string LevelId;
        public string DisplayName;
        public Vector3 Position;
        public LevelState State;
        public string LockReason;
        public GameObject Marker;
    }
}
