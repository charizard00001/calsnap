import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Synthesised sound effects. Everything here is generated with WebAudio at
 * call time — there are no audio files to ship, and nothing is fetched (the
 * artifact/PWA CSP wouldn't allow it anyway). Native is silent for now;
 * haptics cover the same beats there.
 */

export type SfxName =
  | 'tap'
  | 'boing'
  | 'up'
  | 'down'
  | 'chime'
  | 'fanfare'
  | 'error'
  | 'nav';

export interface SfxOptions {
  /** Multiplies every frequency — 1 is the sound as written. */
  pitch?: number;
}

const MUTE_KEY = 'sfx_muted';

let muted = false;
let ctx: AudioContext | null | undefined;

// Restore the saved preference once at module load; until it resolves we
// default to on, which matches the setting's default.
AsyncStorage.getItem(MUTE_KEY)
  .then((v) => {
    muted = v === 'true';
  })
  .catch(() => {});

export function isMuted(): boolean {
  return muted;
}

export async function setMuted(next: boolean): Promise<void> {
  muted = next;
  try {
    await AsyncStorage.setItem(MUTE_KEY, next ? 'true' : 'false');
  } catch {
    // Preference is a nicety — never let storage failure break playback.
  }
}

function audio(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (ctx === undefined) {
    const AC =
      (window as any).AudioContext || (window as any).webkitAudioContext || null;
    ctx = AC ? new AC() : null;
  }
  return ctx ?? null;
}

function tone(
  ac: AudioContext,
  opts: {
    at: number;
    from: number;
    to?: number;
    type?: OscillatorType;
    gain?: number;
    dur?: number;
  }
) {
  const { at, from, to, type = 'triangle', gain = 0.1, dur = 0.14 } = opts;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(to, at + dur * 0.8);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function noise(ac: AudioContext, at: number, dur: number, freq: number, gain: number) {
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const g = ac.createGain();
  src.buffer = buf;
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(at);
}

/** Fire a sound. Safe to call anywhere — it no-ops off web or when muted. */
export function sfx(name: SfxName, opts: SfxOptions = {}): void {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  // Browsers start the context suspended until a user gesture; every call
  // site here is inside one, so this resume is what actually unlocks it.
  if (ac.state === 'suspended') void ac.resume();

  const t = ac.currentTime;
  const p = opts.pitch ?? 1;

  switch (name) {
    case 'nav':
      // Arcade selector: a square blip with a triangle a fifth above it, so
      // the four tabs read as one instrument at four pitches.
      tone(ac, { at: t, from: 520 * p, to: 780 * p, type: 'square', gain: 0.07, dur: 0.1 });
      tone(ac, { at: t + 0.015, from: 780 * p, to: 1040 * p, gain: 0.05, dur: 0.11 });
      break;
    case 'tap':
      tone(ac, { at: t, from: 620, to: 880, type: 'square', gain: 0.06, dur: 0.09 });
      break;
    case 'up':
      tone(ac, { at: t, from: 680, to: 940, gain: 0.08, dur: 0.11 });
      break;
    case 'down':
      tone(ac, { at: t, from: 460, to: 330, gain: 0.08, dur: 0.11 });
      break;
    case 'boing':
      tone(ac, { at: t, from: 860, to: 170, type: 'sine', gain: 0.22, dur: 0.3 });
      noise(ac, t + 0.02, 0.09, 2100, 0.13);
      break;
    case 'chime':
      tone(ac, { at: t, from: 523.25, gain: 0.12, dur: 0.28 });
      tone(ac, { at: t + 0.1, from: 783.99, gain: 0.12, dur: 0.3 });
      break;
    case 'fanfare':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone(ac, {
          at: t + i * 0.11,
          from: f,
          type: i === 3 ? 'sawtooth' : 'square',
          gain: i === 3 ? 0.14 : 0.09,
          dur: i === 3 ? 0.5 : 0.22,
        });
      });
      noise(ac, t + 0.3, 0.45, 5200, 0.07);
      break;
    case 'error':
      tone(ac, { at: t, from: 240, to: 150, type: 'sawtooth', gain: 0.12, dur: 0.26 });
      break;
  }
}
