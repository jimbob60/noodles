import type { Point } from "../noodle/spine";

/** A noodle coin: gold, with a little noodle swirl stamped on it. */
export function drawCoin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin = 0,
): void {
  const squash = Math.abs(Math.cos(spin)) * 0.85 + 0.15;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(squash, 1);
  ctx.fillStyle = "#c98a2a";
  ctx.beginPath();
  ctx.arc(0, r * 0.08, r, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, "#fff0a8");
  g.addColorStop(1, "#f2b93a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d99a2a";
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  if (squash > 0.45) {
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const a = t * Math.PI * 3;
      const rr = r * 0.45 * t;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.stroke();
  }
  ctx.restore();
}

interface Flyer {
  from: Point;
  t: number;
  delay: number;
}

/** Coins earned so far are shown under the need orbs; new ones pop out and fly to the counter. */
export class CoinCounter {
  private flyers: Flyer[] = [];
  private shown = -1;
  private bump = 0;
  private time = 0;

  /** Where the counter's coin sits. */
  at(): Point {
    return { x: 30, y: 116 };
  }

  /** New coins pop out at `from` (a few at most, for show). */
  earned(amount: number, from: Point): void {
    for (let i = 0; i < Math.min(5, amount); i++)
      this.flyers.push({ from: { ...from }, t: 0, delay: i * 0.08 });
  }

  update(dt: number, coins: number): void {
    this.time += dt;
    if (this.shown < 0) this.shown = coins;
    this.bump = Math.max(0, this.bump - dt * 3);
    for (const f of this.flyers) {
      if (f.delay > 0) f.delay -= dt;
      else f.t += dt / 0.8;
    }
    const landed = this.flyers.filter((f) => f.t >= 1).length;
    if (landed) this.bump = 1;
    this.flyers = this.flyers.filter((f) => f.t < 1);
    // The number counts up as the coins land (or right away if none are flying).
    if (this.flyers.length === 0) this.shown = coins;
    else if (landed)
      this.shown = Math.min(
        coins,
        this.shown + Math.ceil((coins - this.shown) / (this.flyers.length + 1)),
      );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const at = this.at();
    const r = 11 * (1 + this.bump * 0.25);
    ctx.fillStyle = "rgba(20,14,60,0.75)";
    ctx.beginPath();
    ctx.roundRect(at.x - 18, at.y - 15, 92, 30, 15);
    ctx.fill();
    drawCoin(ctx, at.x, at.y, r);
    ctx.font = "600 16px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe08a";
    ctx.fillText(String(Math.max(0, this.shown)), at.x + 18, at.y + 1);
    for (const f of this.flyers) {
      if (f.delay > 0) continue;
      // An arc: pop up, then swoop to the counter.
      const e = f.t * f.t * (3 - 2 * f.t);
      const x = f.from.x + (at.x - f.from.x) * e;
      const y = f.from.y + (at.y - f.from.y) * e - Math.sin(e * Math.PI) * 80;
      drawCoin(ctx, x, y, 10, this.time * 9 + f.from.x);
    }
  }
}
