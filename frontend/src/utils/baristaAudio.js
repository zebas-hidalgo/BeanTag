/**
 * Barista Audio Synthesizer & Screen Wake Lock Utility
 * Uses native Web Audio API to produce pleasant barista timer feedback tones
 * without external audio asset dependencies, and controls Screen Wake Lock for mobile brewing.
 */

let audioCtx = null;

/**
 * Lazily retrieves or instantiates a singleton AudioContext instance.
 * Automatically attempts to resume if in suspended state.
 * @returns {AudioContext|null}
 */
export function getAudioContext() {
  if (typeof window === 'undefined') return null;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch (err) {
      console.warn('Failed to initialize AudioContext:', err);
      return null;
    }
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Internal helper to schedule a tone with a smooth attack and decay envelope
 * to avoid acoustic pops and clicks.
 */
function scheduleTone(ctx, frequency, startTime, duration, type = 'sine', volume = 0.15) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    const attack = Math.min(0.01, duration * 0.25);
    const targetVolume = Math.min(1.0, Math.max(0.0001, volume));

    // Envelope: ramp up from silence then exponential decay
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(targetVolume, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (_) {}
    };

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  } catch (err) {
    console.warn('Error scheduling tone:', err);
  }
}

/**
 * Plays a single synthesized tone with smooth envelope.
 * Defensive against SSR and environments without Web Audio.
 * 
 * @param {number} [frequency=440] Tone frequency in Hz
 * @param {number} [duration=0.1] Duration in seconds
 * @param {OscillatorType} [type='sine'] Oscillator waveform type
 * @param {number} [volume=0.15] Peak volume
 */
export function playBeep(frequency = 440, duration = 0.1, type = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    scheduleTone(ctx, frequency, ctx.currentTime, duration, type, volume);
  } catch (err) {
    console.warn('playBeep error:', err);
  }
}

/**
 * Plays a short 440Hz beep (0.08s) for countdown markers (3-2-1).
 */
export function playCountdownBeep() {
  playBeep(440, 0.08, 'sine', 0.15);
}

/**
 * Plays a two-tone chime (587.33 Hz [D5] -> 880 Hz [A5], 0.12s each)
 * to signal valve position adjustments or transitioning to the next pour stage.
 */
export function playPhaseChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    scheduleTone(ctx, 587.33, now, 0.12, 'sine', 0.15);
    scheduleTone(ctx, 880.0, now + 0.12, 0.12, 'sine', 0.15);
  } catch (err) {
    console.warn('playPhaseChime error:', err);
  }
}

/**
 * Plays a major triad chord arpeggio (523.25 Hz [C5] -> 659.25 Hz [E5] -> 783.99 Hz [G5])
 * to celebrate extraction completion.
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    scheduleTone(ctx, 523.25, now, 0.18, 'sine', 0.15);
    scheduleTone(ctx, 659.25, now + 0.12, 0.18, 'sine', 0.15);
    scheduleTone(ctx, 783.99, now + 0.24, 0.35, 'sine', 0.15);
  } catch (err) {
    console.warn('playSuccessChime error:', err);
  }
}

/**
 * Requests a screen wake lock to keep display awake during brewing.
 * Completely safe against unsupporting platforms or permission denials.
 * 
 * @returns {Promise<WakeLockSentinel|null>} Active sentinel or null
 */
export async function requestScreenWakeLock() {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return null;
  }

  try {
    const sentinel = await navigator.wakeLock.request('screen');
    return sentinel;
  } catch (err) {
    console.warn('Screen wake lock request failed or denied:', err);
    return null;
  }
}

/**
 * Safely releases an active screen wake lock sentinel.
 * 
 * @param {WakeLockSentinel|null} sentinel
 */
export async function releaseScreenWakeLock(sentinel) {
  if (!sentinel) return;

  try {
    if (!sentinel.released && typeof sentinel.release === 'function') {
      await sentinel.release();
    }
  } catch (err) {
    console.warn('Screen wake lock release failed:', err);
  }
}

export default {
  getAudioContext,
  playBeep,
  playCountdownBeep,
  playPhaseChime,
  playSuccessChime,
  requestScreenWakeLock,
  releaseScreenWakeLock,
};
