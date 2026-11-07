import { describe, expect, it } from "vitest";
import { GREETING } from "../src/title";

describe("title screen", () => {
  it("greets the player as the phase 4 gate asks", () => {
    expect(GREETING).toContain("Hello, Noodle");
  });
});
