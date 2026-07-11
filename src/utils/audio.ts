/**
 * Audio Utilities
 *
 * Web Audio sounds for the exercise stopwatch (stop confirmation and
 * new-record fanfare).
 *
 * Note: countdown timer sounds do NOT live here - they are scheduled by the
 * native TimerAudioPlugin (src/plugins/timerAudio.ts) so they keep precise
 * timing when iOS backgrounds the app.
 */

import { createScopedLogger } from './logger';

const log = createScopedLogger('Audio');

// Singleton audio context
let audioContext: AudioContext | null = null;

/**
 * Get or create the audio context.
 * Must be called from a user interaction for iOS Safari.
 */
export function getAudioContext(): AudioContext {
  if (audioContext && audioContext.state === 'closed') {
    audioContext = null;
  }
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
  }
  return audioContext;
}

/**
 * Ensure the AudioContext is running, with a single retry.
 */
async function ensureContextRunning(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state !== 'running') {
    try {
      await ctx.resume();
    } catch (_e) {
      log.debug('AudioContext resume failed, state:', ctx.state);
    }
  }
  return ctx;
}

/**
 * Play a single beep tone.
 *
 * @param frequency - Frequency in Hz (e.g., 880 for A5)
 * @param duration - Duration in seconds
 * @param volume - Volume 0-100 (will be converted to gain 0-1)
 */
async function playBeep(frequency: number, duration: number, volume: number): Promise<void> {
  if (volume === 0) return; // Muted

  try {
    const ctx = await ensureContextRunning();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Convert 0-100 volume to 0-1 gain
    const gain = Math.min(1, Math.max(0, volume / 100));

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (_e) {
    log.debug('Beep playback failed');
  }
}

/**
 * Play a single confirmation tone for stopwatch stop.
 *
 * @param volume - Volume 0-100
 */
export function playStopSound(volume: number): void {
  playBeep(660, 0.3, volume);
}

/**
 * Play celebratory ascending tones for a new record.
 *
 * @param volume - Volume 0-100
 */
export async function playNewRecordSound(volume: number): Promise<void> {
  if (volume === 0) return;

  try {
    const ctx = await ensureContextRunning();

    const gain = Math.min(1, Math.max(0, volume / 100));
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startTime = ctx.currentTime + i * 0.12;
      gainNode.gain.setValueAtTime(gain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (_e) {
    log.debug('New record sound playback failed');
  }
}
