import { bodyProfile } from "./body";
import type { Face } from "./face";
import { forwardAt } from "./legs";
import type { DragonLook } from "./look";
import type { Point } from "./spine";

/**
 * The parts only holiday dragons have. Each function draws one special part and says whether it
 * replaced the ordinary one.
 */

const INK = "#3a2416";

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * A whole head that replaces the dragon's own: Pumpkin's jack-o'-lantern and Snowflake's
 * snowman. Drawn in head space (facing right, radius r). Returns false for everyone else.
 */
export function drawRareHead(
  ctx: CanvasRenderingContext2D,
  look: DragonLook,
  r: number,
  face: Face,
  time: number,
): boolean {
  const open = 1 - Math.min(1, face.blink);
  const asleep = face.asleep || face.blink > 0.75;
  const happy = face.mouthShape === "smile" || face.mouthOpen > 0.08;
  if (look.special === "pumpkin") {
    const cx = r * 0.2;
    const w = r * 1.25;
    const h = r * 1.05;
    // The stem and a curly vine on top, behind the pumpkin.
    ctx.strokeStyle = "#3f7a34";
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, -h * 0.85);
    ctx.quadraticCurveTo(cx - r * 0.05, -h * 1.25, cx - r * 0.3, -h * 1.3);
    ctx.stroke();
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.1, -h * 1.0);
    ctx.bezierCurveTo(cx - r * 0.9, -h * 1.5, cx - r * 1.0, -h * 0.7, cx - r * 0.75, -h * 0.95);
    ctx.stroke();
    // The pumpkin: an orange ball with ribs.
    ctx.beginPath();
    ctx.ellipse(cx, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ff8a1f";
    ctx.fill();
    ctx.strokeStyle = "#c95a0c";
    ctx.lineWidth = Math.max(1.2, r * 0.06);
    for (const k of [-0.62, -0.25, 0.25, 0.62]) {
      ctx.beginPath();
      ctx.ellipse(cx + k * w * 0.35, 0, w * (1 - Math.abs(k) * 0.75), h * 0.97, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineWidth = Math.max(1.5, r * 0.09);
    ctx.beginPath();
    ctx.ellipse(cx, 0, w, h, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Carved eyes and grin, lit by a flickering candle inside.
    const flicker = 0.82 + 0.18 * Math.sin(time * 9) * Math.sin(time * 5.3);
    const glow = `rgba(255,${Math.round(214 * flicker)},70,1)`;
    ctx.fillStyle = glow;
    ctx.strokeStyle = "#7a3206";
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.shadowColor = "rgba(255,200,60,0.9)";
    ctx.shadowBlur = r * 0.5 * flicker;
    for (const ex of [-0.12, 0.62]) {
      const x = cx + ex * r;
      const y = -r * 0.22;
      ctx.beginPath();
      if (asleep) {
        // Asleep or blinking: the eyes are just sleepy slits.
        ctx.rect(x - r * 0.2, y + r * 0.08, r * 0.4, r * 0.07);
      } else {
        ctx.moveTo(x, y - r * 0.3 * open);
        ctx.lineTo(x + r * 0.26, y + r * 0.16);
        ctx.lineTo(x - r * 0.26, y + r * 0.16);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
    }
    // A little triangle nose and a jagged grin (wider when happy or chomping).
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.27, r * 0.02);
    ctx.lineTo(cx + r * 0.38, r * 0.2);
    ctx.lineTo(cx + r * 0.16, r * 0.2);
    ctx.closePath();
    ctx.fill();
    const drop = r * (0.2 + (happy ? 0.12 : 0) + Math.min(1, face.mouthOpen) * 0.2);
    const x0 = cx - r * 0.55;
    const x1 = cx + r * 0.95;
    const y0 = r * 0.36;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    const teeth = 5;
    for (let k = 1; k <= teeth; k++) {
      const x = x0 + ((x1 - x0) * k) / teeth;
      ctx.lineTo(x - (x1 - x0) / teeth / 2, y0 + r * 0.12);
      ctx.lineTo(x, y0);
    }
    ctx.quadraticCurveTo((x0 + x1) / 2, y0 + drop * 2.4, x0, y0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    return true;
  }
  if (look.special === "snowflake") {
    const cx = r * 0.12;
    // A knitted scarf round the neck, its end trailing behind.
    ctx.strokeStyle = "#ff5a6e";
    ctx.lineCap = "round";
    ctx.lineWidth = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.75, r * 0.72);
    ctx.lineTo(cx + r * 0.45, r * 0.86);
    ctx.stroke();
    ctx.lineWidth = r * 0.26;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, r * 0.75);
    ctx.quadraticCurveTo(
      cx - r * 1.3,
      r * (1.0 + Math.sin(time * 3) * 0.08),
      cx - r * 1.45,
      r * (1.45 + Math.sin(time * 3) * 0.12),
    );
    ctx.stroke();
    // The snowball.
    ctx.beginPath();
    ctx.arc(cx, 0, r * 1.02, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#9cc4e8";
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, r * 0.2, r * 0.7, Math.PI * 0.25, Math.PI * 0.85);
    ctx.strokeStyle = "rgba(156,196,232,0.5)";
    ctx.stroke();
    // Coal eyes (sleepy lines when shut) and a coal smile.
    ctx.strokeStyle = "#20242e";
    ctx.lineWidth = Math.max(1.5, r * 0.09);
    for (const ex of [0.02, 0.6]) {
      const x = cx + ex * r;
      const y = -r * 0.25;
      if (asleep) {
        ctx.beginPath();
        ctx.arc(x, y, r * 0.12, Math.PI * 0.1, Math.PI * 0.9, !face.asleep);
        ctx.stroke();
      } else {
        dot(ctx, x, y, r * 0.13 * (0.5 + 0.5 * open), "#20242e");
        dot(ctx, x + r * 0.04, y - r * 0.05, r * 0.04, "#ffffff");
      }
    }
    const smile = happy ? 0.16 : 0.07;
    for (let k = 0; k < 5; k++) {
      const u = k / 4;
      dot(
        ctx,
        cx + r * (0.0 + u * 0.72),
        r * (0.4 + Math.sin(u * Math.PI) * smile * 1.6),
        r * 0.055,
        "#20242e",
      );
    }
    // The carrot nose, pointing the way it's going.
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.72, -r * 0.08);
    ctx.lineTo(cx + r * 1.65, r * 0.1);
    ctx.lineTo(cx + r * 0.72, r * 0.2);
    ctx.closePath();
    ctx.fillStyle = "#ff9230";
    ctx.fill();
    ctx.strokeStyle = "#c9620f";
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.stroke();
    // Rosy cheek.
    dot(ctx, cx + r * 0.3, r * 0.18, r * 0.14, "rgba(255,150,180,0.55)");
    return true;
  }
  return false;
}

