#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Validates ui:Template src GUIDs and ui:Instance template names in Learning Toolkit UXML.
/// </summary>
public static class LearningToolkitUxmlTemplateGuidValidator
{
    internal const string LearningToolkitRoot = "Assets/Resources/UI/LearningToolkit";

    private static readonly Regex TemplateSrcRegex = new(
        @"project://database/(?<path>Assets/[^""?]+\.uxml)\?[^""]*guid=(?<guid>[a-f0-9]{32})[^""]*type=3#(?<hash>[^""]+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex TemplateNameDeclareRegex = new(
        @"<ui:Template\s+name=""(?<name>[^""]+)""",
        RegexOptions.Compiled);

    private static readonly Regex InstanceTemplateRefRegex = new(
        @"<ui:Instance\s+template=""(?<name>[^""]+)""",
        RegexOptions.Compiled);

    [MenuItem("Tools/Learning Toolkit/Validate UXML Template References")]
    public static void ValidateFromMenu()
    {
        ReportIssues(ValidateAll(out var checkedCount), checkedCount, logSuccess: true);
    }

    internal static void ReportIssues(List<string> issues, int referenceCount, bool logSuccess)
    {
        if (issues.Count == 0)
        {
            if (logSuccess)
                Debug.Log($"[LearningToolkit] UXML template check passed ({referenceCount} src reference(s)).");
            return;
        }

        foreach (var issue in issues)
            Debug.LogError($"[LearningToolkit] {issue}");

        Debug.LogError(
            $"[LearningToolkit] UXML template check failed: {issues.Count} issue(s), {referenceCount} src reference(s) scanned.");
    }

    public static List<string> ValidateAll(out int referenceCount)
    {
        referenceCount = 0;
        var issues = new List<string>();
        if (!Directory.Exists(LearningToolkitRoot))
            return issues;

        var uxmlPaths = Directory.GetFiles(LearningToolkitRoot, "*.uxml", SearchOption.AllDirectories);
        foreach (var uxmlPath in uxmlPaths)
        {
            var normalizedUxmlPath = uxmlPath.Replace('\\', '/');
            var text = File.ReadAllText(normalizedUxmlPath);
            ValidateTemplateSrcReferences(normalizedUxmlPath, text, issues, ref referenceCount);
            ValidateInstanceTemplateNames(normalizedUxmlPath, text, issues);
        }

        return issues;
    }

    private static void ValidateTemplateSrcReferences(
        string normalizedUxmlPath,
        string text,
        List<string> issues,
        ref int referenceCount)
    {
        foreach (Match match in TemplateSrcRegex.Matches(text))
        {
            referenceCount++;
            var assetPath = match.Groups["path"].Value;
            var declaredGuid = match.Groups["guid"].Value;
            var metaPath = assetPath + ".meta";
            if (!File.Exists(metaPath))
            {
                issues.Add($"{normalizedUxmlPath}: missing .meta for '{assetPath}'.");
                continue;
            }

            var metaGuid = ReadGuidFromMeta(metaPath);
            if (string.IsNullOrEmpty(metaGuid))
            {
                issues.Add($"{normalizedUxmlPath}: could not read guid from '{metaPath}'.");
                continue;
            }

            if (!string.Equals(declaredGuid, metaGuid, System.StringComparison.OrdinalIgnoreCase))
            {
                issues.Add(
                    $"{normalizedUxmlPath}: GUID mismatch for '{assetPath}' " +
                    $"(uxml declares {declaredGuid}, .meta has {metaGuid}).");
            }

            var expectedHash = Path.GetFileNameWithoutExtension(assetPath);
            var declaredHash = match.Groups["hash"].Value;
            if (!string.Equals(declaredHash, expectedHash, System.StringComparison.Ordinal))
            {
                issues.Add(
                    $"{normalizedUxmlPath}: template hash for '{assetPath}' should be '#{expectedHash}' " +
                    $"(found '#{declaredHash}').");
            }
        }
    }

    private static void ValidateInstanceTemplateNames(string normalizedUxmlPath, string text, List<string> issues)
    {
        var declared = new HashSet<string>();
        foreach (Match match in TemplateNameDeclareRegex.Matches(text))
            declared.Add(match.Groups["name"].Value);

        if (declared.Count == 0)
            return;

        foreach (Match match in InstanceTemplateRefRegex.Matches(text))
        {
            var templateName = match.Groups["name"].Value;
            if (!declared.Contains(templateName))
            {
                issues.Add(
                    $"{normalizedUxmlPath}: ui:Instance references undeclared template '{templateName}' " +
                    $"(declare ui:Template name=\"{templateName}\" in this file).");
            }
        }
    }

    private static string ReadGuidFromMeta(string metaPath)
    {
        foreach (var line in File.ReadAllLines(metaPath))
        {
            if (line.StartsWith("guid: "))
                return line.Substring("guid: ".Length).Trim();
        }

        return null;
    }
}
#endif
