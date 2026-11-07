/** Game logic runs in fixed steps so movement feels the same on fast and slow tablets. */
export const STEP = 1 / 60;
/** Longest frame we catch up on; after a long pause we skip ahead instead of fast-forwarding. */
export const MAX_FRAME = 0.25;

/** Pure stepping logic: returns how many fixed updates to run and the leftover time. */
export function advance(
  accumulator: number,
  frameSeconds: number,
): { steps: number; rest: number } {
  let acc = accumulator + Math.min(Math.max(frameSeconds, 0), MAX_FRAME);
  let steps = 0;
  while (acc >= STEP) {
    acc -= STEP;
    steps++;
  }
  return { steps, rest: acc };
}

export interface LoopHooks {
  update(dt: number): void;
  render(): void;
}

/** Starts the game loop. It pauses while the page is hidden and resumes without a jump. */
export function startLoop(hooks: LoopHooks): { fps: () => number } {
  let last = performance.now();
  let acc = 0;
  let fps = 60;

  const frame = (now: number) => {
    const seconds = (now - last) / 1000;
    last = now;
    if (seconds > 0) fps += (1 / seconds - fps) * 0.05;
    const { steps, rest } = advance(acc, seconds);
    acc = rest;
    for (let i = 0; i < steps; i++) hooks.update(STEP);
    hooks.render();
    requestAnimationFrame(frame);
  };

  document.addEventListener("visibilitychange", () => {
    // Coming back: restart the clock so the game doesn't try to catch up on the time away.
    if (!document.hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  requestAnimationFrame(frame);
  return { fps: () => fps };
}
