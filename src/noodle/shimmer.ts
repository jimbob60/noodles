import { bodyProfile } from "./body";
import { forwardAt } from "./legs";
import { hsl, seededRandom, type DragonLook } from "./look";
import type { Point } from "./spine";

/** A four-pointed twinkle. */
export function sparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  if (r <= 0.3) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

/**
 * The rare patterns: twinkling stars, a rainbow running from neck to tail, or big koi-fish
 * patches. The caller has already clipped to the body outline.
 */
export function drawRarePattern(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  look: DragonLook,
  time: number,
): void {
  const n = p.length;
  const widthAt = (i: number) => hw * bodyProfile(i / (n - 1));
  const dark = look.body.l < 35;

  if (look.patternKind === "rainbow") {
    // Starts at the body's own color behind the head and goes all the way round the wheel.
    for (let i = 2; i < n - 1; i++) {
      const t = (i - 2) / (n - 3);
      const hue = (look.body.h + t * 320) % 360;
      const alpha = Math.min(1, t * 7);
      ctx.strokeStyle = `hsl(${hue.toFixed(0)} ${dark ? 75 : 92}% ${dark ? 50 : 72}% / ${alpha.toFixed(2)})`;
      ctx.lineWidth = widthAt(i) * 2.4;
      ctx.beginPath();
      ctx.moveTo(p[i].x, p[i].y);
      ctx.lineTo(p[i + 1].x, p[i + 1].y);
      ctx.stroke();
    }
    return;
  }

  if (look.patternKind === "koi") {
    // Big soft patches in two colors, each dragon's laid out its own way.
    const r = seededRandom(look.seed ^ 0x6b6f69);
    const cream = dark ? "hsl(40 60% 86%)" : "hsl(40 100% 96%)";
    for (let i = 3; i < n - 2; i += 3) {
      const f = forwardAt(p, i);
      const w = widthAt(i);
      const side = r() < 0.5 ? 1 : -1;
      const big = 0.8 + r() * 0.6;
      const lean = (r() - 0.5) * 0.8;
      ctx.fillStyle = (i / 3) % 2 < 1 ? cream : hsl(look.pattern);
      ctx.beginPath();
      ctx.ellipse(
        p[i].x - f.y * w * 0.45 * side,
        p[i].y + f.x * w * 0.45 * side,
        w * 1.15 * big,
        w * 0.7 * big,
        Math.atan2(f.y, f.x) + lean,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    return;
  }

  // Stars: bright twinkles (with a darker edge so they show on any body), zig-zagging down.
  for (let i = 3; i < n - 2; i += 2) {
    const f = forwardAt(p, i);
    const side = (i / 2) % 2 < 1 ? 1 : -1;
    const w = widthAt(i);
    const x = p[i].x - f.y * w * 0.4 * side;
    const y = p[i].y + f.x * w * 0.4 * side;
    const twinkle = 0.7 + 0.3 * Math.sin(time * 2.4 + i * 1.9);
    if (!dark) sparkle(ctx, x, y, w * 0.78, hsl(look.pattern));
    sparkle(ctx, x, y, w * 0.6 * twinkle, "hsl(50 100% 93%)");
  }
}

/**
 * The shimmer on a rare dragon's body: a pearl's soft rainbow sheen, and a bright glint that
 * sweeps from nose to tail every few seconds. The caller has already clipped to the body.
 */
export function drawGlint(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  look: DragonLook,
  time: number,
): void {
  const n = p.length;
  const widthAt = (i: number) => hw * bodyProfile(i / (n - 1)) * 2.4;
  ctx.lineCap = "butt";
  if (look.finish === "pearl") {
    for (let i = 1; i < n - 1; i++) {
      ctx.strokeStyle = `hsl(${((i * 24 + time * 30) % 360).toFixed(0)} 95% 78% / 0.26)`;
      ctx.lineWidth = widthAt(i);
      ctx.beginPath();
      ctx.moveTo(p[i].x, p[i].y);
      ctx.lineTo(p[i + 1].x, p[i + 1].y);
      ctx.stroke();
    }
  }
  // The glint: one sweep, then a little pause. Each dragon keeps its own time.
  const u = (time * 0.4 + (look.seed % 97) / 40) % 1.6;
  const centre = u * (n + 6) - 3;
  const reach = 3.4;
  const tint =
    look.finish === "golden"
      ? "255,246,190"
      : look.finish === "midnight"
        ? "175,205,255"
        : "255,255,255";
  for (let i = Math.max(0, Math.floor(centre - reach)); i < Math.min(n - 1, centre + reach); i++) {
    const d = Math.abs(i + 0.5 - centre) / reach;
    if (d >= 1) continue;
    ctx.strokeStyle = `rgba(${tint},${(0.62 * (1 - d) * (1 - d)).toFixed(3)})`;
    ctx.lineWidth = widthAt(i);
    ctx.beginPath();
    ctx.moveTo(p[i].x, p[i].y);
    ctx.lineTo(p[i + 1].x, p[i + 1].y);
    ctx.stroke();
  }
  ctx.lineCap = "round";
}

/** Little twinkles that pop up beside a rare dragon's body, a few at a time. */
export function drawSparkles(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  look: DragonLook,
  time: number,
): void {
  const n = p.length;
  const color = look.finish === "golden" ? "rgba(255,238,160,0.95)" : "rgba(255,255,255,0.95)";
  for (let k = 0; k < 5; k++) {
    const cycle = time * 0.85 + k * 0.37 + (look.seed % 13);
    const turn = Math.floor(cycle);
    // Each twinkle picks a new spot along the body every time it comes round.
    const where = (Math.abs(Math.sin(turn * 12.9898 + k * 78.233)) * 43758.5453) % 1;
    const i = 2 + Math.floor(where * (n - 4));
    const side = (turn + k) % 2 ? 1 : -1;
    const f = forwardAt(p, i);
    const out = hw * bodyProfile(i / (n - 1)) + hw * 0.4;
    const size = hw * 0.46 * Math.sin((cycle - turn) * Math.PI);
    sparkle(ctx, p[i].x - f.y * out * side, p[i].y + f.x * out * side, size, color);
  }
}
