// Builds are checked by eye: serve dist/, open it in headless Chromium as a tablet, save a screenshot,
// and fail if the page logs any error.
import { createRequire } from "node:module";
import { preview } from "vite";
import { mkdirSync } from "node:fs";

// Playwright is installed on the build machine, not as a project dependency.
const { chromium } = createRequire(import.meta.url)("playwright");

const server = await preview({ preview: { port: 4173, strictPort: false }, logLevel: "silent" });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const errors = [];
try {
  mkdirSync("screenshots", { recursive: true });
  const views = [
    { name: "tablet-landscape", width: 1280, height: 800 },
    { name: "tablet-portrait", width: 800, height: 1280 },
  ];
  for (const v of views) {
    const page = await browser.newPage({
      viewport: { width: v.width, height: v.height },
      hasTouch: true,
    });
    page.on("pageerror", (e) => errors.push(`${v.name}: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`${v.name}: ${m.text()}`));
    await page.goto(url);
    await page.waitForSelector("body[data-ready]", { timeout: 10000 });
    await page.waitForTimeout(200);
    // Drag a "finger" across the screen so the screenshot shows the dot following it.
    await page.mouse.move(v.width * 0.3, v.height * 0.8);
    await page.mouse.down();
    await page.mouse.move(v.width * 0.7, v.height * 0.65, { steps: 20 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `screenshots/${v.name}.png` });
    await page.mouse.up();
    await page.close();
    console.log(`saved screenshots/${v.name}.png`);
  }
} finally {
  await browser.close();
  await server.close();
}
if (errors.length) {
  console.error("Errors in the page:\n" + errors.join("\n"));
  process.exit(1);
}
