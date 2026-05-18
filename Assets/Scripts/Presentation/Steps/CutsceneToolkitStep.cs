using System;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Cutscene content in UI Toolkit; advance via quest shell Next.</summary>
    public sealed class CutsceneToolkitStep : IStepView
    {
        private const string PlaceholderBody =
            "Contenuto non disponibile. Premi Avanti per continuare.";

        private readonly VisualElement _root;

        private Label _titleLabel;
        private Label _subtitleLabel;
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

            _titleLabel = new Label();
            _titleLabel.AddToClassList("lg-heading-screen");
            _titleLabel.style.marginBottom = 8;
            _root.Add(_titleLabel);

            _subtitleLabel = new Label();
            _subtitleLabel.AddToClassList("lg-text-body");
            _subtitleLabel.style.opacity = 0.85f;
            _subtitleLabel.style.marginBottom = 12;
            _subtitleLabel.style.whiteSpace = WhiteSpace.Normal;
            _subtitleLabel.style.display = DisplayStyle.None;
            _root.Add(_subtitleLabel);

            _bodyLabel = new Label();
            _bodyLabel.AddToClassList("lg-text-body");
            _bodyLabel.style.whiteSpace = WhiteSpace.Normal;
            _root.Add(_bodyLabel);

            host.Add(_root);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            var json = context?.contentJson;
            if (!TryDeserialize(json, out var dto, out _))
            {
                _titleLabel.text = "Cutscene";
                _subtitleLabel.style.display = DisplayStyle.None;
                _subtitleLabel.text = string.Empty;
                _bodyLabel.text = PlaceholderBody;
                return;
            }

            var title = string.IsNullOrWhiteSpace(dto.title) ? "Cutscene" : dto.title.Trim();
            _titleLabel.text = title;

            if (string.IsNullOrWhiteSpace(dto.subtitle))
            {
                _subtitleLabel.style.display = DisplayStyle.None;
                _subtitleLabel.text = string.Empty;
            }
            else
            {
                _subtitleLabel.style.display = DisplayStyle.Flex;
                _subtitleLabel.text = dto.subtitle.Trim();
            }

            _bodyLabel.text = string.IsNullOrWhiteSpace(dto.body) ? PlaceholderBody : dto.body.Trim();
        }

        public void SetInteractable(bool interactable)
        {
        }

        public void Teardown()
        {
            _root?.RemoveFromHierarchy();
        }

        private static bool TryDeserialize(string json, out CutsceneContentDto dto, out string error)
        {
            dto = null;
            error = null;
            if (string.IsNullOrWhiteSpace(json))
            {
                error = "Missing content.";
                return false;
            }

            var trimmed = json.TrimStart();
            if (!trimmed.StartsWith("{", StringComparison.Ordinal))
            {
                error = "Cutscene content must be a JSON object.";
                return false;
            }

            dto = JsonUtility.FromJson<CutsceneContentDto>(json);
            if (dto == null)
            {
                error = "Could not parse cutscene content.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(dto.title) || string.IsNullOrWhiteSpace(dto.body))
            {
                dto = null;
                error = "Cutscene requires non-empty title and body.";
                return false;
            }

            if (dto.schemaVersion > 0 && dto.schemaVersion != 1)
            {
                dto = null;
                error = "Unsupported cutscene schemaVersion.";
                return false;
            }

            return true;
        }
    }
}
