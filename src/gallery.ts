import { ACCESSORIES, ACCESSORY_COLORS, type Wardrobe } from "./care/wardrobe";
import type { Screen } from "./engine/screen";
import { Dragon } from "./noodle/dragon";
import { genesFromSeed } from "./noodle/genes";
import { seededRandom } from "./noodle/look";
import { mainTrait, TRAIT_LABEL } from "./noodle/personality";
import { palette } from "./palette";

/** How many dragons one roll makes, and how many show at once. */
export const GALLERY_COUNT = 50;
export const PER_PAGE = 10;
const FAVORITES_KEY = "noodle-dragons.favorites";
const BAR = 58;
const TOP = 40;

/** A random outfit for a gallery dragon, to show dressing up works on any dragon. */
export function dressUp(seed: number): Wardrobe["worn"] {
  const r = seededRandom(seed ^ 0xd2e55);
  const worn: Wardrobe["worn"] = {};
  for (const [slot, chance] of [
    ["head", 0.6],
    ["neck", 0.5],
    ["back", 0.3],
    ["tail", 0.4],
  ] as const) {
    const options = ACCESSORIES.filter((a) => a.slot === slot);
    if (r() < chance)
      worn[slot] = {
        id: options[Math.floor(r() * options.length)].id,
        color: Math.floor(r() * ACCESSORY_COLORS.length),
      };
  }
  return worn;
}

/** Reads the saved favorites (dragon numbers), accepting only sensible ones. */
export function parseFavorites(raw: string | null): number[] {
  try {
    const list: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(list)) return [];
    const seeds = list.filter(
      (v): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 2 ** 32,
    );
    return [...new Set(seeds)].slice(0, 200);
  } catch {
    return [];
  }
}

/** Adds a dragon to the favorites, or takes it out if it's already there. */
export function toggleFavorite(favorites: number[], seed: number): number[] {
  return favorites.includes(seed) ? favorites.filter((s) => s !== seed) : [...favorites, seed];
}

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

interface Button {
  id: "prev" | "next" | "favorites" | "roll" | "outfits" | "age";
  label: string;
  x: number;
  w: number;
  on?: boolean;
}

/**
 * The 50-dragon test (phase 35; tap the build tag until it says gallery): fifty random dragons,
 * ten to a page, each swimming a loop in its own cell. Tap a dragon to ♥ it as a favorite; the
 * bar along the bottom turns pages, shows your favorites, rolls fifty new ones, and switches
 * outfits and babies on and off.
 */
export class Gallery {
  private seeds: number[] = [];
  private favorites: number[];
  private page = 0;
  private showFavorites = false;
  private outfits = true;
  private babies = false;
  private cells: Cell[] = [];
  private time = 0;

  constructor(private screen: Screen) {
    this.favorites = parseFavorites(this.read());
    this.roll();
    screen.onResize(() => this.layout());
  }

  private read(): string | null {
    try {
      return localStorage.getItem(FAVORITES_KEY);
    } catch {
      return null;
    }
  }

