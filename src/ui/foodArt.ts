import type { FoodId } from "../care/food";

/** Main color of each food, used for crumbs. */
export const FOOD_COLOR: Record<FoodId, string> = {
  noodles: "#ffd27a",
  dumpling: "#fff1d6",
  fish: "#ff9f6e",
};

/** Draws a food centered at (x, y), about 2s wide. All code-drawn, no image files. */
export function drawFood(
  ctx: CanvasRenderingContext2D,
  id: FoodId,
  x: number,
  y: number,
  s: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (id === "noodles") drawNoodleBowl(ctx, s);
  else if (id === "dumpling") drawDumpling(ctx, s);
  else drawFish(ctx, s);
  ctx.restore();
}

function drawNoodleBowl(ctx: CanvasRenderingContext2D, s: number): void {
  // Chopsticks behind the bowl.
  ctx.strokeStyle = "#c98a5a";
  ctx.lineWidth = s * 0.09;
  for (const dx of [0.1, 0.32]) {
    ctx.beginPath();
    ctx.moveTo(dx * s, -s * 0.1);
    ctx.lineTo((dx + 0.55) * s, -s * 0.95);
    ctx.stroke();
  }
  // Noodles piled in a dome, with wavy lines.
  ctx.fillStyle = "#ffd27a";
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.05, s * 0.78, s * 0.42, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#e8a93c";
  ctx.lineWidth = s * 0.06;
  for (const y of [-0.3, -0.15]) {
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const px = (-0.6 + i * 0.15) * s;
      const py = (y + Math.sin(i * 1.6) * 0.05) * s;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // A soft-boiled egg half and a fishcake swirl on top.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-s * 0.3, -s * 0.32, s * 0.2, s * 0.15, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffb347";
  ctx.beginPath();
  ctx.arc(-s * 0.3, -s * 0.32, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe4f2";
  ctx.beginPath();
  ctx.arc(s * 0.25, -s * 0.3, s * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ff8ad8";
  ctx.lineWidth = s * 0.04;
  ctx.beginPath();
  ctx.arc(s * 0.25, -s * 0.3, s * 0.06, 0, Math.PI * 1.5);
  ctx.stroke();
  // Bowl.
  ctx.fillStyle = "#ff8ad8";
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, -s * 0.05);
  ctx.lineTo(s * 0.9, -s * 0.05);
  ctx.quadraticCurveTo(s * 0.85, s * 0.75, 0, s * 0.75);
  ctx.quadraticCurveTo(-s * 0.85, s * 0.75, -s * 0.9, -s * 0.05);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  for (const dx of [-0.4, 0, 0.4]) {
    ctx.beginPath();
    ctx.arc(dx * s, s * 0.3, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDumpling(ctx: CanvasRenderingContext2D, s: number): void {
  // A plump half-moon with pleats along the top.
  ctx.fillStyle = "#fff1d6";
  ctx.strokeStyle = "#d9b98a";
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, s * 0.35);
  ctx.quadraticCurveTo(-s * 0.85, -s * 0.75, 0, -s * 0.7);
  ctx.quadraticCurveTo(s * 0.85, -s * 0.75, s * 0.9, s * 0.35);
  ctx.quadraticCurveTo(0, s * 0.7, -s * 0.9, s * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const dx of [-0.45, -0.15, 0.15, 0.45]) {
    ctx.beginPath();
    ctx.moveTo(dx * s, -s * 0.62);
    ctx.quadraticCurveTo((dx + 0.08) * s, -s * 0.35, dx * s, -s * 0.15);
    ctx.stroke();
  }
  // A cute face, because everything here is cute.
  ctx.fillStyle = "#3a2a4a";
  for (const dx of [-0.25, 0.25]) {
    ctx.beginPath();
    ctx.arc(dx * s, s * 0.15, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,138,216,0.6)";
  for (const dx of [-0.45, 0.45]) {
    ctx.beginPath();
    ctx.ellipse(dx * s, s * 0.27, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFish(ctx: CanvasRenderingContext2D, s: number): void {
  // Tail.
  ctx.fillStyle = "#ff7a59";
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, 0);
  ctx.lineTo(-s * 0.95, -s * 0.45);
  ctx.quadraticCurveTo(-s * 0.8, 0, -s * 0.95, s * 0.45);
  ctx.closePath();
  ctx.fill();
  // Body.
  ctx.fillStyle = "#ff9f6e";
  ctx.beginPath();
  ctx.ellipse(s * 0.1, 0, s * 0.65, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  // Belly and fin.
  ctx.fillStyle = "#ffd9b8";
  ctx.beginPath();
  ctx.ellipse(s * 0.15, s * 0.16, s * 0.42, s * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff7a59";
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, -s * 0.38);
  ctx.quadraticCurveTo(s * 0.1, -s * 0.75, s * 0.35, -s * 0.38);
  ctx.closePath();
  ctx.fill();
  // Eye.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(s * 0.45, -s * 0.08, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1040";
  ctx.beginPath();
  ctx.arc(s * 0.48, -s * 0.08, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
}
