import type { Point } from "../noodle/spine";

export type BallKind = "beach" | "yarn" | "star" | "bubble" | "jelly" | "rainbow";
export const BALL_KINDS: BallKind[] = ["beach", "yarn", "star", "bubble", "jelly", "rainbow"];

/** How each ball plays. */
export interface BallStats {
  name: string;
  /** Pulls it down (px/s²). */
  gravity: number;
  /** How much speed it keeps when it bounces (0–1). */
  bounce: number;
  /** How quickly it slows down in the air. */
  airDrag: number;
  /** How much sideways speed it keeps each time it touches the floor. */
  floorGrip: number;
  /** Extra Love on top of the usual for each boop. */
  loveBonus: number;
  /** Coins in the shop (0 = free). */
  cost: number;
}

export const BALLS: Record<BallKind, BallStats> = {
  beach: {
    name: "Beach ball",
    gravity: 420,
    bounce: 0.72,
    airDrag: 0.6,
    floorGrip: 0.9,
    loveBonus: 0,
    cost: 0,
  },
  yarn: {
    name: "Yarn ball",
    gravity: 650,
    bounce: 0.3,
    airDrag: 0.5,
    floorGrip: 0.985,
    loveBonus: 1,
    cost: 20,
  },
  star: {
    name: "Star ball",
    gravity: 260,
    bounce: 0.75,
    airDrag: 0.7,
    floorGrip: 0.9,
    loveBonus: 1,
    cost: 25,
  },
  bubble: {
    name: "Bubble ball",
    gravity: 90,
    bounce: 0.6,
    airDrag: 1.6,
    floorGrip: 0.8,
    loveBonus: 2,
    cost: 30,
  },
  jelly: {
    name: "Jelly ball",
    gravity: 520,
    bounce: 0.93,
    airDrag: 0.4,
    floorGrip: 0.95,
    loveBonus: 2,
    cost: 35,
  },
  rainbow: {
    name: "Rainbow ball",
    gravity: 380,
    bounce: 0.78,
    airDrag: 0.6,
    floorGrip: 0.9,
    loveBonus: 4,
    cost: 50,
  },
};

/** The balls you can play with: the free beach ball plus any bought. */
export function ownedBalls(bought: BallKind[]): BallKind[] {
  return BALL_KINDS.filter((k) => BALLS[k].cost === 0 || bought.includes(k));
}

/** The next owned ball after `current`, round and round. */
export function nextBall(current: BallKind, owned: BallKind[]): BallKind {
  const i = owned.indexOf(current);
  return owned[(i + 1) % owned.length] ?? "beach";
}

/**
 * Draws a ball. `trail` is where it has recently been (for the yarn and star balls) and
 * `squash` (0–1) how squished the jelly ball is from a bounce.
 */
export function drawBallKind(
  ctx: CanvasRenderingContext2D,
  kind: BallKind,
  x: number,
  y: number,
  r: number,
  spin: number,
  time: number,
  trail: Point[] = [],
  squash = 0,
): void {
  if (kind === "beach") return drawBeachBall(ctx, x, y, r, spin);
  if (kind === "yarn") return yarn(ctx, x, y, r, spin, trail);
  if (kind === "star") return star(ctx, x, y, r, spin, time, trail);
  if (kind === "bubble") return bubble(ctx, x, y, r, time);
  if (kind === "jelly") return jelly(ctx, x, y, r, time, squash);
  return rainbow(ctx, x, y, r, spin, time);
}

function yarn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin: number,
  trail: Point[],
): void {
  // A loose strand trailing behind it.
  if (trail.length > 1) {
    ctx.strokeStyle = "#ff8ad8";
    ctx.lineWidth = Math.max(1.5, r * 0.15);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (const p of trail) ctx.lineTo(p.x, p.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = "#ff8ad8";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d9549f";
  ctx.lineWidth = Math.max(1, r * 0.1);
  for (const a of [0, 0.7, 1.4, 2.1]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.9, r * 0.35, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.35, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function star(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin: number,
  time: number,
  trail: Point[],
): void {
  // Sparkles fading out along its path.
  trail.forEach((p, i) => {
    const a = (i + 1) / (trail.length + 1);
    ctx.fillStyle = `rgba(255,230,140,${(a * 0.7).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.x + Math.sin(time * 9 + i) * 2, p.y, r * 0.18 * a + 1, 0, Math.PI * 2);
    ctx.fill();
  });
  const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2);
  g.addColorStop(0, "rgba(255,220,120,0.35)");
  g.addColorStop(1, "rgba(255,220,120,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = "#ffd27a";
  ctx.strokeStyle = "#d99a2a";
  ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r * 1.15 : r * 0.55;
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3a2a4a";
  for (const dx of [-0.22, 0.22]) {
    ctx.beginPath();
    ctx.arc(dx * r, -r * 0.05, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#3a2a4a";
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.beginPath();
  ctx.arc(0, r * 0.1, r * 0.15, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
}

function bubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  time: number,
): void {
  const wob = 1 + Math.sin(time * 5) * 0.04;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(wob, 2 - wob);
  ctx.fillStyle = "rgba(200,240,255,0.22)";
  ctx.strokeStyle = `hsla(${(time * 80) % 360}, 90%, 82%, 0.95)`;
  ctx.lineWidth = Math.max(1.5, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `hsla(${(time * 80 + 140) % 360}, 90%, 82%, 0.6)`;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.95, Math.PI * 0.1, Math.PI * 0.8);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.45, r * 0.25, r * 0.14, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function jelly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  time: number,
  squash: number,
): void {
  const sx = 1 + squash * 0.35 + Math.sin(time * 14) * 0.03 * squash;
  const sy = 1 - squash * 0.3;
  ctx.save();
  ctx.translate(x, y + r * squash * 0.3);
  ctx.scale(sx, sy);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, "rgba(180,255,210,0.95)");
  g.addColorStop(1, "rgba(60,200,140,0.85)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.28, r * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1f6b4a";
  for (const dx of [-0.25, 0.25]) {
    ctx.beginPath();
    ctx.arc(dx * r, r * 0.05, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#1f6b4a";
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.beginPath();
  ctx.arc(0, r * 0.2, r * 0.13, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
}

function rainbow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin: number,
  time: number,
): void {
  const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 1.8);
  g.addColorStop(0, `hsla(${(time * 60) % 360}, 95%, 75%, 0.35)`);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = `hsl(${(i * 51 + time * 60) % 360} 90% 70%)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, (i * Math.PI * 2) / 7, ((i + 1) * Math.PI * 2) / 7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(-spin);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.4, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A glowing beach-ball: pink, white and cyan wedges that spin as it rolls. */
export function drawBeachBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(255,138,216,0.18)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(spin);
  const colors = ["#ff8ad8", "#ffffff", "#7af3ff", "#ffffff", "#ffd27a", "#ffffff"];
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3);
    ctx.closePath();
    ctx.fill();
  });
  ctx.rotate(-spin);
  ctx.strokeStyle = "#d9549f";
  ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.4, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
