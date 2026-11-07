import { bodyProfile } from "./body";
import { rimOf } from "./drawBody";
import { forwardAt, liftOf, type Leg, type LegSizes } from "./legs";
import { hsl, shade, type DragonLook } from "./look";
import type { Point } from "./spine";
import type { Whiskers } from "./whiskers";

/** Stubby legs with round paws and pink toe beans. Drawn before the body so hips tuck under. */
export function drawLegs(
  ctx: CanvasRenderingContext2D,
  legs: Leg[],
  spine: Point[],
  s: LegSizes,
  look: DragonLook,
): void {
  const hw = s.bodyHalf;
  const body = hsl(look.body);
  const rim = hsl(rimOf(look.body));
  ctx.lineCap = "round";
  for (const leg of legs) {
    const hipPt = spine[leg.hip];
    const f = forwardAt(spine, leg.hip);
    const tuck = hw * bodyProfile(leg.hip / (spine.length - 1)) * 0.3;
    const hip = { x: hipPt.x - f.y * tuck * leg.side, y: hipPt.y + f.x * tuck * leg.side };
    const lift = liftOf(leg);

    ctx.strokeStyle = rim;
    ctx.lineWidth = hw * 0.8;
    line(ctx, hip, leg.foot);
    ctx.strokeStyle = body;
    ctx.lineWidth = hw * 0.64;
    line(ctx, hip, leg.foot);

    // Paw: a little bigger while lifted, as if closer to us.
    const pr = hw * (0.4 + lift * 0.08);
    ctx.beginPath();
    ctx.arc(leg.foot.x, leg.foot.y, pr, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = rim;
    ctx.lineWidth = Math.max(1.5, hw * 0.1);
    ctx.stroke();

    // Toe beans on the side of the paw away from the hip.
    const dx = leg.foot.x - hip.x;
    const dy = leg.foot.y - hip.y;
    const a = Math.atan2(dy, dx);
    ctx.fillStyle = hsl(look.accent, 0.9);
    for (const spread of [-0.6, 0, 0.6]) {
      ctx.beginPath();
      ctx.arc(
        leg.foot.x + Math.cos(a + spread) * pr * 0.55,
        leg.foot.y + Math.sin(a + spread) * pr * 0.55,
        pr * 0.2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
}

/** A fluffy pink tuft at the tail tip that fans out and sways. */
export function drawTailTuft(
  ctx: CanvasRenderingContext2D,
  spine: Point[],
  hw: number,
  time: number,
  look: DragonLook,
): void {
  const n = spine.length;
  const tip = spine[n - 1];
  const before = spine[n - 3];
  const back = Math.atan2(tip.y - before.y, tip.x - before.x);
  const sway = Math.sin(time * 3.1) * 0.22;
  const lobes = [
    { angle: -0.75, length: 0.75 },
    { angle: 0.75, length: 0.75 },
    { angle: -0.38, length: 1.0 },
    { angle: 0.38, length: 1.0 },
    { angle: 0, length: 1.2 },
  ];
  for (const pass of ["rim", "fill"] as const) {
    for (const lobe of lobes) {
      const a = back + lobe.angle + sway * (1 + Math.abs(lobe.angle));
      const len = hw * lobe.length;
      const grow = pass === "rim" ? hw * 0.07 : 0;
      ctx.beginPath();
      ctx.ellipse(
        tip.x + Math.cos(a) * len * 0.5,
        tip.y + Math.sin(a) * len * 0.5,
        len * 0.55 + grow,
        hw * 0.26 + grow,
        a,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = hsl(pass === "rim" ? shade(look.accent, -22, -10) : look.accent);
      ctx.fill();
    }
  }
}

/** Long flowing whiskers: thick at the root, thin at the tip. */
export function drawWhiskers(ctx: CanvasRenderingContext2D, whiskers: Whiskers, hw: number): void {
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(240,255,255,0.92)";
  for (const strand of whiskers.strands) {
    const p = strand.points;
    for (let i = 0; i < p.length - 1; i++) {
      ctx.lineWidth = Math.max(1.2, hw * 0.22 * (1 - i / p.length));
      line(ctx, p[i], p[i + 1]);
    }
  }
}

function line(ctx: CanvasRenderingContext2D, a: Point, b: Point): void {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}
