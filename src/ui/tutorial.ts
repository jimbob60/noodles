import { logEvent } from "./log";

/**
 * Phase 45: the tutorial. Shelly, a little talking egg, guides a new player's first few minutes,
 * one step at a time: each step waits for the player to actually do the thing (or tap "Got it"
 * for the ones that just explain), and a bouncing arrow points at what to use. "Skip" ends it
 * any time. It only runs for a brand-new player, once per device.
 */

/** Things the game tells the tutorial about. */
export type TutorialEvent = "rub" | "crack" | "named" | "swim" | "fed" | "pet" | "play" | "ok";

/** What the arrow can point at (the game says where each is). */
export type TutorialTarget = "dragon" | "food" | "toys" | "orbs" | "goals" | "moon" | "menu";

export interface TutorialStep {
  id: string;
  /** What Shelly says; {name} becomes the dragon's name. */
  say: string;
  /** What finishes this step. */
  until: TutorialEvent;
  /** For "swim": how far (in pixels) to swim first. */
  amount?: number;
  arrow?: TutorialTarget;
}

export const STEPS: TutorialStep[] = [
  {
    id: "warm",
    say: "Hi, I'm Shelly! 🥚 There's a baby dragon in this egg. Rub it with your finger to keep it warm!",
    until: "rub",
    amount: 600,
  },
  {
    id: "tap",
    say: "It's wiggling! Now tap the egg, again and again, to help it hatch!",
    until: "crack",
  },
  { id: "name", say: "Ooh, here it comes! Give your baby a name.", until: "named" },
  {
    id: "swim",
    say: "Say hi to {name}! Drag your finger around and {name} swims after it.",
    until: "swim",
    amount: 900,
    arrow: "dragon",
  },
  {
    id: "feed",
    say: "Babies get hungry! Drag a snack from down here up to {name}'s mouth.",
    until: "fed",
    arrow: "food",
  },
  {
    id: "pet",
    say: "Now rub {name} gently to pet it. Keep going until it purrs! 💗",
    until: "pet",
    arrow: "dragon",
  },
  {
    id: "play",
    say: "Playtime! Throw the ball or wave the ribbon from down here.",
    until: "play",
    arrow: "toys",
  },
  {
    id: "orbs",
    say: "These glowing orbs show Food, Love, Energy and Hygiene. Keep them full and {name} grows up happy!",
    until: "ok",
    arrow: "orbs",
  },
  {
    id: "goals",
    say: "Caring earns 🪙 coins. Tap 🎯 Goals for three little things to do each day.",
    until: "ok",
    arrow: "goals",
  },
  {
    id: "moon",
    say: "When {name} gets sleepy, the 🌙 moon tucks it into bed. The sponge gives a bubble bath!",
    until: "ok",
    arrow: "moon",
  },
  {
    id: "menu",
    say: "Up here: the shop, closet, family, Dragondex and more. The ⚙️ gear has help any time.",
    until: "ok",
    arrow: "menu",
  },
  { id: "bye", say: "You're a natural! Have fun with {name}. Bye for now! 💜", until: "ok" },
];

/** Where the tutorial is: a step, plus how far along a "rub" or "swim" step is. */
export interface TutorialState {
  step: number;
  progress: number;
}

/**
 * Moves the tutorial on when the player does what the step asks (or more: hatching skips
 * ahead past the egg steps if they were quick). Returns the new state; `step` reaching
 * STEPS.length means done.
 */
export function advance(s: TutorialState, event: TutorialEvent, amount = 1): TutorialState {
  if (s.step >= STEPS.length) return s;
  const step = STEPS[s.step];
  // Naming means the egg hatched, whatever egg step it was on.
  if (event === "named" && s.step <= STEPS.findIndex((x) => x.id === "name"))
    return { step: STEPS.findIndex((x) => x.id === "name") + 1, progress: 0 };
  // Cracking the egg also finishes the rubbing step.
  if (event === "crack" && step.id === "warm") return { step: s.step + 2, progress: 0 };
  if (step.until !== event) return s;
  if (step.amount) {
    const progress = s.progress + amount;
    return progress >= step.amount ? { step: s.step + 1, progress: 0 } : { ...s, progress };
  }
  return { step: s.step + 1, progress: 0 };
}

