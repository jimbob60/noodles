// Phase 27 gate: "a day in the life". Plays everything in one session on a tablet-sized screen,
// then closes and reopens the game and checks nothing was lost. Fails on any page error or a
// broken expectation. Run after `npm run build` with `npm run day`.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { preview } from "vite";

const { chromium } = createRequire(import.meta.url)("playwright");
const W = 1280;
const H = 800;
const R = Math.max(24, Math.min(34, Math.min(W, H) * 0.042)); // tray bubble radius
const GAP = R * 0.55;
const checks = [];
const check = (ok, what) => {
  checks.push({ ok, what });
  console.log(`${ok ? "✓" : "✗"} ${what}`);
};

const server = await preview({ preview: { port: 4300, strictPort: false }, logLevel: "silent" });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true });
await ctx.clock.install({ time: new Date(2026, 10, 9, 10, 0).getTime() });
const errors = [];
let p;

const open = async () => {
  p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(url);
  await p.clock.runFor(500);
  await p.waitForSelector("body[data-ready]");
  await p.clock.runFor(500);
};
const data = (k) => p.evaluate((key) => document.body.dataset[key] ?? "", k);
const num = async (k) => Number(await data(k)) || 0;
const pos = async (k) => (await data(k)).split(",").map(Number);
const step = (ms = 33) => p.clock.runFor(ms);
const save = async () => {
  await p.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  return p.evaluate(() => JSON.parse(localStorage.getItem("noodle-dragons.save")));
};
const tap = async (x, y) => {
  await p.mouse.move(x, y);
  await p.mouse.down();
  await step();
  await p.mouse.up();
  await step(100);
};
const drag = async (from, path, holdFrames = 0) => {
  await p.mouse.move(from.x, from.y);
  await p.mouse.down();
  await step();
  for (const q of path) {
    await p.mouse.move(q.x, q.y);
    await step();
  }
  for (let i = 0; i < holdFrames; i++) await step();
  await p.mouse.up();
  await step(100);
};
const line = (a, b, n = 10) =>
  Array.from({ length: n }, (_, i) => ({
    x: a.x + ((b.x - a.x) * (i + 1)) / n,
    y: a.y + ((b.y - a.y) * (i + 1)) / n,
  }));
const topButton = (i) => ({ x: W - 32, y: 44 + i * 46 + 18 }); // 0 backup, 1 decorate, 2 shop, 3 game, 4 closet, 5 camera, 6 family
const foodSlot = (i) => ({ x: 14 + R + i * (2 * R + GAP), y: H - 14 - R });
const ball = { x: W - 14 - R, y: H - 14 - R };
const sponge = { x: W - 14 - R - (2 * R + GAP), y: H - 14 - R - (2 * R + GAP) };
const moon = { x: W - 14 - R, y: H - 14 - R - (2 * R + GAP) };

await open();
// A brand-new player starts with an egg: warm it by rubbing, then tap three times to hatch it.
check((await data("egg")).startsWith("warming"), "a new player starts with an egg");
check(
  (await p.evaluate(() => localStorage.getItem("noodle-dragons.save"))) === null,
  "nothing is saved before it hatches",
);
const eggAt = { x: W / 2, y: H * 0.62 };
await drag(
  eggAt,
  Array.from({ length: 130 }, (_, i) => ({ x: eggAt.x + Math.sin(i / 3) * 40, y: eggAt.y })),
);
console.log(`  (egg after rubbing: ${await data("egg")})`);
for (let c = 0; c < 3; c++) {
  await tap(eggAt.x, eggAt.y - 10);
  console.log(`  (egg after tap ${c + 1}: ${await data("egg")})`);
  await step(400);
}
await step(4000);
check((await data("egg")) === "hatched", "the egg hatches into the dragon");
// Naming: a card pops up with a suggestion; type a name and press the button.
check((await p.$("#name-panel input")) !== null, "a name card pops up after hatching");
await p.fill("#name-panel input", "Biscuit");
await p.click("#name-panel >> text=That's the one");
await step(200);
check((await data("name")) === "Biscuit", "the new dragon is named Biscuit");
const fresh = await save();
check(fresh.version >= 10, `a new dragon starts and saves (save version ${fresh.version})`);
check(
  fresh.identity.name === "Biscuit" &&
    Math.abs(fresh.identity.birthday - (await p.evaluate(() => Date.now()))) < 60_000,
  "its name and hatch day are saved",
);
// The profile card: tap the name badge under the coins.
await tap(40, 160);
await p.waitForSelector("#profile-panel");
check(
  (await p.textContent("#profile-name")) === "Biscuit" &&
    (await p.textContent("#profile-panel")).includes("Hatched today"),
  "tapping the name badge opens its profile card",
);
await p.click("#profile-panel >> text=✕");
await step(200);
check(
  (await data("stage")) === "baby" && fresh.growth.hours < 0.1,
  `it hatches as a little baby (${await data("length")} spine points)`,
);
check((await num("coins")) === 10, "the daily hello gives 10 coins");

