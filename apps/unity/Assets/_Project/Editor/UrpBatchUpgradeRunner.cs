using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEditor.Rendering;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

namespace ITBL.LanguageGame.EditorTools
{
    public static class UrpBatchUpgradeRunner
    {
        private static readonly string[] CoreScenePaths =
        {
            "Assets/_Project/Scenes/MainMenu.unity",
            "Assets/_Project/Scenes/MainHub.unity",
            "Assets/_Project/Scenes/LevelTemplate.unity",
        };

        public static void UpgradeProjectMaterials()
        {
            Type pipelineType = GraphicsSettings.currentRenderPipelineAssetType;
            List<MaterialUpgrader> upgraders = MaterialUpgrader.FetchAllUpgradersForPipeline(pipelineType);
            if (upgraders == null || upgraders.Count == 0)
            {
                Debug.LogWarning("[URP Upgrade] No material upgraders were found for the active render pipeline.");
                return;
            }

            MaterialUpgrader.UpgradeProjectFolder(upgraders, "Upgrade to SRP Material");
            AssetDatabase.SaveAssets();
            Debug.Log($"[URP Upgrade] Completed material upgrade with {upgraders.Count} upgrader(s).");
        }

        public static void ValidateCoreScenes()
        {
            int issueCount = 0;

            foreach (string scenePath in CoreScenePaths)
            {
                Scene scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                Renderer[] renderers = Resources.FindObjectsOfTypeAll<Renderer>();

                foreach (Renderer renderer in renderers)
                {
                    if (!renderer.gameObject.scene.IsValid() || renderer.gameObject.scene.path != scene.path)
                    {
                        continue;
                    }

                    foreach (Material material in renderer.sharedMaterials)
                    {
                        if (material == null)
                        {
                            issueCount++;
                            Debug.LogError($"[URP Smoke] Null material in scene '{scenePath}' on '{renderer.name}'.");
                            continue;
                        }

                        Shader shader = material.shader;
                        if (shader == null || string.Equals(shader.name, "Hidden/InternalErrorShader", StringComparison.Ordinal))
                        {
                            issueCount++;
                            string shaderName = shader == null ? "<null>" : shader.name;
                            Debug.LogError($"[URP Smoke] Invalid shader '{shaderName}' in scene '{scenePath}' on material '{material.name}'.");
                        }
                    }
                }
            }

            if (issueCount > 0)
            {
                throw new Exception($"[URP Smoke] Found {issueCount} material/shader issue(s) in core scenes.");
            }

            Debug.Log("[URP Smoke] Core scene material validation passed.");
        }
    }
}
