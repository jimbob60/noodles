import { bodyOutline, bodyProfile, shineLine, traceSmoothLoop } from "./body";
import { forwardAt } from "./legs";
import { CLASSIC_LOOK, hsl, shade, type DragonLook, type Hsl } from "./look";
import type { Point, Spine } from "./spine";

/** Half-width of the chubbiest part, from the spine spacing. */
export function bodyHalfWidth(spine: Spine): number {
  return spine.segment * 1.95;
}

/** Darker rim color for a clear, cute outline. */
export const rimOf = (c: Hsl): Hsl => shade(c, -30, -15);

/** A chubby tapered body with a soft glowing edge, its pattern, a rim and a shine. */
export function drawBody(
  ctx: CanvasRenderingContext2D,
  spine: Spine,
  look: DragonLook = CLASSIC_LOOK,
  puff = 1,
): void {
  const hw = bodyHalfWidth(spine) * puff;
  const outline = bodyOutline(spine.points, hw);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  traceSmoothLoop(ctx, outline);
  // Soft glowing edge: see-through strokes behind the body, stacked so the glow fades outward
  // (much cheaper than a blur on every frame).
  ctx.strokeStyle = hsl(look.body, 0.13);
  for (const width of [1.6, 1.0, 0.5]) {
    ctx.lineWidth = hw * width;
    ctx.stroke();
  }
  ctx.fillStyle = hsl(look.body);
  ctx.fill();

  if (look.patternKind !== "plain") {
    ctx.save();
    ctx.clip();
    drawPattern(ctx, spine.points, hw, look);
    ctx.restore();
    traceSmoothLoop(ctx, outline);
  }

  // Fish scales: soft arcs in rows, clipped to the body.
  ctx.save();
  ctx.clip();
  drawScales(ctx, spine.points, hw, look);
  ctx.restore();
  traceSmoothLoop(ctx, outline);

  ctx.strokeStyle = hsl(rimOf(look.body));
  ctx.lineWidth = Math.max(1.5, hw * 0.12);
  ctx.stroke();

  // Shine along the top of the body, so it reads as round rather than flat.
  const shine = shineLine(spine.points, hw);
  ctx.beginPath();
  ctx.moveTo(shine[0].x, shine[0].y);
  for (let i = 1; i < shine.length - 1; i++) {
    const mx = (shine[i].x + shine[i + 1].x) / 2;
    const my = (shine[i].y + shine[i + 1].y) / 2;
    ctx.quadraticCurveTo(shine[i].x, shine[i].y, mx, my);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = hw * 0.28;
  ctx.stroke();
}

/**
 * Fish scales: rows of little arcs that open toward the tail, like an Eastern dragon's. Faint, so
 * the pattern still shows through. The caller has already clipped to the body outline.
 */
function drawScales(ctx: CanvasRenderingContext2D, p: Point[], hw: number, look: DragonLook): void {
  const n = p.length;
  ctx.strokeStyle = hsl(rimOf(look.body), 0.32);
  ctx.lineCap = "round";
  for (let i = 2; i < n - 2; i++) {
    const f = forwardAt(p, i);
    // forwardAt points toward the head; scales open toward the tail.
    const back = Math.atan2(-f.y, -f.x);
    const w = hw * bodyProfile(i / (n - 1));
    const size = Math.max(2, w * 0.42);
    ctx.lineWidth = Math.max(1, size * 0.18);
    const across = i % 2 === 0 ? [-0.62, 0, 0.62] : [-0.31, 0.31];
    for (const a of across) {
      const x = p[i].x - f.y * w * a;
      const y = p[i].y + f.x * w * a;
      ctx.beginPath();
      ctx.arc(x, y, size, back - Math.PI / 2 - 0.35, back + Math.PI / 2 + 0.35);
      ctx.stroke();
    }
  }
}

/**
 * The spiny ridge along the back: pointed fins poking out of the upper edge of the body, sweeping
 * toward the tail and shrinking as it thins. Drawn before the body, so their roots tuck in. Where
 * the body runs straight up or down there is no clear "top", so the fins shrink away there
 * instead of flipping sides.
 */
export function drawRidge(
  ctx: CanvasRenderingContext2D,
  spine: Spine,
  look: DragonLook = CLASSIC_LOOK,
  puff = 1,
): void {
  const p = spine.points;
  const n = p.length;
  const hw = bodyHalfWidth(spine) * puff;
  ctx.lineJoin = "round";
  ctx.fillStyle = hsl(look.accent);
  ctx.strokeStyle = hsl(shade(look.accent, -24, -8));
  ctx.lineWidth = Math.max(1, hw * 0.08);
  for (let i = 2; i < n - 2; i++) {
    const f = forwardAt(p, i);
    // The side normal that points up the screen.
    let nx = -f.y;
    let ny = f.x;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const up = Math.min(1, -ny * 1.6);
    if (up < 0.15) continue;
    const w = hw * bodyProfile(i / (n - 1));
    const tall = w * 0.75 * up;
    const half = w * 0.42;
    const ex = p[i].x + nx * w * 0.8;
    const ey = p[i].y + ny * w * 0.8;
    // Leaning back toward the tail, like a fin in the wind.
    const tx = ex + nx * tall - f.x * tall * 0.7;
    const ty = ey + ny * tall - f.y * tall * 0.7;
    ctx.beginPath();
    ctx.moveTo(ex + f.x * half, ey + f.y * half);
    ctx.quadraticCurveTo(ex + nx * tall * 0.7, ey + ny * tall * 0.7, tx, ty);
    ctx.quadraticCurveTo(
      ex - f.x * half * 0.6,
      ey - f.y * half * 0.6,
      ex - f.x * half,
      ey - f.y * half,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Paints the pattern; the caller has already clipped to the body outline. */
function drawPattern(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  look: DragonLook,
): void {
  const n = p.length;
  const widthAt = (i: number) => hw * bodyProfile(i / (n - 1));
  const color = hsl(look.pattern);

  if (look.patternKind === "gradient") {
    // Head keeps the body color and slides into the pattern color by the tail.
    for (let i = 0; i < n - 1; i++) {
      const t = i / (n - 2);
      ctx.strokeStyle = hsl(mix(look.body, look.pattern, Math.pow(t, 1.3)));
      ctx.lineWidth = widthAt(i) * 2.4;
      ctx.beginPath();
      ctx.moveTo(p[i].x, p[i].y);
      ctx.lineTo(p[i + 1].x, p[i + 1].y);
      ctx.stroke();
    }
    return;
  }

  if (look.patternKind === "stripes") {
    // Bands across the body, from the neck to the tail.
    ctx.strokeStyle = color;
    for (let i = 4; i < n - 1; i += 3) {
      const f = forwardAt(p, i);
      const w = widthAt(i) * 1.3;
      ctx.lineWidth = hw * 0.42 * (1 - (i / n) * 0.5);
      ctx.beginPath();
      ctx.moveTo(p[i].x - f.y * w, p[i].y + f.x * w);
      ctx.lineTo(p[i].x + f.y * w, p[i].y - f.x * w);
      ctx.stroke();
    }
    return;
  }

  if (look.patternKind === "spots") {
    // Round spots zig-zagging from side to side.
    ctx.fillStyle = color;
    for (let i = 3; i < n - 2; i += 2) {
      const f = forwardAt(p, i);
      const side = (i / 2) % 2 < 1 ? 1 : -1;
      const w = widthAt(i);
      ctx.beginPath();
      ctx.arc(
        p[i].x - f.y * w * 0.45 * side,
        p[i].y + f.x * w * 0.45 * side,
        w * 0.38,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    return;
  }

  // Back stripe: one band running down the middle of the back, fading out at the tail.
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  for (let i = 2; i < n - 2; i++) {
    ctx.lineWidth = widthAt(i) * 0.7;
    ctx.beginPath();
    ctx.moveTo(p[i].x, p[i].y);
    ctx.lineTo(p[i + 1].x, p[i + 1].y);
    ctx.stroke();
  }
}

/** Blends two colors (t = 0 gives a, 1 gives b), going the short way round the hue circle. */
export function mix(a: Hsl, b: Hsl, t: number): Hsl {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return { h: (a.h + dh * t + 360) % 360, s: a.s + (b.s - a.s) * t, l: a.l + (b.l - a.l) * t };
}
