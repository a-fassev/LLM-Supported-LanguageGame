using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Core
{
    public sealed class UserFacingErrorState
    {
        public AppErrorCode CurrentCode { get; private set; } = AppErrorCode.None;
        public string CurrentMessage { get; private set; } = string.Empty;
        public bool HasError => CurrentCode != AppErrorCode.None;

        public void Report(AppErrorCode code, string details = "")
        {
            CurrentCode = code;
            CurrentMessage = ErrorMessageCatalog.Resolve(code);
            Debug.LogWarning($"[WP1][Error] {code} {details}");
        }

        public void Clear()
        {
            CurrentCode = AppErrorCode.None;
            CurrentMessage = string.Empty;
        }
    }
}
