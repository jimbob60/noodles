import type { DecorItem, DecorKind } from "./decor";

/** The three colors of each decoration, as hues (each drawing sets its own lightness). */
const HUES: Record<DecorKind, [number, number, number]> = {
  lantern: [330, 42, 187],
  cushion: [270, 330, 155],
  plant: [20, 210, 45],
  jar: [45, 187, 320],
  rug: [320, 265, 175],
  lights: [45, 320, 187],
  crystal: [187, 290, 330],
  stool: [355, 270, 30],
  mobile: [45, 220, 300],
  tea: [330, 187, 45],
};

/** Size of a decoration for the screen: about the size of the dragon's head. */
export function decorSize(w: number, h: number): number {
  return Math.max(20, Math.min(40, Math.min(w, h) * 0.046));
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
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const draw = {
    lantern,
    cushion,
    plant,
    jar,
    rug,
    lights,
    crystal,
    stool,
    mobile,
    tea,
  }[kind];
  draw(ctx, s, hue, dark, time);
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

type Painter = (
  ctx: CanvasRenderingContext2D,
  s: number,
  hue: number,
  dark: number,
  time: number,
) => void;

const c = (hue: number, sat: number, light: number, a = 1) =>
  a >= 1 ? `hsl(${hue} ${sat}% ${light}%)` : `hsl(${hue} ${sat}% ${light}% / ${a})`;

function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  hue: number,
  a: number,
): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `hsla(${hue} 95% 75% / ${a.toFixed(3)})`);
  g.addColorStop(1, `hsla(${hue} 95% 75% / 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function shadow(ctx: CanvasRenderingContext2D, y: number, rx: number, ry: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function tassel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, s * 0.05);
  for (const dx of [-0.07, 0, 0.07]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * s, y + s * 0.28);
    ctx.stroke();
  }
}

/** A ribbed paper lantern with a gold cap, a knot and a tassel, gently swaying. */
const lantern: Painter = (ctx, s, hue, dark, time) => {
  ctx.rotate(Math.sin(time * 1.2 + hue) * 0.06);
  glow(ctx, 0, 0, s * 2.6, hue, 0.15 + 0.38 * dark);
  ctx.strokeStyle = "rgba(255,240,220,0.65)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.95);
  ctx.lineTo(0, -s * 1.6);
  ctx.stroke();
  // Paper shade, lit from inside.
  const g = ctx.createRadialGradient(-s * 0.15, -s * 0.1, s * 0.1, 0, 0, s * 0.85);
  g.addColorStop(0, c(hue, 90, 88));
  g.addColorStop(1, c(hue, 75, 64));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.78, s * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ribs.
  ctx.strokeStyle = c(hue, 55, 50, 0.7);
  ctx.lineWidth = Math.max(1, s * 0.045);
  for (const k of [0.25, 0.55, 0.85]) {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.78 * k, s * 0.72, 0, -Math.PI / 2, Math.PI / 2, side < 0);
      ctx.stroke();
    }
  }
  // Little painted flowers.
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  for (const [dx, dy] of [
    [-0.35, -0.15],
    [0.3, 0.2],
    [0.05, -0.38],
  ]) {
    for (let p = 0; p < 5; p++) {
      const a = (p * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(
        dx * s + Math.cos(a) * s * 0.06,
        dy * s + Math.sin(a) * s * 0.06,
        s * 0.04,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  // Gold caps top and bottom, the hanging knot and tassel.
  ctx.fillStyle = "#e8b54a";
  ctx.beginPath();
  ctx.roundRect(-s * 0.34, -s * 0.92, s * 0.68, s * 0.2, s * 0.06);
  ctx.roundRect(-s * 0.34, s * 0.7, s * 0.68, s * 0.2, s * 0.06);
  ctx.fill();
  ctx.fillStyle = "#ffe08a";
  ctx.fillRect(-s * 0.3, -s * 0.9, s * 0.6, s * 0.05);
  ctx.beginPath();
  ctx.arc(0, -s * 1.0, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  tassel(ctx, 0, s * 0.95, s * 1.6, c(hue, 80, 55));
};

/** A puffy cushion: stitched seam, gold corner tassels and a tufted button with creases. */
const cushion: Painter = (ctx, s, hue) => {
  shadow(ctx, s * 0.55, s * 1.25, s * 0.25);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-s * 1.05, -s * 0.15);
    ctx.bezierCurveTo(-s * 0.7, -s * 0.75, s * 0.7, -s * 0.75, s * 1.05, -s * 0.15);
    ctx.bezierCurveTo(s * 1.25, s * 0.15, s * 1.15, s * 0.45, s * 0.95, s * 0.5);
    ctx.bezierCurveTo(s * 0.4, s * 0.72, -s * 0.4, s * 0.72, -s * 0.95, s * 0.5);
    ctx.bezierCurveTo(-s * 1.15, s * 0.45, -s * 1.25, s * 0.15, -s * 1.05, -s * 0.15);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, -s * 0.6, 0, s * 0.65);
  g.addColorStop(0, c(hue, 65, 76));
  g.addColorStop(1, c(hue, 55, 52));
  body();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = c(hue, 45, 40);
  ctx.lineWidth = Math.max(1.2, s * 0.06);
  ctx.stroke();
  // Stitched seam just inside the edge.
  ctx.save();
  ctx.scale(0.86, 0.8);
  body();
  ctx.restore();
  ctx.setLineDash([s * 0.08, s * 0.07]);
  ctx.strokeStyle = c(hue, 70, 88, 0.85);
  ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.stroke();
  ctx.setLineDash([]);
  // Creases running into the button, and the button.
  ctx.strokeStyle = c(hue, 45, 45, 0.6);
  ctx.lineWidth = Math.max(1, s * 0.04);
  for (const a of [0.4, 1.3, 2.2, 3.3, 4.4, 5.4]) {
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * s * 0.12, s * 0.05 + Math.sin(a) * s * 0.08);
    ctx.quadraticCurveTo(
      Math.cos(a) * s * 0.3,
      s * 0.05 + Math.sin(a) * s * 0.12,
      Math.cos(a) * s * 0.45,
      s * 0.05 + Math.sin(a) * s * 0.25,
    );
    ctx.stroke();
  }
  ctx.fillStyle = c(hue, 50, 42);
  ctx.beginPath();
  ctx.arc(0, s * 0.05, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c(hue, 60, 75);
  ctx.beginPath();
  ctx.arc(-s * 0.03, s * 0.02, s * 0.04, 0, Math.PI * 2);
  ctx.fill();
  // A shine along the top.
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = Math.max(1.5, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, -s * 0.38);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.52, s * 0.25, -s * 0.45);
  ctx.stroke();
  for (const [tx, ty] of [
    [-1.05, -0.15],
    [1.05, -0.15],
    [-0.95, 0.5],
    [0.95, 0.5],
  ]) {
    tassel(ctx, tx * s, ty * s, s, "#e8b54a");
  }
};

/** A leafy plant with veined leaves and a little flower, in a painted pot. */
const plant: Painter = (ctx, s, hue) => {
  shadow(ctx, s * 0.62, s * 0.6, s * 0.15);
  const leaves: [number, number, number][] = [
    [-1.0, 1.0, 140],
    [-0.45, 1.35, 150],
    [0.15, 1.45, 135],
    [0.7, 1.15, 155],
    [1.1, 0.8, 145],
  ];
  for (const [a, len, h] of leaves) {
    ctx.save();
    ctx.translate(0, -s * 0.22);
    ctx.rotate(a);
    ctx.fillStyle = c(h, 45, 40);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.32, -s * len * 0.5, 0, -s * len);
    ctx.quadraticCurveTo(-s * 0.32, -s * len * 0.5, 0, 0);
    ctx.fill();
    ctx.strokeStyle = c(h, 45, 60, 0.8);
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -s * len * 0.9);
    for (let v = 1; v <= 3; v++) {
      const vy = (-s * len * v) / 4;
      ctx.moveTo(0, vy);
      ctx.lineTo(s * 0.12, vy - s * 0.1);
      ctx.moveTo(0, vy);
      ctx.lineTo(-s * 0.12, vy - s * 0.1);
    }
    ctx.stroke();
    ctx.restore();
  }
  // A little flower peeking out.
  ctx.save();
  ctx.translate(s * 0.25, -s * 1.15);
  ctx.fillStyle = "#ffb3e6";
  for (let p = 0; p < 5; p++) {
    const a = (p * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(a) * s * 0.12,
      Math.sin(a) * s * 0.12,
      s * 0.1,
      s * 0.07,
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = "#ffe08a";
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Pot: tapered, with a rim, a painted band of dots, and soil.
  ctx.fillStyle = c(hue, 55, 58);
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, -s * 0.18);
  ctx.lineTo(s * 0.55, -s * 0.18);
  ctx.lineTo(s * 0.42, s * 0.62);
  ctx.quadraticCurveTo(0, s * 0.7, -s * 0.42, s * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c(hue, 55, 48);
  ctx.fillRect(-s * 0.5, s * 0.15, s * 1.0, s * 0.14);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (let d = -2; d <= 2; d++) {
    ctx.beginPath();
    ctx.arc(d * s * 0.18, s * 0.22, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = c(hue, 60, 70);
  ctx.beginPath();
  ctx.roundRect(-s * 0.64, -s * 0.34, s * 1.28, s * 0.2, s * 0.06);
  ctx.fill();
  ctx.fillStyle = "#4a3326";
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.33, s * 0.5, s * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(-s * 0.42, -s * 0.12, s * 0.08, s * 0.6);
};

/** A shiny glass jar of fireflies with a cork tied with string and a heart label. */
const jar: Painter = (ctx, s, hue, dark, time) => {
  glow(ctx, 0, 0, s * 2.1, hue, 0.12 + 0.32 * dark);
  ctx.fillStyle = "rgba(200,230,255,0.16)";
  ctx.strokeStyle = "rgba(220,240,255,0.75)";
  ctx.lineWidth = Math.max(1.2, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s * 0.62);
  ctx.quadraticCurveTo(-s * 0.62, -s * 0.5, -s * 0.6, -s * 0.2);
  ctx.lineTo(-s * 0.6, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.6, s * 0.72, -s * 0.35, s * 0.72);
  ctx.lineTo(s * 0.35, s * 0.72);
  ctx.quadraticCurveTo(s * 0.6, s * 0.72, s * 0.6, s * 0.5);
  ctx.lineTo(s * 0.6, -s * 0.2);
  ctx.quadraticCurveTo(s * 0.62, -s * 0.5, s * 0.4, -s * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Fireflies drifting inside, each with its own little glow.
  for (let i = 0; i < 5; i++) {
    const fx = Math.sin(time * (1.3 + i * 0.4) + i * 2) * s * 0.32;
    const fy = Math.cos(time * (1.1 + i * 0.3) + i) * s * 0.38 + s * 0.12;
    const blink = 0.55 + 0.45 * Math.sin(time * 3 + i * 1.7);
    glow(ctx, fx, fy, s * 0.22, hue, 0.5 * blink);
    ctx.fillStyle = `hsla(${hue} 100% 88% / ${blink.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(fx, fy, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  // Heart label.
  ctx.fillStyle = "rgba(255,245,230,0.9)";
  ctx.beginPath();
  ctx.roundRect(-s * 0.3, s * 0.18, s * 0.6, s * 0.36, s * 0.06);
  ctx.fill();
  ctx.fillStyle = "#ff8ad8";
  const hs = s * 0.11;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.45);
  ctx.bezierCurveTo(
    -hs * 1.6,
    s * 0.36 - hs * 0.1,
    -hs * 0.8,
    s * 0.36 - hs * 1.3,
    0,
    s * 0.36 - hs * 0.4,
  );
  ctx.bezierCurveTo(hs * 0.8, s * 0.36 - hs * 1.3, hs * 1.6, s * 0.36 - hs * 0.1, 0, s * 0.45);
  ctx.fill();
  // Cork with a tied string.
  ctx.fillStyle = "#c98a5a";
  ctx.beginPath();
  ctx.roundRect(-s * 0.36, -s * 0.9, s * 0.72, s * 0.3, s * 0.08);
  ctx.fill();
  ctx.fillStyle = "#a96d43";
  for (const [dx, dy] of [
    [-0.15, -0.8],
    [0.12, -0.72],
    [0.22, -0.84],
  ]) {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, s * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#f3e2c0";
  ctx.lineWidth = Math.max(1, s * 0.04);
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, -s * 0.6);
  ctx.lineTo(s * 0.42, -s * 0.6);
  ctx.moveTo(s * 0.3, -s * 0.6);
  ctx.quadraticCurveTo(s * 0.55, -s * 0.5, s * 0.45, -s * 0.35);
  ctx.moveTo(s * 0.3, -s * 0.6);
  ctx.quadraticCurveTo(s * 0.6, -s * 0.7, s * 0.6, -s * 0.48);
  ctx.stroke();
  // Glass shine.
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = Math.max(1.5, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, -s * 0.25);
  ctx.lineTo(-s * 0.45, s * 0.35);
  ctx.stroke();
};

/** A round woven rug: rings, a ring of diamonds, and a fringe all round. */
const rug: Painter = (ctx, s, hue) => {
  const rx = s * 2;
  const ry = s * 0.55;
  // Fringe.
  ctx.strokeStyle = c(hue, 40, 82);
  ctx.lineWidth = Math.max(1, s * 0.05);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * rx, Math.sin(a) * ry);
    ctx.lineTo(Math.cos(a) * rx * 1.08, Math.sin(a) * ry * 1.18);
    ctx.stroke();
  }
  for (const [r, l] of [
    [1, 50],
    [0.82, 66],
    [0.62, 50],
    [0.4, 72],
    [0.18, 56],
  ]) {
    ctx.fillStyle = c(hue, 50, l);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * r, ry * r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // A ring of little diamonds.
  ctx.fillStyle = c(hue, 70, 85);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x = Math.cos(a) * rx * 0.72;
    const y = Math.sin(a) * ry * 0.72;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.06);
    ctx.lineTo(x + s * 0.09, y);
    ctx.lineTo(x, y + s * 0.06);
    ctx.lineTo(x - s * 0.09, y);
    ctx.closePath();
    ctx.fill();
  }
  // Woven texture: faint stitch lines.
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let k = 0.3; k < 1; k += 0.14) {
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * k, ry * k, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
};