  private write(): void {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(this.favorites));
    } catch {
      // No storage here (a locked-down preview): favorites last until the page closes.
    }
  }

  /** Fifty new random dragons (or the given ones). */
  roll(seeds?: number[]): void {
    this.seeds =
      seeds ?? Array.from({ length: GALLERY_COUNT }, () => Math.floor(Math.random() * 1e9));
    this.page = 0;
    this.showFavorites = false;
    this.layout();
  }

  /** The dragons being browsed: this roll's fifty, or the favorites. */
  private get list(): number[] {
    return this.showFavorites ? this.favorites : this.seeds;
  }

  get pages(): number {
    return Math.max(1, Math.ceil(this.list.length / PER_PAGE));
  }

  /** Builds this page's dragons in their cells. */
  private layout(): void {
    const { width: w, height: h } = this.screen;
    this.page = Math.min(this.page, this.pages - 1);
    const shown = this.list.slice(this.page * PER_PAGE, (this.page + 1) * PER_PAGE);
    const cols = w > h ? 5 : 2;
    const rows = Math.ceil(PER_PAGE / cols);
    const cw = w / cols;
    const ch = (h - BAR - TOP) / rows;
    const segment = Math.min(cw / 30, ch / 13);
    this.cells = shown.map((seed, i) => {
      const cx = cw * (i % cols) + cw / 2;
      const cy = TOP + ch * Math.floor(i / cols) + ch / 2;
      const world = { width: w, height: h, unit: segment };
      const dragon = new Dragon(cx, cy, segment, world, genesFromSeed(seed));
      dragon.setGrowth(this.babies ? 0 : 1);
      if (this.outfits) dragon.outfit = dressUp(seed);
      const lead = { x: cx, y: cy, down: true };
      return { dragon, cx, cy, cw, ch, phase: i * 0.7, lead };
    });
    // Let them swim a few seconds before they're seen, so a new page opens with every dragon
    // already curled into its loop (not still unrolling from a straight line).
    for (let k = 0; k < 150; k++) this.swim(1 / 30);
    this.mark();
  }

  /** For automated checks: where the gallery is. */
  private mark(): void {
    const d = document.body.dataset;
    d.galleryPage = `${this.page + 1}/${this.pages}`;
    d.galleryShown = String(this.cells.length);
    d.galleryCount = String(this.list.length);
    d.favorites = String(this.favorites.length);
  }

  private buttons(): Button[] {
    const w = this.screen.width;
    const narrow = w < 560;
    const defs: Omit<Button, "x">[] = [
      { id: "prev", label: "◀", w: 44 },
      { id: "next", label: "▶", w: 44 },
      {
        id: "favorites",
        label: narrow ? `♥ ${this.favorites.length}` : `♥ Favorites (${this.favorites.length})`,
        w: narrow ? 58 : 150,
        on: this.showFavorites,
      },
      { id: "roll", label: narrow ? "🎲" : "🎲 New 50", w: narrow ? 44 : 104 },
      { id: "outfits", label: "👗", w: 44, on: this.outfits },
      { id: "age", label: "🐣", w: 44, on: this.babies },
    ];
    const gap = narrow ? 6 : 10;
    const total = defs.reduce((s, b) => s + b.w, 0) + gap * (defs.length - 1);
    let x = (w - total) / 2;
    return defs.map((b) => {
      const at = { ...b, x };
      x += b.w + gap;
      return at;
    });
  }

  private press(x: number, y: number): void {
    const h = this.screen.height;
    if (y > h - BAR) {
      const b = this.buttons().find((q) => x >= q.x - 3 && x <= q.x + q.w + 3);
      if (!b) return;
      if (b.id === "prev") this.page = (this.page + this.pages - 1) % this.pages;
      else if (b.id === "next") this.page = (this.page + 1) % this.pages;
      else if (b.id === "favorites") {
        this.showFavorites = !this.showFavorites;
        this.page = 0;
      } else if (b.id === "roll") return this.roll();
      else if (b.id === "outfits") this.outfits = !this.outfits;
      else this.babies = !this.babies;
      this.layout();
      return;
    }
    // A tap on a dragon's cell: ♥ it, or un-♥ it.
    const c = this.cells.find(
      (q) => Math.abs(x - q.cx) < q.cw / 2 && Math.abs(y - q.cy) < q.ch / 2,
    );
    if (!c) return;
    this.favorites = toggleFavorite(this.favorites, c.dragon.look.seed);
    this.write();
    // Un-♥ing on the favorites page takes it off the page.
    if (this.showFavorites) this.layout();
    this.mark();
  }

  /** @param press where a new tap landed this frame, if any. */
  update(dt: number, press: { x: number; y: number } | null): void {
    if (press) this.press(press.x, press.y);
    this.swim(dt);
  }

  /** Leads each dragon round a loop in its own cell. */
  private swim(dt: number): void {
    this.time += dt;
    const { width: w, height: h } = this.screen;
    for (const c of this.cells) {
      const t = this.time * 0.8 + c.phase;
      c.lead.x = c.cx + Math.cos(t) * c.cw * 0.26;
      c.lead.y = c.cy - c.ch * 0.06 + Math.sin(t * 2) * c.ch * 0.14;
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
    ctx.textAlign = "center";
    for (const c of this.cells) {
      // Each dragon's number and main personality, and a heart if it's a favorite.
      const fav = this.favorites.includes(c.dragon.look.seed);
      const trait = TRAIT_LABEL[mainTrait(c.dragon.genes.personality)];
      ctx.font = "12px system-ui, sans-serif";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = fav ? "#ffd6f5" : "rgba(255,255,255,0.5)";
      ctx.fillText(`#${c.dragon.look.seed} · ${trait}`, c.cx, c.cy + c.ch / 2 - 4);
      ctx.font = "22px system-ui, sans-serif";
      ctx.textBaseline = "top";
      ctx.fillStyle = fav ? "#ff8ad8" : "rgba(255,255,255,0.18)";
      ctx.fillText(fav ? "♥" : "♡", c.cx + c.cw / 2 - 22, c.cy - c.ch / 2 + 6);
    }
    if (this.cells.length === 0) {
      ctx.font = "600 18px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e6dcff";
      ctx.fillText("No favorites yet — tap a dragon to ♥ it", w / 2, h / 2);
    }
    // The bar: page turns, favorites, a new roll, outfits and babies.
    ctx.fillStyle = "rgba(20,14,60,0.85)";
    ctx.fillRect(0, h - BAR, w, BAR);
    ctx.textBaseline = "middle";
    for (const b of this.buttons()) {
      ctx.fillStyle = b.on ? "#7af3ff" : "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.roundRect(b.x, h - BAR + 8, b.w, BAR - 16, 14);
      ctx.fill();
      ctx.font = "600 15px system-ui, sans-serif";
      ctx.fillStyle = b.on ? "#1a1040" : "#f3ecff";
      ctx.fillText(b.label, b.x + b.w / 2, h - BAR / 2 + 1);
    }
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    const what = this.showFavorites ? "♥ Favorites" : "50 dragons";
    ctx.fillText(`${what} · page ${this.page + 1} of ${this.pages}`, 14, TOP / 2 + 2);
  }
}
