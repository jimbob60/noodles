import { describe, expect, it } from "vitest";
import { FORM, prefilledLink } from "../src/ui/helpPanel";

describe("the feedback form", () => {
  it("is hooked up to Jacob's Google Form, every question with its own field", () => {
    expect(FORM.id).toMatch(/^1FAIpQL/);
    const ids = Object.values(FORM.entry);
    expect(ids.every((v) => /^\d+$/.test(v))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fills in a link with the answers", () => {
    const link = new URL(prefilledLink({ kind: "bug", bug: "the cat vanished", log: "build x" }));
    expect(link.pathname).toBe(`/forms/d/e/${FORM.id}/viewform`);
    expect(link.searchParams.get(`entry.${FORM.entry.kind}`)).toBe("bug");
    expect(link.searchParams.get(`entry.${FORM.entry.bug}`)).toBe("the cat vanished");
    expect(link.searchParams.get(`entry.${FORM.entry.rating}`)).toBeNull();
  });
});
