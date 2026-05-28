#if UNITY_EDITOR
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Re-validates Learning Toolkit UXML template references when toolkit assets are imported.
/// </summary>
public sealed class LearningToolkitUxmlTemplateImportValidator : AssetPostprocessor
{
    private static bool _validationQueued;

    private static readonly HashSet<string> PendingChangedPaths = new();

    private static void OnPostprocessAllAssets(
        string[] importedAssets,
        string[] deletedAssets,
        string[] movedAssets,
        string[] movedFromAssetPaths)
    {
        if (!ShouldValidate(importedAssets, deletedAssets, movedAssets, movedFromAssetPaths))
            return;

        RecordChangedPaths(importedAssets);
        RecordChangedPaths(deletedAssets);
        RecordChangedPaths(movedAssets);
        RecordChangedPaths(movedFromAssetPaths);

        if (_validationQueued)
            return;

        _validationQueued = true;
        EditorApplication.delayCall += RunQueuedValidation;
    }

    private static void RecordChangedPaths(string[] assetPaths)
    {
        if (assetPaths == null || assetPaths.Length == 0)
            return;

        for (var i = 0; i < assetPaths.Length; i++)
        {
            string path = assetPaths[i];
            if (!string.IsNullOrEmpty(path))
                PendingChangedPaths.Add(path);
        }
    }

    private static bool ShouldValidate(
        string[] importedAssets,
        string[] deletedAssets,
        string[] movedAssets,
        string[] movedFromAssetPaths)
    {
        return importedAssets.Any(IsLearningToolkitUxmlOrMeta)
            || deletedAssets.Any(IsLearningToolkitUxmlOrMeta)
            || movedAssets.Any(IsLearningToolkitUxmlOrMeta)
            || movedFromAssetPaths.Any(IsLearningToolkitUxmlOrMeta);
    }

    private static bool IsLearningToolkitUxmlOrMeta(string assetPath)
    {
        if (string.IsNullOrEmpty(assetPath))
            return false;
        if (!assetPath.StartsWith(LearningToolkitUxmlTemplateGuidValidator.LearningToolkitRoot))
            return false;

        return assetPath.EndsWith(".uxml") || assetPath.EndsWith(".uxml.meta");
    }

    private static void RunQueuedValidation()
    {
        if (EditorApplication.isCompiling || EditorApplication.isUpdating)
        {
            EditorApplication.delayCall += RunQueuedValidation;
            return;
        }

        _validationQueued = false;

        var issues = LearningToolkitUxmlTemplateGuidValidator.ValidateAll(out var referenceCount);
        if (issues.Count > 0)
            LearningToolkitUxmlTemplateGuidValidator.ReportIssues(issues, referenceCount, logSuccess: false);

        if (LanguageGame.EditorTools.LearningMenusToolkitTextBootstrap.ShouldEnsureMenusTextAfterImport(
                PendingChangedPaths))
        {
            LanguageGame.EditorTools.LearningMenusToolkitTextBootstrap.EnsureMenusTextAssets(forceRegenerateFont: false);
        }

        PendingChangedPaths.Clear();
    }
}
#endif
