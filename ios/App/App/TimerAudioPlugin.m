#import <Capacitor/Capacitor.h>

CAP_PLUGIN(TimerAudioPlugin, "TimerAudio",
    CAP_PLUGIN_METHOD(scheduleCountdown, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(cancelScheduledSounds, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopKeepAlive, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(playTestSound, CAPPluginReturnPromise);
)
