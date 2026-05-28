#if UNITY_EDITOR
using System.Collections.Generic;
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

        private const string MenusThemeAssetPath = "Assets/Resources/UI/LearningToolkit/LearningMenusTheme.tss";

        /// <summary>Must match <see cref="PanelTextSettings"/> default font path and Resources layout.</summary>
        private const string DefaultFontAssetResourcesPath = "UI/Fonts/";

        static LearningMenusToolkitTextBootstrap()
        {
            EditorApplication.delayCall += HealMenusTextOnEditorLoad;
        }

        private static void HealMenusTextOnEditorLoad()
        {
            bool forceRegenerate = !IsCommittedMenusFontAssetUsable();
            EnsureMenusTextAssets(forceRegenerate);
        }

        /// <summary>
        /// Unity batch entry (regenerates font). Example:
        /// Unity -batchmode -quit -projectPath &lt;repo&gt;
        /// -executeMethod LanguageGame.EditorTools.LearningMenusToolkitTextBootstrap.RunBatchModeEnsureMenusText
        /// </summary>
        public static void RunBatchModeEnsureMenusText()
        {
            if (!EnsureMenusTextAssets(forceRegenerateFont: true))
            {
                Debug.LogError(
                    "[LearningMenusToolkitTextBootstrap] Batch ensure failed — see errors above (TTF missing or font build failed).");
                EditorApplication.Exit(1);
                return;
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            EditorApplication.Exit(0);
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

        /// <summary>
        /// Run font/text wiring after asset import only when menus text assets changed or the font is broken.
        /// </summary>
        internal static bool ShouldEnsureMenusTextAfterImport(IReadOnlyCollection<string> changedAssetPaths)
        {
            if (changedAssetPaths != null)
            {
                foreach (string path in changedAssetPaths)
                {
                    if (IsMenusTextRelatedAssetPath(path))
                        return true;
                }
            }

            return false;
        }

        internal static bool EnsureMenusTextAssets(bool forceRegenerateFont)
        {
            EnsureFolderHierarchy("Assets/Resources/UI/Fonts");

            AssetDatabase.ImportAsset(TtfAssetPath, ImportAssetOptions.ForceUpdate);
            Font sourceFont = AssetDatabase.LoadAssetAtPath<Font>(TtfAssetPath);
            if (sourceFont == null)
            {
                Debug.LogError(
                    $"[LearningMenusToolkitTextBootstrap] Missing TTF font at {TtfAssetPath}. Re-import or restore Roboto-Regular.");
                return false;
            }

            FontAsset fontAsset = EnsureFontAsset(sourceFont, forceRegenerateFont);
            if (fontAsset == null)
            {
                Debug.LogError("[LearningMenusToolkitTextBootstrap] Could not build LearningMenusUIFont.");
                return false;
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

            EnsureDefaultFontAssetPath(panelText);
            EnsureFontReferences(panelText, sourceFont, fontAsset);
            EnsurePanelSettingsReferencesTextSettings(panelText);
            EnsurePanelSettingsReferencesTheme();

            EditorUtility.SetDirty(panelText);
            AssetDatabase.SaveAssets();

            Debug.Log(
                $"[LearningMenusToolkitTextBootstrap] UITK menus text wiring ready ({PanelTextAssetPath}, {FontAssetOutputPath}).");

            EditorGUIUtility.PingObject(panelText);
            return true;
        }

        private static bool IsCommittedMenusFontAssetUsable()
        {
            FontAsset fontAsset = AssetDatabase.LoadAssetAtPath<FontAsset>(FontAssetOutputPath);
            return IsFontAssetUsable(fontAsset);
        }

        private static bool IsMenusTextRelatedAssetPath(string assetPath)
        {
            if (string.IsNullOrEmpty(assetPath))
                return false;

            if (assetPath == TtfAssetPath ||
                assetPath == FontAssetOutputPath ||
                assetPath == PanelTextAssetPath ||
                assetPath == PanelSettingsAssetPath)
                return true;

            return assetPath.StartsWith("Assets/Resources/UI/Fonts/");
        }

        private static FontAsset EnsureFontAsset(Font sourceFont, bool forceRegenerate)
        {
            if (forceRegenerate)
                AssetDatabase.DeleteAsset(FontAssetOutputPath);

            FontAsset existing = AssetDatabase.LoadAssetAtPath<FontAsset>(FontAssetOutputPath);
            if (!forceRegenerate && IsFontAssetUsable(existing))
                return existing;

            if (existing != null)
                AssetDatabase.DeleteAsset(FontAssetOutputPath);

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
            PersistFontAssetSubAssets(created);
            return created;
        }

        private static bool IsFontAssetUsable(FontAsset fontAsset)
        {
            if (fontAsset == null)
                return false;

            if (fontAsset.material == null)
                return false;

            if (fontAsset.atlasTextures == null || fontAsset.atlasTextures.Length == 0)
                return false;

            if (fontAsset.atlasTextures[0] == null)
                return false;

            // Dynamic SDF fonts keep a minimal atlas on disk until glyphs render; broken imports miss material/atlas wiring.
            if (fontAsset.atlasPopulationMode == AtlasPopulationMode.Dynamic)
                return fontAsset.atlasWidth >= 256 && fontAsset.atlasHeight >= 256;

            Texture2D atlas = fontAsset.atlasTextures[0];
            return atlas.width > 1 && atlas.height > 1;
        }

        private static void PersistFontAssetSubAssets(FontAsset fontAsset)
        {
            if (fontAsset == null)
                return;

            if (fontAsset.material != null && !AssetDatabase.IsSubAsset(fontAsset.material))
                AssetDatabase.AddObjectToAsset(fontAsset.material, fontAsset);

            if (fontAsset.atlasTextures == null)
                return;

            foreach (Texture2D atlas in fontAsset.atlasTextures)
            {
                if (atlas != null && !AssetDatabase.IsSubAsset(atlas))
                    AssetDatabase.AddObjectToAsset(atlas, fontAsset);
            }

            EditorUtility.SetDirty(fontAsset);
            AssetDatabase.SaveAssets();
        }

        private static void EnsureDefaultFontAssetPath(PanelTextSettings panelText)
        {
            if (panelText == null)
                return;

            var so = new SerializedObject(panelText);
            SerializedProperty pathProp = so.FindProperty("m_DefaultFontAssetPath");
            if (pathProp == null || pathProp.stringValue == DefaultFontAssetResourcesPath)
                return;

            pathProp.stringValue = DefaultFontAssetResourcesPath;
            so.ApplyModifiedPropertiesWithoutUndo();
            EditorUtility.SetDirty(panelText);
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

        /// <summary>
        /// UI Builder and the PanelSettings preview need the menus theme (imports theme-learn + GameArt USS).
        /// </summary>
        private static void EnsurePanelSettingsReferencesTheme()
        {
            var panelSettings = AssetDatabase.LoadAssetAtPath<PanelSettings>(PanelSettingsAssetPath);
            var theme = AssetDatabase.LoadAssetAtPath<ThemeStyleSheet>(MenusThemeAssetPath);
            if (panelSettings == null)
            {
                Debug.LogWarning(
                    $"[LearningMenusToolkitTextBootstrap] Missing PanelSettings at {PanelSettingsAssetPath}.");
                return;
            }

            if (theme == null)
            {
                Debug.LogWarning(
                    $"[LearningMenusToolkitTextBootstrap] Missing ThemeStyleSheet at {MenusThemeAssetPath}.");
                return;
            }

            var so = new SerializedObject(panelSettings);
            SerializedProperty themeProp = so.FindProperty("themeStyleSheet")
                ?? so.FindProperty("themeUss")
                ?? so.FindProperty("m_ThemeStyleSheet");
            if (themeProp != null)
            {
                if (themeProp.objectReferenceValue == theme)
                    return;

                themeProp.objectReferenceValue = theme;
                so.ApplyModifiedPropertiesWithoutUndo();
            }
            else if (panelSettings.themeStyleSheet != theme)
            {
                panelSettings.themeStyleSheet = theme;
            }

            EditorUtility.SetDirty(panelSettings);
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
