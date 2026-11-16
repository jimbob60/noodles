/**
 * The lo-fi music, as plain numbers (phase 43): which notes play on which step. `sound.ts`
 * turns these into real sounds. Kept apart so it can be tested without a sound card.
 */

/** Beats per minute: slow and relaxed. */
export const BPM = 72;
/** Eighth-note steps in a bar. */
export const STEPS = 8;
/** Seconds per eighth-note step. */
export const STEP_SECONDS = 60 / BPM / 2;

/** A note number (MIDI: 60 is middle C) as a frequency in Hz. */
export const freq = (note: number): number => 440 * 2 ** ((note - 69) / 12);

/**
 * The classic cozy lo-fi loop, one chord a bar: Fmaj7, Em7, Dm7, Cmaj7 (then round again).
 * Each chord: its bass note and the four notes the soft keys play.
 */
export const CHORDS = [
  { name: "Fmaj7", bass: 41, keys: [53, 57, 60, 64] },
  { name: "Em7", bass: 40, keys: [52, 55, 59, 62] },
  { name: "Dm7", bass: 38, keys: [50, 53, 57, 60] },
  { name: "Cmaj7", bass: 36, keys: [48, 52, 55, 59] },
] as const;

/** Melody notes: C major pentatonic, up high (it fits every chord in the loop). */
export const MELODY = [72, 74, 76, 79, 81, 84];

/** Small seeded random numbers, so each loop's melody wanders but tests stay steady. */
export function melodyRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What plays on one eighth-note step. */
export interface Step {
  /** Strike the chord's keys (a soft, long chord). */
  keys: readonly number[] | null;
  bass: number | null;
  kick: boolean;
  snare: boolean;
  hat: boolean;
  melody: number | null;
}

/**
 * What plays on step `n` (counting from 0, forever). At bedtime (`sleepy`) the drums rest and
 * the melody gets sparser, like a lullaby.
 */
export function stepAt(n: number, random: () => number, sleepy = false): Step {
  const bar = Math.floor(n / STEPS);
  const s = n % STEPS;
  const chord = CHORDS[bar % CHORDS.length];
  const melodyChance = sleepy ? 0.12 : 0.28;
  // Only on off-beats near the end of a bar, a little melody note now and then.
  const playMelody = s !== 0 && random() < melodyChance;
  return {
    keys: s === 0 || (s === 5 && !sleepy && random() < 0.5) ? chord.keys : null,
    bass: s === 0 || (s === 4 && !sleepy) ? chord.bass : null,
    kick: !sleepy && (s === 0 || s === 5),
    snare: !sleepy && (s === 2 || s === 6),
    hat: !sleepy && s % 2 === 1,
    melody: playMelody ? MELODY[Math.floor(random() * MELODY.length)] : null,
  };
}

/** The sound setting: everything on, or everything off. */
export type SoundSetting = "on" | "off";
export const parseSoundSetting = (raw: string | null): SoundSetting =>
  raw === "off" ? "off" : "on";
