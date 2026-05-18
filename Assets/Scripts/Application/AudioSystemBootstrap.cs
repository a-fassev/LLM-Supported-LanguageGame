using UnityEngine;

namespace LanguageGame.Application
{
    /// <summary>
    /// Locks in explicit Unity audio settings as early as possible so the FMOD-backed engine
    /// initializes output once with a stable sample rate / DSP size. Helps avoid editor warnings
    /// like «Cannot call this command after System::init» when the OS/default device setup is
    /// ambiguous (common on macOS with Bluetooth or switching audio devices).
    /// </summary>
    internal static class AudioSystemBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ConfigureAudioForProcess()
        {
            var config = AudioSettings.GetConfiguration();
            var modified = false;

            if (config.sampleRate <= 0)
            {
                config.sampleRate = 48000;
                modified = true;
            }

            if (config.dspBufferSize <= 0)
            {
                config.dspBufferSize = 1024;
                modified = true;
            }

            if (!modified)
                return;

            if (!AudioSettings.Reset(config) && Debug.isDebugBuild)
                Debug.LogWarning("[AudioSystemBootstrap] AudioSettings.Reset returned false.");
        }
    }
}
