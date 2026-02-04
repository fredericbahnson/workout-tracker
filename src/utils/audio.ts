/**
 * Audio Utilities
 *
 * Centralized audio functions for timer beeps and sounds.
 * Uses Web Audio API for reliable cross-browser/mobile support.
 */

import { createScopedLogger } from './logger';

const log = createScopedLogger('Audio');

// Singleton audio context
let audioContext: AudioContext | null = null;

// Keep-alive oscillator to prevent iOS from suspending AudioContext
let keepAliveOscillator: OscillatorNode | null = null;
let keepAliveGain: GainNode | null = null;

/**
 * Get or create the audio context.
 * Must be called from a user interaction for iOS Safari.
 */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
  }
  return audioContext;
}

/**
 * Resume audio context if suspended.
 * Required by browser autoplay policies.
 */
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  await ctx.resume();
}

/**
 * Initialize audio on user interaction.
 * Call this from touch/click handlers to ensure audio works on iOS.
 */
export function initAudioOnInteraction(): void {
  try {
    const ctx = getAudioContext();
    ctx.resume();
  } catch (_e) {
    log.debug('Audio context initialization failed');
  }
}

/**
 * Start a near-silent oscillator to keep the AudioContext alive on iOS.
 * Must be called from a user gesture (e.g., timer start button).
 * Prevents iOS from suspending the AudioContext when the app is backgrounded.
 */
export function startAudioKeepAlive(): void {
  try {
    const ctx = getAudioContext();
    ctx.resume();

    // Already running
    if (keepAliveOscillator) return;

    keepAliveOscillator = ctx.createOscillator();
    keepAliveGain = ctx.createGain();

    keepAliveOscillator.connect(keepAliveGain);
    keepAliveGain.connect(ctx.destination);

    // 1Hz at near-zero gain - inaudible but keeps context active
    keepAliveOscillator.frequency.value = 1;
    keepAliveGain.gain.value = 0.001;

    keepAliveOscillator.start();
    log.debug('Audio keep-alive started');
  } catch (_e) {
    log.debug('Audio keep-alive start failed');
  }
}

/**
 * Stop the keep-alive oscillator.
 * Call when timer completes or component unmounts.
 */
export function stopAudioKeepAlive(): void {
  try {
    if (keepAliveOscillator) {
      keepAliveOscillator.stop();
      keepAliveOscillator.disconnect();
      keepAliveOscillator = null;
    }
    if (keepAliveGain) {
      keepAliveGain.disconnect();
      keepAliveGain = null;
    }
    log.debug('Audio keep-alive stopped');
  } catch (_e) {
    log.debug('Audio keep-alive stop failed');
  }
}

/**
 * Ensure the AudioContext is running, with a single retry.
 */
async function ensureContextRunning(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
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
export async function playBeep(frequency: number, duration: number, volume: number): Promise<void> {
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
 * Play countdown beep (3, 2, 1).
 * Short beep at 880Hz (A5).
 *
 * @param volume - Volume 0-100
 */
export function playCountdownBeep(volume: number): void {
  playBeep(880, 0.15, volume);
}

/**
 * Play completion sound - ascending three-tone chord.
 *
 * @param volume - Volume 0-100
 */
export async function playCompletionSound(volume: number): Promise<void> {
  if (volume === 0) return; // Muted

  try {
    const ctx = await ensureContextRunning();

    // Convert 0-100 volume to 0-1 gain
    const gain = Math.min(1, Math.max(0, volume / 100));

    // Three ascending tones: C5, E5, G5 (major chord)
    const frequencies = [523.25, 659.25, 783.99];

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + i * 0.15;
      gainNode.gain.setValueAtTime(gain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  } catch (_e) {
    log.debug('Completion sound playback failed');
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

/**
 * Play a test beep for volume preview.
 * Plays countdown beep followed by completion sound.
 *
 * @param volume - Volume 0-100
 */
export function playTestSound(volume: number): void {
  playCountdownBeep(volume);
  // Play completion sound after a short delay
  setTimeout(() => {
    playCompletionSound(volume);
  }, 300);
}

/**
 * Pre-schedule countdown sounds using Web Audio API's internal clock.
 * This ensures precise timing even if setInterval is delayed by iOS.
 *
 * @param secondsRemaining - Current seconds remaining (should be ~5 or less)
 * @param volume - Volume 0-100
 * @returns Cancel function to stop scheduled sounds
 */
export function scheduleCountdownSounds(secondsRemaining: number, volume: number): () => void {
  if (volume === 0) return () => {};

  const oscillators: OscillatorNode[] = [];

  try {
    const ctx = getAudioContext();
    const gain = Math.min(1, Math.max(0, volume / 100));

    // Schedule countdown beeps at 3, 2, 1
    for (let s = Math.min(secondsRemaining, 3); s >= 1; s--) {
      const delay = secondsRemaining - s;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      const startAt = ctx.currentTime + delay;
      gainNode.gain.setValueAtTime(gain, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startAt + 0.15);
      osc.start(startAt);
      osc.stop(startAt + 0.15);
      oscillators.push(osc);
    }

    // Schedule completion chord at 0
    const completionDelay = secondsRemaining;
    const frequencies = [523.25, 659.25, 783.99];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startAt = ctx.currentTime + completionDelay + i * 0.15;
      gainNode.gain.setValueAtTime(gain, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startAt + 0.3);
      osc.start(startAt);
      osc.stop(startAt + 0.3);
      oscillators.push(osc);
    });
  } catch (_e) {
    log.debug('Failed to schedule countdown sounds');
  }

  // Return cancel function
  return () => {
    oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Already stopped
      }
    });
  };
}
