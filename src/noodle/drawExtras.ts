import { bodyProfile } from "./body";
import { rimOf } from "./drawBody";
import { forwardAt, liftOf, type Leg, type LegSizes } from "./legs";
import { hsl, shade, type DragonLook } from "./look";
import type { Point } from "./spine";
import type { Whiskers } from "./whiskers";

/**
 * Stubby legs with round paws and little claws, all hanging from the belly as seen side-on: the
 * far legs first and a shade darker, then the near ones. Drawn before the body so hips tuck under.
 */
export function drawLegs(
  ctx: CanvasRenderingContext2D,
  legs: Leg[],
  spine: Point[],
  s: LegSizes,
  look: DragonLook,
): void {
  const hw = s.bodyHalf;
  ctx.lineCap = "round";
  const ordered = [...legs.filter((l) => l.far), ...legs.filter((l) => !l.far)];
  for (const leg of ordered) {
    const body = hsl(leg.far ? shade(look.body, -12) : look.body);
    const rim = hsl(rimOf(look.body));
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

    // Three little claws poking out on the side of the paw away from the hip.
    const dx = leg.foot.x - hip.x;
    const dy = leg.foot.y - hip.y;
    const a = Math.atan2(dy, dx);
    ctx.fillStyle = hsl(look.horn);
    ctx.strokeStyle = rim;
    ctx.lineWidth = Math.max(1, hw * 0.06);
    for (const spread of [-0.55, 0, 0.55]) {
      const ca = a + spread;
      const bx = leg.foot.x + Math.cos(ca) * pr * 0.75;
      const by = leg.foot.y + Math.sin(ca) * pr * 0.75;
      const nx = -Math.sin(ca) * pr * 0.2;
      const ny = Math.cos(ca) * pr * 0.2;
      ctx.beginPath();
      ctx.moveTo(bx + nx, by + ny);
      ctx.quadraticCurveTo(
        bx + Math.cos(ca) * pr * 0.5 + nx * 0.4,
        by + Math.sin(ca) * pr * 0.5 + ny * 0.4,
        bx + Math.cos(ca) * pr * 0.6 - nx * 0.6,
        by + Math.sin(ca) * pr * 0.6 - ny * 0.6,
      );
      ctx.lineTo(bx - nx, by - ny);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

/** A flickering flame-shaped fin at the tail tip that fans out and sways. */
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
  const tongues = [
    { angle: -0.8, length: 1.0, phase: 0 },
    { angle: 0.8, length: 1.0, phase: 2.1 },
    { angle: -0.38, length: 1.45, phase: 1.3 },
    { angle: 0.38, length: 1.45, phase: 3.4 },
    { angle: 0, length: 1.8, phase: 0.7 },
  ];
  const passes = [
    { color: hsl(shade(look.accent, -22, -10)), grow: hw * 0.1, scale: 1 },
    { color: hsl(look.accent), grow: 0, scale: 1 },
    { color: hsl(shade(look.accent, 12, 5)), grow: 0, scale: 0.6 },
  ];
  for (const pass of passes) {
    for (const t of tongues) {
      const a = back + t.angle + sway * (1 + Math.abs(t.angle));
      const len = hw * t.length * pass.scale + pass.grow;
      const wide = hw * 0.34 * pass.scale + pass.grow;
      // Each tongue curls a little, like a flame licking upward.
      const curl = Math.sin(time * 5 + t.phase) * 0.35;
      const ex = tip.x + Math.cos(a + curl) * len;
      const ey = tip.y + Math.sin(a + curl) * len;
      const nx = -Math.sin(a) * wide;
      const ny = Math.cos(a) * wide;
      const mx = tip.x + Math.cos(a) * len * 0.4;
      const my = tip.y + Math.sin(a) * len * 0.4;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.quadraticCurveTo(mx + nx * 1.6, my + ny * 1.6, ex, ey);
      ctx.quadraticCurveTo(mx - nx * 1.6, my - ny * 1.6, tip.x, tip.y);
      ctx.closePath();
      ctx.fillStyle = pass.color;
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
