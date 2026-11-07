import { describe, expect, it } from "vitest";
import { advance, MAX_FRAME, STEP } from "../src/engine/loop";

describe("game loop stepping", () => {
  it("runs one update per 60th of a second", () => {
    expect(advance(0, STEP * 3 + STEP / 2).steps).toBe(3);
  });
  it("carries leftover time into the next frame", () => {
    const first = advance(0, STEP * 0.6);
    expect(first.steps).toBe(0);
    expect(advance(first.rest, STEP * 0.6).steps).toBe(1);
  });
  it("skips ahead after a long pause instead of fast-forwarding", () => {
    expect(advance(0, 10).steps).toBe(Math.floor(MAX_FRAME / STEP + 1e-9));
  });
  it("ignores a clock that goes backwards", () => {
    expect(advance(0, -1)).toEqual({ steps: 0, rest: 0 });
  });
});
