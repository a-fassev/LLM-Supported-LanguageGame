using UnityEngine;
using UnityEngine.SceneManagement;
using LanguageGame.Domain;

namespace LanguageGame.Application
{
    public class GameFlowController : MonoBehaviour
    {
        public static GameFlowController Instance { get; private set; }

        private const string SceneMainMenu = "MainMenu";
        private const string SceneCityMap  = "CityMap";

        private static readonly System.Collections.Generic.Dictionary<TaskType, string> TaskSceneMap =
            new System.Collections.Generic.Dictionary<TaskType, string>
            {
                { TaskType.ErrorSpotting,  "LevelErrorSpotting"  },
                { TaskType.DragDrop,       "LevelDragDrop"       },
                { TaskType.ClozeText,      "LevelClozeText"      },
                { TaskType.Matching,       "LevelMatching"       },
                { TaskType.MultipleChoice, "LevelMultipleChoice" },
                { TaskType.FreeText,       "LevelFreeText"       },
                { TaskType.RelativeClause, "LevelRelativeClause" },
            };

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void LoadMainMenu() => LoadScene(SceneMainMenu);
        public void LoadCityMap()  => LoadScene(SceneCityMap);

        public void LoadLevel(TaskType taskType)
        {
            if (TaskSceneMap.TryGetValue(taskType, out string sceneName))
                LoadScene(sceneName);
            else
            {
                Debug.LogError($"[GameFlowController] No scene for TaskType '{taskType}'. Falling back to MainMenu.");
                LoadMainMenu();
            }
        }

        private void LoadScene(string sceneName)
        {
            if (string.IsNullOrEmpty(sceneName))
            {
                Debug.LogError("[GameFlowController] Scene name empty. Falling back to MainMenu.");
                SceneManager.LoadScene(SceneMainMenu, LoadSceneMode.Single);
                return;
            }
            SceneManager.LoadScene(sceneName, LoadSceneMode.Single);
        }
    }
}
