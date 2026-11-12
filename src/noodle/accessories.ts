import { ACCESSORY_COLORS, type Wardrobe, type Worn } from "../care/wardrobe";
import { bodyOutline, bodyProfile, traceSmoothLoop } from "./body";
import { bellySide, forwardAt } from "./legs";
import type { Point } from "./spine";

const INK = "rgba(40,20,80,0.65)";
const GOLD = "#ffd96a";
const GOLD_DARK = "#d9a531";
/** Hats are drawn this many times bigger than their sketch, so they read at a glance. */
const HAT = 1.45;

/** A color a bit darker (k < 0) or lighter (k > 0), hex in, rgb out. */
export function tint(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) =>
    Math.round(Math.max(0, Math.min(255, k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Fill, then outline, the current path. */
function paint(ctx: CanvasRenderingContext2D, fill: string): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}

/** A five-pointed star path. */
function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, turn = 0): void {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + turn + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

/** A heart path, point down, centred on (x, y). */
function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.05, x + s * 1.3, y, x, y + s * 0.9);
  ctx.closePath();
}

/** A little flower: five round petals and a gold middle. */
function flower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  petal: string,
  spin = 0,
): void {
  for (let q = 0; q < 5; q++) {
    const a = (q / 5) * Math.PI * 2 + spin;
    dot(ctx, x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.85, petal);
  }
  dot(ctx, x, y, s * 0.6, GOLD);
}

/**
 * A ribbon bow: two puffy loops with a fold line in each, a round knot, and two ribbon ends
 * with a notch cut in them. `along` is the direction the loops spread; `down` where the ends hang.
 */
function bow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  c: string,
  along: Point,
  down: Point,
): void {
  const ax = along.x;
  const ay = along.y;
  const P = (u: number, v: number) => ({
    x: x + ax * u * s + down.x * v * s,
    y: y + ay * u * s + down.y * v * s,
  });
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1.2, s * 0.09);
  ctx.strokeStyle = INK;
  // Ribbon ends first, so the loops sit on top.
  for (const dir of [1, -1]) {
    const a = P(0.05 * dir, 0.1);
    const b = P(0.42 * dir, 1.0);
    const notch = P(0.3 * dir, 0.85);
    const c2 = P(0.2 * dir, 1.08);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(notch.x, notch.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.closePath();
    paint(ctx, tint(c, -0.15));
  }
  for (const dir of [1, -1]) {
    const tip1 = P(1.0 * dir, -0.55);
    const tip2 = P(1.05 * dir, 0.4);
    const o = P(0, 0);
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    const c1 = P(0.35 * dir, -0.75);
    ctx.quadraticCurveTo(c1.x, c1.y, tip1.x, tip1.y);
    const c3 = P(1.35 * dir, 0);
    ctx.quadraticCurveTo(c3.x, c3.y, tip2.x, tip2.y);
    const c4 = P(0.4 * dir, 0.5);
    ctx.quadraticCurveTo(c4.x, c4.y, o.x, o.y);
    ctx.closePath();
    paint(ctx, c);
    // The fold inside each loop.
    const f1 = P(0.25 * dir, -0.05);
    const f2 = P(0.75 * dir, -0.2);
    ctx.beginPath();
    ctx.moveTo(f1.x, f1.y);
    ctx.quadraticCurveTo(P(0.55 * dir, 0.1).x, P(0.55 * dir, 0.1).y, f2.x, f2.y);
    ctx.strokeStyle = tint(c, -0.3);
    ctx.stroke();
    ctx.strokeStyle = INK;
  }
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.24, s * 0.3, Math.atan2(ay, ax), 0, Math.PI * 2);
  paint(ctx, tint(c, -0.2));
  dot(ctx, x - s * 0.06, y - s * 0.08, s * 0.07, "rgba(255,255,255,0.6)");
}

/**
 * Something on the head: a hat, crown, halo, flower crown or hair bow. Drawn in the head's own
 * coordinates (facing right, centre at 0,0, radius r), so it turns, tilts and grows with it.
 */
