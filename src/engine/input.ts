/**
 * One input system for touch, pen and mouse (pointer events). Follows the first finger down;
 * a mouse counts as a pointer even without a button pressed, so the dot follows it too.
 */
export class Input {
  x = 0;
  y = 0;
  /** True while a finger is on the screen or a mouse button is held. */
  down = false;
  /** True once the player has touched or moved the mouse at least once. */
  active = false;
  private pointerId: number | null = null;

  constructor(target: HTMLElement) {
    target.addEventListener("pointerdown", (e) => {
      if (this.pointerId !== null && this.pointerId !== e.pointerId) return;
      this.pointerId = e.pointerId;
      target.setPointerCapture?.(e.pointerId);
      this.down = true;
      this.move(e);
    });
    target.addEventListener("pointermove", (e) => {
      if (this.pointerId !== null && this.pointerId !== e.pointerId) return;
      if (e.pointerType !== "mouse" && !this.down) return;
      this.move(e);
    });
    const release = (e: PointerEvent) => {
      if (e.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.down = false;
    };
    target.addEventListener("pointerup", release);
    target.addEventListener("pointercancel", release);
    // No long-press menu or text selection on the game.
    target.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private move(e: PointerEvent): void {
    this.x = e.clientX;
    this.y = e.clientY;
    this.active = true;
  }
}
