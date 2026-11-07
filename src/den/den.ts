import { mix } from "../noodle/drawBody";
import { hsl, seededRandom, shade, type Hsl } from "../noodle/look";
import type { Point } from "../noodle/spine";
import { lightInSky, skyAt, type Sky } from "./timeOfDay";

/** How far each layer drifts as the dragon moves (0 = fixed): far things move least. */
const PARALLAX = { sky: 0.015, hills: 0.035, walls: 0.06, floor: 0.085, vines: 0.11 };
/** Extra room around each painted layer, so it can drift without showing an edge. */
const MARGIN = 70;

interface Glow {
  x: number;
  y: number;
  r: number;
  hue: number;
  phase: number;
}

type LayerName = "sky" | "hills" | "walls" | "floor" | "vines";

/**
 * The den: a cozy cave with a big arched opening onto the hills and sky, glowing crystals in
 * the walls, glowing mushrooms on a mossy floor, hanging lantern vines and fireflies. Layers are
 * painted once into hidden canvases (redone on resize, and every 15 minutes of sky time) and slid
 * slightly at different speeds as the dragon moves, so the den feels deep.
 */
export class Den {
  private layers = new Map<LayerName, HTMLCanvasElement>();
  private paintedFor = "";
  private skyKey = "";
  private crystals: Glow[] = [];
  private mushrooms: Glow[] = [];
  private bulbs: Glow[] = [];
  private focus: Point | null = null;

  /** Where the floor starts (as a share of the screen height): the dragon's home ground. */
  static readonly FLOOR = 0.8;

  draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dpr: number,
    hour: number,
    dragonAt: Point,
    time: number,
  ): void {
    const size = `${w}x${h}@${dpr}`;
    if (size !== this.paintedFor) {
      this.paintStatic(w, h, dpr);
      this.paintedFor = size;
      this.skyKey = "";
    }
    const key = String(Math.round(hour * 4));
    const sky = skyAt(hour);
    if (key !== this.skyKey) {
      this.paintSky(w, h, dpr, hour, sky);
      this.skyKey = key;
    }

    // The view drifts gently after the dragon.
    if (!this.focus) this.focus = { ...dragonAt };
    this.focus.x += (dragonAt.x - this.focus.x) * 0.03;
    this.focus.y += (dragonAt.y - this.focus.y) * 0.03;
    const dx = this.focus.x - w / 2;
    const dy = this.focus.y - h / 2;
    const at = (f: number) => ({ x: -MARGIN - dx * f, y: -MARGIN - dy * f });
    const blit = (name: LayerName, f: number) => {
      const o = at(f);
      ctx.drawImage(this.layers.get(name)!, o.x, o.y, w + MARGIN * 2, h + MARGIN * 2);
    };

    blit("sky", PARALLAX.sky);
    blit("hills", PARALLAX.hills);
    blit("walls", PARALLAX.walls);
    this.drawGlows(ctx, this.crystals, at(PARALLAX.walls), sky.dark, time, 1.0);
    blit("floor", PARALLAX.floor);
    this.drawGlows(ctx, this.mushrooms, at(PARALLAX.floor), sky.dark, time, 0.8);
    blit("vines", PARALLAX.vines);
    this.drawGlows(ctx, this.bulbs, at(PARALLAX.vines), sky.dark, time, 0.7);
    this.drawFireflies(ctx, w, h, sky, time);
  }

  private layer(name: LayerName, w: number, h: number, dpr: number): CanvasRenderingContext2D {
    let c = this.layers.get(name);
    if (!c) {
      c = document.createElement("canvas");
      this.layers.set(name, c);
    }
    c.width = Math.round((w + MARGIN * 2) * dpr);
    c.height = Math.round((h + MARGIN * 2) * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, MARGIN * dpr, MARGIN * dpr);
    return ctx;
  }

  /** The arched opening in the cave wall, as a path. */
  private arch(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const left = w * 0.13;
    const right = w * 0.87;
    const spring = h * 0.42;
    const top = h * 0.07;
    const floor = h * Den.FLOOR + 10;
    const r = seededRandom(31);
    ctx.beginPath();
    ctx.moveTo(left, floor);
    // Lumpy rock edge up the left side, over the top, and down the right.
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = Math.PI + t * Math.PI;
      const x = w / 2 + (Math.cos(a) * (right - left)) / 2;
      const y = spring + Math.sin(a) * (spring - top);
      const lump = (r() - 0.5) * 14;
      if (i === 0) ctx.lineTo(left + lump, spring);
      ctx.lineTo(x + lump, y + lump * 0.6);
    }
    ctx.lineTo(right, floor);
    ctx.closePath();
  }

  private paintStatic(w: number, h: number, dpr: number): void {
    const rnd = seededRandom(4242);
    const rock: Hsl = { h: 256, s: 32, l: 13 };

    // --- Walls: dark rock everywhere except the arched opening, with crystal clusters. ---
    const walls = this.layer("walls", w, h, dpr);
    walls.fillStyle = hsl(rock);
    walls.fillRect(-MARGIN, -MARGIN, w + MARGIN * 2, h + MARGIN * 2);
    walls.globalCompositeOperation = "destination-out";
    this.arch(walls, w, h);
    walls.fill();
    walls.globalCompositeOperation = "source-over";
    // A lighter rim around the opening, and soft rock bumps on the walls.
    this.arch(walls, w, h);
    walls.strokeStyle = hsl(shade(rock, 12, 5));
    walls.lineWidth = 6;
    walls.stroke();
    for (let i = 0; i < 26; i++) {
      const x = rnd() < 0.5 ? rnd() * w * 0.14 : w * 0.86 + rnd() * w * 0.14;
      const y = rnd() * h * Den.FLOOR;
      walls.fillStyle = hsl(shade(rock, 3 + rnd() * 5));
      walls.beginPath();
      walls.ellipse(x, y, 20 + rnd() * 40, 14 + rnd() * 26, rnd() * 3, 0, Math.PI * 2);
      walls.fill();
    }
    this.crystals = [];
    for (let c = 0; c < 7; c++) {
      const leftSide = c % 2 === 0;
      const cx = leftSide ? w * (0.03 + rnd() * 0.08) : w * (0.89 + rnd() * 0.08);
      const cy = h * (0.15 + rnd() * 0.6);
      const hue = [187, 320, 45, 270][Math.floor(rnd() * 4)];
      const size = 12 + rnd() * 16;
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k - 1) * 0.5 + (rnd() - 0.5) * 0.3;
        drawCrystal(walls, cx + (k - 1) * size * 0.45, cy, size * (k === 1 ? 1.3 : 0.9), a, hue);
      }
      this.crystals.push({ x: cx, y: cy - size * 0.5, r: size * 3, hue, phase: rnd() * 6 });
    }

    // --- Floor: a soft mossy ground across the bottom, with grass and glowing mushrooms. ---
    const floor = this.layer("floor", w, h, dpr);
    const top = h * Den.FLOOR;
    const moss = floor.createLinearGradient(0, top - 20, 0, h + MARGIN);
    moss.addColorStop(0, "hsl(150 35% 22%)");
    moss.addColorStop(0.25, "hsl(160 32% 15%)");
    moss.addColorStop(1, "hsl(250 30% 9%)");
    floor.fillStyle = moss;
    floor.beginPath();
    floor.moveTo(-MARGIN, h + MARGIN);
    for (let x = -MARGIN; x <= w + MARGIN; x += 20) {
      floor.lineTo(x, top + Math.sin(x * 0.013) * 10 + Math.sin(x * 0.041) * 5);
    }
    floor.lineTo(w + MARGIN, h + MARGIN);
    floor.closePath();
    floor.fill();
    floor.strokeStyle = "hsl(140 40% 32%)";
    floor.lineCap = "round";
    floor.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w;
      const y = top + Math.sin(x * 0.013) * 10 + 4 + rnd() * 6;
      const tall = 6 + rnd() * 10;
      floor.beginPath();
      floor.moveTo(x, y);
      floor.quadraticCurveTo(x + 3, y - tall * 0.6, x + (rnd() - 0.5) * 8, y - tall);
      floor.stroke();
    }
    this.mushrooms = [];
    for (let i = 0; i < 6; i++) {
      const x = (i < 3 ? 0.04 + rnd() * 0.25 : 0.7 + rnd() * 0.26) * w;
      const y = top + Math.sin(x * 0.013) * 10 + 6;
      const s = 7 + rnd() * 9;
      const hue = rnd() < 0.5 ? 320 : 187;
      drawMushroom(floor, x, y, s, hue);
      this.mushrooms.push({ x, y: y - s * 1.3, r: s * 3.2, hue, phase: rnd() * 6 });
    }

    // --- Vines: hanging from the top of the arch on both sides, with little lantern bulbs. ---
    const vines = this.layer("vines", w, h, dpr);
    this.bulbs = [];
    vines.strokeStyle = "hsl(150 35% 26%)";
    vines.lineWidth = 3;
    vines.lineCap = "round";
    for (let v = 0; v < 6; v++) {
      const side = v < 3 ? 0 : 1;
      const x0 = side === 0 ? w * (0.05 + v * 0.06) : w * (0.95 - (v - 3) * 0.06);
      const length = h * (0.12 + rnd() * 0.16);
      vines.beginPath();
      vines.moveTo(x0, -MARGIN);
      const sway = (rnd() - 0.5) * 30;
      vines.bezierCurveTo(x0 + sway, length * 0.3, x0 - sway, length * 0.7, x0, length);
      vines.stroke();
      for (let leaf = 0; leaf < 4; leaf++) {
        const ly = (length * (leaf + 0.6)) / 4.5;
        vines.fillStyle = "hsl(145 40% 30%)";
        vines.beginPath();
        vines.ellipse(x0 + (leaf % 2 ? 7 : -7), ly, 7, 3.5, leaf % 2 ? 0.6 : -0.6, 0, Math.PI * 2);
        vines.fill();
      }
      const hue = [45, 320, 187][v % 3];
      vines.fillStyle = `hsl(${hue} 90% 80%)`;
      vines.beginPath();
      vines.arc(x0, length + 6, 6, 0, Math.PI * 2);
      vines.fill();
      this.bulbs.push({ x: x0, y: length + 6, r: 30, hue, phase: rnd() * 6 });
    }
  }

  private paintSky(w: number, h: number, dpr: number, hour: number, sky: Sky): void {
    const ctx = this.layer("sky", w, h, dpr);
    const g = ctx.createLinearGradient(0, -MARGIN, 0, h * Den.FLOOR);
    g.addColorStop(0, hsl(sky.top));
    g.addColorStop(1, hsl(sky.bottom));
    ctx.fillStyle = g;
    ctx.fillRect(-MARGIN, -MARGIN, w + MARGIN * 2, h + MARGIN * 2);
    const rnd = seededRandom(77);
    for (let i = 0; i < 110; i++) {
      const x = rnd() * w;
      const y = rnd() * h * 0.75;
      const a = sky.stars * (0.3 + rnd() * 0.65);
      if (a < 0.02) continue;
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + rnd() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const light = lightInSky(hour);
    if (light) {
      const x = w * light.x;
      const y = h * 0.42 * light.y + h * 0.08;
      const r = Math.min(w, h) * 0.05;
      const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 4);
      const tint = light.kind === "moon" ? "230,225,255" : "255,230,200";
      glow.addColorStop(0, `rgba(${tint},0.35)`);
      glow.addColorStop(1, `rgba(${tint},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = light.kind === "moon" ? "#f1ecff" : "#ffe9cf";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (light.kind === "moon") {
        ctx.fillStyle = "rgba(200,190,240,0.5)";
        for (const [cx, cy, cr] of [
          [-0.3, -0.2, 0.22],
          [0.25, 0.25, 0.16],
          [0.1, -0.35, 0.1],
        ]) {
          ctx.beginPath();
          ctx.arc(x + cx * r, y + cy * r, cr * r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Two rows of soft hills, tinted by the sky so they belong to the same moment.
    const hills = this.layer("hills", w, h, dpr);
    const rows: [number, number, number][] = [
      [0.6, 0.006, 26],
      [0.68, 0.009, 18],
    ];
    rows.forEach(([base, freq, amp], i) => {
      // Halfway between the sky's glow and a soft violet, a little darker for the nearer row.
      const c = mix(sky.bottom, { h: 262, s: 35, l: 22 }, 0.55);
      hills.fillStyle = hsl({ h: c.h, s: c.s * 0.8, l: Math.max(11 - i * 2, c.l - 8 - i * 6) });
      hills.beginPath();
      hills.moveTo(-MARGIN, h + MARGIN);
      for (let x = -MARGIN; x <= w + MARGIN; x += 16) {
        hills.lineTo(
          x,
          h * base - Math.sin(x * freq + i * 2) * amp - Math.sin(x * freq * 2.7) * amp * 0.4,
        );
      }
      hills.lineTo(w + MARGIN, h + MARGIN);
      hills.closePath();
      hills.fill();
    });
  }

  /** Soft pulsing glows, brighter in the dark. */
  private drawGlows(
    ctx: CanvasRenderingContext2D,
    glows: Glow[],
    off: Point,
    dark: number,
    time: number,
    strength: number,
  ): void {
    for (const g of glows) {
      const x = g.x + off.x + MARGIN;
      const y = g.y + off.y + MARGIN;
      const pulse = 0.75 + 0.25 * Math.sin(time * 1.4 + g.phase);
      const a = (0.1 + 0.35 * dark) * pulse * strength;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, g.r);
      grad.addColorStop(0, `hsla(${g.hue} 95% 75% / ${a.toFixed(3)})`);
      grad.addColorStop(1, `hsla(${g.hue} 95% 75% / 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, g.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Fireflies drift about at night; by day they're faint floating motes. */
  private drawFireflies(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    sky: Sky,
    time: number,
  ): void {
    for (let i = 0; i < 14; i++) {
      const x = w * (0.5 + 0.42 * Math.sin(time * 0.07 * (1 + (i % 3) * 0.3) + i * 2.1));
      const y = h * (0.45 + 0.3 * Math.sin(time * 0.11 * (1 + (i % 4) * 0.2) + i * 1.3));
      const blink = 0.5 + 0.5 * Math.sin(time * (1.5 + (i % 5) * 0.4) + i);
      const a = (0.15 + 0.7 * sky.dark) * blink;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 9);
      grad.addColorStop(0, `rgba(255,240,170,${a.toFixed(3)})`);
      grad.addColorStop(1, "rgba(255,240,170,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A pointed glowing crystal. */
function drawCrystal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  hue: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.32, -size * 0.25);
  ctx.lineTo(size * 0.22, size * 0.2);
  ctx.lineTo(-size * 0.22, size * 0.2);
  ctx.lineTo(-size * 0.32, -size * 0.25);
  ctx.closePath();
  ctx.fillStyle = `hsl(${hue} 85% 68%)`;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.12, -size * 0.25);
  ctx.lineTo(0, size * 0.2);
  ctx.closePath();
  ctx.fillStyle = `hsl(${hue} 90% 88%)`;
  ctx.fill();
  ctx.restore();
}

/** A little glowing mushroom with dots on its cap. */
function drawMushroom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  hue: number,
): void {
  ctx.fillStyle = "hsl(40 40% 85%)";
  ctx.beginPath();
  ctx.roundRect(x - s * 0.25, y - s * 1.2, s * 0.5, s * 1.2, s * 0.2);
  ctx.fill();
  ctx.fillStyle = `hsl(${hue} 85% 68%)`;
  ctx.beginPath();
  ctx.ellipse(x, y - s * 1.2, s * 0.9, s * 0.6, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const [dx, dy] of [
    [-0.4, -1.45],
    [0.15, -1.6],
    [0.5, -1.35],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
}