export function drawHeadWear(ctx: CanvasRenderingContext2D, r: number, worn: Worn, time = 0): void {
  const c = ACCESSORY_COLORS[worn.color] ?? ACCESSORY_COLORS[0];
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = INK;
  if (worn.id === "flowerCrown") {
    // A ring of flowers round the top of the head.
    ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.beginPath();
    ctx.ellipse(-r * 0.05, -r * 0.1, r * 0.98, r * 0.82, 0, Math.PI * 1.08, Math.PI * 1.9);
    ctx.strokeStyle = "#5cc47a";
    ctx.lineWidth = r * 0.08;
    ctx.stroke();
    for (let k = 0; k < 7; k++) {
      const a = Math.PI * 1.1 + k * 0.125 * Math.PI;
      const x = -r * 0.05 + Math.cos(a) * r * 0.98;
      const y = -r * 0.1 + Math.sin(a) * r * 0.82;
      if (k % 2) {
        ctx.fillStyle = "#6fdc8c";
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.05, r * 0.13, r * 0.06, a, 0, Math.PI * 2);
        ctx.fill();
      }
      flower(ctx, x, y, r * 0.09, k % 2 ? "#ffffff" : c, time * 0.3 + k);
    }
    ctx.restore();
    return;
  }
  if (worn.id === "halo") {
    // A glowing golden ring floating above the head, bobbing gently.
    const y = -r * 1.35 + Math.sin(time * 2) * r * 0.05;
    ctx.beginPath();
    ctx.ellipse(-r * 0.1, y, r * 0.62, r * 0.16, -0.1, 0, Math.PI * 2);
    ctx.strokeStyle = tint(c, 0.5);
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = r * 0.28;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = r * 0.11;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = r * 0.035;
    ctx.stroke();
    ctx.restore();
    return;
  }
  // Everything else sits on the crown, tipped back a little, drawn bigger than its sketch.
  ctx.translate(-r * 0.2, -r * 0.8);
  ctx.rotate(-0.2);
  ctx.scale(HAT, HAT);
  const s = r;
  ctx.lineWidth = Math.max(1.2, (r * 0.06) / HAT);
  switch (worn.id) {
    case "hairBow":
      ctx.translate(s * 0.15, s * 0.05);
      bow(ctx, 0, 0, s * 0.32, c, { x: 1, y: 0 }, { x: 0, y: 1 });
      break;
    case "partyHat": {
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, s * 0.05);
      ctx.lineTo(s * 0.02, -s * 0.85);
      ctx.lineTo(s * 0.4, s * 0.05);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.save();
      ctx.clip();
      // Stripes and confetti dots.
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = s * 0.08;
      for (const y of [-0.15, -0.42, -0.68]) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, y * s + s * 0.1);
        ctx.lineTo(s * 0.6, y * s - s * 0.1);
        ctx.stroke();
      }
      ctx.restore();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, s * 0.05, s * 0.42, s * 0.07, 0, 0, Math.PI * 2);
      paint(ctx, tint(c, -0.2));
      // A fluffy pompom on top.
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        dot(
          ctx,
          s * 0.02 + Math.cos(a) * s * 0.07,
          -s * 0.88 + Math.sin(a) * s * 0.07,
          s * 0.07,
          "#ffffff",
        );
      }
      break;
    }
    case "beanie": {
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, s * 0.05);
      ctx.bezierCurveTo(-s * 0.52, -s * 0.62, s * 0.52, -s * 0.62, s * 0.5, s * 0.05);
      ctx.closePath();
      paint(ctx, c);
      ctx.strokeStyle = tint(c, -0.25);
      for (const x of [-0.3, -0.1, 0.1, 0.3]) {
        ctx.beginPath();
        ctx.moveTo(x * s, -s * 0.02);
        ctx.quadraticCurveTo(x * s * 1.05, -s * 0.25, x * s * 0.55, -s * 0.42);
        ctx.stroke();
      }
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.roundRect(-s * 0.56, -s * 0.08, s * 1.12, s * 0.22, s * 0.1);
      paint(ctx, tint(c, -0.18));
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        dot(ctx, Math.cos(a) * s * 0.08, -s * 0.55 + Math.sin(a) * s * 0.08, s * 0.08, "#ffffff");
      }
      break;
    }
    case "chefHat": {
      ctx.beginPath();
      ctx.roundRect(-s * 0.32, -s * 0.3, s * 0.64, s * 0.36, s * 0.04);
      paint(ctx, "#ffffff");
      // The puffy top: three soft clouds.
      ctx.beginPath();
      ctx.arc(-s * 0.25, -s * 0.42, s * 0.2, 0, Math.PI * 2);
      ctx.arc(s * 0.0, -s * 0.55, s * 0.25, 0, Math.PI * 2);
      ctx.arc(s * 0.25, -s * 0.42, s * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-s * 0.25, -s * 0.42, s * 0.2, Math.PI * 0.7, Math.PI * 1.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.0, -s * 0.55, s * 0.25, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.25, -s * 0.42, s * 0.2, Math.PI * 1.3, Math.PI * 2.3);
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.fillRect(-s * 0.32, -s * 0.12, s * 0.64, s * 0.1);
      break;
    }
    case "santaHat": {
      // A floppy cone that droops back, white fur trim and pompom.
      const sway = Math.sin(time * 2.5) * s * 0.04;
      ctx.beginPath();
      ctx.moveTo(-s * 0.45, s * 0.02);
      ctx.quadraticCurveTo(-s * 0.2, -s * 0.85, -s * 0.85 + sway, -s * 0.55);
      ctx.quadraticCurveTo(-s * 0.05, -s * 0.5, s * 0.45, s * 0.02);
      ctx.closePath();
      paint(ctx, c === ACCESSORY_COLORS[0] ? "#ff5a6e" : c);
      ctx.beginPath();
      ctx.roundRect(-s * 0.52, -s * 0.1, s * 1.04, s * 0.22, s * 0.11);
      paint(ctx, "#ffffff");
      dot(ctx, -s * 0.88 + sway, -s * 0.52, s * 0.14, "#ffffff");
      break;
    }
    case "propellerCap": {
      ctx.beginPath();
      ctx.moveTo(-s * 0.45, s * 0.04);
      ctx.bezierCurveTo(-s * 0.45, -s * 0.5, s * 0.45, -s * 0.5, s * 0.45, s * 0.04);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = tint(c, 0.45);
      ctx.fillRect(-s * 0.15, -s * 0.5, s * 0.3, s * 0.6);
      ctx.restore();
      ctx.stroke();
      // The peak sticking out the front.
      ctx.beginPath();
      ctx.ellipse(s * 0.5, s * 0.03, s * 0.28, s * 0.07, 0.1, 0, Math.PI * 2);
      paint(ctx, tint(c, -0.2));
      // The spinning propeller.
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.38);
      ctx.lineTo(0, -s * 0.52);
      ctx.stroke();
      const spin = Math.cos(time * 14);
      for (const dir of [1, -1]) {
        ctx.beginPath();
        ctx.ellipse(
          dir * s * 0.22 * spin,
          -s * 0.54,
          Math.abs(s * 0.22 * spin) + 0.5,
          s * 0.05,
          0,
          0,
          Math.PI * 2,
        );
        paint(ctx, dir > 0 ? "#ffd96a" : "#7af3ff");
      }
      dot(ctx, 0, -s * 0.54, s * 0.05, "#ff8ad8");
      break;
    }
    case "witchHat": {
      const dark = tint(c, -0.55);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.72, s * 0.15, 0, 0, Math.PI * 2);
      paint(ctx, dark);
      ctx.beginPath();
      ctx.moveTo(-s * 0.36, -s * 0.03);
      ctx.quadraticCurveTo(-s * 0.18, -s * 0.6, -s * 0.6, -s * 1.0);
      ctx.quadraticCurveTo(s * 0.12, -s * 0.68, s * 0.36, -s * 0.03);
      ctx.closePath();
      paint(ctx, dark);
      ctx.beginPath();
      ctx.moveTo(-s * 0.34, -s * 0.13);
      ctx.lineTo(s * 0.34, -s * 0.13);
      ctx.strokeStyle = c;
      ctx.lineWidth = s * 0.11;
      ctx.stroke();
      star(ctx, s * 0.0, -s * 0.13, s * 0.08);
      ctx.fillStyle = GOLD;
      ctx.fill();
      break;
    }
    case "cowboyHat": {
      const brown = c === ACCESSORY_COLORS[2] ? "#c98a4b" : tint(c, -0.35);
      ctx.beginPath();
      ctx.moveTo(-s * 0.72, -s * 0.05);
      ctx.quadraticCurveTo(0, s * 0.18, s * 0.72, -s * 0.05);
      ctx.quadraticCurveTo(s * 0.78, -s * 0.18, s * 0.62, -s * 0.12);
      ctx.quadraticCurveTo(0, s * 0.02, -s * 0.62, -s * 0.12);
      ctx.quadraticCurveTo(-s * 0.78, -s * 0.18, -s * 0.72, -s * 0.05);
      ctx.closePath();
      paint(ctx, brown);
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, -s * 0.06);
      ctx.bezierCurveTo(-s * 0.4, -s * 0.62, -s * 0.05, -s * 0.5, 0, -s * 0.42);
      ctx.bezierCurveTo(s * 0.05, -s * 0.5, s * 0.4, -s * 0.62, s * 0.35, -s * 0.06);
      ctx.closePath();
      paint(ctx, brown);
      ctx.fillStyle = tint(c, 0.2);
      ctx.fillRect(-s * 0.34, -s * 0.17, s * 0.68, s * 0.09);
      break;
    }
    case "topHat": {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.6, s * 0.13, 0, 0, Math.PI * 2);
      paint(ctx, "#2a2050");
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, -s * 0.02);
      ctx.lineTo(-s * 0.36, -s * 0.78);
      ctx.quadraticCurveTo(0, -s * 0.84, s * 0.36, -s * 0.78);
      ctx.lineTo(s * 0.32, -s * 0.02);
      ctx.closePath();
      paint(ctx, "#2a2050");
      ctx.fillStyle = c;
      ctx.fillRect(-s * 0.33, -s * 0.24, s * 0.66, s * 0.15);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(-s * 0.24, -s * 0.74, s * 0.08, s * 0.48);
      flower(ctx, s * 0.24, -s * 0.17, s * 0.05, "#ffffff");
      break;
    }
    case "crown": {
      ctx.beginPath();
      ctx.moveTo(-s * 0.42, s * 0.04);
      ctx.lineTo(-s * 0.48, -s * 0.45);
      ctx.lineTo(-s * 0.24, -s * 0.22);
      ctx.lineTo(0, -s * 0.56);
      ctx.lineTo(s * 0.24, -s * 0.22);
      ctx.lineTo(s * 0.48, -s * 0.45);
      ctx.lineTo(s * 0.42, s * 0.04);
      ctx.closePath();
      paint(ctx, GOLD);
      ctx.fillStyle = GOLD_DARK;
      ctx.fillRect(-s * 0.42, -s * 0.06, s * 0.84, s * 0.1);
      for (const [x, y] of [
        [-0.48, -0.47],
        [0, -0.58],
        [0.48, -0.47],
      ])
        dot(ctx, x * s, y * s, s * 0.06, "#ffffff");
      dot(ctx, 0, -s * 0.2, s * 0.09, c);
      dot(ctx, -s * 0.25, -s * 0.12, s * 0.055, c);
      dot(ctx, s * 0.25, -s * 0.12, s * 0.055, c);
      dot(ctx, -s * 0.03, -s * 0.23, s * 0.03, "rgba(255,255,255,0.8)");
      break;
    }
  }
  ctx.restore();
}

