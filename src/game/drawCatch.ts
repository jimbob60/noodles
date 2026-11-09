import type { Point } from "../noodle/spine";
import { cornerButton } from "../ui/layout";
import { drawFood } from "../ui/foodArt";
import { COUNTDOWN, ROUND_TIME, type NoodleCatch } from "./noodleCatch";

/** The falling dumplings (golden ones glow) and the "+1" pops. */
export function drawFallers(ctx: CanvasRenderingContext2D, g: NoodleCatch, size: number): void {
  for (const f of g.fallers) {
    ctx.save();
    ctx.globalAlpha = f.landed > 0 ? Math.max(0, 1 - f.landed / 0.8) : 1;
    ctx.translate(
      f.x,
      f.y - (f.landed > 0 ? Math.sin(Math.min(1, f.landed * 3) * Math.PI) * 18 : 0),
    );
    ctx.rotate(Math.sin(f.spin) * 0.3);
    if (f.kind === "golden") {
      const glow = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size * 1.8);
      glow.addColorStop(0, "rgba(255,215,110,0.6)");
      glow.addColorStop(1, "rgba(255,215,110,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // A golden dumpling is the same dumpling, tinted gold, with a twinkle.
    if (f.kind === "golden")
      ctx.filter = "sepia(1) saturate(5) hue-rotate(-12deg) brightness(1.08)";
    drawFood(ctx, "dumpling", 0, 0, size);
    ctx.filter = "none";
    if (f.kind === "golden") {
      ctx.fillStyle = "#fffbe6";
      ctx.beginPath();
      ctx.arc(size * 0.5, -size * 0.55, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const p of g.pops) {
    ctx.globalAlpha = 1 - p.age / 0.9;
    ctx.font = `${Math.round(size * 1.1)}px "Pacifico", cursive`;
    ctx.fillStyle = p.text === "+3" ? "#ffd27a" : "#ffffff";
    ctx.fillText(p.text, p.x, p.y - 30 - p.age * 50);
  }
  ctx.globalAlpha = 1;
}

/** The timer bar and score at the top, the countdown, and the results card at the end. */
export function drawCatchHud(
  ctx: CanvasRenderingContext2D,
  g: NoodleCatch,
  w: number,
  h: number,
  best: number,
  coins: number,
): void {
  const top = w < 760 ? 140 : 24;
  const barW = Math.min(360, w * 0.6);
  // Score pill.
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.beginPath();
  ctx.roundRect(w / 2 - barW / 2, top, barW, 50, 25);
  ctx.fill();
  drawFood(ctx, "dumpling", w / 2 - barW / 2 + 32, top + 25, 15);
  ctx.font = '22px "Pacifico", cursive';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe6ad";
  ctx.fillText(String(g.score), w / 2 - barW / 2 + 56, top + 24);
  // Time left, as a draining glowing bar.
  const left = g.timeLeft / ROUND_TIME;
  const bx = w / 2 - barW / 2 + 110;
  const bw = barW - 130;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.roundRect(bx, top + 19, bw, 12, 6);
  ctx.fill();
  ctx.fillStyle = left < 0.2 ? "#ff8ad8" : "#7af3ff";
  ctx.beginPath();
  ctx.roundRect(bx, top + 19, Math.max(6, bw * left), 12, 6);
  ctx.fill();

  if (g.phase === "countdown") {
    const n = Math.max(1, Math.ceil(COUNTDOWN - g.clock));
    const t = 1 - ((COUNTDOWN - g.clock) % 1);
    ctx.font = `${Math.round(120 + t * 40)}px "Pacifico", cursive`;
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(255,138,216,${(1 - t * 0.6).toFixed(3)})`;
    ctx.fillText(String(n), w / 2, h * 0.42);
    ctx.font = "600 18px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Steer your dragon to catch the dumplings!", w / 2, h * 0.42 + 90);
  }

  if (g.phase === "done") {
    ctx.fillStyle = "rgba(8,6,30,0.55)";
    ctx.fillRect(0, 0, w, h);
    const cw = Math.min(380, w - 32);
    const ch = 230;
    const cx = w / 2 - cw / 2;
    const cy = h / 2 - ch / 2;
    ctx.fillStyle = "#1c1450";
    ctx.strokeStyle = "rgba(255,210,122,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 22);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '28px "Pacifico", cursive';
    ctx.fillStyle = "#ff8ad8";
    ctx.fillText(g.score > best ? "New best!" : "Yum!", w / 2, cy + 40);
    ctx.font = "600 18px system-ui, sans-serif";
    ctx.fillStyle = "#f3ecff";
    ctx.fillText(`Caught ${g.caught} dumplings · ${g.score} points`, w / 2, cy + 88);
    ctx.fillStyle = "#c9bdf0";
    ctx.font = "15px system-ui, sans-serif";
    ctx.fillText(`Best: ${Math.max(best, g.score)}`, w / 2, cy + 116);
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillStyle = "#ffe08a";
    ctx.fillText(`+${coins} 🪙`, w / 2, cy + 152);
    ctx.font = "600 15px system-ui, sans-serif";
    ctx.fillStyle = "#9dffc8";
    ctx.fillText("Tap to finish", w / 2, cy + 196);
  }
}

/** The game button: under the shop button, a little dumpling with a sparkle. */
export function gameButton(width: number, height: number): Point & { r: number } {
  return cornerButton(3, width, height);
}

export function drawGameButton(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const b = gameButton(width, height);
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = "rgba(255,138,216,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawFood(ctx, "dumpling", b.x, b.y + 2, b.r * 0.55);
  ctx.fillStyle = "#ffd27a";
  ctx.beginPath();
  ctx.arc(b.x + b.r * 0.55, b.y - b.r * 0.5, 3, 0, Math.PI * 2);
  ctx.fill();
}
