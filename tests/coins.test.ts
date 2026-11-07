import { describe, expect, it } from "vitest";
import { DAILY_SOFT_CAP, earn, emptyWallet, parseWallet, REWARD, spend } from "../src/care/coins";
import { decodeBackup, encodeBackup, makeSave, parseSave } from "../src/save/saveGame";
import { freshNeeds } from "../src/care/needs";

const DAY1 = new Date(2026, 10, 7, 12).getTime();
const DAY2 = new Date(2026, 10, 8, 9).getTime();

describe("noodle coins", () => {
  it("are earned by care and play", () => {
    let w = emptyWallet();
    for (const r of ["snack", "petting", "boop", "bath"] as const) w = earn(w, r, DAY1).wallet;
    expect(w.coins).toBe(REWARD.snack + REWARD.petting + REWARD.boop + REWARD.bath);
  });

  it("give the hello bonus once a day", () => {
    let w = earn(emptyWallet(), "hello", DAY1).wallet;
    expect(earn(w, "hello", DAY1 + 3_600_000).earned).toBe(0);
    w = earn(w, "hello", DAY2).wallet;
    expect(w.coins).toBe(REWARD.hello * 2);
  });

  it("slow down after a lot in one day, and reset the next day", () => {
    let w = emptyWallet();
    while (w.today < DAILY_SOFT_CAP) w = earn(w, "bath", DAY1).wallet;
    expect(earn(w, "bath", DAY1).earned).toBe(Math.ceil(REWARD.bath / 2));
    expect(earn(w, "bath", DAY2).earned).toBe(REWARD.bath);
  });

  it("can be spent, but never more than you have", () => {
    const w = { ...emptyWallet(), coins: 20 };
    expect(spend(w, 15)?.coins).toBe(5);
    expect(spend(w, 25)).toBeNull();
    expect(spend(w, -3)).toBeNull();
  });

  it("are saved, survive backup codes, and junk is ignored", () => {
    const wallet = { coins: 42, today: 12, day: "2026-11-07", helloDay: "2026-11-07" };
    const save = makeSave(5, freshNeeds(DAY1), DAY1, [], wallet);
    expect(parseSave(JSON.parse(JSON.stringify(save)), DAY1)?.wallet).toEqual(wallet);
    expect(decodeBackup(encodeBackup(save), DAY1)?.wallet).toEqual(wallet);
    expect(parseSave({ version: 2, seed: 5, decor: [] }, DAY1)?.wallet.coins).toBe(0);
    expect(parseWallet({ coins: -5, today: "x", day: "yesterday" })).toEqual(emptyWallet());
  });
});