/**
 * Extras on top of an ordinary head: Tinsel's glowing red nose and the lights on its antlers,
 * Gobble's wattle and pilgrim hat, Boo's round ghost eyes. `nose` is where the tip of the snout
 * is (it moves with the snout gene).
 */
export function drawRareFace(
  ctx: CanvasRenderingContext2D,
  look: DragonLook,
  r: number,
  nose: number,
  time: number,
): void {
  if (look.special === "tinsel") {
    const pulse = 0.75 + 0.25 * Math.sin(time * 4);
    dot(ctx, nose, -r * 0.03, r * 0.42 * pulse, "rgba(255,60,60,0.28)");
    dot(ctx, nose, -r * 0.03, r * 0.17, "#ff3b3b");
    dot(ctx, nose - r * 0.05, -r * 0.09, r * 0.05, "#ffffff");
    // Twinkling lights strung along the antlers.
    const bulbs = ["#ff5a6e", "#ffd96a", "#7af3ff", "#9dffc8", "#ff8ad8"];
    for (let k = 0; k < 6; k++) {
      const u = k / 5;
      const x = -r * (0.1 + u * 1.0);
      const y = -r * (0.85 + Math.sin(u * Math.PI * 0.6) * 0.75);
      const lit = Math.sin(time * 5 + k * 1.9) > -0.2;
      dot(ctx, x, y, r * 0.2, lit ? `${bulbs[k % 5]}55` : "rgba(0,0,0,0)");
      dot(ctx, x, y, r * 0.085, lit ? bulbs[k % 5] : "#5b6b62");
    }
  } else if (look.special === "gobble") {
    // A red wattle under the chin.
    ctx.beginPath();
    ctx.ellipse(r * 0.95, r * 0.62, r * 0.13, r * 0.26 + Math.sin(time * 6) * r * 0.03, 0.2, 0, 7);
    ctx.fillStyle = "#e23a3a";
    ctx.fill();
    // A pilgrim hat: black, with a wide brim and a gold buckle.
    ctx.save();
    ctx.translate(-r * 0.15, -r * 0.82);
    ctx.rotate(-0.2);
    ctx.fillStyle = "#23202b";
    ctx.strokeStyle = "#6d6480";
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.78, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 0.02);
    ctx.lineTo(-r * 0.32, -r * 0.8);
    ctx.lineTo(r * 0.32, -r * 0.8);
    ctx.lineTo(r * 0.42, -r * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#8a6a3a";
    ctx.fillRect(-r * 0.4, -r * 0.3, r * 0.8, r * 0.16);
    ctx.strokeStyle = "#ffd96a";
    ctx.lineWidth = Math.max(1.2, r * 0.07);
    ctx.strokeRect(-r * 0.13, -r * 0.34, r * 0.26, r * 0.24);
    ctx.restore();
  }
}

