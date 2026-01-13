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
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/**
 * Initialize audio on user interaction.
 * Call this from touch/click handlers to ensure audio works on iOS.
 */
export function initAudioOnInteraction(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (e) {
    log.debug('Audio context initialization failed');
  }
}

/**
 * Play a single beep tone.
 *
 * @param frequency - Frequency in Hz (e.g., 880 for A5)
 * @param duration - Duration in seconds
 * @param volume - Volume 0-100 (will be converted to gain 0-1)
 */
export function playBeep(frequency: number, duration: number, volume: number): void {
  if (volume === 0) return; // Muted

  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

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
  } catch (e) {
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
export function playCompletionSound(volume: number): void {
  if (volume === 0) return; // Muted

  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

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
  } catch (e) {
    log.debug('Completion sound playback failed');
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
