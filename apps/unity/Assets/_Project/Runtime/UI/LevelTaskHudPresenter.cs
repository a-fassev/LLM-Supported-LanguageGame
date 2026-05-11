namespace ITBL.LanguageGame.Runtime.Game.Levels
{
    /// <summary>
    /// Thin entry for level-scene IMGUI; drawing logic lives on <see cref="LevelSceneController.DrawLevelTaskHud"/>.
    /// </summary>
    public static class LevelTaskHudPresenter
    {
        public static void Draw(LevelSceneController level)
        {
            level.DrawLevelTaskHud();
        }
    }
}