/** A special tail tip in place of the ordinary one. Returns false for everyone else. */
export function drawRareTail(
  ctx: CanvasRenderingContext2D,
  look: DragonLook,
  tip: Point,
  back: number,
  hw: number,
  time: number,
): boolean {
  const bx = Math.cos(back);
  const by = Math.sin(back);
  if (look.special === "gobble") {
    // A turkey's fan of feathers, in bands of gold, orange and red, swaying open.
    const spread = 1.25 + Math.sin(time * 2) * 0.08;
    const n = 7;
    for (let k = 0; k < n; k++) {
      const a = back + (k / (n - 1) - 0.5) * 2 * spread;
      const len = hw * 2.6;
      ctx.save();
      ctx.translate(tip.x, tip.y);
      ctx.rotate(a);
      for (const [u, w, color] of [
        [1, 0.42, "#7a3b1c"],
        [0.84, 0.36, "#e2542a"],
        [0.66, 0.3, "#ff9a2e"],
        [0.46, 0.24, "#ffd96a"],
      ] as const) {
        ctx.beginPath();
        ctx.ellipse(len * u * 0.5, 0, len * u * 0.5, hw * w, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1, hw * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len * 0.92, 0);
      ctx.stroke();
      ctx.restore();
    }
    return true;
  }
  if (look.special === "boo") {
    // A wispy ghost tail that fades away to nothing.
    for (let k = 0; k < 6; k++) {
      const u = k / 5;
      const wave = Math.sin(time * 3 + k * 0.9) * hw * 0.35 * u;
      dot(
        ctx,
        tip.x + bx * hw * u * 2.4 - by * wave,
        tip.y + by * hw * u * 2.4 + bx * wave,
        hw * (0.42 - u * 0.3),
        `rgba(235,242,255,${(0.75 * (1 - u)).toFixed(3)})`,
      );
    }
    return true;
  }
  if (look.special === "tinsel") {
    // A golden jingle bell.
    const x = tip.x + bx * hw * 0.7;
    const y = tip.y + by * hw * 0.7 + Math.sin(time * 5) * hw * 0.08;
    dot(ctx, x, y, hw * 0.62, "#ffd24a");
    ctx.strokeStyle = "#a9781a";
    ctx.lineWidth = Math.max(1.2, hw * 0.1);
    ctx.beginPath();
    ctx.arc(x, y, hw * 0.62, 0, Math.PI * 2);
    ctx.moveTo(x - hw * 0.5, y);
    ctx.lineTo(x + hw * 0.5, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + hw * 0.5);
    ctx.stroke();
    dot(ctx, x - hw * 0.22, y - hw * 0.26, hw * 0.13, "rgba(255,255,255,0.8)");
    return true;
  }
  if (look.special === "snowflake") {
    // A big six-armed snowflake, slowly spinning.
    const x = tip.x + bx * hw * 0.9;
    const y = tip.y + by * hw * 0.9;
    const R = hw * 1.25;
    ctx.strokeStyle = "#ffffff";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(160,220,255,0.9)";
    ctx.shadowBlur = hw * 0.6;
    ctx.lineWidth = Math.max(1.5, hw * 0.16);
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = time * 0.6 + (k * Math.PI) / 3;
      const ex = x + Math.cos(a) * R;
      const ey = y + Math.sin(a) * R;
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      for (const side of [-1, 1]) {
        const mx = x + Math.cos(a) * R * 0.62;
        const my = y + Math.sin(a) * R * 0.62;
        ctx.moveTo(mx, my);
        ctx.lineTo(
          mx + Math.cos(a + side * 0.9) * R * 0.3,
          my + Math.sin(a + side * 0.9) * R * 0.3,
        );
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    return true;
  }
  if (look.special === "pumpkin") {
    // A curly vine with a leaf.
    ctx.strokeStyle = "#3f7a34";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1.5, hw * 0.2);
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    const sway = Math.sin(time * 2.5) * 0.3;
    for (let k = 1; k <= 14; k++) {
      const u = k / 14;
      const a = back + u * 5.2 + sway * u;
      const rad = hw * (1.1 - u * 0.75);
      ctx.lineTo(
        tip.x + bx * hw * 1.2 * u + Math.cos(a) * rad * u,
        tip.y + by * hw * 1.2 * u + Math.sin(a) * rad * u,
      );
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      tip.x + bx * hw * 0.5 - by * hw * 0.5,
      tip.y + by * hw * 0.5 + bx * hw * 0.5,
      hw * 0.5,
      hw * 0.28,
      back + 0.8,
      0,
      7,
    );
    ctx.fillStyle = "#57a544";
    ctx.fill();
    return true;
  }
  return false;
}

/**
 * Things along a holiday dragon's body, drawn over it: Tinsel's string of blinking lights, and
 * the snowflakes or autumn leaves that drift off Snowflake and Gobble as they swim.
 */
export function drawRareBody(
  ctx: CanvasRenderingContext2D,
  look: DragonLook,
  p: Point[],
  hw: number,
  time: number,
): void {
  const n = p.length;
  if (look.special === "tinsel") {
    const bulbs = ["#ff5a6e", "#ffd96a", "#7af3ff", "#9dffc8", "#ff8ad8"];
    ctx.strokeStyle = "#1d3b2a";
    ctx.lineWidth = Math.max(1, hw * 0.06);
    const at = (i: number) => {
      const f = forwardAt(p, i);
      const w = hw * bodyProfile(i / (n - 1));
      const wave = i % 2 ? 0.55 : -0.2;
      return { x: p[i].x - f.y * w * wave, y: p[i].y + f.x * w * wave, w };
    };
    ctx.beginPath();
    for (let i = 3; i < n - 2; i++) {
      const q = at(i);
      if (i === 3) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
    for (let i = 3; i < n - 2; i++) {
      const q = at(i);
      // They blink in turn, like a chasing string of lights.
      const lit = (Math.floor(time * 3) + i) % 3 !== 0;
      const color = bulbs[i % 5];
      if (lit) dot(ctx, q.x, q.y, Math.max(3, q.w * 0.55), `${color}44`);
      dot(ctx, q.x, q.y, Math.max(1.5, q.w * 0.22), lit ? color : "#4d5f55");
    }
    return;
  }
  if (look.special !== "snowflake" && look.special !== "gobble") return;
  // Six little things drifting down and back from along the body, over and over.
  const leaves = ["#e2542a", "#ff9a2e", "#ffd96a", "#b5521f"];
  for (let k = 0; k < 6; k++) {
    const u = (time * 0.35 + k / 6) % 1;
    const i = Math.min(n - 1, 2 + ((k * 5) % Math.max(1, n - 3)));
    const x = p[i].x + Math.sin(time * 2 + k * 2.1) * hw * 0.8 + (k % 2 ? 1 : -1) * hw * u;
    const y = p[i].y + hw * (0.6 + u * 4.5);
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
    if (look.special === "snowflake") {
      dot(ctx, x, y, Math.max(1.2, hw * (0.1 + (k % 3) * 0.04)), "#ffffff");
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 2 + k);
      ctx.beginPath();
      ctx.ellipse(0, 0, hw * 0.3, hw * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = leaves[k % 4];
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}
