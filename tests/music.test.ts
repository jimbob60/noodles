import { describe, expect, it } from "vitest";
import {
  BPM,
  CHORDS,
  freq,
  melodyRandom,
  MELODY,
  parseSoundSetting,
  STEP_SECONDS,
  STEPS,
  stepAt,
} from "../src/audio/music";

describe("the lo-fi music", () => {
  it("is slow and relaxed, in tune", () => {
    expect(BPM).toBeLessThanOrEqual(80);
    expect(STEP_SECONDS).toBeCloseTo(60 / BPM / 2);
    expect(freq(69)).toBeCloseTo(440);
    expect(freq(60)).toBeCloseTo(261.63, 1);
  });

  it("strikes a new chord at the start of every bar, round the four-chord loop", () => {
    const r = melodyRandom(1);
    for (let bar = 0; bar < 8; bar++) {
      const s = stepAt(bar * STEPS, r);
      expect(s.keys).toEqual(CHORDS[bar % 4].keys);
      expect(s.bass).toBe(CHORDS[bar % 4].bass);
      expect(s.kick).toBe(true);
    }
  });

  it("only plays melody notes from the gentle scale", () => {
    const r = melodyRandom(2);
    let notes = 0;
    for (let n = 0; n < 400; n++) {
      const m = stepAt(n, r).melody;
      if (m !== null) {
        notes++;
        expect(MELODY).toContain(m);
      }
    }
    expect(notes).toBeGreaterThan(40);
    expect(notes).toBeLessThan(200);
  });

  it("turns into a lullaby at bedtime: no drums, fewer notes", () => {
    const r = melodyRandom(3);
    let notes = 0;
    for (let n = 0; n < 400; n++) {
      const s = stepAt(n, r, true);
      expect(s.kick || s.snare || s.hat).toBe(false);
      if (s.melody !== null) notes++;
    }
    expect(notes).toBeLessThan(80);
  });

  it("remembers the sound setting, on unless turned off", () => {
    expect(parseSoundSetting(null)).toBe("on");
    expect(parseSoundSetting("off")).toBe("off");
    expect(parseSoundSetting("junk")).toBe("on");
  });
});
