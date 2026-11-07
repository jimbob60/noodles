import { describe, expect, it } from "vitest";
import { Bath, MAX_CLEAN_PER_SECOND, spongeButton } from "../src/ui/bath";
import { bedButton } from "../src/ui/bedtime";

const W = 1280;
const H = 800;
const grubby = { fullness: 70, happiness: 70, energy: 70, cleanliness: 20 };
// A pretend dragon lying along y = 400, x 400–800.
const dragon = {
  spotAt: (x: number, y: number) =>
    Math.abs(y - 400) < 30 && x >= 400 && x <= 800 ? (x - 400) / 400 : null,
};

/** Grabs the sponge and scrubs back and forth along the dragon for `seconds`. */
function scrub(bath: Bath, seconds: number, needs = grubby) {
  const btn = spongeButton(W, H);
  bath.update(1 / 60, { x: btn.x, y: btn.y, down: true }, btn, dragon, needs, W, H);
  let clean = 0;
  let squeaky = 0;
  let level = needs.cleanliness;
  for (let i = 0; i < seconds * 60; i++) {
    const x = 600 + Math.sin(i / 5) * 150;
    const r = bath.update(
      1 / 60,
      { x, y: 430, down: true },
      null,
      dragon,
      { ...needs, cleanliness: level },
      W,
      H,
    );
    clean += r.clean;
    level += r.clean;
    if (r.squeaky) squeaky++;
  }
  return { clean, squeaky, level };
}

describe("bath", () => {
  it("picks up the sponge from its button, which sits beside the bed button", () => {
    const bath = new Bath();
    const btn = spongeButton(W, H);
    expect(
      bath.update(1 / 60, { x: btn.x, y: btn.y, down: true }, btn, dragon, grubby, W, H).busy,
    ).toBe(true);
    expect(bath.held).not.toBeNull();
    const bed = bedButton(W, H);
    expect(Math.abs(btn.y - bed.y)).toBeLessThan(1);
    expect(Math.hypot(btn.x - bed.x, btn.y - bed.y)).toBeGreaterThan(btn.r * 2);
  });

  it("scrubbing the dragon fills Hygiene and makes bubbles", () => {
    const bath = new Bath();
    const r = scrub(bath, 2);
    expect(r.clean).toBeGreaterThan(10);
    expect(bath.bubbles.length).toBeGreaterThan(5);
  });

  it("never cleans faster than the cap, and stops at 100 with one squeaky-clean moment", () => {
    const bath = new Bath();
    const r = scrub(bath, 12);
    expect(r.clean).toBeLessThanOrEqual(MAX_CLEAN_PER_SECOND * 12 + 1e-9);
    expect(r.level).toBeCloseTo(100, 6);
    expect(r.squeaky).toBe(1);
  });

  it("cleans at full speed even when the finger reports only every other update", () => {
    const bath = new Bath();
    const btn = spongeButton(W, H);
    bath.update(1 / 60, { x: btn.x, y: btn.y, down: true }, btn, dragon, grubby, W, H);
    let clean = 0;
    let x = 450;
    for (let i = 0; i < 120; i++) {
      if (i % 2 === 0) x = x === 450 ? 750 : 450; // big strokes, reported on half the updates
      clean += bath.update(
        1 / 60,
        { x, y: 430, down: true },
        null,
        dragon,
        { ...grubby, cleanliness: 20 },
        W,
        H,
      ).clean;
    }
    expect(clean).toBeGreaterThan(MAX_CLEAN_PER_SECOND * 2 * 0.9);
  });

  it("does nothing when scrubbing thin air", () => {
    const bath = new Bath();
    const btn = spongeButton(W, H);
    bath.update(1 / 60, { x: btn.x, y: btn.y, down: true }, btn, dragon, grubby, W, H);
    let clean = 0;
    for (let i = 0; i < 60; i++)
      clean += bath.update(
        1 / 60,
        { x: 100 + i * 3, y: 150, down: true },
        null,
        dragon,
        grubby,
        W,
        H,
      ).clean;
    expect(clean).toBe(0);
  });
});
