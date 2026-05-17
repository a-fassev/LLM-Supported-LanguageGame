using System;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Cutscene content in UI Toolkit; advance via quest shell Next.</summary>
    public sealed class CutsceneToolkitStep : IStepView
    {
        private const string PlaceholderBody = "(cutscene placeholder)";

        private readonly VisualElement _root;

        private Label _bodyLabel;

        public CutsceneToolkitStep(VisualElement host)
        {
            _root = new VisualElement();
            _root.style.flexGrow = 1;
            _root.AddToClassList("lg-muted-panel");
            _root.style.paddingTop = 16;
            _root.style.paddingBottom = 16;
            _root.style.paddingLeft = 16;
            _root.style.paddingRight = 16;

            var title = new Label("Cutscene");
            title.AddToClassList("lg-heading-screen");
            title.style.marginBottom = 12;
            _root.Add(title);

            _bodyLabel = new Label();
            _bodyLabel.AddToClassList("lg-text-body");
            _bodyLabel.style.whiteSpace = WhiteSpace.Normal;
            _root.Add(_bodyLabel);

            host.Add(_root);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            var json = context?.contentJson;
            _bodyLabel.text = string.IsNullOrEmpty(json) ? PlaceholderBody : json;
        }

        public void SetInteractable(bool interactable)
        {
        }

        public void Teardown()
        {
            _root?.RemoveFromHierarchy();
        }
    }
}
