import { ACCESSORY_COLORS, type Wardrobe, type Worn } from "../care/wardrobe";
import { bodyProfile } from "./body";
import { bellySide, forwardAt } from "./legs";
import type { Point } from "./spine";

const INK = "rgba(40,20,80,0.6)";
const GOLD = "#ffd96a";

/** A color a bit darker or lighter (hex in, rgb out). */
function tint(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) =>
    Math.round(Math.max(0, Math.min(255, k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * A hat, crown or flower crown on top of the head. Drawn in the head's own coordinates (facing
 * right, centre at 0,0, radius r), so it turns and tilts with the head.
 */
export function drawHeadWear(ctx: CanvasRenderingContext2D, r: number, worn: Worn, time = 0): void {
  const c = ACCESSORY_COLORS[worn.color] ?? ACCESSORY_COLORS[0];
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.2, r * 0.06);
  // Sits on the crown, tipped back a little.
  ctx.translate(-r * 0.18, -r * 0.78);
  ctx.rotate(-0.18);
  switch (worn.id) {
    case "partyHat": {
      ctx.beginPath();
      ctx.moveTo(-r * 0.42, 0);
      ctx.lineTo(r * 0.05, -r * 1.05);
      ctx.lineTo(r * 0.42, 0);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = r * 0.1;
      for (const y of [-0.25, -0.55, -0.85]) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, y * r + r * 0.1);
        ctx.lineTo(r * 0.6, y * r - r * 0.1);
        ctx.stroke();
      }
      ctx.restore();
      ctx.stroke();
      blob(ctx, r * 0.05, -r * 1.08, r * 0.14, "#ffffff");
      break;
    }
    case "flowerCrown": {
      ctx.translate(r * 0.18, r * 0.78);
      ctx.rotate(0.18);
      for (let k = 0; k < 6; k++) {
        const a = -2.75 + k * 0.38;
        const x = Math.cos(a) * r * 0.92;
        const y = Math.sin(a) * r * 0.86;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#6fdc8c";
        ctx.beginPath();
        ctx.ellipse(r * 0.14, r * 0.02, r * 0.12, r * 0.05, 0.6, 0, Math.PI * 2);
        ctx.fill();
        const petal = k % 2 ? c : "#ffffff";
        for (let q = 0; q < 5; q++) {
          const pa = (q / 5) * Math.PI * 2 + time * 0.2;
          blob(ctx, Math.cos(pa) * r * 0.1, Math.sin(pa) * r * 0.1, r * 0.09, petal);
        }
        blob(ctx, 0, 0, r * 0.06, GOLD);
        ctx.restore();
      }
      break;
    }
    case "beanie": {
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, r * 0.05);
      ctx.bezierCurveTo(-r * 0.55, -r * 0.75, r * 0.55, -r * 0.75, r * 0.55, r * 0.05);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.stroke();
      // Knitted ribs, then the folded cuff.
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      for (const x of [-0.3, -0.1, 0.1, 0.3]) {
        ctx.beginPath();
        ctx.moveTo(x * r, -r * 0.05);
        ctx.quadraticCurveTo(x * r * 1.1, -r * 0.3, x * r * 0.6, -r * 0.5);
        ctx.stroke();
      }
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.roundRect(-r * 0.6, -r * 0.12, r * 1.2, r * 0.24, r * 0.1);
      ctx.fillStyle = tint(c, -0.15);
      ctx.fill();
      ctx.stroke();
      blob(ctx, 0, -r * 0.62, r * 0.17, "#ffffff");
      break;
    }
    case "witchHat": {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.75, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = tint(c, -0.35);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.38, -r * 0.05);
      ctx.quadraticCurveTo(-r * 0.15, -r * 0.7, -r * 0.55, -r * 1.15);
      ctx.quadraticCurveTo(r * 0.15, -r * 0.75, r * 0.38, -r * 0.05);
      ctx.closePath();
      ctx.fillStyle = tint(c, -0.35);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.36, -r * 0.12);
      ctx.lineTo(r * 0.36, -r * 0.12);
      ctx.strokeStyle = c;
      ctx.lineWidth = r * 0.12;
      ctx.stroke();
      blob(ctx, -r * 0.55, -r * 1.15, r * 0.06, GOLD);
      break;
    }
    case "topHat": {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.62, r * 0.14, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#2a2050";
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-r * 0.36, -r * 0.82, r * 0.72, r * 0.82, r * 0.06);
      ctx.fillStyle = "#2a2050";
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.fillRect(-r * 0.36, -r * 0.3, r * 0.72, r * 0.16);
      blob(ctx, r * 0.22, -r * 0.22, r * 0.08, "#ffffff");
      break;
    }
    case "crown": {
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, 0);
      ctx.lineTo(-r * 0.5, -r * 0.5);
      ctx.lineTo(-r * 0.25, -r * 0.25);
      ctx.lineTo(0, -r * 0.62);
      ctx.lineTo(r * 0.25, -r * 0.25);
      ctx.lineTo(r * 0.5, -r * 0.5);
      ctx.lineTo(r * 0.45, 0);
      ctx.closePath();
      ctx.fillStyle = GOLD;
      ctx.fill();
      ctx.stroke();
      for (const [x, y] of [
        [-0.5, -0.52],
        [0, -0.64],
        [0.5, -0.52],
      ])
        blob(ctx, x * r, y * r, r * 0.07, "#ffffff");
      blob(ctx, 0, -r * 0.16, r * 0.1, c);
      blob(ctx, -r * 0.27, -r * 0.12, r * 0.06, c);
      blob(ctx, r * 0.27, -r * 0.12, r * 0.06, c);
      break;
    }
  }
  ctx.restore();
}

