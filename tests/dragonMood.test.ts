import { describe, expect, it } from "vitest";
import type { Mood } from "../src/care/mood";
import { Dragon } from "../src/noodle/dragon";

const world = { width: 1280, height: 800, unit: 16 };
const noFinger = { x: 0, y: 0, down: false };

function live(mood: Mood, seconds: number, watch?: (d: Dragon) => void) {
  const d = new Dragon(640, 400, 16, world, undefined, () => 0.5);
  d.mood = mood;
  for (let i = 0; i < seconds * 60; i++) {
    d.update(1 / 60, noFinger, world);
    watch?.(d);
  }
  return d;
}

describe("the dragon shows its mood", () => {
  it("tired: droopy eyelids and yawns", () => {
    let yawned = false;
    const d = live("tired", 20, (d) => (yawned ||= d.face.yawnLeft > 0 && !d.asleep));
    if (!d.asleep) expect(d.face.droop).toBeGreaterThan(0.4);
    expect(yawned).toBe(true);
  });

  it("happy: a big smile, and wide-awake eyes", () => {
    const d = live("happy", 2);
    expect(d.face.mouthShape).toBe("smile");
    expect(d.face.droop).toBeLessThan(0.05);
  });

  it("hungry: a pout", () => {
    expect(live("hungry", 1).face.mouthShape).toBe("pout");
  });

  it("lonely: big pleading eyes", () => {
    expect(live("lonely", 1).face.pleading).toBe(true);
  });

  it("thinks about what it wants, now and then", () => {
    const thoughts = new Set<string>();
    live("hungry", 25, (d) => {
      if (d.thinkingOf) thoughts.add(d.thinkingOf);
    });
    expect([...thoughts]).toEqual(["fullness"]);
  });

  it("has no thought bubbles when happy", () => {
    let thought = false;
    live("happy", 25, (d) => (thought ||= d.thinkingOf !== null));
    expect(thought).toBe(false);
  });
});
