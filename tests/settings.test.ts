import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings } from "../src/settings";

describe("settings", () => {
  it("start at gentle defaults", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("not json")).toEqual(DEFAULT_SETTINGS);
  });
  it("keep volumes between 0 and 1, filling in anything missing", () => {
    expect(parseSettings(JSON.stringify({ music: 0.3, effects: 2 }))).toEqual({
      music: 0.3,
      effects: 1,
    });
    expect(parseSettings(JSON.stringify({ music: -1 }))).toEqual({
      music: 0,
      effects: DEFAULT_SETTINGS.effects,
    });
  });
});
