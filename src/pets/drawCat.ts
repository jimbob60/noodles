import { Cat } from "./cat";

const FUR = "#16121f";
const FUR_LIGHT = "#3d2c2f";
const RIM = "#6a58a0";
const EYE = "#b9f25c";

/** A fluffy closed shape: an oval whose edge ruffles in and out like long fur. */
function fluff(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tufts: number,
  ruffle: number,
  turn = 0,
): void {
  // Soft round tufts: each one bulges out between two points on the oval.
  const at = (a: number, k: number) => ({
    x: cx + Math.cos(a) * rx * k,
    y: cy + Math.sin(a) * ry * k,
  });
  const step = (Math.PI * 2) / tufts;
  const first = at(turn, 1 - ruffle * 0.3);
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let k = 1; k <= tufts; k++) {
    const bulge = at(turn + (k - 0.5) * step, 1 + ruffle * 1.3);
    const next = at(turn + k * step, 1 - ruffle * 0.3);
    ctx.quadraticCurveTo(bulge.x, bulge.y, next.x, next.y);
  }
  ctx.closePath();
}

/**
 * Draws Jinxy. She is drawn twice: first every shape with a thick soft-purple edge, then again
 * in black, so the whole cat gets one outline that shows up on the dark den floor.
 */
export function drawCat(
  ctx: CanvasRenderingContext2D,
  cat: Cat,
  world: { width: number; height: number },
): void {
  const s = Cat.size(world);
  const t = cat.time;
  const mood = cat.mood;
  const lying = mood === "nap";
  const walking = mood === "walk";
  const sitting = !lying && !walking;
  const purring = mood === "purr" || mood === "rub";
  const grooming = mood === "groom";

  ctx.save();
  ctx.translate(cat.x, cat.y);
  ctx.scale(cat.facing, 1);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Where things are in each pose (in units of s; x forward, y up is negative).
  const breathe = Math.sin(t * (lying ? 1.6 : 2.4)) * 0.02;
  const bob = walking ? Math.abs(Math.sin(t * 9)) * 0.05 : 0;
  const body = lying
    ? { x: 0, y: -0.45, rx: 1.12, ry: 0.5 + breathe }
    : walking
      ? { x: 0, y: -0.98 - bob, rx: 1.05, ry: 0.6 }
      : { x: -0.1, y: -0.88, rx: 0.78, ry: 0.9 + breathe };
  const lean = mood === "rub" ? Math.sin(cat.clock * 5) * 0.12 : 0;
  const nod = grooming ? 0.22 + Math.sin(t * 7) * 0.08 : 0;
  const head = lying
    ? { x: 0.78, y: -0.5, r: 0.56 }
    : walking
      ? { x: 1.02, y: -1.47 - bob, r: 0.6 }
      : { x: 0.36 + lean, y: -1.76 + nod, r: 0.62 };

  const shapes = (rim: boolean) => {
    const paint = () => {
      if (rim) {
        ctx.strokeStyle = RIM;
        ctx.lineWidth = s * 0.12;
        ctx.stroke();
      } else {
        ctx.fillStyle = FUR;
        ctx.fill();
      }
    };

    // The tail: a big plume, made of overlapping fluffy puffs along a curve.
    const swish = Math.sin(t * (purring ? 5 : 2.2)) * (lying ? 0.05 : 0.22);
    const tailAt = (k: number): { x: number; y: number; r: number } => {
      const u = k / 6;
      if (sitting) {
        // Sitting: her big plume of a tail sweeps out to the side behind her, the tip flicking.
        return {
          x: -0.55 - u * 1.25,
          y: -0.3 - u * u * 0.35 - swish * u * 0.5,
          r: 0.24 + Math.sin(u * Math.PI * 0.85) * 0.24,
        };
      }
      if (lying) {
        // Curled round her along the ground.
        const x = -0.85 + u * 1.75;
        const y = -0.2 - Math.sin(u * Math.PI) * 0.1 - (u > 0.8 ? swish * (u - 0.8) * 4 : 0);
        return { x: x * 0.9 + 0.1, y, r: 0.2 + Math.sin(u * Math.PI) * 0.16 };
      }
      // Held high and proud while she walks.
      const a = -Math.PI * (0.55 + u * 0.38) + swish * u;
      return {
        x: -0.95 + Math.cos(a) * u * 1.25 - u * 0.25,
        y: -1.05 + Math.sin(a) * u * 1.25,
        r: 0.18 + Math.sin(u * Math.PI * 0.9) * 0.24,
      };
    };
    for (let k = 0; k <= 6; k++) {
      const p = tailAt(k);
      fluff(ctx, p.x * s, p.y * s, p.r * s, p.r * s, 5, 0.3, k + t * 0.3);
      paint();
    }

    // Legs.
    if (walking) {
      for (const [x, phase] of [
        [-0.62, 0],
        [-0.32, Math.PI],
        [0.38, Math.PI],
        [0.68, 0],
      ]) {
        const swing = Math.sin(t * 9 + phase) * 0.22;
        const lift = Math.max(0, Math.sin(t * 9 + phase + Math.PI / 2)) * 0.12;
        ctx.beginPath();
        ctx.moveTo(x * s, -0.75 * s);
        ctx.lineTo((x + swing) * s, (-0.1 - lift) * s);
        if (rim) {
          ctx.strokeStyle = RIM;
          ctx.lineWidth = s * 0.44;
        } else {
          ctx.strokeStyle = FUR;
          ctx.lineWidth = s * 0.28;
        }
        ctx.stroke();
        // A fluffy paw.
        fluff(ctx, (x + swing + 0.05) * s, (-0.08 - lift) * s, 0.2 * s, 0.13 * s, 4, 0.2);
        paint();
      }
    } else if (sitting) {
      // Haunch, and two straight front legs with fluffy paws.
      fluff(ctx, -0.45 * s, -0.42 * s, 0.55 * s, 0.45 * s, 7, 0.14, 0.4);
      paint();
      for (const x of [0.3, 0.58]) {
        const raised = grooming && x > 0.5 ? 0.55 + Math.sin(t * 7) * 0.06 : 0;
        ctx.beginPath();
        ctx.moveTo(x * s, -0.9 * s);
        ctx.lineTo((x + raised * 0.25) * s, (-0.12 - raised) * s);
        if (rim) {
          ctx.strokeStyle = RIM;
          ctx.lineWidth = s * 0.44;
        } else {
          ctx.strokeStyle = FUR;
          ctx.lineWidth = s * 0.28;
        }
        ctx.stroke();
        fluff(ctx, (x + 0.05 + raised * 0.25) * s, (-0.08 - raised) * s, 0.2 * s, 0.13 * s, 4, 0.2);
        paint();
      }
    }

    // Body: long fur ruffling all round, with an extra-fluffy chest.
    fluff(ctx, body.x * s, body.y * s, body.rx * s, body.ry * s, 11, 0.1, 0.2);
    paint();
    if (!lying) {
      const chest = walking ? { x: 0.72, y: -1.0 } : { x: 0.3, y: -1.1 };
      fluff(ctx, chest.x * s, chest.y * s, 0.45 * s, 0.5 * s, 7, 0.22, 0.9);
      paint();
    }

    // Head: round, with fluffy cheeks and tufted ears.
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo((head.x + side * 0.18) * s, (head.y - head.r * 0.72) * s);
      ctx.lineTo((head.x + side * 0.5) * s, (head.y - head.r * 1.55) * s);
      ctx.lineTo((head.x + side * 0.6) * s, (head.y - head.r * 0.35) * s);
      ctx.closePath();
      paint();
    }
    fluff(ctx, head.x * s, head.y * s, head.r * s, head.r * 0.9 * s, 9, 0.09, 0.3);
    paint();
    for (const side of [-1, 1]) {
      // Cheek ruff.
      fluff(ctx, (head.x + side * 0.42) * s, (head.y + 0.2) * s, 0.3 * s, 0.26 * s, 5, 0.3, side);
      paint();
    }
  };
  shapes(true);
  shapes(false);

  // Soft lighter strands, so the black fur has some shape to it.
  ctx.strokeStyle = FUR_LIGHT;
  ctx.lineWidth = Math.max(1, s * 0.05);
  for (const [x, y, len] of lying
    ? [
        [-0.5, -0.6, 0.3],
        [-0.1, -0.7, 0.3],
        [0.3, -0.6, 0.25],
      ]
    : walking
      ? [
          [-0.5, -1.2, 0.35],
          [-0.1, -1.3, 0.35],
          [0.3, -1.2, 0.3],
          [0.7, -0.8, 0.3],
        ]
      : [
          [-0.4, -1.2, 0.4],
          [-0.15, -0.8, 0.4],
          [0.3, -0.85, 0.35],
          [0.18, -1.2, 0.3],
        ]) {
    ctx.beginPath();
    ctx.moveTo(x * s, y * s);
    ctx.quadraticCurveTo((x - 0.05) * s, (y + len * 0.5) * s, (x + 0.06) * s, (y + len) * s);
    ctx.stroke();
  }
  // Inside the ears.
  ctx.fillStyle = "#3a2b33";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo((head.x + side * 0.3) * s, (head.y - head.r * 0.85) * s);
    ctx.lineTo((head.x + side * 0.48) * s, (head.y - head.r * 1.35) * s);
    ctx.lineTo((head.x + side * 0.52) * s, (head.y - head.r * 0.7) * s);
    ctx.closePath();
    ctx.fill();
  }
  // Soft wisps of fur inside her ears.
  ctx.strokeStyle = "#6b5560";
  ctx.lineWidth = Math.max(0.8, s * 0.025);
  for (const side of [-1, 1])
    for (const k of [0, 1, 2]) {
      const bx = (head.x + side * (0.36 + k * 0.05)) * s;
      const by = (head.y - head.r * 0.78) * s;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + side * s * 0.05, by - s * (0.16 + k * 0.05));
      ctx.stroke();
    }

  // Face. Her eyes: bright green, glowing a little in the dark.
  const blink = (t % 4.2 < 0.14 ? 1 : 0) || 0;
  const shut = lying || purring || grooming || blink;
  const ex = 0.25;
  const ey = head.y - 0.05;
  for (const side of [-1, 1]) {
    const x = (head.x + side * ex) * s;
    const y = ey * s;
    if (shut) {
      // Happy shut eyes.
      ctx.beginPath();
      ctx.arc(x, y + s * 0.03, s * 0.13, Math.PI * 1.1, Math.PI * 1.9, lying);
      ctx.strokeStyle = EYE;
      ctx.lineWidth = Math.max(1.2, s * 0.05);
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = "rgba(185,242,92,0.2)";
    ctx.beginPath();
    ctx.arc(x, y, s * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = EYE;
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.18, s * 0.165, side * -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0c1a10";
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.085, s * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + s * 0.06 * cat.facing, y - s * 0.06, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  // Nose and mouth.
  const ny = head.y + 0.17;
  ctx.fillStyle = "#ff9ac0";
  ctx.beginPath();
  ctx.moveTo((head.x - 0.06) * s, ny * s);
  ctx.lineTo((head.x + 0.06) * s, ny * s);
  ctx.lineTo(head.x * s, (ny + 0.07) * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#8f7fc0";
  ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.beginPath();
  ctx.moveTo(head.x * s, (ny + 0.07) * s);
  ctx.quadraticCurveTo((head.x - 0.08) * s, (ny + 0.2) * s, (head.x - 0.17) * s, (ny + 0.12) * s);
  ctx.moveTo(head.x * s, (ny + 0.07) * s);
  ctx.quadraticCurveTo((head.x + 0.08) * s, (ny + 0.2) * s, (head.x + 0.17) * s, (ny + 0.12) * s);
  ctx.stroke();
  // Her extra fang: on HER right side, which is the left as you look at her, whichever way
  // she's facing.
  const fx = head.x - 0.15 * cat.facing;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#8f7fc0";
  ctx.lineWidth = Math.max(0.8, s * 0.02);
  ctx.beginPath();
  ctx.moveTo((fx - 0.04) * s, (ny + 0.13) * s);
  ctx.lineTo(fx * s, (ny + 0.29) * s);
  ctx.lineTo((fx + 0.04) * s, (ny + 0.13) * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (grooming) {
    // A little pink tongue, licking her paw.
    ctx.fillStyle = "#ff8fb1";
    ctx.beginPath();
    ctx.ellipse((head.x + 0.02) * s, (ny + 0.24) * s, 0.06 * s, 0.09 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Whiskers.
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = Math.max(0.8, s * 0.022);
  for (const side of [-1, 1])
    for (const up of [-0.06, 0.04, 0.14]) {
      ctx.beginPath();
      ctx.moveTo((head.x + side * 0.22) * s, (ny + 0.08) * s);
      ctx.lineTo((head.x + side * 0.78) * s, (ny + up) * s);
      ctx.stroke();
    }
  ctx.restore();

  // Zzz while she naps, and hearts when she's happy.
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (lying) {
    ctx.fillStyle = "rgba(190,220,255,0.75)";
    for (let k = 0; k < 2; k++) {
      const u = (t * 0.5 + k * 0.5) % 1;
      ctx.globalAlpha = (1 - u) * 0.8;
      ctx.font = `700 ${Math.round(s * (0.4 + u * 0.3))}px system-ui, sans-serif`;
      ctx.fillText("z", cat.x + cat.facing * s * (0.9 + u * 0.4), cat.y - s * (1.1 + u * 1.1));
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#ff8ad8";
  for (const h of cat.hearts) {
    if (h.age < 0) continue;
    ctx.globalAlpha = Math.max(0, 1 - h.age / 1.4);
    const k = s * 0.2;
    ctx.beginPath();
    ctx.moveTo(h.x, h.y + k * 0.9);
    ctx.bezierCurveTo(h.x - k * 1.3, h.y, h.x - k * 0.7, h.y - k * 1.05, h.x, h.y - k * 0.4);
    ctx.bezierCurveTo(h.x + k * 0.7, h.y - k * 1.05, h.x + k * 1.3, h.y, h.x, h.y + k * 0.9);
    ctx.fill();
  }
  ctx.restore();
}
