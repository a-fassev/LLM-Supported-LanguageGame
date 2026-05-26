#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;

/// <summary>Logs whether SpecialScreens chrome UXML exist under Resources (editor menu helper).</summary>
public static class SpecialScreensAssetDiagnostics
{
    private const string Folder = "Assets/Resources/UI/LearningToolkit/Templates/SpecialScreens";

    [MenuItem("Tools/Learning Toolkit/Verify SpecialScreens Assets")]
    public static void Verify()
    {
        var expected = new[]
        {
            $"{Folder}/SpecialScreenMessengerChrome.uxml",
            $"{Folder}/SpecialScreenMailChrome.uxml",
            $"{Folder}/SpecialScreenReaderChrome.uxml",
            $"{Folder}/SpecialScreenPhotoChrome.uxml",
        };

        foreach (var path in expected)
        {
            var asset = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(path);
            Debug.Log(asset != null
                ? $"[SpecialScreens] OK: {path}"
                : $"[SpecialScreens] MISSING in AssetDatabase: {path}");
        }

        Debug.Log($"[SpecialScreens] Project data path: {Application.dataPath}");
    }

    [MenuItem("Tools/Learning Toolkit/Reimport SpecialScreens Folder")]
    public static void Reimport()
    {
        AssetDatabase.ImportAsset(Folder, ImportAssetOptions.ImportRecursive);
        AssetDatabase.Refresh();
        Verify();
    }
}
#endif
