using System.Collections.Generic;
using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.Game.Levels;
using ITBL.LanguageGame.Runtime.Infrastructure.Persistence;
using ITBL.LanguageGame.Runtime.UI.Screens;
using UnityEngine;
using UnityEngine.InputSystem;

namespace ITBL.LanguageGame.Runtime.Game.Hub
{
    public sealed class HubSceneController : MonoBehaviour
    {
        private const float MovementSpeed = 4f;
        private const float InteractionDistance = 1.8f;

        private readonly List<HubLevelGate> _gates = new();
        private Transform _playerTransform;
        private InputAction _moveAction;
        private InputAction _interactAction;
        private bool _interactPressed;
        private string _statusMessage = "Erkunde den Hub und waehle ein Level.";
        private HubOverlayView _overlayView;

        private void Start()
        {
            EnsureSceneVisuals();
            BuildHubObjects();
            BindInput();
            RefreshGateStates();
            _overlayView = HubOverlayView.Create(transform);
            _overlayView.Bind(() => GameRoot.Services.SceneRouter.LoadScene(GameSceneId.MainMenu));
        }

        private void OnEnable()
        {
            _interactPressed = false;
        }

        private void OnDisable()
        {
            if (_interactAction != null)
            {
                _interactAction.performed -= OnInteractPerformed;
            }
        }

        private void Update()
        {
            if (!GameRoot.IsReady || _playerTransform == null)
            {
                return;
            }

            Vector2 movement = _moveAction != null ? _moveAction.ReadValue<Vector2>() : Vector2.zero;
            Vector3 delta = new(movement.x, movement.y, 0f);
            _playerTransform.position += delta * (MovementSpeed * Time.deltaTime);

            if (_interactPressed)
            {
                _interactPressed = false;
                TryInteract();
            }

            PlayerProfile profile = GameRoot.Services.ProgressionService.GetPlayerProfile();
            _overlayView?.Refresh(_statusMessage, profile, _gates);
        }

        private void BuildHubObjects()
        {
            GameObject player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            player.name = "HubPlayer";
            player.transform.position = Vector3.zero;
            _playerTransform = player.transform;

            IReadOnlyList<LevelRuntimeState> levels = GameRoot.Services.ProgressionService.GetLevelStates();
            float startX = -2.5f;
            for (int i = 0; i < levels.Count; i++)
            {
                LevelRuntimeState level = levels[i];
                HubLevelGate gate = new()
                {
                    LevelId = level.LevelId,
                    DisplayName = level.DisplayName,
                    Position = new Vector3(startX + i * 3f, 2f, 0f),
                    State = level.State,
                    LockReason = string.Empty,
                };
                gate.Marker = GameObject.CreatePrimitive(PrimitiveType.Cube);
                gate.Marker.name = $"Gate_{level.LevelId}";
                gate.Marker.transform.position = gate.Position;
                gate.Marker.transform.localScale = new Vector3(1.2f, 1.2f, 1.2f);
                _gates.Add(gate);
            }
        }

        private void BindInput()
        {
            InputActionAsset actions = InputSystem.actions;
            _moveAction = actions?.FindAction("Move");
            _interactAction = actions?.FindAction("Interact");

            _moveAction?.actionMap?.Enable();
            _interactAction?.actionMap?.Enable();
            if (_interactAction != null)
            {
                _interactAction.performed += OnInteractPerformed;
            }
        }

        private void OnInteractPerformed(InputAction.CallbackContext _)
        {
            _interactPressed = true;
        }

        private void RefreshGateStates()
        {
            Dictionary<string, LevelRuntimeState> levelById = new();
            foreach (LevelRuntimeState level in GameRoot.Services.ProgressionService.GetLevelStates())
            {
                levelById[level.LevelId] = level;
            }

            for (int i = 0; i < _gates.Count; i++)
            {
                HubLevelGate gate = _gates[i];
                if (levelById.TryGetValue(gate.LevelId, out LevelRuntimeState runtimeState))
                {
                    gate.State = runtimeState.State;
                }
                else
                {
                    gate.State = LevelState.Locked;
                }

                gate.LockReason = GameRoot.Services.ProgressionService.GetLockReason(gate.LevelId);

                if (gate.Marker != null)
                {
                    Renderer renderer = gate.Marker.GetComponent<Renderer>();
                    if (renderer != null)
                    {
                        renderer.material.color = gate.State switch
                        {
                            LevelState.Completed => Color.green,
                            LevelState.Unlocked => Color.cyan,
                            _ => Color.red,
                        };
                    }
                }
            }
        }

        private void TryInteract()
        {
            HubLevelGate nearest = null;
            float nearestDistance = float.MaxValue;

            foreach (HubLevelGate gate in _gates)
            {
                float distance = Vector3.Distance(_playerTransform.position, gate.Position);
                if (distance < nearestDistance)
                {
                    nearestDistance = distance;
                    nearest = gate;
                }
            }

            if (nearest == null || nearestDistance > InteractionDistance)
            {
                _statusMessage = "Gehe naeher an ein Level-Tor und druecke Interact.";
                return;
            }

            if (nearest.State == LevelState.Locked)
            {
                _statusMessage = string.IsNullOrWhiteSpace(nearest.LockReason)
                    ? "Dieses Level ist gesperrt."
                    : nearest.LockReason;
                return;
            }

            GameRoot.Services.AppState.SelectedLevelId = nearest.LevelId;
            _statusMessage = $"{nearest.DisplayName} wird geladen ...";
            Debug.Log($"[WP1][Hub] Entering {nearest.LevelId}");
            GameRoot.Services.SceneRouter.LoadScene(GameSceneId.LevelTemplate);
        }

        private static void EnsureSceneVisuals()
        {
            Camera camera = Camera.main;
            if (camera == null)
            {
                GameObject cameraObject = new("Main Camera");
                camera = cameraObject.AddComponent<Camera>();
                camera.tag = "MainCamera";
            }

            camera.transform.position = new Vector3(0f, 0f, -10f);
            camera.orthographic = true;
            camera.orthographicSize = 6f;
        }

    }
}
