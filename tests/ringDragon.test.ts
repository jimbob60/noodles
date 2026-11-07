import { describe, expect, it } from "vitest";
import { bodyThickness } from "../src/ringDragon";

describe("ring dragon body", () => {
  it("is chubby at the head and thin at the tail", () => {
    expect(bodyThickness(0, 10)).toBeGreaterThan(bodyThickness(0.5, 10));
    expect(bodyThickness(0.5, 10)).toBeGreaterThan(bodyThickness(1, 10));
    expect(bodyThickness(1, 10)).toBeGreaterThan(0);
  });
});
