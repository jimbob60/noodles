import "@fontsource/pacifico/latin-400.css";
import { Input } from "./engine/input";
import { startLoop } from "./engine/loop";
import { Screen } from "./engine/screen";
import { Follower } from "./follower";
import { drawBody } from "./noodle/drawBody";
import { Spine } from "./noodle/spine";
import { palette } from "./palette";
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
const SPINE_POINTS = 26;
function segmentFor(screen: Screen): number {
  return Math.min(18, Math.max(8, Math.min(screen.width, screen.height) / 55));
}

async function main(): Promise<void> {
  // Wait for the fancy font so the title isn't drawn in a plain one.
  await document.fonts.load(`80px "${TITLE_FONT}"`).catch(() => undefined);

  const screen = new Screen(document.getElementById("game") as HTMLCanvasElement);
  const input = new Input(screen.canvas);
  const backdrop = document.createElement("canvas");
  paintBackdrop(screen, backdrop);
  const dot = new Follower(screen.width / 2, screen.height * 0.85);
  const spine = new Spine(dot.x, dot.y, SPINE_POINTS, segmentFor(screen));
  screen.onResize(() => {
    paintBackdrop(screen, backdrop);
    spine.resize(segmentFor(screen));
  });
  let idleTime = 0;

  const loop = startLoop({
    update(dt) {
      idleTime += dt;
      if (input.active) {
        dot.update(dt, input.x, input.y);
      } else {
        // Before the first touch, the head swims a lazy figure-eight near the bottom.
        const cx = screen.width / 2 + Math.sin(idleTime * 0.7) * screen.width * 0.22;
        const cy = screen.height * 0.84 + Math.sin(idleTime * 1.4) * screen.height * 0.05;
        dot.update(dt, cx, cy);
      }
      spine.follow(dot.x, dot.y);
    },
    render() {
      const ctx = screen.begin();
      ctx.drawImage(backdrop, 0, 0, screen.width, screen.height);
      drawBody(ctx, spine);

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
