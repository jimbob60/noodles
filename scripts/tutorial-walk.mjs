// Phase 45: walks a brand-new player through all of Shelly's tutorial, on a tablet and on a
// phone, doing each thing she asks (rub, hatch, name, swim, feed, pet, play, then "Got it").
// At every step it checks the bubble never covers what she's pointing at, and saves a picture.
// Run after `npm run build` with `npm run tutorial`.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { preview } from "vite";

const { chromium } = createRequire(import.meta.url)("playwright");
const checks = [];
const check = (ok, what) => {
  checks.push({ ok, what });
  console.log(`${ok ? "✓" : "✗"} ${what}`);
};
mkdirSync("screenshots", { recursive: true });
const server = await preview({ preview: { port: 4301, strictPort: false }, logLevel: "silent" });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch();

for (const [name, W, H] of [
  ["tablet", 1280, 800],
  ["phone", 390, 844],
]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true });
  await ctx.clock.install({ time: new Date(2026, 10, 9, 10, 0).getTime() });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(url);
  await p.clock.runFor(500);
  await p.waitForSelector("body[data-ready]");
  const step = (ms = 33) => p.clock.runFor(ms);
  const data = (k) => p.evaluate((key) => document.body.dataset[key] ?? "", k);
  const drag = async (from, path, hold = 0) => {
    await p.mouse.move(from.x, from.y);
    await p.mouse.down();
    await step();
    for (const q of path) {
      await p.mouse.move(q.x, q.y);
      await step();
    }
    for (let i = 0; i < hold; i++) await step();
    await p.mouse.up();
    await step(100);
  };
  const line = (a, b, n = 20) =>
    Array.from({ length: n }, (_, i) => ({
      x: a.x + ((b.x - a.x) * (i + 1)) / n,
      y: a.y + ((b.y - a.y) * (i + 1)) / n,
    }));
  const R = Math.max(24, Math.min(34, Math.min(W, H) * 0.042));
  const head = async () => (await data("head")).split(",").map(Number);
  /** Does Shelly's bubble cover this point (with a little room)? */
  const covers = async (pt) => {
    const r = await p.evaluate(() => {
      const b = document.getElementById("tutorial")?.getBoundingClientRect();
      return b ? { l: b.left, t: b.top, r: b.right, b: b.bottom } : null;
    });
    return !!r && pt.x > r.l - 20 && pt.x < r.r + 20 && pt.y > r.t - 20 && pt.y < r.b + 20;
  };
  const shot = (id) => p.screenshot({ path: `screenshots/tutorial-${name}-${id}.png` });
  const clear = async (id, pt) => {
    await step(500); // the bubble glides over
    check(!(await covers(pt)), `${name}: Shelly's bubble keeps clear of the ${id}`);
    await shot(id);
  };

  // If anything goes wrong, say which step it was on (rather than just timing out).
  try {
    await p.click("#title-play");
    await step(700);
    check((await data("tutorial")) === "warm", `${name}: Shelly says hello`);
    const egg = { x: W / 2, y: H * 0.62 };
    await clear("egg", egg);
    await drag(
      egg,
      Array.from({ length: 130 }, (_, i) => ({ x: egg.x + Math.sin(i / 3) * 40, y: egg.y })),
    );
    for (let c = 0; c < 4; c++) {
      await p.mouse.click(egg.x, egg.y - 10);
      await step(450);
    }
    await step(4000);
    await p.waitForSelector("#name-panel input", { timeout: 8000 });
    await p.fill("#name-panel input", "Mochi");
    await p.click("#name-panel >> text=That's the one");
    await step(300);
    check((await data("tutorial")) === "swim", `${name}: after naming, swim`);
    await drag(
      { x: W * 0.3, y: H * 0.45 },
      Array.from({ length: 80 }, (_, i) => ({
        x: W * 0.3 + Math.abs(((i * 12) % (W * 0.8)) - W * 0.4),
        y: H * 0.45 + Math.sin(i / 4) * 60,
      })),
    );
    check((await data("tutorial")) === "feed", `${name}: after swimming, feed`);
    const food = { x: 14 + R + (2 * R + R * 0.55), y: H - 14 - R };
    await clear("food tray", food);
    for (let i = 0; i < 3 && (await data("tutorial")) === "feed"; i++) {
      const [hx, hy] = await head();
      await drag(food, line(food, { x: hx, y: hy }), 150);
      await step(800);
    }
    check((await data("tutorial")) === "pet", `${name}: after a snack, pet`);
    for (let i = 0; i < 4 && (await data("tutorial")) === "pet"; i++) {
      const [bx, by] = (await data("body")).split(",").map(Number);
      await drag(
        { x: bx, y: by },
        Array.from({ length: 90 }, (_, k) => ({ x: bx + Math.sin(k / 4) * 40, y: by })),
      );
      await step(300);
    }
    check((await data("tutorial")) === "play", `${name}: after a purr, play`);
    const ball = { x: W - 14 - R, y: H - 14 - R };
    await clear("toys", ball);
    // Throw the ball toward the dragon and let them play.
    const [hx, hy] = await head();
    await drag(ball, line(ball, { x: hx, y: hy }, 4));
    for (let i = 0; i < 300 && (await data("tutorial")) === "play"; i++) await step();
    check((await data("tutorial")) === "orbs", `${name}: after playing, it moves on (not stuck!)`);
    const targets = {
      orbs: { x: Math.min(150, W * 0.3), y: 44 },
      goals: { x: 68, y: 222 },
      moon: { x: W - 14 - R, y: H - 14 - R - (2 * R + R * 0.55) },
      menu: { x: W - 32, y: 44 + 2 * 46 + 18 },
    };
    for (const [id, pt] of Object.entries(targets)) {
      check((await data("tutorial")) === id, `${name}: Shelly explains the ${id}`);
      await clear(id, pt);
      await p.click("#tutorial-ok");
      await step(200);
    }
    check((await data("tutorial")) === "bye", `${name}: and says goodbye`);
    await p.click("#tutorial-ok");
    await step(300);
    check(
      (await data("tutorial")) === "done" && (await p.$("#tutorial")) === null,
      `${name}: the tutorial is finished`,
    );
    await p.waitForSelector("#howto-panel", { timeout: 8000 });
    check(true, `${name}: then the how-to card comes`);
  } catch (e) {
    check(
      false,
      `${name}: stopped at step "${await data("tutorial")}": ${e.message.split("\n")[0]}`,
    );
    await shot("stuck");
  }
  check(
    errors.length === 0,
    `${name}: no errors in the page${errors.length ? `: ${errors[0]}` : ""}`,
  );
  await ctx.close();
}

await browser.close();
await server.close();
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
