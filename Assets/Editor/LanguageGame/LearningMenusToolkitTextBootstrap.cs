#if UNITY_EDITOR
using System.Reflection;
using UnityEditor;
using UnityEngine;
using UnityEngine.TextCore.LowLevel;
using UnityEngine.TextCore.Text;
using UnityEngine.UIElements;

namespace LanguageGame.EditorTools
{
    /// <summary>
    /// Creates a TextCore FontAsset + <see cref="PanelTextSettings"/> for Learning menus UITK so runtime panels resolve text meshes.
    /// Runs once on Editor load; use the menu command to regenerate after changing the base TTF.
    /// </summary>
    [InitializeOnLoad]
    internal static class LearningMenusToolkitTextBootstrap
    {
        private const string TtfAssetPath = "Assets/Resources/UI/Fonts/Roboto-Regular.ttf";

        private const string FontAssetOutputPath = "Assets/Resources/UI/Fonts/LearningMenusUIFont.asset";

        private const string PanelTextAssetPath = "Assets/Resources/UI/LearningMenusPanelTextSettings.asset";

        private const string PanelSettingsAssetPath = "Assets/Resources/UI/LearningMenusPanelSettings.asset";

        static LearningMenusToolkitTextBootstrap()
        {
            EditorApplication.delayCall += () => EnsureMenusTextAssets(forceRegenerateFont: false);
        }

        [MenuItem("Language Game/UITK/Ensure menus text settings")]
        private static void MenuEnsureMenusTextSettings()
        {
            EnsureMenusTextAssets(forceRegenerateFont: false);
        }

        [MenuItem("Language Game/UITK/Regenerate menus font asset")]
        private static void MenuForceRegenerateFont()
        {
            EnsureMenusTextAssets(forceRegenerateFont: true);
        }

        internal static void EnsureMenusTextAssets(bool forceRegenerateFont)
        {
            EnsureFolderHierarchy("Assets/Resources/UI/Fonts");

            AssetDatabase.ImportAsset(TtfAssetPath, ImportAssetOptions.ForceUpdate);
            Font sourceFont = AssetDatabase.LoadAssetAtPath<Font>(TtfAssetPath);
            if (sourceFont == null)
            {
                Debug.LogError(
                    $"[LearningMenusToolkitTextBootstrap] Missing TTF font at {TtfAssetPath}. Re-import or restore Roboto-Regular.");
                return;
            }

            FontAsset fontAsset = EnsureFontAsset(sourceFont, forceRegenerateFont);
            if (fontAsset == null)
            {
                Debug.LogError("[LearningMenusToolkitTextBootstrap] Could not build LearningMenusUIFont.");
                return;
            }

            PanelTextSettings panelText = AssetDatabase.LoadAssetAtPath<PanelTextSettings>(PanelTextAssetPath);
            if (panelText == null)
            {
                panelText = ScriptableObject.CreateInstance<PanelTextSettings>();
                AssetDatabase.CreateAsset(panelText, PanelTextAssetPath);
            }

            if (!AssignDefaultFontAsset(panelText, fontAsset))
            {
                Debug.LogWarning(
                    "[LearningMenusToolkitTextBootstrap] Could not assign default font serialized field; assigning via reflection.");

                AssignDefaultFontReflection(panelText, fontAsset);
            }

            EnsureFontReferences(panelText, sourceFont, fontAsset);
            EnsurePanelSettingsReferencesTextSettings(panelText);

            EditorUtility.SetDirty(panelText);
            AssetDatabase.SaveAssets();

            Debug.Log(
                $"[LearningMenusToolkitTextBootstrap] UITK menus text wiring ready ({PanelTextAssetPath}, {FontAssetOutputPath}).");

            EditorGUIUtility.PingObject(panelText);
        }

        private static FontAsset EnsureFontAsset(Font sourceFont, bool forceRegenerate)
        {
            if (forceRegenerate)
                AssetDatabase.DeleteAsset(FontAssetOutputPath);

            FontAsset existing = AssetDatabase.LoadAssetAtPath<FontAsset>(FontAssetOutputPath);
            if (!forceRegenerate && existing != null)
                return existing;

            FontAsset created = FontAsset.CreateFontAsset(
                sourceFont,
                96,
                8,
                GlyphRenderMode.SDFAA,
                4096,
                4096,
                AtlasPopulationMode.Dynamic);

            created.name = "LearningMenusUIFont";
            AssetDatabase.CreateAsset(created, FontAssetOutputPath);
            return created;
        }

