using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Load UXML step templates, clone into hosts, and query protected named slots.</summary>
    internal static class ToolkitStepUx
    {
        /// <summary>Shown when a required UXML template failed to load (no programmatic fallback UI).</summary>
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

            var template = Resources.Load<VisualTreeAsset>(resourcesPath);
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

        /// <summary>Instantiate a detached template root (e.g. cutscene beat panels).</summary>
        public static VisualElement Instantiate(string resourcesPath, string rootElementName) =>
            Instantiate(Resources.Load<VisualTreeAsset>(resourcesPath), resourcesPath, rootElementName);

        /// <summary>Instantiate from a cached <see cref="VisualTreeAsset"/> (avoids repeated Resources.Load).</summary>
        public static VisualElement Instantiate(
            VisualTreeAsset template,
            string resourcesPathForLogs,
            string rootElementName) =>
            template == null
                ? LogMissingTemplate(resourcesPathForLogs)
                : DetachTemplateRoot(template, resourcesPathForLogs, rootElementName);

        public static T Query<T>(VisualElement root, string elementName, string ownerStepName)
            where T : VisualElement
        {
            if (root == null)
                return null;

            var element = root.Q<T>(elementName);
            if (element == null)
            {
                Debug.LogWarning(
                    $"[{ownerStepName}] Template missing required element name='{elementName}'. " +
                    "Do not rename protected slots in UXML.");
            }

            return element;
        }

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
            var wrapper = new VisualElement();
            template.CloneTree(wrapper);
            var root = string.IsNullOrEmpty(rootElementName)
                ? (wrapper.childCount > 0 ? wrapper[0] : null)
                : wrapper.Q<VisualElement>(rootElementName);

            if (root != null)
            {
                root.RemoveFromHierarchy();
                return root;
            }

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