const css = (e: HTMLElement, style: Partial<CSSStyleDeclaration>) => Object.assign(e.style, style);

/** A little egg with a face (Shelly), drawn into a small canvas. */
function shellyArt(size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = size * dpr;
  c.height = size * dpr;
  css(c, {
    width: `${size}px`,
    height: `${size}px`,
    flex: "none",
    animation: "shelly-bob 1.6s ease-in-out infinite",
  });
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.scale(dpr, dpr);
  const cx = size / 2;
  const cy = size * 0.55;
  const g = ctx.createRadialGradient(cx - size * 0.1, cy - size * 0.15, 2, cx, cy, size * 0.45);
  g.addColorStop(0, "#fffaf0");
  g.addColorStop(1, "#ffd9a8");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.32, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pastel spots.
  for (const [x, y, r, col] of [
    [-0.15, -0.22, 0.06, "#ff8ad8"],
    [0.17, -0.08, 0.05, "#7af3ff"],
    [-0.05, 0.25, 0.055, "#9dffc8"],
  ] as const) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(cx + x * size, cy + y * size, r * size, 0, Math.PI * 2);
    ctx.fill();
  }
  // A happy face.
  ctx.fillStyle = "#3a2a5a";
  for (const dx of [-0.1, 0.1]) {
    ctx.beginPath();
    ctx.ellipse(cx + dx * size, cy + size * 0.02, size * 0.035, size * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,138,216,0.6)";
  for (const dx of [-0.18, 0.18]) {
    ctx.beginPath();
    ctx.arc(cx + dx * size, cy + size * 0.1, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#3a2a5a";
  ctx.lineWidth = Math.max(1.5, size * 0.03);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.1, size * 0.06, 0.2, Math.PI - 0.2);
  ctx.stroke();
  return c;
}

/** The talking egg's speech bubble, and the arrow it draws on the game canvas. */
export class Tutorial {
  state: TutorialState = { step: 0, progress: 0 };
  private box: HTMLDivElement | null = null;
  private text: HTMLDivElement | null = null;
  private okButton: HTMLButtonElement | null = null;
  private shown = -1;
  private name = "";

  constructor(
    /** Called once when the tutorial ends (finished or skipped). */
    private readonly onEnd: (skipped: boolean) => void,
  ) {}

  get active(): boolean {
    return this.box !== null;
  }

  get step(): TutorialStep | null {
    return STEPS[this.state.step] ?? null;
  }

  start(fromStep = 0): void {
    this.state = { step: fromStep, progress: 0 };
    this.build();
    this.render();
    logEvent("tutorial start");
  }

  setName(name: string): void {
    this.name = name;
    this.render();
  }

  /** Something happened in the game. */
  on(event: TutorialEvent, amount = 1): void {
    if (!this.active) return;
    const before = this.state.step;
    this.state = advance(this.state, event, amount);
    if (this.state.step !== before) {
      logEvent(`tutorial ${STEPS[before]?.id} done`);
      if (this.state.step >= STEPS.length) this.end(false);
      else this.render();
    }
    document.body.dataset.tutorial = this.step?.id ?? "done";
  }

  /** Draws a bouncing arrow pointing at the step's target, if it has one. */
  drawArrow(
    ctx: CanvasRenderingContext2D,
    where: (t: TutorialTarget) => { x: number; y: number } | null,
    time: number,
  ): void {
    const target = this.active ? this.step?.arrow : undefined;
    const at = target ? where(target) : null;
    if (!at) return;
    // The arrow comes from above the target (or below, near the top of the screen).
    const fromBelow = at.y < 160;
    const dir = fromBelow ? -1 : 1;
    const bob = Math.sin(time * 5) * 6;
    const tip = at.y - dir * (34 + bob);
    ctx.save();
    ctx.shadowColor = "rgba(255,224,138,0.9)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffe08a";
    ctx.beginPath();
    ctx.moveTo(at.x, tip);
    ctx.lineTo(at.x - 14, tip - dir * 18);
    ctx.lineTo(at.x - 5, tip - dir * 18);
    ctx.lineTo(at.x - 5, tip - dir * 40);
    ctx.lineTo(at.x + 5, tip - dir * 40);
    ctx.lineTo(at.x + 5, tip - dir * 18);
    ctx.lineTo(at.x + 14, tip - dir * 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private build(): void {
    document.getElementById("tutorial")?.remove();
    if (!document.getElementById("shelly-style")) {
      const style = document.createElement("style");
      style.id = "shelly-style";
      style.textContent =
        "@keyframes shelly-bob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-4px) rotate(4deg)}}";
      document.head.append(style);
    }
    const box = document.createElement("div");
    box.id = "tutorial";
    css(box, {
      position: "fixed",
      // Centered on a wide screen; on a phone, kept clear of the buttons down the right.
      left: "max(12px, calc(50vw - 220px))",
      top: "max(236px, 30vh)",
      width: "min(440px, calc(100vw - 84px))",
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      padding: "10px 12px",
      background: "rgba(28,20,80,0.93)",
      border: "2px solid rgba(255,224,138,0.7)",
      borderRadius: "18px",
      color: "#f3ecff",
      font: "15px system-ui, sans-serif",
      lineHeight: "1.35",
      zIndex: "9",
      // Taps go through to the game, except on the buttons.
      pointerEvents: "none",
      boxShadow: "0 0 24px rgba(255,224,138,0.25)",
    });
    const right = document.createElement("div");
    css(right, { flex: "1" });
    const text = document.createElement("div");
    text.id = "tutorial-text";
    const row = document.createElement("div");
    css(row, { display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" });
    const mk = (label: string, bg: string, color: string) => {
      const b = document.createElement("button");
      b.textContent = label;
      css(b, {
        font: "600 14px system-ui, sans-serif",
        background: bg,
        color,
        border: "none",
        borderRadius: "999px",
        padding: "6px 14px",
        minHeight: "40px",
        cursor: "pointer",
        pointerEvents: "auto",
      });
      return b;
    };
    const skip = mk("Skip tutorial", "rgba(255,255,255,0.1)", "#c8bdf0");
    skip.id = "tutorial-skip";
    skip.addEventListener("click", () => this.end(true));
    const ok = mk("Got it! ✨", "#ffe08a", "#1a1040");
    ok.id = "tutorial-ok";
    ok.addEventListener("click", () => this.on("ok"));
    row.append(skip, ok);
    right.append(
      Object.assign(document.createElement("div"), { textContent: "Shelly" }),
      text,
      row,
    );
    css(right.firstElementChild as HTMLElement, {
      font: '15px "Pacifico", cursive',
      color: "#ffe08a",
    });
    box.append(shellyArt(52), right);
    document.body.append(box);
    this.box = box;
    this.text = text;
    this.okButton = ok;
  }

  private render(): void {
    const step = this.step;
    if (!this.text || !step) return;
    this.text.textContent = step.say.replaceAll("{name}", this.name || "your dragon");
    if (this.okButton) this.okButton.style.display = step.until === "ok" ? "" : "none";
    if (this.shown !== this.state.step) {
      this.shown = this.state.step;
      // A little pop each time Shelly says something new.
      this.box?.animate([{ transform: "scale(0.94)" }, { transform: "scale(1)" }], {
        duration: 220,
        easing: "ease-out",
      });
    }
    document.body.dataset.tutorial = step.id;
  }

  private end(skipped: boolean): void {
    this.box?.remove();
    this.box = null;
    document.body.dataset.tutorial = skipped ? "skipped" : "done";
    logEvent(`tutorial ${skipped ? "skipped" : "finished"}`);
    this.onEnd(skipped);
  }
}