// Morning care: a new dragon is nearly full (90%), so one snack fills it, and a second gets a
// polite "no thanks".
for (const i of [0, 1]) {
  const before = await num("fed");
  await drag(foodSlot(i), line(foodSlot(i), { x: 640, y: 420 }), 150);
  const ate = (await num("fed")) > before;
  check(
    i === 0 ? ate : !ate,
    i === 0 ? "a snack is eaten" : "a full dragon says no thanks to more",
  );
  await step(800);
}

// A good petting along the body.
const [bx, by] = await pos("body");
await drag(
  { x: bx, y: by },
  Array.from({ length: 90 }, (_, i) => ({ x: bx + Math.sin(i / 4) * 40, y: by })),
);
check((await save()).needs.values.happiness > fresh.needs.values.happiness, "petting raises Love");

// Ball time.
await drag(ball, line(ball, { x: 700, y: 300 }, 4));
let boops = 0;
for (let i = 0; i < 400; i++) {
  await step();
  boops = Math.max(boops, Number(await data("boops")) || 0);
}
check(boops > 0, `the dragon chases and boops the ball (${boops} boops)`);

// Bath: scrub along the body until squeaky clean.
const before = (await save()).needs.values.cleanliness;
const [cx, cy] = await pos("body");
await drag(sponge, [
  ...line(sponge, { x: cx, y: cy }),
  ...Array.from({ length: 150 }, (_, i) => ({
    x: cx + Math.sin(i / 3) * 60,
    y: cy + Math.cos(i / 5) * 10,
  })),
]);
check((await save()).needs.values.cleanliness >= before, "the bath keeps it clean");

// Shopping: a lantern for the den.
const coinsBefore = await num("coins");
await tap(topButton(2).x, topButton(2).y);
await p.waitForSelector("#shop-panel");
await p.click("#shop-panel >> text=Paper lantern >> xpath=.. >> button");
await p.click("#shop-panel >> text=✕");
await step(200);
check((await num("coins")) === coinsBefore - 10, "the shop sells a lantern for 10 coins");

// Dressing up: the closet (the fifth corner button). A new dragon can't afford much yet,
// so check it won't sell what you can't pay for.
const coinsBeforeCloset = await num("coins");
await tap(topButton(4).x, topButton(4).y);
await p.waitForSelector("#closet-panel");
const tiles = await p.$$("#closet-panel [data-accessory]");
await p.click('[data-accessory="crown"]');
await step(100);
check(
  tiles.length === 30 &&
    (await num("coins")) === coinsBeforeCloset &&
    (await data("outfit")) === "",
  `the closet opens with 30 accessories, and won't sell a crown for 80 with ${coinsBeforeCloset} coins`,
);
await p.click("#closet-panel >> text=✕");
await step(200);

// Photo mode (the sixth corner button): hold still, grin, snap and save a picture.
await tap(topButton(5).x, topButton(5).y);
await p.waitForSelector("#photo-bar");
await p.click("#photo-bar >> text=Hold still");
await p.click('#photo-bar [aria-label="Face: happy"]');
await step(100);
await p.click("#photo-bar >> text=Snap");
await p.waitForSelector("#photo-preview img");
const [download] = await Promise.all([
  p.waitForEvent("download"),
  p.click("#photo-preview >> text=Save"),
]);
const photoName = download.suggestedFilename();
check(
  /^biscuit-\d{4}-\d{2}-\d{2}-\d{4}\.png$/.test(photoName),
  `a photo saves to the device (${photoName})`,
);
await p.click("#photo-preview >> text=Another");
await p.click('#photo-bar [aria-label="Done"]');
await step(200);
check((await data("photo")) === "off", "leaving photo mode brings the buttons back");

