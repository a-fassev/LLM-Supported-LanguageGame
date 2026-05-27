using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Load UXML step templates, clone into hosts, and query protected named slots.</summary>
    internal static class ToolkitStepUx
    {
        private static readonly Dictionary<string, VisualTreeAsset> s_templateCache = new();
        /// <summary>
        /// Shown when a required UXML template failed to load. Task steps have no fallback UI;
        /// cutscenes may still show <see cref="TryMountBeatFailurePanel"/> when narrator beat UXML is missing.
        /// </summary>
        public const string TemplateLoadFailedMessage =
            "Impossibile caricare l'interfaccia del compito. Aggiorna l'app o contatta il supporto.";

        public static bool TryMount(
            VisualElement host,
            string resourcesPath,
            string rootElementName,
            out VisualElement root)
        {
            root = null;
            if (host == null)
                return false;

            var template = LoadTemplate(resourcesPath);
            if (template == null)
            {
                Debug.LogError(
                    $"[ToolkitStepUx] Missing VisualTreeAsset at Resources/{resourcesPath}. " +
                    "Create the UXML under Assets/Resources/UI/LearningToolkit/Templates/.");
                return false;
            }

            root = DetachTemplateRoot(template, resourcesPath, rootElementName);
            if (root == null)
                return false;

            host.Add(root);
            return true;
        }

        /// <summary>Clears dynamic host children before runtime rebuild (removes UI Builder fixtures).</summary>
        public static void ClearHost(VisualElement host)
        {
            if (host == null)
                return;

            // RemoveAt loop: ui:Instance TemplateContainers can survive host.Clear() in some UITK versions.
            while (host.childCount > 0)
                host.RemoveAt(0);
        }

        /// <summary>Instantiate a detached template root (e.g. cutscene beat panels).</summary>
        public static VisualElement Instantiate(string resourcesPath, string rootElementName) =>
            Instantiate(LoadTemplate(resourcesPath), resourcesPath, rootElementName);

        /// <summary>Clone a shared part template under <c>Templates/Parts/</c>.</summary>
        public static VisualElement InstantiatePart(string resourcesPath, string rootElementName) =>
            Instantiate(LoadTemplate(resourcesPath), resourcesPath, rootElementName);

        /// <summary>
        /// Instantiate a required part; surfaces <see cref="TemplateLoadFailedMessage"/> when the asset or root is missing.
        /// </summary>
        public static bool TryInstantiatePart(
            string resourcesPath,
            string rootElementName,
            string ownerStepName,
            StepContext context,
            out VisualElement root)
        {
            root = InstantiatePart(resourcesPath, rootElementName);
            if (root != null)
                return true;

            Debug.LogError(
                $"[{ownerStepName}] Failed to instantiate part Resources/{resourcesPath} root='{rootElementName}'.");
            context?.presentValidationMessage?.Invoke(TemplateLoadFailedMessage);
            return false;
        }

        /// <summary>Instantiate from a cached <see cref="VisualTreeAsset"/> (avoids repeated Resources.Load).</summary>
        public static VisualElement Instantiate(
            VisualTreeAsset template,
            string resourcesPathForLogs,
            string rootElementName) =>
            template == null
                ? LogMissingTemplate(resourcesPathForLogs)
                : DetachTemplateRoot(template, resourcesPathForLogs, rootElementName);

        private static VisualTreeAsset LoadTemplate(string resourcesPath)
        {
            if (string.IsNullOrEmpty(resourcesPath))
                return null;

            if (s_templateCache.TryGetValue(resourcesPath, out var cached) && cached != null)
                return cached;

            var loaded = Resources.Load<VisualTreeAsset>(resourcesPath);
            if (loaded != null)
                s_templateCache[resourcesPath] = loaded;

            return loaded;
        }

        /// <summary>Query a protected slot; logs an error when missing (use for guard-listed elements).</summary>
        public static T QueryRequired<T>(VisualElement root, string elementName, string ownerStepName)
            where T : VisualElement
        {
            if (root == null)
                return null;

            var element = root.Q<T>(elementName);
            if (element == null)
            {
                Debug.LogError(
                    $"[{ownerStepName}] Template missing required element name='{elementName}'. " +
                    "Do not rename protected slots in UXML.");
            }

            return element;
        }

        /// <summary>Query an optional slot (prompt, subtitle, progress, etc.) without logging.</summary>
        public static T QueryOptional<T>(VisualElement root, string elementName)
            where T : VisualElement =>
            root?.Q<T>(elementName);

        public static void SetOptionalLabel(Label label, string text, bool hideWhenEmpty = true)
        {
            if (label == null)
                return;

            if (hideWhenEmpty && string.IsNullOrWhiteSpace(text))
            {
                label.style.display = DisplayStyle.None;
                label.text = string.Empty;
                return;
            }

            label.style.display = DisplayStyle.Flex;
            label.text = text ?? string.Empty;
        }

        public static bool GuardTemplateReady(bool uiReady, StepContext context, params VisualElement[] requiredSlots)
        {
            if (!uiReady)
            {
                context?.presentValidationMessage?.Invoke(TemplateLoadFailedMessage);
                return false;
            }

            if (requiredSlots == null)
                return true;

            foreach (var slot in requiredSlots)
            {
                if (slot != null)
                    continue;

                context?.presentValidationMessage?.Invoke(TemplateLoadFailedMessage);
                return false;
            }

            return true;
        }

        /// <summary>
        /// Minimal cutscene beat panel when narrator UXML is unavailable (uses the same USS as narrator beats).
        /// </summary>
        public static bool TryMountBeatFailurePanel(VisualElement beatHost, string title, string body)
        {
            if (beatHost == null)
                return false;

            beatHost.Clear();

            var panel = new VisualElement();
            panel.AddToClassList("lg-cutscene-narrator");

            var titleLabel = new Label { name = "beat-title", text = title ?? string.Empty };
            titleLabel.AddToClassList("lg-cutscene-narrator__title");
            titleLabel.style.whiteSpace = WhiteSpace.Normal;
            titleLabel.style.display = string.IsNullOrWhiteSpace(title) ? DisplayStyle.None : DisplayStyle.Flex;
            panel.Add(titleLabel);

            var bodyLabel = new Label { name = "beat-body", text = body ?? string.Empty };
            bodyLabel.AddToClassList("lg-cutscene-narrator__body");
            bodyLabel.style.whiteSpace = WhiteSpace.Normal;
            panel.Add(bodyLabel);

            beatHost.Add(panel);
            return true;
        }

        public static void ApplyMutedTaskChrome(VisualElement root, bool useMutedChrome)
        {
            if (root == null)
                return;

            if (useMutedChrome)
            {
                root.AddToClassList("lg-muted-panel");
                root.AddToClassList("lg-task-template-root");
            }
            else
            {
                root.RemoveFromClassList("lg-muted-panel");
                root.RemoveFromClassList("lg-task-template-root");
            }
        }

        private static VisualElement DetachTemplateRoot(
            VisualTreeAsset template,
            string resourcesPathForLogs,
            string rootElementName)
        {
            var container = template.Instantiate();
            var root = string.IsNullOrEmpty(rootElementName)
                ? (container.childCount > 0 ? container[0] as VisualElement : container)
                : container.Q<VisualElement>(rootElementName);

            if (root != null)
            {
                root.RemoveFromHierarchy();
                container.RemoveFromHierarchy();
                return root;
            }

            container.RemoveFromHierarchy();

            Debug.LogError(
                $"[ToolkitStepUx] Template '{resourcesPathForLogs}' has no root named '{rootElementName}'.");
            return null;
        }

        private static VisualElement LogMissingTemplate(string resourcesPathForLogs)
        {
            Debug.LogError(
                $"[ToolkitStepUx] Missing VisualTreeAsset at Resources/{resourcesPathForLogs}.");
            return null;
        }
    }
}