/** Where the neck is: a spine point just behind the head, its direction and its belly side. */
function bodySpot(p: Point[], i: number, hw: number) {
  const f = forwardAt(p, i);
  const s = bellySide(p, i);
  const side = Math.abs(s) < 0.2 ? 1 : Math.sign(s);
  // The belly-side normal (pointing down the screen when swimming sideways).
  const n = { x: -f.y * side, y: f.x * side };
  const w = hw * bodyProfile(i / (p.length - 1));
  return { at: p[i], f, n, w };
}

/** A collar, bow tie, bandana or scarf around the neck; scarf ends flutter along the body. */
export function drawNeckWear(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  worn: Worn,
  time = 0,
  headR = hw * 1.3,
): void {
  const c = ACCESSORY_COLORS[worn.color] ?? ACCESSORY_COLORS[0];
  // The neck: the first spine point clear of the head, so the head doesn't hide it.
  let i = 1;
  while (i < p.length - 3 && Math.hypot(p[i].x - p[0].x, p[i].y - p[0].y) < headR * 0.95) i++;
  const { at, f, n, w } = bodySpot(p, i, hw);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // The band round the neck (everything has one, except the bow tie on its own).
  const band = (width: number, color: string) => {
    ctx.beginPath();
    ctx.moveTo(at.x - n.x * w * 1.02, at.y - n.y * w * 1.02);
    ctx.lineTo(at.x + n.x * w * 1.02, at.y + n.y * w * 1.02);
    ctx.strokeStyle = INK;
    ctx.lineWidth = width + Math.max(2, hw * 0.08);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };
  const belly = { x: at.x + n.x * w * 0.95, y: at.y + n.y * w * 0.95 };
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.2, hw * 0.07);
  if (worn.id === "bowTie") {
    const s = w * 0.8;
    for (const dir of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(belly.x, belly.y);
      ctx.lineTo(belly.x + f.x * s * dir + n.x * s * 0.6, belly.y + f.y * s * dir + n.y * s * 0.6);
      ctx.lineTo(belly.x + f.x * s * dir - n.x * s * 0.6, belly.y + f.y * s * dir - n.y * s * 0.6);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.stroke();
    }
    blob(ctx, belly.x, belly.y, s * 0.28, tint(c, -0.2));
  } else if (worn.id === "bandana") {
    // A kerchief: its top edge along the collar, its point hanging back and down.
    const p1 = { x: at.x - n.x * w * 0.35, y: at.y - n.y * w * 0.35 };
    const p2 = { x: at.x + n.x * w * 1.05, y: at.y + n.y * w * 1.05 };
    const tip = {
      x: at.x + n.x * w * 0.75 - f.x * w * 1.1,
      y: at.y + n.y * w * 0.75 - f.y * w * 1.1,
    };
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();
    ctx.stroke();
    for (const t of [0.3, 0.55]) {
      const x = p1.x + (tip.x - p1.x) * 0.5 + (p2.x - p1.x) * t * 0.6;
      const y = p1.y + (tip.y - p1.y) * 0.5 + (p2.y - p1.y) * t * 0.6;
      blob(ctx, x, y, w * 0.07, "#ffffff");
    }
    band(w * 0.24, tint(c, -0.15));
  } else if (worn.id === "bellCollar") {
    band(w * 0.24, c);
    const b = { x: belly.x + n.x * w * 0.2, y: belly.y + n.y * w * 0.2 };
    blob(ctx, b.x, b.y, w * 0.26, GOLD);
    ctx.stroke();
    blob(ctx, b.x + n.x * w * 0.1, b.y + n.y * w * 0.1, w * 0.06, INK);
  } else if (worn.id === "scarf") {
    // Two soft ends trailing back from the knot, fluttering as it swims.
    for (const [k, off] of [
      [0, 0.0],
      [1, 0.5],
    ]) {
      ctx.beginPath();
      ctx.moveTo(belly.x, belly.y);
      let last = belly;
      for (let j = 1; j <= 3 && i + j < p.length; j++) {
        const q = bodySpot(p, i + j, hw);
        const wave = Math.sin(time * 6 + j * 1.3 + k * 2) * q.w * 0.25;
        last = {
          x: q.at.x + q.n.x * (q.w * (0.9 + j * 0.15 + off * 0.4) + wave),
          y: q.at.y + q.n.y * (q.w * (0.9 + j * 0.15 + off * 0.4) + wave),
        };
        ctx.lineTo(last.x, last.y);
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = w * 0.42 + Math.max(2, hw * 0.08);
      ctx.stroke();
      ctx.strokeStyle = k ? tint(c, -0.12) : c;
      ctx.lineWidth = w * 0.42;
      ctx.stroke();
    }
    band(w * 0.4, c);
    ctx.beginPath();
    for (const t of [-0.5, 0, 0.5]) {
      ctx.moveTo(at.x + n.x * w * t - f.x * w * 0.12, at.y + n.y * w * t - f.y * w * 0.12);
      ctx.lineTo(at.x + n.x * w * t + f.x * w * 0.12, at.y + n.y * w * t + f.y * w * 0.12);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = Math.max(1, w * 0.06);
    ctx.stroke();
  }
  ctx.restore();
}

/** A bow or shiny rings near the tip of the tail. */
export function drawTailWear(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  worn: Worn,
): void {
  const c = ACCESSORY_COLORS[worn.color] ?? ACCESSORY_COLORS[0];
  const n = p.length;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (worn.id === "tailRings") {
    for (const i of [n - 4, n - 6, n - 8]) {
      if (i < 2) continue;
      const q = bodySpot(p, i, hw);
      ctx.beginPath();
      ctx.moveTo(q.at.x - q.n.x * q.w * 0.95, q.at.y - q.n.y * q.w * 0.95);
      ctx.lineTo(q.at.x + q.n.x * q.w * 0.95, q.at.y + q.n.y * q.w * 0.95);
      ctx.lineCap = "butt";
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(4, q.w * 0.9) + 2;
      ctx.stroke();
      ctx.strokeStyle = c;
      ctx.lineWidth = Math.max(4, q.w * 0.9);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = Math.max(1, q.w * 0.22);
      ctx.stroke();
    }
  } else {
    const q = bodySpot(p, Math.max(1, n - 4), hw);
    const s = Math.max(hw * 1.0, q.w * 1.6);
    const top = { x: q.at.x - q.n.x * q.w, y: q.at.y - q.n.y * q.w };
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.2, hw * 0.07);
    for (const dir of [1, -1]) {
      // A loop each side, and a ribbon tail hanging down behind.
      ctx.beginPath();
      ctx.ellipse(
        top.x + q.f.x * s * 0.55 * dir - q.n.x * s * 0.2,
        top.y + q.f.y * s * 0.55 * dir - q.n.y * s * 0.2,
        s * 0.5,
        s * 0.3,
        Math.atan2(q.f.y, q.f.x),
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = c;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(
        top.x + q.f.x * s * 0.35 * dir + q.n.x * s * 0.9,
        top.y + q.f.y * s * 0.35 * dir + q.n.y * s * 0.9,
      );
      ctx.lineWidth = s * 0.22;
      ctx.strokeStyle = tint(c, -0.15);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1.2, hw * 0.07);
    }
    blob(ctx, top.x, top.y, s * 0.2, tint(c, -0.2));
  }
  ctx.restore();
}

/** Everything it's wearing on its body (the hat is drawn with the head). */
export function drawBodyWear(
  ctx: CanvasRenderingContext2D,
  p: Point[],
  hw: number,
  wardrobe: Wardrobe["worn"],
  time: number,
  headR = hw * 1.3,
): void {
  if (wardrobe.tail) drawTailWear(ctx, p, hw, wardrobe.tail);
  if (wardrobe.neck) drawNeckWear(ctx, p, hw, wardrobe.neck, time, headR);
}
