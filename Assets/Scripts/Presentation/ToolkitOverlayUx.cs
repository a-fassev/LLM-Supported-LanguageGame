using System;
using LanguageGame.Presentation.Steps;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Loads shared overlay UXML templates (same Resources pattern as quest step templates).</summary>
    internal static class ToolkitOverlayUx
    {
        public static bool IsAttached(VisualElement root) => root != null && root.parent != null;

        public static VisualElement Instantiate(string resourcesPath, string rootElementName) =>
            ToolkitStepUx.Instantiate(resourcesPath, rootElementName);

        public static bool TryAttach(
            VisualElement overlayPlane,
            string resourcesPath,
            string rootElementName,
            string ownerName,
            out VisualElement root,
            bool insertAtFront = false)
        {
            root = null;

            if (overlayPlane == null)
            {
                LogMissingPlane(ownerName);
                return false;
            }

            root = Instantiate(resourcesPath, rootElementName);
            if (root == null)
            {
                LogMissing(resourcesPath, rootElementName, ownerName);
                return false;
            }

            if (insertAtFront)
                overlayPlane.Insert(0, root);
            else
                overlayPlane.Add(root);

            root.style.display = DisplayStyle.None;
            return true;
        }

        /// <summary>
        /// Attaches overlay UXML, runs wiring (queries + callbacks). Rolls back the root when wiring fails.
        /// </summary>
        public static bool TryAttachAndWire(
            VisualElement overlayPlane,
            string resourcesPath,
            string rootElementName,
            string ownerName,
            Func<VisualElement, bool> wire,
            out VisualElement root,
            bool insertAtFront = false)
        {
            if (!TryAttach(overlayPlane, resourcesPath, rootElementName, ownerName, out root, insertAtFront))
                return false;

            if (wire != null && wire(root))
                return true;

            DetachAndClear(ref root);
            Debug.LogError(
                $"[{ownerName}] Overlay wiring failed for Resources/{resourcesPath}. " +
                "Check protected element names in Templates/Overlays UXML.");
            return false;
        }

        public static T QueryRequired<T>(VisualElement root, string elementName, string ownerName)
            where T : VisualElement =>
            ToolkitStepUx.QueryRequired<T>(root, elementName, ownerName);

        public static bool AllFound(params VisualElement[] elements)
        {
            if (elements == null)
                return false;

            foreach (var element in elements)
            {
                if (element == null)
                    return false;
            }

            return true;
        }

        public static void DetachAndClear(ref VisualElement root)
        {
            if (root == null)
                return;

            root.RemoveFromHierarchy();
            root = null;
        }

        public static void WarnNotAttached(string ownerName)
        {
            Debug.LogWarning(
                $"[{ownerName}] Overlay is not attached — UI will not show. " +
                "Verify Templates/Overlays UXML exists and protected names match C#.");
        }

        public static void LogMissing(string resourcesPath, string rootElementName, string ownerName)
        {
            Debug.LogError(
                $"[{ownerName}] Missing overlay UXML at Resources/{resourcesPath} " +
                $"with root name='{rootElementName}'. Open Templates/Overlays/*.uxml in UI Builder.");
        }

        private static void LogMissingPlane(string ownerName)
        {
            Debug.LogError($"[{ownerName}] Cannot attach overlay — overlay-plane is null.");
        }
    }
}