        private static bool AssignDefaultFontAsset(PanelTextSettings panelText, FontAsset fontAsset)
        {
            var so = new SerializedObject(panelText);

            SerializedProperty resolved = TryFindExplicitFontProperty(so) ?? TryFallbackFontProperty(so);
            if (resolved == null)
                return false;

            resolved.objectReferenceValue = fontAsset;
            resolved.serializedObject.ApplyModifiedPropertiesWithoutUndo();
            so.ApplyModifiedProperties();
            return true;
        }

        private static SerializedProperty TryFindExplicitFontProperty(SerializedObject so)
        {
            foreach (var name in new[] { "m_DefaultFontAsset", "defaultFontAsset", "m_defaultFontAsset" })
            {
                SerializedProperty p = so.FindProperty(name);
                if (p != null && p.propertyType == SerializedPropertyType.ObjectReference)
                    return p;
            }

            return null;
        }

        private static SerializedProperty TryFallbackFontProperty(SerializedObject so)
        {
            var iterator = so.GetIterator();
            for (bool enterChildren = true; iterator.NextVisible(enterChildren); enterChildren = false)
            {
                enterChildren = false;
                if (iterator.propertyType != SerializedPropertyType.ObjectReference)
                    continue;

                string lowered = iterator.propertyPath.ToLowerInvariant();
                if (!lowered.Contains("font"))
                    continue;
                if (lowered.Contains("fallback") ||
                    lowered.Contains("sprite") ||
                    lowered.Contains("emoji"))
                    continue;

                return so.FindProperty(iterator.propertyPath);
            }

            return null;
        }

        private static void AssignDefaultFontReflection(PanelTextSettings panelText, FontAsset fa)
        {
            FieldInfo fi = typeof(PanelTextSettings).GetField(
                "m_DefaultFontAsset",
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            fi?.SetValue(panelText, fa);
        }

        /// <summary>
        /// Prevents stale/corrupt entries (for example a ThemeStyleSheet GUID in m_FontReferences) which can
        /// trigger editor mesh generation warnings.
        /// </summary>
        private static void EnsureFontReferences(PanelTextSettings panelText, Font sourceFont, FontAsset fontAsset)
        {
            if (panelText == null || sourceFont == null || fontAsset == null)
                return;

            var so = new SerializedObject(panelText);
            SerializedProperty refs = so.FindProperty("m_FontReferences");
            if (refs == null || !refs.isArray)
                return;

            refs.arraySize = 1;
            SerializedProperty item = refs.GetArrayElementAtIndex(0);
            SerializedProperty fontProp = item.FindPropertyRelative("font");
            SerializedProperty fontAssetProp = item.FindPropertyRelative("fontAsset");
            if (fontProp != null)
                fontProp.objectReferenceValue = sourceFont;
            if (fontAssetProp != null)
                fontAssetProp.objectReferenceValue = fontAsset;

            so.ApplyModifiedPropertiesWithoutUndo();
        }

        /// <summary>
        /// UITK editor mesh generation and UI Builder need <see cref="PanelSettings.textSettings"/> assigned on the asset,
        /// not only at runtime in <see cref="LearningToolkitBootstrap"/>.
        /// </summary>
        private static void EnsurePanelSettingsReferencesTextSettings(PanelTextSettings panelText)
        {
            if (panelText == null)
                return;

            var panelSettings = AssetDatabase.LoadAssetAtPath<PanelSettings>(PanelSettingsAssetPath);
            if (panelSettings == null)
            {
                Debug.LogWarning(
                    $"[LearningMenusToolkitTextBootstrap] Missing PanelSettings at {PanelSettingsAssetPath}.");
                return;
            }

            if (panelSettings.textSettings == panelText)
                return;

            var so = new SerializedObject(panelSettings);
            SerializedProperty textProp = so.FindProperty("m_TextSettings") ?? so.FindProperty("textSettings");
            if (textProp != null && textProp.objectReferenceValue != panelText)
            {
                textProp.objectReferenceValue = panelText;
                so.ApplyModifiedPropertiesWithoutUndo();
            }
            else if (panelSettings.textSettings == null)
            {
                panelSettings.textSettings = panelText;
            }

            EditorUtility.SetDirty(panelSettings);
            so.Update();
        }

        private static void EnsureFolderHierarchy(params string[] segments)
        {
            if (segments.Length == 0 || segments[0] != "Assets")
                return;

            string currentPath = segments[0];
            for (var idx = 1; idx < segments.Length; idx++)
            {
                string next = $"{currentPath}/{segments[idx]}";
                if (!AssetDatabase.IsValidFolder(next))
                    AssetDatabase.CreateFolder(currentPath, segments[idx]);

                currentPath = next;
            }
        }
    }
}
#endif
