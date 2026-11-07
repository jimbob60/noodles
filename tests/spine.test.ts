import { describe, expect, it } from "vitest";
import { Spine, wrapAngle } from "../src/noodle/spine";

function segmentLengths(spine: Spine): number[] {
  return spine.points.slice(1).map((p, i) => {
    const q = spine.points[i];
    return Math.hypot(p.x - q.x, p.y - q.y);
  });
}

function bends(spine: Spine): number[] {
  const p = spine.points;
  const out: number[] = [];
  for (let i = 2; i < p.length; i++) {
    const a = Math.atan2(p[i - 1].y - p[i - 2].y, p[i - 1].x - p[i - 2].x);
    const b = Math.atan2(p[i].y - p[i - 1].y, p[i].x - p[i - 1].x);
    out.push(Math.abs(wrapAngle(b - a)));
  }
  return out;
}

describe("noodle spine", () => {
  it("puts the head exactly where it is told", () => {
    const spine = new Spine(0, 0, 20, 10);
    spine.follow(123, 45);
    expect(spine.head).toEqual({ x: 123, y: 45 });
  });

  it("keeps every link the same length while the head moves around", () => {
    const spine = new Spine(0, 0, 20, 10);
    for (let t = 0; t < 300; t++) spine.follow(Math.cos(t * 0.1) * 150, Math.sin(t * 0.23) * 90);
    for (const len of segmentLengths(spine)) expect(len).toBeCloseTo(10, 6);
  });

  it("never bends sharper than allowed, even when the head doubles back", () => {
    const spine = new Spine(0, 0, 20, 10, Math.PI / 6);
    spine.follow(0, -50);
    spine.follow(0, 120); // straight back through its own body
    for (const bend of bends(spine)) expect(bend).toBeLessThanOrEqual(Math.PI / 6 + 1e-9);
  });

  it("trails behind: the tail ends up opposite to where the head went", () => {
    const spine = new Spine(0, 0, 10, 10);
    for (let x = 0; x <= 400; x += 5) spine.follow(x, 0);
    const tail = spine.points[spine.points.length - 1];
    expect(tail.x).toBeCloseTo(400 - 90, 0);
    expect(tail.y).toBeCloseTo(0, 0);
  });

  it("survives the head standing still on top of itself", () => {
    const spine = new Spine(5, 5, 6, 10);
    spine.follow(5, 5);
    spine.follow(5, 5);
    for (const p of spine.points) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
  });
});
