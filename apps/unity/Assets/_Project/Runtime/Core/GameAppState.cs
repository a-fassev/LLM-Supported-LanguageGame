namespace ITBL.LanguageGame.Runtime.Core
{
    public sealed class GameAppState
    {
        public GameSceneId CurrentSceneId { get; set; } = GameSceneId.Bootstrap;
        public string SelectedLevelId { get; set; } = string.Empty;
    }
}
