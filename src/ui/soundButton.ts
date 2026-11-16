import type { Point } from "../noodle/spine";
import { cornerButton } from "./layout";

/** The sound button (🔊/🔇): last in the top-right stack, always there. */
export function soundButton(width: number, height: number): Point & { r: number } {
  return cornerButton(9, width, height);
}

export function onSoundButton(p: Point, width: number, height: number): boolean {
  const b = soundButton(width, height);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.3;
}

/** A little speaker, with sound waves when on and a cross when off. */
export function drawSoundButton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  on: boolean,
): void {
  const b = soundButton(width, height);
  const s = b.r;
  ctx.save();
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = on ? "rgba(122,243,255,0.7)" : "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const color = on ? "#7af3ff" : "rgba(243,236,255,0.6)";
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const x = b.x - s * 0.22;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.38, b.y - s * 0.18);
  ctx.lineTo(x - s * 0.14, b.y - s * 0.18);
  ctx.lineTo(x + s * 0.14, b.y - s * 0.42);
  ctx.lineTo(x + s * 0.14, b.y + s * 0.42);
  ctx.lineTo(x - s * 0.14, b.y + s * 0.18);
  ctx.lineTo(x - s * 0.38, b.y + s * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, s * 0.1);
  ctx.lineCap = "round";
  ctx.beginPath();
  if (on) {
    for (const r of [0.3, 0.52]) {
      ctx.moveTo(x + s * (0.14 + r) * Math.cos(-0.7), b.y + s * (0.14 + r) * Math.sin(-0.7));
      ctx.arc(x + s * 0.14, b.y, s * r, -0.7, 0.7);
    }
  } else {
    const cx = x + s * 0.5;
    ctx.moveTo(cx - s * 0.17, b.y - s * 0.17);
    ctx.lineTo(cx + s * 0.17, b.y + s * 0.17);
    ctx.moveTo(cx + s * 0.17, b.y - s * 0.17);
    ctx.lineTo(cx - s * 0.17, b.y + s * 0.17);
  }
  ctx.stroke();
  ctx.restore();
}
