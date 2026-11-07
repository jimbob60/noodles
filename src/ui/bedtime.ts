import type { Point } from "../noodle/spine";

/** The bedtime button sits just above the ball in the bottom-right corner. */
export function bedButton(width: number, height: number): Point & { r: number } {
  const r = Math.max(24, Math.min(34, Math.min(width, height) * 0.042));
  return { x: width - 14 - r, y: height - 14 - r - (2 * r + r * 0.55), r };
}

export function onBedButton(p: Point, width: number, height: number): boolean {
  const b = bedButton(width, height);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.15;
}

/** Where the bed goes: on the den floor, in the middle, with room for the curled-up dragon. */
export function bedSpot(width: number, height: number): Point {
  return { x: width * 0.5, y: height * 0.7 };
}

/** A moon to go to bed, or a sun to wake up. */
export function drawBedButton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  inBed: boolean,
  time: number,
): void {
  const b = bedButton(width, height);
  const glowColor = inBed ? "255,210,122" : "183,160,255";
  const glow = ctx.createRadialGradient(b.x, b.y, b.r * 0.5, b.x, b.y, b.r * 1.5);
  glow.addColorStop(0, `rgba(${glowColor},0.25)`);
  glow.addColorStop(1, `rgba(${glowColor},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = `rgba(${glowColor},0.75)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const s = b.r * 0.5;
  ctx.save();
  ctx.translate(b.x, b.y + Math.sin(time * 2) * b.r * 0.04);
  if (inBed) {
    // Sun: tap to wake up.
    ctx.strokeStyle = "#ffd27a";
    ctx.lineWidth = s * 0.16;
    ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + time * 0.3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s * 0.75, Math.sin(a) * s * 0.75);
      ctx.lineTo(Math.cos(a) * s * 1.05, Math.sin(a) * s * 1.05);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffe6ad";
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Moon with a nightcap star: tap for bedtime.
    ctx.fillStyle = "#e6dcff";
    ctx.beginPath();
    ctx.arc(-s * 0.1, 0, s * 0.85, -0.25 * Math.PI, 1.55 * Math.PI, false);
    ctx.arc(s * 0.3, -s * 0.25, s * 0.7, 1.12 * Math.PI, 0.25 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd27a";
    ctx.beginPath();
    ctx.arc(s * 0.6, s * 0.45, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Lights down: the screen dims, with a soft pool of light around the bed. */
export function drawNight(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
  bed: Point,
): void {
  if (amount <= 0) return;
  const r = Math.max(width, height);
  const g = ctx.createRadialGradient(bed.x, bed.y, r * 0.08, bed.x, bed.y, r * 0.75);
  g.addColorStop(0, `rgba(8,6,30,${(0.15 * amount).toFixed(3)})`);
  g.addColorStop(1, `rgba(8,6,30,${(0.6 * amount).toFixed(3)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

/** A plump round cushion with stitching and little tassels, centred on `bed`. */
export function drawBed(
  ctx: CanvasRenderingContext2D,
  bed: Point,
  size: number,
  amount: number,
): void {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.translate(bed.x, bed.y);
  const rx = size * 1.15;
  const ry = size * 0.55;
  ctx.fillStyle = "rgba(183,160,255,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, ry * 0.25, rx * 1.25, ry * 1.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b4fb8";
  ctx.beginPath();
  ctx.ellipse(0, ry * 0.18, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8f73d9";
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.97, ry * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,240,255,0.55)";
  ctx.setLineDash([size * 0.06, size * 0.06]);
  ctx.lineWidth = Math.max(1, size * 0.025);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.8, ry * 0.72, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffd27a";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * rx * 0.97, ry * 0.1, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
