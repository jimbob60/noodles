import type { PointerState } from "./engine/input";
import type { Screen } from "./engine/screen";
import { Dragon } from "./noodle/dragon";
import { genesFromSeed } from "./noodle/genes";
import { palette } from "./palette";

const COUNT = 20;

interface Cell {
  dragon: Dragon;
  cx: number;
  cy: number;
  /** Cell size, so each dragon swims a wide loop that shows off its pattern. */
  cw: number;
  ch: number;
  phase: number;
  /** A pretend finger that leads the dragon round a little loop in its cell. */
  lead: { x: number; y: number; down: boolean };
}

/**
 * The 20-dragon check from phase 11 (open the preview with #gallery): twenty random dragons,
 * each swimming a loop in its own cell. Tap to roll twenty new ones.
 */
export class Gallery {
  private cells: Cell[] = [];
  private time = 0;
  private wasDown = false;

  constructor(private screen: Screen) {
    this.roll();
    screen.onResize(() => this.roll(this.cells.map((c) => c.dragon.look.seed)));
  }

  roll(seeds?: number[]): void {
    const { width: w, height: h } = this.screen;
    const cols = w > h ? 5 : 4;
    const rows = Math.ceil(COUNT / cols);
    const cw = w / cols;
    const ch = h / rows;
    const segment = Math.min(cw, ch) / 26;
    this.cells = Array.from({ length: COUNT }, (_, i) => {
      const cx = cw * (i % cols) + cw / 2;
      const cy = ch * Math.floor(i / cols) + ch / 2;
      const seed = seeds?.[i] ?? Math.floor(Math.random() * 1e9);
      const world = { width: w, height: h, unit: segment };
      const dragon = new Dragon(cx, cy, segment, world, genesFromSeed(seed));
      return { dragon, cx, cy, cw, ch, phase: i * 0.7, lead: { x: cx, y: cy, down: true } };
    });
  }

  update(dt: number, input: PointerState): void {
    this.time += dt;
    if (input.down && !this.wasDown) this.roll();
    this.wasDown = input.down;
    const { width: w, height: h } = this.screen;
    for (const c of this.cells) {
      const t = this.time * 0.8 + c.phase;
      c.lead.x = c.cx + Math.cos(t) * c.cw * 0.3;
      c.lead.y = c.cy - c.ch * 0.08 + Math.sin(t * 2) * c.ch * 0.18;
      c.dragon.update(dt, c.lead, { width: w, height: h, unit: c.dragon.spine.segment });
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { width: w, height: h } = this.screen;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, palette.night);
    sky.addColorStop(1, palette.dusk);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (const c of this.cells) c.dragon.draw(ctx);
    // Each dragon's seed, small, so favourites can be named and found again.
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (const c of this.cells) {
      ctx.fillText(`#${c.dragon.look.seed}`, c.cx, c.cy + c.ch / 2 - 4);
    }
  }
}