/** A string of fairy lights sagging between two hooks, the bulbs twinkling one by one. */
const lights: Painter = (ctx, s, hue, dark, time) => {
  const half = s * 2.4;
  const sag = s * 0.6;
  const at = (t: number) => ({
    x: -half + t * half * 2,
    y: Math.sin(t * Math.PI) * sag - sag * 0.3,
  });
  ctx.strokeStyle = "hsl(150 25% 30%)";
  ctx.lineWidth = Math.max(1.2, s * 0.05);
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) {
    const p = at(i / 20);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  // Little hooks at each end.
  ctx.fillStyle = "#e8b54a";
  for (const t of [0, 1]) {
    const p = at(t);
    ctx.beginPath();
    ctx.arc(p.x, p.y, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  const hues = [hue, (hue + 120) % 360, (hue + 240) % 360];
  for (let i = 1; i <= 8; i++) {
    const p = at(i / 9);
    const bh = hues[i % 3];
    const twinkle = 0.55 + 0.45 * Math.sin(time * 2.4 + i * 1.3);
    glow(ctx, p.x, p.y + s * 0.15, s * 0.5, bh, (0.2 + 0.4 * dark) * twinkle);
    ctx.fillStyle = "hsl(150 20% 25%)";
    ctx.fillRect(p.x - s * 0.04, p.y - s * 0.02, s * 0.08, s * 0.08);
    ctx.fillStyle = `hsla(${bh} 95% ${70 + 15 * twinkle}% / 1)`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + s * 0.17, s * 0.08, s * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
};

/** A glowing crystal cluster lamp on a little wooden stand. */
const crystal: Painter = (ctx, s, hue, dark, time) => {
  shadow(ctx, s * 0.65, s * 0.7, s * 0.16);
  glow(ctx, 0, -s * 0.3, s * 2.2, hue, (0.15 + 0.35 * dark) * (0.85 + 0.15 * Math.sin(time * 1.5)));
  // Wooden stand.
  ctx.fillStyle = "#8a5a3c";
  ctx.beginPath();
  ctx.roundRect(-s * 0.6, s * 0.3, s * 1.2, s * 0.35, s * 0.12);
  ctx.fill();
  ctx.fillStyle = "#a8714c";
  ctx.fillRect(-s * 0.55, s * 0.32, s * 1.1, s * 0.08);
  // Crystals, tallest in the middle, each with a bright facet.
  for (const [dx, tall, tilt] of [
    [-0.35, 0.8, -0.35],
    [0.35, 0.9, 0.3],
    [0, 1.35, 0],
    [-0.15, 0.6, -0.15],
    [0.2, 0.55, 0.2],
  ]) {
    ctx.save();
    ctx.translate(dx * s, s * 0.32);
    ctx.rotate(tilt);
    const h = s * tall;
    const wd = s * 0.22;
    ctx.fillStyle = c(hue, 80, 66);
    ctx.beginPath();
    ctx.moveTo(-wd, 0);
    ctx.lineTo(-wd, -h * 0.75);
    ctx.lineTo(0, -h);
    ctx.lineTo(wd, -h * 0.75);
    ctx.lineTo(wd, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c(hue, 90, 88);
    ctx.beginPath();
    ctx.moveTo(-wd * 0.2, 0);
    ctx.lineTo(-wd * 0.2, -h * 0.78);
    ctx.lineTo(0, -h);
    ctx.lineTo(wd * 0.35, -h * 0.75);
    ctx.lineTo(wd * 0.35, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // A sparkle that comes and goes.
  const tw = Math.max(0, Math.sin(time * 1.7 + hue));
  if (tw > 0.2) {
    ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(3)})`;
    const sx = s * 0.05;
    const sy = -s * 0.85;
    const r = s * 0.16 * tw;
    ctx.beginPath();
    ctx.moveTo(sx, sy - r);
    ctx.quadraticCurveTo(sx, sy, sx + r, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy + r);
    ctx.quadraticCurveTo(sx, sy, sx - r, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy - r);
    ctx.fill();
  }
};

/** A spotty mushroom stool, just the right size for a dragon to sit on. */
const stool: Painter = (ctx, s, hue) => {
  shadow(ctx, s * 0.62, s * 0.75, s * 0.17);
  // Stem with a little skirt ring.
  ctx.fillStyle = "#f3e6d0";
  ctx.beginPath();
  ctx.moveTo(-s * 0.35, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.45, s * 0.4, -s * 0.42, s * 0.6);
  ctx.lineTo(s * 0.42, s * 0.6);
  ctx.quadraticCurveTo(s * 0.45, s * 0.4, s * 0.35, -s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e2d0b3";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.05, s * 0.42, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cap: a flat-topped dome, with spots and a shine.
  const g = ctx.createLinearGradient(0, -s * 0.75, 0, 0);
  g.addColorStop(0, c(hue, 75, 66));
  g.addColorStop(1, c(hue, 70, 50));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-s * 0.95, -s * 0.1);
  ctx.bezierCurveTo(-s * 0.95, -s * 0.85, s * 0.95, -s * 0.85, s * 0.95, -s * 0.1);
  ctx.quadraticCurveTo(0, s * 0.05, -s * 0.95, -s * 0.1);
  ctx.fill();
  ctx.fillStyle = "rgba(255,250,240,0.92)";
  for (const [dx, dy, r] of [
    [-0.5, -0.35, 0.13],
    [0.05, -0.55, 0.16],
    [0.55, -0.3, 0.11],
    [-0.15, -0.2, 0.08],
    [0.35, -0.6, 0.07],
  ]) {
    ctx.beginPath();
    ctx.ellipse(dx * s, dy * s, r * s, r * s * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = Math.max(1.5, s * 0.06);
  ctx.beginPath();
  ctx.arc(0, -s * 0.15, s * 0.6, Math.PI * 1.2, Math.PI * 1.45);
  ctx.stroke();
};

/** A moon mobile: a crescent on a bar with little stars dangling and slowly turning. */
const mobile: Painter = (ctx, s, hue, dark, time) => {
  ctx.rotate(Math.sin(time * 0.6) * 0.08);
  ctx.strokeStyle = "rgba(255,240,220,0.6)";
  ctx.lineWidth = Math.max(1, s * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.2);
  ctx.lineTo(0, -s * 0.8);
  ctx.stroke();
  ctx.strokeStyle = "#c98a5a";
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.beginPath();
  ctx.moveTo(-s * 1.1, -s * 0.8);
  ctx.lineTo(s * 1.1, -s * 0.8);
  ctx.stroke();
  // Moon in the middle.
  glow(ctx, 0, -s * 0.1, s * 1.2, 50, 0.1 + 0.25 * dark);
  ctx.strokeStyle = "rgba(255,240,220,0.6)";
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.8);
  ctx.lineTo(0, -s * 0.5);
  ctx.stroke();
  ctx.fillStyle = "#fff1c4";
  ctx.beginPath();
  ctx.arc(-s * 0.05, -s * 0.1, s * 0.42, -0.25 * Math.PI, 1.55 * Math.PI, false);
  ctx.arc(s * 0.15, -s * 0.22, s * 0.35, 1.12 * Math.PI, 0.25 * Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3a2a4a";
  ctx.beginPath();
  ctx.arc(-s * 0.2, -s * 0.12, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  // Stars on strings at the ends of the bar and in between.
  for (const [dx, len, k] of [
    [-1.0, 0.9, 0],
    [-0.55, 0.55, 1],
    [0.55, 0.7, 2],
    [1.0, 0.45, 3],
  ]) {
    const x = dx * s;
    const y = -s * 0.8 + len * s;
    ctx.strokeStyle = "rgba(255,240,220,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, -s * 0.8);
    ctx.lineTo(x, y);
    ctx.stroke();
    const twinkle = 0.6 + 0.4 * Math.sin(time * 2 + k);
    glow(ctx, x, y, s * 0.35, hue, (0.15 + 0.3 * dark) * twinkle);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.8 + k);
    ctx.fillStyle = c(hue, 85, 75);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? s * 0.2 : s * 0.09;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};

/** A little tea set on a tray: a round teapot with steam, and two cups. */
const tea: Painter = (ctx, s, hue, _dark, time) => {
  shadow(ctx, s * 0.55, s * 1.4, s * 0.2);
  // Tray.
  ctx.fillStyle = "#8a5a3c";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.45, s * 1.35, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a8714c";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.4, s * 1.25, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Steam curling up from the spout.
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = Math.max(1.2, s * 0.05);
  for (let k = 0; k < 2; k++) {
    const t = (time * 0.6 + k * 0.5) % 1;
    ctx.globalAlpha = 1 - t;
    ctx.beginPath();
    ctx.moveTo(s * 0.68, -s * 0.25 - t * s * 0.6);
    ctx.quadraticCurveTo(s * 0.85, -s * 0.45 - t * s * 0.6, s * 0.7, -s * 0.65 - t * s * 0.6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Teapot: body, spout, handle, lid with a knob, and a painted heart.
  ctx.fillStyle = c(hue, 60, 70);
  ctx.strokeStyle = c(hue, 50, 50);
  ctx.lineWidth = Math.max(1.2, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(s * 0.3, s * 0.0);
  ctx.quadraticCurveTo(s * 0.6, -s * 0.05, s * 0.68, -s * 0.25);
  ctx.lineTo(s * 0.55, -s * 0.22);
  ctx.quadraticCurveTo(s * 0.45, -s * 0.05, s * 0.3, s * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-s * 0.48, s * 0.05, s * 0.18, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-s * 0.05, s * 0.08, s * 0.42, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c(hue, 60, 62);
  ctx.beginPath();
  ctx.ellipse(-s * 0.05, -s * 0.22, s * 0.25, s * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8b54a";
  ctx.beginPath();
  ctx.arc(-s * 0.05, -s * 0.3, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const hs = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(-s * 0.05, s * 0.18);
  ctx.bezierCurveTo(
    -s * 0.05 - hs * 1.6,
    s * 0.1,
    -s * 0.05 - hs * 0.8,
    s * 0.1 - hs * 1.3,
    -s * 0.05,
    s * 0.06,
  );
  ctx.bezierCurveTo(
    -s * 0.05 + hs * 0.8,
    s * 0.1 - hs * 1.3,
    -s * 0.05 + hs * 1.6,
    s * 0.1,
    -s * 0.05,
    s * 0.18,
  );
  ctx.fill();
  // Two cups with a little tea in each.
  for (const cx of [-0.95, 0.95]) {
    ctx.fillStyle = "#fff6ea";
    ctx.beginPath();
    ctx.moveTo((cx - 0.22) * s, s * 0.15);
    ctx.lineTo((cx + 0.22) * s, s * 0.15);
    ctx.lineTo((cx + 0.15) * s, s * 0.38);
    ctx.lineTo((cx - 0.15) * s, s * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#b9763f";
    ctx.beginPath();
    ctx.ellipse(cx * s, s * 0.16, s * 0.2, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c(hue, 60, 70);
    ctx.fillRect((cx - 0.17) * s, s * 0.26, s * 0.34, s * 0.04);
  }
};
