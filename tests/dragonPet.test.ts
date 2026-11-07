import { describe, expect, it } from "vitest";
import { Dragon } from "../src/noodle/dragon";

const world = { width: 1280, height: 800, unit: 16 };
const noFinger = { x: 0, y: 0, down: false };

function settled() {
  const d = new Dragon(640, 400, 16, world, undefined, () => 0.5);
  for (let i = 0; i < 30; i++) d.update(1 / 60, noFinger, world);
  return d;
}

describe("petting the dragon", () => {
  it("knows a touch on its head or body from a touch on empty space", () => {
    const d = settled();
    const head = d.spine.head;
    const mid = d.spine.points[12];
    expect(d.spotAt(head.x, head.y)).toBe(0);
    const t = d.spotAt(mid.x, mid.y)!;
    expect(t).toBeGreaterThan(0.3);
    expect(t).toBeLessThan(0.7);
    expect(d.spotAt(head.x + 500, head.y + 500)).toBeNull();
  });

  it("holds still and closes its eyes happily while being rubbed", () => {
    const d = settled();
    const start = { ...d.spine.head };
    d.pet = { active: true, purr: 0.8, giggle: 0 };
    for (let i = 0; i < 120; i++) d.update(1 / 60, noFinger, world);
    expect(Math.hypot(d.spine.head.x - start.x, d.spine.head.y - start.y)).toBeLessThan(5);
    expect(d.face.happy).toBe(true);
    expect(d.face.blink).toBe(1);
  });

  it("squirms when tickled", () => {
    const d = settled();
    d.pet = { active: true, purr: 0.5, giggle: 1 };
    let moved = 0;
    let last = d.spine.head.x;
    for (let i = 0; i < 60; i++) {
      d.update(1 / 60, noFinger, world);
      moved += Math.abs(d.spine.head.x - last);
      last = d.spine.head.x;
    }
    expect(moved).toBeGreaterThan(20);
  });

  it("goes back to its own moods when the petting stops", () => {
    const d = settled();
    d.pet = { active: true, purr: 0.5, giggle: 0 };
    for (let i = 0; i < 30; i++) d.update(1 / 60, noFinger, world);
    d.pet = { active: false, purr: 0.4, giggle: 0 };
    d.update(1 / 60, noFinger, world);
    expect(d.brain.mode).toBe("float");
    expect(d.face.happy).toBe(false);
  });

  it("every dragon has tickle spots", () => {
    expect(settled().tickles.length).toBeGreaterThan(0);
  });
});

describe("after a good petting", () => {
  it("gets excited: a loop-de-loop with a big smile and hearts", () => {
    const d = settled();
    d.pet = { active: true, purr: 0.9, giggle: 0 };
    for (let i = 0; i < 30; i++) d.update(1 / 60, noFinger, world);
    d.pet = { active: false, purr: 0.9, giggle: 0 };
    const start = { ...d.spine.head };
    d.update(1 / 60, noFinger, world);
    expect(d.exciteLeft).toBeGreaterThan(0);
    let farthest = 0;
    let smiled = false;
    for (let i = 0; i < 60; i++) {
      d.update(1 / 60, noFinger, world);
      farthest = Math.max(farthest, Math.hypot(d.spine.head.x - start.x, d.spine.head.y - start.y));
      smiled ||= d.face.mouthShape === "smile" && d.face.happy;
    }
    expect(smiled).toBe(true);
    expect(farthest).toBeGreaterThan(d.halfWidth * 3); // it really loops around
    for (let i = 0; i < 60; i++) d.update(1 / 60, noFinger, world);
    expect(d.exciteLeft).toBe(0);
    expect(d.brain.mode).toBe("float"); // and then carries on with its day
  });

  it("doesn't for a quick little pat", () => {
    const d = settled();
    d.pet = { active: true, purr: 0.2, giggle: 0 };
    for (let i = 0; i < 10; i++) d.update(1 / 60, noFinger, world);
    d.pet = { active: false, purr: 0.2, giggle: 0 };
    d.update(1 / 60, noFinger, world);
    expect(d.exciteLeft).toBe(0);
  });

  it("doesn't wake a dragon that was petted in its sleep", () => {
    const d = settled();
    d.goToBed({ x: 640, y: 450 }, world);
    for (let i = 0; i < 60 * 12; i++) d.update(1 / 60, noFinger, world);
    d.pet = { active: true, purr: 0.9, giggle: 0 };
    for (let i = 0; i < 30; i++) d.update(1 / 60, noFinger, world);
    d.pet = { active: false, purr: 0.9, giggle: 0 };
    d.update(1 / 60, noFinger, world);
    expect(d.exciteLeft).toBe(0);
    expect(d.inBed).toBe(true);
  });
});