/** A spot on the body: the spine point, its forward direction, belly-side normal and width. */
function bodySpot(p: Point[], i: number, hw: number) {
  const k = Math.max(0, Math.min(p.length - 1, i));
  const f = forwardAt(p, k);
  const s = bellySide(p, k);
  const side = Math.abs(s) < 0.2 ? 1 : Math.sign(s);
  // The belly-side normal (pointing down the screen when swimming sideways).
  const n = { x: -f.y * side, y: f.x * side };
  const w = hw * bodyProfile(k / (p.length - 1));
  return { at: p[k], f, n, w };
}

/** A point on the body: `u` along it (toward the head) and `v` across it (toward the belly). */
const onBody = (q: ReturnType<typeof bodySpot>, u: number, v: number): Point => ({
  x: q.at.x + q.f.x * u + q.n.x * v,
  y: q.at.y + q.f.y * u + q.n.y * v,
});

/** The neck: the first spine point clear of the head. */
function neckIndex(p: Point[], headR: number): number {
  let i = 1;
  while (i < p.length - 3 && Math.hypot(p[i].x - p[0].x, p[i].y - p[0].y) < headR * 1.4) i++;
  return i;
}

/** A band right round the body at a spot (a collar, a ring). */
function band(
  ctx: CanvasRenderingContext2D,
  q: ReturnType<typeof bodySpot>,
  width: number,
  color: string,
  shine = true,
  /** The body's outline: the band is clipped to it, so it wraps the body instead of poking out. */
  outline?: Point[],
): void {
  const a = onBody(q, 0, -q.w * 1.2);
  const b = onBody(q, 0, q.w * 1.2);
  ctx.save();
  if (outline) {
    traceSmoothLoop(ctx, outline);
    ctx.clip();
  }
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = INK;
  ctx.lineWidth = width + Math.max(2, width * 0.3);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  if (shine) {
    const a2 = onBody(q, width * 0.18, -q.w * 0.85);
    const b2 = onBody(q, width * 0.18, -q.w * 0.2);
    ctx.beginPath();
    ctx.moveTo(a2.x, a2.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = Math.max(1, width * 0.22);
    ctx.stroke();
  }
  ctx.restore();
}

/** Something round the neck, drawn over the back of the head's mane so it always shows. */
export function drawNeckWear(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  worn: Worn,
  time = 0,
  headR = hw * 1.3,
): void {
  const c = ACCESSORY_COLORS[worn.color] ?? ACCESSORY_COLORS[0];
  const q = bodySpot(p, neckIndex(p, headR), hw);
  // Sized from the body's full width, so neck things read at a glance.
  const w = Math.max(q.w, hw * 0.95);
  const belly = onBody(q, 0, w * 0.95);
  const outline = bodyOutline(p, hw);
  const ring = (at: ReturnType<typeof bodySpot>, width: number, color: string, shine = true) =>
    band(ctx, at, width, color, shine, outline);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.2, hw * 0.07);
  switch (worn.id) {
    case "bowTie":
      ring(q, w * 0.22, tint(c, -0.15), false);
      bow(ctx, belly.x, belly.y, w * 0.55, c, q.f, q.n);
      break;
    case "bandana": {
      ring(q, w * 0.3, c);
      // A kerchief hanging below the throat, with polka dots.
      const a = onBody(q, w * 0.45, w * 0.55);
      const b = onBody(q, -w * 0.45, w * 0.55);
      const tip = onBody(q, -w * 0.1, w * 1.75);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.quadraticCurveTo((b.x + tip.x) / 2, (b.y + tip.y) / 2, tip.x, tip.y);
      ctx.quadraticCurveTo((a.x + tip.x) / 2, (a.y + tip.y) / 2, a.x, a.y);
      ctx.closePath();
      paint(ctx, c);
      for (const [u, v] of [
        [0.15, 0.8],
        [-0.2, 0.95],
        [0, 1.3],
        [0.25, 1.1],
      ]) {
        const d = onBody(q, w * u, w * v);
        dot(ctx, d.x, d.y, w * 0.07, "#ffffff");
      }
      break;
    }
    case "bellCollar": {
      ring(q, w * 0.3, c);
      // A shiny gold bell hanging at the throat, swinging a little.
      const swing = Math.sin(time * 3) * 0.15;
      const at = onBody(q, Math.sin(swing) * w * 0.3, w * 1.25);
      ctx.beginPath();
      ctx.moveTo(at.x, at.y - w * 0.35);
      ctx.bezierCurveTo(
        at.x - w * 0.42,
        at.y - w * 0.35,
        at.x - w * 0.4,
        at.y + w * 0.2,
        at.x - w * 0.5,
        at.y + w * 0.3,
      );
      ctx.lineTo(at.x + w * 0.5, at.y + w * 0.3);
      ctx.bezierCurveTo(
        at.x + w * 0.4,
        at.y + w * 0.2,
        at.x + w * 0.42,
        at.y - w * 0.35,
        at.x,
        at.y - w * 0.35,
      );
      ctx.closePath();
      paint(ctx, GOLD);
      dot(ctx, at.x, at.y + w * 0.36, w * 0.12, GOLD_DARK);
      dot(ctx, at.x - w * 0.15, at.y - w * 0.12, w * 0.08, "rgba(255,255,255,0.7)");
      break;
    }
    case "lei": {
      // Flowers all round the neck.
      for (let k = 0; k <= 6; k++) {
        const v = -w * 0.95 + (k / 6) * w * 2.1;
        const d = onBody(q, Math.sin(k * 1.7) * w * 0.12, v);
        flower(ctx, d.x, d.y, w * 0.17, k % 2 ? c : tint(c, 0.55), k);
      }
      break;
    }
    case "scarf": {
      // Two soft ends hanging from the knot under the chin, swaying as it swims.
      for (const [k, back] of [
        [0, 0.35],
        [1, -0.25],
      ]) {
        const sway = Math.sin(time * 4 + k * 1.8) * w * 0.25;
        const top = onBody(q, back * w * 0.4, w * 0.8);
        const end = onBody(q, back * w - w * 0.4 + sway, w * 2.1);
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.quadraticCurveTo(
          (top.x + end.x) / 2 + q.f.x * sway,
          (top.y + end.y) / 2 + q.f.y * sway,
          end.x,
          end.y,
        );
        ctx.strokeStyle = INK;
        ctx.lineWidth = w * 0.5 + 3;
        ctx.stroke();
        ctx.strokeStyle = k ? tint(c, -0.15) : c;
        ctx.lineWidth = w * 0.5;
        ctx.stroke();
        // Fringe at the end.
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = Math.max(1, w * 0.06);
        for (const t of [-0.18, 0, 0.18]) {
          const e1 = { x: end.x + q.f.x * w * t, y: end.y + q.f.y * w * t };
          ctx.beginPath();
          ctx.moveTo(e1.x, e1.y);
          ctx.lineTo(e1.x + q.n.x * w * 0.25, e1.y + q.n.y * w * 0.25);
          ctx.stroke();
        }
      }
      ring(q, w * 0.55, c);
      // Knitted stripes across the wrap.
      for (const v of [-0.55, 0, 0.55]) {
        const a = onBody(q, -w * 0.2, w * v);
        const b = onBody(q, w * 0.2, w * v);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = Math.max(1, w * 0.08);
        ctx.stroke();
      }
      break;
    }
    case "heartLocket": {
      ring(q, w * 0.1, GOLD, false);
      const at = onBody(q, 0, w * 1.4);
      ctx.beginPath();
      ctx.moveTo(belly.x, belly.y);
      ctx.lineTo(at.x, at.y - w * 0.2);
      ctx.strokeStyle = GOLD_DARK;
      ctx.lineWidth = Math.max(1, w * 0.06);
      ctx.stroke();
      ctx.strokeStyle = INK;
      heart(ctx, at.x, at.y + w * 0.05, w * 0.45);
      ctx.lineWidth = Math.max(1.2, hw * 0.06);
      paint(ctx, c);
      dot(ctx, at.x - w * 0.1, at.y - w * 0.05, w * 0.07, "rgba(255,255,255,0.75)");
      break;
    }
    case "pearls": {
      // A string of pearls, a little longer than the neck, with one big pearl in front.
      for (let k = 0; k <= 9; k++) {
        const t = k / 9;
        const v = -w * 1.0 + t * w * 2.25;
        const sag = Math.sin(t * Math.PI) * w * 0.25;
        const d = onBody(q, -sag * 0.4, v);
        dot(ctx, d.x, d.y, w * 0.16, "#fff4fb");
        ctx.beginPath();
        ctx.arc(d.x, d.y, w * 0.16, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(120,90,150,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        dot(ctx, d.x - w * 0.04, d.y - w * 0.04, w * 0.04, "#ffffff");
      }
      const big = onBody(q, 0, w * 1.45);
      dot(ctx, big.x, big.y, w * 0.3, tint(c, 0.6));
      ctx.beginPath();
      ctx.arc(big.x, big.y, w * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = INK;
      ctx.stroke();
      dot(ctx, big.x - w * 0.07, big.y - w * 0.07, w * 0.07, "#ffffff");
      break;
    }
  }
  ctx.restore();
}

/**
 * Something on its back: wings that flap, a cape that flutters, or a tiny backpack. Sits on the
 * upper edge of the body a little behind the front legs.
 */
export function drawBackWear(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  worn: Worn,
  time = 0,
  headR = hw * 1.3,
): void {
  const c = ACCESSORY_COLORS[worn.color] ?? ACCESSORY_COLORS[0];
  const n = p.length;
  const neck = neckIndex(p, headR);
  const mid = Math.min(n - 3, neck + Math.max(2, Math.round(n * 0.12)));
  const q = bodySpot(p, mid, hw);
  const w = q.w;
  const up = { x: -q.n.x, y: -q.n.y };
  const top = onBody(q, 0, -w * 0.85);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.2, hw * 0.07);
  if (worn.id === "fairyWings" || worn.id === "butterflyWings" || worn.id === "dragonWings") {
    // Wings are drawn by drawWings, in two layers (far wing behind the body, near wing in
    // front), so nothing more to do here.
  } else if (worn.id === "cape") {
    // A cape tied at the neck, streaming back over the body and fluttering at the hem.
    const from = Math.max(1, neck);
    const to = Math.min(n - 3, from + Math.max(4, Math.round(n * 0.3)));
    const edge: Point[] = [];
    const hem: Point[] = [];
    for (let i = from; i <= to; i++) {
      const s = bodySpot(p, i, hw);
      const t = (i - from) / Math.max(1, to - from);
      const flutter = Math.sin(time * 6 - i * 0.9) * s.w * 0.25 * t;
      edge.push(onBody(s, 0, -s.w * (1.02 + t * 0.15) - flutter * 0.4));
      hem.push(onBody(s, 0, s.w * (0.35 + t * 0.75) + flutter));
    }
    ctx.beginPath();
    ctx.moveTo(edge[0].x, edge[0].y);
    for (const e of edge) ctx.lineTo(e.x, e.y);
    for (let k = hem.length - 1; k >= 0; k--) {
      // A wavy hem.
      ctx.lineTo(hem[k].x, hem[k].y);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.95;
    paint(ctx, c);
    ctx.globalAlpha = 1;
    // A star emblem and a gold clasp at the neck.
    const mid2 = bodySpot(p, Math.round((from + to) / 2), hw);
    star(ctx, mid2.at.x, mid2.at.y, mid2.w * 0.42, 0);
    paint(ctx, GOLD);
    const clasp = onBody(bodySpot(p, from, hw), 0, 0);
    dot(ctx, clasp.x, clasp.y, w * 0.2, GOLD);
  } else if (worn.id === "backpack") {
    // A round little backpack on its back, with a flap, a pocket and a strap.
    const strapA = onBody(q, w * 0.45, -w * 0.6);
    const strapB = onBody(q, w * 0.45, w * 0.95);
    ctx.beginPath();
    ctx.moveTo(strapA.x, strapA.y);
    ctx.lineTo(strapB.x, strapB.y);
    ctx.strokeStyle = tint(c, -0.35);
    ctx.lineWidth = Math.max(2, w * 0.18);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.2, hw * 0.07);
    const centre = onBody(q, 0, -w * 0.95);
    const ang = Math.atan2(q.f.y, q.f.x);
    ctx.save();
    ctx.translate(centre.x, centre.y);
    ctx.rotate(ang);
    const bw = Math.max(w, hw * 0.9) * 1.5;
    const bh = Math.max(w, hw * 0.9) * 1.1;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh * 0.35);
    paint(ctx, c);
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh * 0.45, bh * 0.3);
    paint(ctx, tint(c, -0.2));
    ctx.beginPath();
    ctx.roundRect(-bw * 0.25, bh * 0.05, bw * 0.5, bh * 0.32, bh * 0.1);
    paint(ctx, tint(c, 0.3));
    ctx.restore();
    dot(ctx, centre.x, centre.y, w * 0.07, GOLD);
  }
  ctx.restore();
}

