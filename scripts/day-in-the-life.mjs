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
const topButton = (i) => ({ x: W - 32, y: 44 + i * 46 + 18 }); // 0 backup, 1 decorate, 2 shop, 3 game
const foodSlot = (i) => ({ x: 14 + R + i * (2 * R + GAP), y: H - 14 - R });
const ball = { x: W - 14 - R, y: H - 14 - R };
const sponge = { x: W - 14 - R - (2 * R + GAP), y: H - 14 - R - (2 * R + GAP) };
const moon = { x: W - 14 - R, y: H - 14 - R - (2 * R + GAP) };

await open();
const fresh = await save();
check(fresh.version >= 7, `a new dragon starts and saves (save version ${fresh.version})`);
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
check(morning.seed === evening.seed, "same dragon after reopening");
check(JSON.stringify(morning.decor) === JSON.stringify(evening.decor), "decorations kept");
check(morning.wallet.coins === evening.wallet.coins, `coins kept (${morning.wallet.coins})`);
check(
  morning.stash.bestCatch === evening.stash.bestCatch,
  `best catch kept (${morning.stash.bestCatch})`,
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

await browser.close();
await server.close();
check(
  errors.length === 0,
  `no errors in the page${errors.length ? `: ${errors.join(" | ")}` : ""}`,
);
const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
