import { bodyOutline, bodyProfile, shineLine, traceSmoothLoop } from "./body";
import { forwardAt } from "./legs";
import { CLASSIC_LOOK, hsl, shade, type DragonLook, type Hsl } from "./look";
import type { Point, Spine } from "./spine";

/** Half-width of the chubbiest part, from the spine spacing. */
export function bodyHalfWidth(spine: Spine, chubby = 1): number {
  return spine.segment * 1.95 * chubby;
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
  const hw = bodyHalfWidth(spine, look.chubby) * puff;
  const outline = bodyOutline(spine.points, hw);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  traceSmoothLoop(ctx, outline);
  // Soft glowing edge: see-through strokes behind the body, stacked so the glow fades outward
  // (much cheaper than a blur on every frame).
  ctx.strokeStyle = hsl(look.body, Math.min(0.3, 0.13 * look.glow));
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
  ctx.strokeStyle = hsl(rimOf(look.body), look.scaleStrength);
  ctx.lineCap = "round";
  for (let i = 2; i < n - 2; i++) {
    const f = forwardAt(p, i);
    // forwardAt points toward the head; scales open toward the tail.
    const back = Math.atan2(-f.y, -f.x);
    const w = hw * bodyProfile(i / (n - 1));
    const size = Math.max(2, w * 0.42);
    ctx.lineWidth = Math.max(1, size * 0.18);
    const across = i % 2 === 0 ? [-0.62, 0, 0.62] : [-0.31, 0.31];
    // One stroke for the whole row (much cheaper than one per scale).
    const from = back - Math.PI / 2 - 0.35;
    const to = back + Math.PI / 2 + 0.35;
    ctx.beginPath();
    for (const a of across) {
      const x = p[i].x - f.y * w * a;
      const y = p[i].y + f.x * w * a;
      ctx.moveTo(x + Math.cos(from) * size, y + Math.sin(from) * size);
      ctx.arc(x, y, size, from, to);
    }
    ctx.stroke();
  }
}

/**
 * The ridge along the back, from the genes: pointed spikes, round scallops or a flowing sail fin,
 * poking out of the upper edge of the body and shrinking as it thins. Drawn before the body, so
 * the roots tuck in. Where the body runs straight up or down there is no clear "top", so the
 * ridge shrinks away there instead of flipping sides.
 */
export function drawRidge(
  ctx: CanvasRenderingContext2D,
  spine: Spine,
  look: DragonLook = CLASSIC_LOOK,
  puff = 1,
  /** Smaller on a baby: 0.5 just hatched, 1 grown. */
  size = 1,
): void {
  const p = spine.points;
  const n = p.length;
  const hw = bodyHalfWidth(spine, look.chubby) * puff;
  const grow = size * look.ridgeSize;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.fillStyle = hsl(look.accent);
  ctx.strokeStyle = hsl(shade(look.accent, -24, -8));
  ctx.lineWidth = Math.max(1, hw * 0.08);
  // Where the upper edge is at each point, which way is "out" and back, and how tall to be.
  const spots = [];
  for (let i = 2; i < n - 2; i++) {
    const f = forwardAt(p, i);
    let nx = -f.y;
    let ny = f.x;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const up = Math.min(1, -ny * 1.6);
    const w = hw * bodyProfile(i / (n - 1));
    spots.push({
      i,
      f,
      nx,
      ny,
      up,
      w,
      ex: p[i].x + nx * w * 0.8,
      ey: p[i].y + ny * w * 0.8,
      tall: w * 0.75 * up * grow,
    });
  }
  if (look.ridgeStyle === "sail") {
    // One flowing fin: a wavy membrane with darker rays, see-through like a fish's fin.
    const live = spots.filter((q) => q.up >= 0.15);
    ctx.globalAlpha = 0.85;
    for (let k = 0; k < live.length - 1; k++) {
      const a = live[k];
      const b = live[k + 1];
      if (b.i !== a.i + 1) continue;
      const ha = a.tall * (0.85 + 0.25 * Math.sin(a.i * 1.3));
      const hb = b.tall * (0.85 + 0.25 * Math.sin(b.i * 1.3));
      ctx.beginPath();
      ctx.moveTo(a.ex, a.ey);
      ctx.lineTo(a.ex + a.nx * ha - a.f.x * ha * 0.4, a.ey + a.ny * ha - a.f.y * ha * 0.4);
      ctx.lineTo(b.ex + b.nx * hb - b.f.x * hb * 0.4, b.ey + b.ny * hb - b.f.y * hb * 0.4);
      ctx.lineTo(b.ex, b.ey);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const q of live) {
      if (q.i % 2) continue;
      const h = q.tall * (0.85 + 0.25 * Math.sin(q.i * 1.3));
      ctx.beginPath();
      ctx.moveTo(q.ex, q.ey);
      ctx.lineTo(q.ex + q.nx * h - q.f.x * h * 0.4, q.ey + q.ny * h - q.f.y * h * 0.4);
      ctx.stroke();
    }
    return;
  }
  for (const q of spots) {
    if (q.up < 0.15) continue;
    if (look.ridgeStyle === "scallops") {
      // Round bumps, like a row of little petals.
      if (q.i % 2) continue;
      const rr = Math.max(1, q.w * 0.42 * Math.min(1, grow) * Math.max(0.4, q.up));
      ctx.beginPath();
      ctx.arc(q.ex, q.ey, rr * (0.8 + 0.3 * grow), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      continue;
    }
    // Pointed spikes, leaning back toward the tail like fins in the wind.
    const half = q.w * 0.42;
    const tx = q.ex + q.nx * q.tall - q.f.x * q.tall * 0.7;
    const ty = q.ey + q.ny * q.tall - q.f.y * q.tall * 0.7;
    ctx.beginPath();
    ctx.moveTo(q.ex + q.f.x * half, q.ey + q.f.y * half);
    ctx.quadraticCurveTo(q.ex + q.nx * q.tall * 0.7, q.ey + q.ny * q.tall * 0.7, tx, ty);
    ctx.quadraticCurveTo(
      q.ex - q.f.x * half * 0.6,
      q.ey - q.f.y * half * 0.6,
      q.ex - q.f.x * half,
      q.ey - q.f.y * half,
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
