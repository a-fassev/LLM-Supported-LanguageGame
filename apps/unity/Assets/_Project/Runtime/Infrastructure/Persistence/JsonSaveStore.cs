using System;
using System.IO;
using ITBL.LanguageGame.Runtime.Core;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Infrastructure.Persistence
{
    public sealed class JsonSaveStore
    {
        private const string SaveFileName = "wp1-save.json";
        private readonly UserFacingErrorState _errorState;

        public JsonSaveStore(UserFacingErrorState errorState)
        {
            _errorState = errorState;
        }

        private static string SaveFilePath => Path.Combine(Application.persistentDataPath, SaveFileName);

        public SaveData Load()
        {
            try
            {
                if (!File.Exists(SaveFilePath))
                {
                    return new SaveData();
                }

                string json = File.ReadAllText(SaveFilePath);
                SaveData data = JsonUtility.FromJson<SaveData>(json);
                return data ?? new SaveData();
            }
            catch (Exception exception)
            {
                _errorState.Report(AppErrorCode.PersistenceLoadFailed, exception.Message);
                return new SaveData();
            }
        }

        public void Save(SaveData data)
        {
            try
            {
                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(SaveFilePath, json);
            }
            catch (Exception exception)
            {
                _errorState.Report(AppErrorCode.PersistenceSaveFailed, exception.Message);
            }
        }
    }
}