const WINGS = ["dragonWings", "fairyWings", "butterflyWings"] as const;

/** True if what's worn on the back is a pair of wings. */
export const isWings = (worn?: Worn): boolean =>
  !!worn && (WINGS as readonly string[]).includes(worn.id);

/**
 * A pair of wings at the shoulders. Drawn in two layers for depth: call it with `far` before
 * the body (the far wing peeks up from behind) and without after it (the near wing in front).
 */
export function drawWings(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  worn: Worn,
  time: number,
  headR: number,
  far: boolean,
): void {
  if (!isWings(worn)) return;
  const c = ACCESSORY_COLORS[worn.color] ?? ACCESSORY_COLORS[0];
  const shoulder = Math.min(p.length - 3, neckIndex(p, headR) + 2);
  const q = bodySpot(p, shoulder, hw);
  const up = { x: -q.n.x, y: -q.n.y };
  // The root sits just inside the top edge of the back; the far wing a little further forward.
  const root = onBody(q, far ? q.w * 0.35 : 0, -q.w * 0.6);
  const L = hw * 3.4;
  ctx.save();
  ctx.translate(root.x, root.y);
  // The body's own frame: x runs back toward the tail, y runs up off the back.
  ctx.transform(-q.f.x, -q.f.y, up.x, up.y, 0, 0);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (worn.id === "dragonWings") dragonWing(ctx, L, c, time, far);
  else if (worn.id === "fairyWings") fairyWing(ctx, L, c, time, far);
  else butterflyWing(ctx, L, c, time, far);
  ctx.restore();
}

