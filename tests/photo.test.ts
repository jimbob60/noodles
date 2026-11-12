import { describe, expect, it } from "vitest";
import { captionDate, photoFileName } from "../src/ui/photoMode";
import { pose } from "../src/noodle/pose";
import { Face } from "../src/noodle/face";

describe("photos", () => {
  it("names photo files after the dragon and the moment", () => {
    const when = new Date(2026, 10, 12, 17, 4);
    expect(photoFileName("NoodlePuff", when)).toBe("noodlepuff-2026-11-12-1704.png");
    expect(photoFileName("Sir Mochi!!", when)).toBe("sir-mochi-2026-11-12-1704.png");
    expect(photoFileName("🐉🐉", when)).toBe("dragon-2026-11-12-1704.png");
    expect(photoFileName("Café Bao", when)).toBe("cafe-bao-2026-11-12-1704.png");
  });

  it("puts the date on a polaroid", () => {
    expect(captionDate(new Date(2026, 10, 12))).toBe("Nov 12, 2026");
  });

  it("poses the face for each expression", () => {
    const f = new Face(() => 0.5);
    pose(f, "happy");
    expect([f.mouthShape, f.blink, f.asleep]).toEqual(["smile", 1, false]);
    pose(f, "wow");
    expect([f.mouthShape, f.blink, f.pleading]).toEqual(["smile", 0, true]);
    pose(f, "sleepy");
    expect([f.blink, f.asleep]).toEqual([1, true]);
    const g = new Face(() => 0.5);
    const before = JSON.stringify(g);
    pose(g, "normal");
    expect(JSON.stringify(g)).toBe(before);
  });
});