// The family (the seventh corner button): just Biscuit so far, and an egg costs more coins
// than a brand-new player has.
await tap(topButton(6).x, topButton(6).y);
await p.waitForSelector("#family-panel");
check(
  (await p.$$("#family-panel [data-member]")).length === 1 &&
    (await p.textContent('#family-panel [data-member="0"]')).includes("Biscuit") &&
    (await p.isDisabled("#adopt-surprise")),
  "the family card shows Biscuit, and an egg can't be adopted without enough coins",
);
await p.click("#family-panel >> text=✕");
await step(200);

// Decorating: place it in the den.
await tap(topButton(1).x, topButton(1).y);
const slotY = 112 + Math.max(22, Math.min(30, 800 * 0.04)) * 1.4;
await drag({ x: 640, y: slotY }, line({ x: 640, y: slotY }, { x: 380, y: 330 }));
await tap(topButton(1).x, topButton(1).y);
const placed = await save();
check(
  placed.decor.some((d) => d.kind === "lantern"),
  "the lantern is placed in the den",
);

// Noodle Catch, played by a bot that steers under the lowest falling dumpling.
const coinsBeforeGame = await num("coins");
await tap(topButton(3).x, topButton(3).y);
await step(3200);
await p.mouse.move(640, 600);
await p.mouse.down();
let mx = 640;
let my = 600;
for (let i = 0; i < 46 * 30; i++) {
  const t = await data("target");
  if (t) {
    const [tx, ty] = t.split(",").map(Number);
    mx += (tx - mx) * 0.35;
    my += (Math.min(ty + 60, 660) - my) * 0.35;
  }
  await p.mouse.move(mx, my);
  await step();
}
await p.mouse.up();
await step(1200);
const score = await num("catchScore");
await tap(640, 400);
check(score > 0, `Noodle Catch round played (score ${score})`);
check((await num("coins")) > coinsBeforeGame, "the round pays coins");

// Evening: bedtime until it wakes up rested.
const evening0 = await save();
console.log(`  (energy before bed: ${evening0.needs.values.energy.toFixed(0)})`);
await tap(moon.x, moon.y);
check((await save()).needs.inBed === true, "the moon button starts bedtime");
let asleep = false;
for (let s = 0; s < 40 && !asleep; s++) {
  await step(1000);
  asleep = (await data("mood")) === "asleep";
}
check(asleep, "curls up asleep on the cushion");
let woke = false;
for (let s = 0; s < 400 && !woke; s++) {
  await step(1000);
  woke = (await data("mood")) !== "asleep";
}
check(woke, "wakes up by itself when rested");

// Speed: frames per second over a few seconds of normal play.
const fps = await p.evaluate(
  () =>
    new Promise((resolve) => {
      let n = 0;
      const t0 = performance.now();
      const f = () =>
        ++n === 90
          ? resolve(Math.round(90000 / (performance.now() - t0)))
          : requestAnimationFrame(f);
      requestAnimationFrame(f);
    }),
);
console.log(`  (frame rate in this test browser: ${fps} fps)`);

// Close and reopen: everything should still be there.
const evening = await save();
mkdirSync("screenshots", { recursive: true });
await p.screenshot({ path: "screenshots/day-in-the-life.png" });
await p.close();
await open();
const morning = await save();
check(
  morning.seed === evening.seed && morning.identity.name === "Biscuit",
  "same dragon after reopening (still called Biscuit)",
);
check(JSON.stringify(morning.decor) === JSON.stringify(evening.decor), "decorations kept");
check(morning.version >= 12 && morning.family.length === 0, "still a family of one");
check(morning.wallet.coins === evening.wallet.coins, `coins kept (${morning.wallet.coins})`);
check(
  morning.stash.bestCatch === evening.stash.bestCatch,
  `best catch kept (${morning.stash.bestCatch})`,
);
check(
  morning.growth.hours >= evening.growth.hours && evening.growth.hours > 0,
  `growing up kept (${(evening.growth.hours * 60).toFixed(0)} minutes of good care so far)`,
);

// A long night away (36 h): gentle needs, nothing lost.
await p.close();
await ctx.clock.fastForward(36 * 3_600_000);
await open();
const later = await save();
check(
  Object.values(later.needs.values).every((v) => v >= 15),
  "a day and a half away: every need above the cozy floor",
);
check(
  later.seed === evening.seed && later.decor.length === evening.decor.length,
  "still the same dragon and den",
);
check(
  later.growth.hours >= morning.growth.hours,
  `it never shrinks while you're away (${later.growth.hours.toFixed(1)} h grown, ${await data("stage")})`,
);

await browser.close();
await server.close();
check(
  errors.length === 0,
  `no errors in the page${errors.length ? `: ${errors.join(" | ")}` : ""}`,
);
const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