/** A bat-like dragon wing: arched leading edge, finger bones, a scalloped trailing edge. */
function dragonWing(
  ctx: CanvasRenderingContext2D,
  L: number,
  c: string,
  time: number,
  far: boolean,
): void {
  const beat = Math.sin(time * 3);
  // The far wing tilts up, so it peeks out above and ahead of the near one.
  ctx.rotate(0.2 * beat + (far ? 0.42 : 0));
  ctx.scale(far ? 0.88 : 1, 0.95 + 0.07 * beat);
  const fill = far ? tint(c, -0.35) : c;
  const edge = tint(c, far ? -0.62 : -0.5);
  // The arm rises to the wrist, then the top edge sweeps far back to a pointed tip.
  const wrist = { x: L * 0.1, y: L * 0.95 };
  const tip = { x: L * 1.45, y: L * 1.0 };
  const trail = [
    tip,
    { x: L * 1.2, y: L * 0.62 },
    { x: L * 1.0, y: L * 0.32 },
    { x: L * 0.78, y: L * 0.08 },
    { x: L * 0.5, y: 0 },
  ];
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(-L * 0.06, 0);
    ctx.quadraticCurveTo(-L * 0.1, L * 0.55, wrist.x, wrist.y);
    ctx.quadraticCurveTo(L * 0.75, L * 1.22, tip.x, tip.y);
    for (let k = 1; k < trail.length; k++) {
      const a = trail[k - 1];
      const b = trail[k];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      // Each scallop bows in toward the wrist.
      ctx.quadraticCurveTo(mx + (wrist.x - mx) * 0.22, my + (wrist.y - my) * 0.22, b.x, b.y);
    }
    ctx.closePath();
  };
  outline();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const g = ctx.createLinearGradient(0, L * 1.1, L * 0.6, L * 0.2);
  g.addColorStop(0, "rgba(255,255,255,0.3)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-L, -L, L * 4, L * 4);
  ctx.restore();
  outline();
  ctx.strokeStyle = edge;
  ctx.lineWidth = L * 0.028;
  ctx.stroke();
  // Bones: the arm and top edge thick, then a finger out to each point of the trailing edge.
  ctx.lineWidth = L * 0.06;
  ctx.beginPath();
  ctx.moveTo(-L * 0.06, 0);
  ctx.quadraticCurveTo(-L * 0.1, L * 0.55, wrist.x, wrist.y);
  ctx.stroke();
  ctx.lineWidth = L * 0.04;
  ctx.beginPath();
  ctx.moveTo(wrist.x, wrist.y);
  ctx.quadraticCurveTo(L * 0.75, L * 1.22, tip.x, tip.y);
  ctx.stroke();
  ctx.lineWidth = L * 0.026;
  for (const t of trail.slice(1, 4)) {
    ctx.beginPath();
    ctx.moveTo(wrist.x, wrist.y);
    ctx.quadraticCurveTo((wrist.x + t.x) / 2, (wrist.y + t.y) / 2 + L * 0.08, t.x, t.y);
    ctx.stroke();
  }
  // A little claw on the wrist.
  ctx.beginPath();
  ctx.moveTo(wrist.x - L * 0.03, wrist.y + L * 0.02);
  ctx.quadraticCurveTo(
    wrist.x - L * 0.16,
    wrist.y + L * 0.1,
    wrist.x - L * 0.12,
    wrist.y + L * 0.22,
  );
  ctx.quadraticCurveTo(
    wrist.x - L * 0.04,
    wrist.y + L * 0.1,
    wrist.x + L * 0.05,
    wrist.y + L * 0.03,
  );
  ctx.closePath();
  ctx.fillStyle = "#fff4d6";
  ctx.fill();
  ctx.lineWidth = L * 0.018;
  ctx.stroke();
}

