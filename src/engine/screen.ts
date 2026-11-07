/** Sharpness cap: above 2× tablets spend a lot of power for detail nobody can see. */
const MAX_DPR = 2;

/** Keeps the canvas full-screen and sharp through resizes and rotations. Sizes are in CSS pixels. */
export class Screen {
  readonly ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  dpr = 1;
  private listeners: (() => void)[] = [];

  constructor(readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    const onResize = () => this.resize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    this.resize();
  }

  get portrait(): boolean {
    return this.height > this.width;
  }

  onResize(fn: () => void): void {
    this.listeners.push(fn);
  }

  /** Prepares the context for a new frame: identity transform scaled to CSS pixels. */
  begin(): CanvasRenderingContext2D {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    return this.ctx;
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    if (w === this.width && h === this.height && dpr === this.dpr) return;
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    for (const fn of this.listeners) fn();
  }
}
