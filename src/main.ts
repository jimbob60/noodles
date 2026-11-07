import "@fontsource/pacifico/latin-400.css";
import { advance, NEED_NAMES } from "./care/needs";
import { loadNeeds, saveNeeds } from "./care/storage";
import { Input } from "./engine/input";
import { startLoop } from "./engine/loop";
import { Screen } from "./engine/screen";
import { Gallery } from "./gallery";
import { Dragon } from "./noodle/dragon";
import { makeLook } from "./noodle/look";
import { palette } from "./palette";
import { NeedsBar } from "./ui/needsBar";
import { drawTitle, TITLE_FONT } from "./title";

/** Fixed star positions (0–1 of the screen), so the sky looks the same every time. */
const stars = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1;
  return { x: r(1), y: r(2), size: 0.6 + r(3) * 1.6, alpha: 0.3 + r(4) * 0.6 };
});

/**
 * The sky, stars and title only change on resize, so they are drawn once into an offscreen
 * canvas and copied each frame (glow effects are too slow to redraw 60 times a second).
 */
function paintBackdrop(screen: Screen, backdrop: HTMLCanvasElement): void {
  const { width: w, height: h, dpr } = screen;
  backdrop.width = Math.round(w * dpr);
  backdrop.height = Math.round(h * dpr);
  const ctx = backdrop.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, palette.night);
  sky.addColorStop(1, palette.dusk);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  drawTitle(ctx, w, h);
}

/** Spine spacing scales with the screen so the noodle is the same size on any tablet. */
function segmentFor(screen: Screen): number {
  return Math.min(22, Math.max(9, Math.min(screen.width, screen.height) / 48));
}

async function main(): Promise<void> {
  // Wait for the fancy font so the title isn't drawn in a plain one.
  await document.fonts.load(`80px "${TITLE_FONT}"`).catch(() => undefined);

  const screen = new Screen(document.getElementById("game") as HTMLCanvasElement);
  const input = new Input(screen.canvas);
  const backdrop = document.createElement("canvas");
  paintBackdrop(screen, backdrop);
  const world = () => ({ width: screen.width, height: screen.height, unit: segmentFor(screen) });
  // A new random look each visit, until saving arrives in phase 21.
  const look = makeLook(Math.floor(Math.random() * 1e9));
  const dragon = new Dragon(
    screen.width / 2,
    screen.height * 0.8,
    segmentFor(screen),
    world(),
    look,
  );
  const gallery = location.hash === "#gallery" ? new Gallery(screen) : null;
  window.addEventListener("hashchange", () => location.reload());
  const debug = location.hash === "#debug";

  // Needs follow the real clock, so they keep changing while the app is closed.
  let needs = loadNeeds(Date.now());
  let sinceSave = 0;
  const needsBar = new NeedsBar();
  const persist = () => saveNeeds(needs);
  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) persist();
  });
  screen.onResize(() => {
    paintBackdrop(screen, backdrop);
    dragon.resize(segmentFor(screen));
  });

  const loop = startLoop({
    update(dt) {
      if (gallery) {
        gallery.update(dt, input);
        return;
      }
      dragon.update(dt, input, world());
      needs = advance(needs, Date.now(), dragon.asleep);
      needsBar.update(dt, needs.values);
      sinceSave += dt;
      if (sinceSave > 5) {
        sinceSave = 0;
        persist();
      }
      // The current mood on the page, so automated checks can find naps and walks.
      const mood = dragon.asleep ? "asleep" : dragon.brain.mode;
      if (document.body.dataset.mood !== mood) document.body.dataset.mood = mood;
    },
    render() {
      const ctx = screen.begin();
      if (gallery) {
        gallery.draw(ctx);
      } else {
        ctx.drawImage(backdrop, 0, 0, screen.width, screen.height);
        dragon.draw(ctx);
        needsBar.draw(ctx, screen.width, screen.height);
      }

      if (debug) {
        // Hidden readout (#debug) until the real needs display arrives in phase 14.
        ctx.font = "13px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        NEED_NAMES.forEach((n, i) => {
          ctx.fillText(`${n} ${needs.values[n].toFixed(2)}`, 10, 80 + i * 18);
        });
      }

      // Build tag and frame rate in the corner, so Jacob can tell which build he is playing.
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillText(
        `build ${__BUILD__} · ${Math.round(loop.fps())} fps`,
        screen.width - 10,
        screen.height - 8,
      );
    },
  });
  document.body.dataset.ready = "true";
}

void main();
