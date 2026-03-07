import { registerPlugin } from '@capacitor/core';

interface TimerAudioPlugin {
  scheduleCountdown(options: { secondsRemaining: number; volume: number }): Promise<void>;
  cancelScheduledSounds(): Promise<void>;
  stopKeepAlive(): Promise<void>;
  playTestSound(options: { volume: number }): Promise<void>;
}

const TimerAudio = registerPlugin<TimerAudioPlugin>('TimerAudio');

export const timerAudio = TimerAudio;