/** A see-through teardrop lobe from the root, pointing at `angle` (0 = straight back). */
function lobe(ctx: CanvasRenderingContext2D, len: number, wide: number, angle: number): void {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const P = (u: number, v: number) => ({ x: u * ca - v * sa, y: u * sa + v * ca });
  const a = P(len * 0.45, wide);
  const b = P(len * 1.0, wide * 0.55);
  const t = P(len * 1.08, 0);
  const d = P(len * 1.0, -wide * 0.5);
  const e = P(len * 0.45, -wide * 0.75);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(a.x * 0.4, a.y * 0.4, a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  ctx.quadraticCurveTo(b.x, b.y, t.x, t.y);
  ctx.quadraticCurveTo(d.x, d.y, (d.x + e.x) / 2, (d.y + e.y) / 2);
  ctx.bezierCurveTo(e.x, e.y, e.x * 0.4, e.y * 0.4, 0, 0);
  ctx.closePath();
}

/** Fairy wings: two pairs of long, see-through, sparkly teardrops that flutter fast. */
function fairyWing(
  ctx: CanvasRenderingContext2D,
  L: number,
  c: string,
  time: number,
  far: boolean,
): void {
  const flutter = Math.sin(time * 9);
  ctx.rotate(0.12 * flutter + (far ? 0.38 : 0));
  for (const [len, wide, angle] of [
    [L * 1.15, L * 0.36, 1.05],
    [L * 0.8, L * 0.24, 0.45],
  ]) {
    lobe(ctx, len, wide, angle);
    const g = ctx.createLinearGradient(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
    g.addColorStop(0, far ? tint(c, 0.1) : tint(c, 0.35));
    g.addColorStop(1, far ? tint(c, 0.45) : tint(c, 0.8));
    ctx.globalAlpha = far ? 0.55 : 0.72;
    ctx.fillStyle = g;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = far ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.95)";
    ctx.lineWidth = L * 0.022;
    ctx.stroke();
    // Veins.
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = L * 0.012;
    for (const off of [-0.18, 0.12]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const a2 = angle + off;
      ctx.quadraticCurveTo(
        Math.cos(a2) * len * 0.5,
        Math.sin(a2) * len * 0.5,
        Math.cos(angle + off * 0.5) * len * 0.92,
        Math.sin(angle + off * 0.5) * len * 0.92,
      );
      ctx.stroke();
    }
  }
  if (!far) {
    // Twinkles on the wings.
    ctx.fillStyle = "#ffffff";
    for (let k = 0; k < 4; k++) {
      const tw = 0.5 + 0.5 * Math.sin(time * 5 + k * 1.9);
      const a = 0.6 + k * 0.17;
      const r = L * (0.45 + (k % 2) * 0.3);
      star(ctx, Math.cos(a) * r, Math.sin(a) * r, L * 0.045 * (0.5 + tw), time + k);
      ctx.fill();
    }
  }
}

/** Butterfly wings: a big round upper wing and a smaller lower one, with a border and spots. */
function butterflyWing(
  ctx: CanvasRenderingContext2D,
  L: number,
  c: string,
  time: number,
  far: boolean,
): void {
  const beat = Math.sin(time * 5);
  ctx.rotate(0.16 * beat + (far ? 0.4 : 0));
  ctx.scale(far ? 0.8 : 0.86, far ? 0.8 : 0.86);
  const body = far ? tint(c, -0.3) : c;
  const border = tint(c, far ? -0.65 : -0.55);
  const shapes: [number, number, number][] = [
    // [len, wide, angle]: the upper wing points up and back, the lower one back.
    [L * 1.0, L * 0.55, 1.2],
    [L * 0.7, L * 0.38, 0.5],
  ];
  for (const [len, wide, angle] of shapes) {
    lobe(ctx, len, wide, angle);
    ctx.fillStyle = border;
    ctx.fill();
    ctx.save();
    ctx.translate(Math.cos(angle) * len * 0.06, Math.sin(angle) * len * 0.06);
    lobe(ctx, len * 0.84, wide * 0.8, angle);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.restore();
    if (!far) {
      // White spots along the border, and a big eye spot.
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      dot(
        ctx,
        ca * len * 0.62 - sa * wide * 0.05,
        sa * len * 0.62 + ca * wide * 0.05,
        wide * 0.22,
        tint(c, 0.6),
      );
      dot(
        ctx,
        ca * len * 0.62 - sa * wide * 0.05,
        sa * len * 0.62 + ca * wide * 0.05,
        wide * 0.1,
        border,
      );
      for (const t of [0.85, 0.98]) dot(ctx, ca * len * t, sa * len * t, wide * 0.07, "#ffffff");
    }
  }
}

/** Something near the tip of the tail. */
export function drawTailWear(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  worn: Worn,
  time = 0,
): void {
  const c = ACCESSORY_COLORS[worn.color] ?? ACCESSORY_COLORS[0];
  const n = p.length;
  const q = bodySpot(p, n - 4, hw);
  const s = Math.max(hw * 1.15, q.w * 2);
  const top = onBody(q, 0, -q.w * 0.9);
  const under = onBody(q, 0, q.w * 0.9);
  const outline = bodyOutline(p, hw);
  const ring = (at: ReturnType<typeof bodySpot>, width: number, color: string, shine = true) =>
    band(ctx, at, width, color, shine, outline);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.2, hw * 0.07);
  switch (worn.id) {
    case "tailBow":
      // A proper ribbon bow tied on top of the tail.
      ring(q, Math.max(3, q.w * 0.45), tint(c, -0.15), false);
      bow(ctx, top.x, top.y, s * 0.85, c, q.f, { x: -q.n.x, y: -q.n.y });
      break;
    case "tailRings":
      for (const i of [n - 4, n - 6, n - 8]) {
        if (i < 2) continue;
        const r = bodySpot(p, i, hw);
        ring(r, Math.max(hw * 0.32, r.w * 0.85), GOLD);
        const gem = onBody(r, 0, 0);
        dot(ctx, gem.x, gem.y, Math.max(2, r.w * 0.25), c);
      }
      break;
    case "tailFlower":
      ring(q, Math.max(3, q.w * 0.35), "#5cc47a", false);
      for (const [u, a] of [
        [0.5, 0.6],
        [-0.5, -0.6],
      ]) {
        const leaf = onBody(q, s * u * 0.6, -q.w - s * 0.15);
        ctx.beginPath();
        ctx.ellipse(
          leaf.x,
          leaf.y,
          s * 0.32,
          s * 0.13,
          Math.atan2(q.f.y, q.f.x) + a,
          0,
          Math.PI * 2,
        );
        paint(ctx, "#6fdc8c");
      }
      {
        const at = onBody(q, 0, -q.w - s * 0.35);
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + time * 0.3;
          ctx.beginPath();
          ctx.ellipse(
            at.x + Math.cos(a) * s * 0.26,
            at.y + Math.sin(a) * s * 0.26,
            s * 0.24,
            s * 0.15,
            a,
            0,
            Math.PI * 2,
          );
          paint(ctx, k % 2 ? c : tint(c, 0.35));
        }
        dot(ctx, at.x, at.y, s * 0.17, GOLD);
      }
      break;
    case "tailBell": {
      ring(q, Math.max(3, q.w * 0.4), c, false);
      const swing = Math.sin(time * 3.5) * 0.25;
      const at = onBody(q, Math.sin(swing) * s * 0.3, q.w + s * 0.45);
      const b = s * 0.42;
      ctx.beginPath();
      ctx.moveTo(under.x, under.y);
      ctx.lineTo(at.x, at.y - b * 0.6);
      ctx.strokeStyle = tint(c, -0.3);
      ctx.lineWidth = Math.max(1, s * 0.06);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1.2, hw * 0.07);
      ctx.beginPath();
      ctx.moveTo(at.x, at.y - b * 0.7);
      ctx.bezierCurveTo(
        at.x - b * 0.8,
        at.y - b * 0.7,
        at.x - b * 0.75,
        at.y + b * 0.35,
        at.x - b,
        at.y + b * 0.55,
      );
      ctx.lineTo(at.x + b, at.y + b * 0.55);
      ctx.bezierCurveTo(
        at.x + b * 0.75,
        at.y + b * 0.35,
        at.x + b * 0.8,
        at.y - b * 0.7,
        at.x,
        at.y - b * 0.7,
      );
      ctx.closePath();
      paint(ctx, GOLD);
      dot(ctx, at.x, at.y + b * 0.68, b * 0.22, GOLD_DARK);
      dot(ctx, at.x - b * 0.3, at.y - b * 0.2, b * 0.14, "rgba(255,255,255,0.7)");
      break;
    }
    case "tailStar": {
      ring(q, Math.max(3, q.w * 0.3), GOLD, false);
      const swing = Math.sin(time * 3) * 0.3;
      const at = onBody(q, Math.sin(swing) * s * 0.35, q.w + s * 0.7);
      ctx.beginPath();
      ctx.moveTo(under.x, under.y);
      ctx.lineTo(at.x, at.y);
      ctx.strokeStyle = GOLD_DARK;
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1.2, hw * 0.07);
      star(ctx, at.x, at.y, s * 0.42, swing);
      paint(ctx, c);
      dot(ctx, at.x - s * 0.1, at.y - s * 0.1, s * 0.07, "rgba(255,255,255,0.8)");
      break;
    }
    case "streamers": {
      // Three long ribbons streaming from a knot near the tip, rippling.
      ring(q, Math.max(3, q.w * 0.4), c, false);
      const colors = [c, tint(c, 0.45), tint(c, -0.2)];
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        const pts: Point[] = [];
        for (let j = 1; j <= 6; j++) {
          const t = j / 6;
          const wave = Math.sin(time * 6 - j * 0.9 + k * 2) * s * 0.3 * t;
          pts.push(onBody(q, -s * 2.6 * t - k * s * 0.2, -q.w + s * (0.3 + k * 0.45) * t + wave));
        }
        for (const pt of pts) ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = INK;
        ctx.lineWidth = s * 0.28 + 2;
        ctx.stroke();
        ctx.strokeStyle = colors[k];
        ctx.lineWidth = s * 0.28;
        ctx.stroke();
      }
      const knot = top;
      dot(ctx, knot.x, knot.y, s * 0.2, tint(c, -0.2));
      break;
    }
  }
  ctx.restore();
}

/** Everything it's wearing behind its head: tail things and back things. */
export function drawBodyWear(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  wardrobe: Wardrobe["worn"],
  time: number,
  headR = hw * 1.3,
): void {
  if (wardrobe.tail) drawTailWear(ctx, p, hw, wardrobe.tail, time);
  if (wardrobe.back) drawBackWear(ctx, p, hw, wardrobe.back, time, headR);
  // The near wing, in front of the body (the far one was drawn behind it).
  if (wardrobe.back && isWings(wardrobe.back))
    drawWings(ctx, p, hw, wardrobe.back, time, headR, false);
}
