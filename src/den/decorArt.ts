import type { DecorItem, DecorKind } from "./decor";

/** The three colors of each decoration, as hues (with the lightness set by each drawing). */
const HUES: Record<DecorKind, [number, number, number]> = {
  lantern: [330, 42, 187],
  cushion: [270, 330, 155],
  plant: [20, 210, 45],
  jar: [45, 187, 320],
  rug: [320, 265, 175],
};

/** Size of a decoration for the screen: about the size of the dragon's head. */
export function decorSize(w: number, h: number): number {
  return Math.max(18, Math.min(34, Math.min(w, h) * 0.038));
}

/** Draws one decoration centred at (x, y) in pixels. `dark` (0–1) makes glowing things glow more. */
export function drawDecorAt(
  ctx: CanvasRenderingContext2D,
  kind: DecorKind,
  color: number,
  x: number,
  y: number,
  s: number,
  dark: number,
  time: number,
): void {
  const hue = HUES[kind][color % 3];
  ctx.save();
  ctx.translate(x, y);
  if (kind === "lantern") lantern(ctx, s, hue, dark, time);
  else if (kind === "cushion") cushion(ctx, s, hue);
  else if (kind === "plant") plant(ctx, s, hue);
  else if (kind === "jar") jar(ctx, s, hue, dark, time);
  else rug(ctx, s, hue);
  ctx.restore();
}

export function drawDecor(
  ctx: CanvasRenderingContext2D,
  item: DecorItem,
  w: number,
  h: number,
  dark: number,
  time: number,
): void {
  drawDecorAt(ctx, item.kind, item.color, item.x * w, item.y * h, decorSize(w, h), dark, time);
}

function glow(ctx: CanvasRenderingContext2D, r: number, hue: number, a: number): void {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `hsla(${hue} 95% 75% / ${a.toFixed(3)})`);
  g.addColorStop(1, `hsla(${hue} 95% 75% / 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A round paper lantern on a little string, gently swaying. */
function lantern(
  ctx: CanvasRenderingContext2D,
  s: number,
  hue: number,
  dark: number,
  time: number,
): void {
  ctx.rotate(Math.sin(time * 1.2 + hue) * 0.06);
  glow(ctx, s * 2.4, hue, 0.15 + 0.35 * dark);
  ctx.strokeStyle = "rgba(255,240,220,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.85);
  ctx.lineTo(0, -s * 1.5);
  ctx.stroke();
  ctx.fillStyle = `hsl(${hue} 80% 72%)`;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.75, s * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `hsl(${hue} 60% 55%)`;
  ctx.lineWidth = Math.max(1, s * 0.05);
  for (const k of [-0.4, 0, 0.4]) {
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      s * 0.75 * Math.abs(Math.cos(k * 2)),
      s * 0.7,
      0,
      -Math.PI / 2,
      Math.PI / 2,
      k < 0,
    );
    ctx.stroke();
  }
  ctx.fillStyle = "#3a2a4a";
  ctx.fillRect(-s * 0.3, -s * 0.85, s * 0.6, s * 0.18);
  ctx.fillRect(-s * 0.3, s * 0.67, s * 0.6, s * 0.18);
  ctx.strokeStyle = `hsl(${hue} 80% 72%)`;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.85);
  ctx.lineTo(0, s * 1.2);
  ctx.stroke();
}

/** A plump square cushion with a button in the middle. */
function cushion(ctx: CanvasRenderingContext2D, s: number, hue: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.5, s * 1.1, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsl(${hue} 60% 62%)`;
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.2);
  ctx.quadraticCurveTo(0, -s * 0.7, s, -s * 0.2);
  ctx.quadraticCurveTo(s * 1.15, s * 0.15, s, s * 0.45);
  ctx.quadraticCurveTo(0, s * 0.75, -s, s * 0.45);
  ctx.quadraticCurveTo(-s * 1.15, s * 0.15, -s, -s * 0.2);
  ctx.fill();
  ctx.fillStyle = `hsl(${hue} 70% 75%)`;
  ctx.beginPath();
  ctx.ellipse(-s * 0.2, -s * 0.15, s * 0.5, s * 0.18, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsl(${hue} 50% 45%)`;
  ctx.beginPath();
  ctx.arc(0, s * 0.08, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

/** A leafy plant in a round pot. */
function plant(ctx: CanvasRenderingContext2D, s: number, hue: number): void {
  for (const [a, len] of [
    [-0.9, 1.0],
    [-0.35, 1.3],
    [0.2, 1.4],
    [0.75, 1.1],
  ]) {
    ctx.save();
    ctx.translate(0, -s * 0.2);
    ctx.rotate(a);
    ctx.fillStyle = "hsl(140 45% 42%)";
    ctx.beginPath();
    ctx.ellipse(0, -s * len * 0.55, s * 0.24, s * len * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "hsl(140 40% 58%)";
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -s * len);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = `hsl(${hue} 55% 60%)`;
  ctx.beginPath();
  ctx.moveTo(-s * 0.6, -s * 0.2);
  ctx.lineTo(s * 0.6, -s * 0.2);
  ctx.lineTo(s * 0.45, s * 0.6);
  ctx.lineTo(-s * 0.45, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `hsl(${hue} 55% 70%)`;
  ctx.fillRect(-s * 0.68, -s * 0.32, s * 1.36, s * 0.2);
}

/** A glass jar of fireflies with a cork lid; the lights drift about inside. */
function jar(
  ctx: CanvasRenderingContext2D,
  s: number,
  hue: number,
  dark: number,
  time: number,
): void {
  glow(ctx, s * 2, hue, 0.12 + 0.3 * dark);
  ctx.fillStyle = "rgba(200,230,255,0.18)";
  ctx.strokeStyle = "rgba(220,240,255,0.7)";
  ctx.lineWidth = Math.max(1.2, s * 0.06);
  ctx.beginPath();
  ctx.roundRect(-s * 0.55, -s * 0.6, s * 1.1, s * 1.3, s * 0.3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#c98a5a";
  ctx.fillRect(-s * 0.4, -s * 0.85, s * 0.8, s * 0.28);
  for (let i = 0; i < 4; i++) {
    const fx = Math.sin(time * (1.3 + i * 0.4) + i * 2) * s * 0.3;
    const fy = Math.cos(time * (1.1 + i * 0.3) + i) * s * 0.35 + s * 0.05;
    ctx.fillStyle = `hsla(${hue} 100% 80% / ${(0.6 + 0.4 * Math.sin(time * 3 + i)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(fx, fy, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(-s * 0.4, -s * 0.45, s * 0.1, s * 0.8);
}

/** A round woven rug lying flat on the floor. */
function rug(ctx: CanvasRenderingContext2D, s: number, hue: number): void {
  for (const [r, l] of [
    [1, 52],
    [0.75, 64],
    [0.5, 52],
    [0.25, 70],
  ]) {
    ctx.fillStyle = `hsl(${hue} 50% ${l}%)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 2 * r, s * 0.55 * r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
