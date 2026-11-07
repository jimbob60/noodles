import "@fontsource/pacifico/latin-400.css";
import { palette } from "./palette";
import { drawTitle, TITLE_FONT } from "./title";

// Title placeholder until the real game loop arrives in phase 5.
const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

/** Fixed star positions (0–1 of the screen), so the sky looks the same every time. */
const stars = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1;
  return { x: r(1), y: r(2), size: 0.6 + r(3) * 1.6, alpha: 0.3 + r(4) * 0.6 };
});

function draw(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = window.innerWidth;
  const h = window.innerHeight;
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

window.addEventListener("resize", draw);
// Wait for the fancy font so the first frame isn't drawn in a plain one.
document.fonts.load(`80px "${TITLE_FONT}"`).finally(() => {
  draw();
  document.body.dataset.ready = "true";
});
