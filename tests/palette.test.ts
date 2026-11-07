import { describe, expect, it } from "vitest";
import { palette } from "../src/palette";

describe("palette", () => {
  it("only holds valid hex colors", () => {
    for (const color of Object.values(palette)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
