import { describe, expect, it } from "vitest";
import { Face } from "../src/noodle/face";
import { headToWorld, Whiskers } from "../src/noodle/whiskers";

describe("whiskers", () => {
  it("grow from the snout on whichever side the face points", () => {
    const face = new Face(() => 0.5);
    const at = { x: 100, y: 100 };
    expect(headToWorld(at, face, { x: 10, y: 0 }).x).toBeGreaterThan(100);
    face.facing = -1;
    expect(headToWorld(at, face, { x: 10, y: 0 }).x).toBeLessThan(100);
  });

  it("hang down and a little back while the head holds still", () => {
    const face = new Face(() => 0.5); // facing right
    const at = { x: 0, y: 0 };
    const whiskers = new Whiskers(at, 5);
    for (let i = 0; i < 180; i++) whiskers.update(1 / 60, at, 20, face);
    for (const strand of whiskers.strands) {
      const tip = strand.points[strand.points.length - 1];
      expect(tip.y).toBeGreaterThan(strand.points[0].y);
      expect(tip.x).toBeLessThanOrEqual(strand.points[0].x + 1);
    }
  });
});
