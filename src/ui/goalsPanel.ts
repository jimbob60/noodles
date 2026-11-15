import {
  ALL_DONE_BONUS,
  GOAL_COINS,
  goalText,
  isDone,
  kindOf,
  type DailyGoals,
} from "../care/goals";
import { logEvent } from "./log";

/** Where the goals chip sits: just under the name badge. */
const CHIP = { x: 12, y: 190, w: 112, h: 32 };

export function onGoalsChip(p: { x: number; y: number }): boolean {
  return (
    p.x >= CHIP.x - 6 &&
    p.x <= CHIP.x + CHIP.w + 6 &&
    p.y >= CHIP.y - 6 &&
    p.y <= CHIP.y + CHIP.h + 6
  );
}

/**
 * A little pill under the name badge: "🎯 1/3" for today's goals, a ✓ when all are done. It
 * glows for a moment (`glow` 0–1) when a goal has just been finished.
 */
export function drawGoalsChip(ctx: CanvasRenderingContext2D, g: DailyGoals, glow: number): void {
  const done = g.goals.filter(isDone).length;
  const all = done === g.goals.length;
  const { x, y, w, h } = CHIP;
  ctx.save();
  if (glow > 0) {
    ctx.shadowColor = "rgba(255,224,138,0.9)";
    ctx.shadowBlur = 18 * glow;
  }
  ctx.fillStyle = all ? "rgba(60,48,20,0.85)" : "rgba(20,14,60,0.8)";
  ctx.strokeStyle = all || glow > 0 ? "rgba(255,224,138,0.9)" : "rgba(157,255,200,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = all ? "#ffe08a" : "#f3ecff";
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(all ? "🎯 All done!" : `🎯 Goals ${done}/${g.goals.length}`, x + 10, y + h / 2 + 1);
  ctx.restore();
}

const css = (e: HTMLElement, style: Partial<CSSStyleDeclaration>) => Object.assign(e.style, style);
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration> = {},
  text = "",
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  css(e, style);
  if (text) e.textContent = text;
  return e;
}

/** Today's goals: what to do, how far along, and what each pays. */
export function openGoals(g: DailyGoals): void {
  document.getElementById("goals-panel")?.remove();
  logEvent("opened goals");
  const shade = el("div", {
    position: "fixed",
    inset: "0",
    background: "rgba(8,6,30,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: "10",
  });
  shade.id = "goals-panel";
  shade.addEventListener("click", (e) => {
    if (e.target === shade) shade.remove();
  });
  const card = el("div", {
    width: "min(440px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#1c1450",
    border: "2px solid rgba(255,224,138,0.6)",
    borderRadius: "20px",
    padding: "16px",
    color: "#f3ecff",
    font: "15px system-ui, sans-serif",
    boxShadow: "0 0 40px rgba(255,224,138,0.25)",
  });
  const head = el("div", { display: "flex", alignItems: "center", gap: "10px" });
  const close = el(
    "button",
    {
      marginLeft: "auto",
      font: "600 15px system-ui, sans-serif",
      background: "rgba(255,255,255,0.12)",
      color: "#f3ecff",
      border: "none",
      borderRadius: "999px",
      padding: "8px 16px",
      minHeight: "44px",
      cursor: "pointer",
    },
    "✕",
  );
  close.addEventListener("click", () => shade.remove());
  head.append(
    el("div", { font: '24px "Pacifico", cursive', color: "#ffe08a" }, "🎯 Today's goals"),
    close,
  );
  card.append(head);
  g.goals.forEach((goal, i) => {
    const done = isDone(goal);
    const row = el("div", {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginTop: "10px",
      padding: "10px",
      borderRadius: "14px",
      background: done ? "rgba(157,255,200,0.14)" : "rgba(255,255,255,0.06)",
      border: `2px solid ${done ? "rgba(157,255,200,0.6)" : "rgba(255,255,255,0.12)"}`,
    });
    row.dataset.goal = String(i);
    row.dataset.done = done ? "yes" : "no";
    const text = el("div", { flex: "1" });
    const bar = el("div", {
      height: "8px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.12)",
      overflow: "hidden",
      marginTop: "6px",
    });
    bar.append(
      el("div", {
        width: `${(100 * goal.count) / goal.target}%`,
        height: "100%",
        background: done ? "#9dffc8" : "linear-gradient(90deg, #7af3ff, #ffe08a)",
      }),
    );
    text.append(
      el("div", { font: "600 15px system-ui, sans-serif" }, goalText(goal)),
      bar,
      el(
        "div",
        { fontSize: "12px", color: "#c8bdf0", marginTop: "3px" },
        done ? "Done! 🎉" : `${goal.count} of ${goal.target}`,
      ),
    );
    row.append(
      el("div", { fontSize: "28px", width: "36px", textAlign: "center" }, kindOf(goal)?.icon ?? ""),
      text,
      el(
        "div",
        { font: "700 14px system-ui, sans-serif", color: done ? "#9dffc8" : "#ffe08a" },
        done ? "✓" : `🪙${GOAL_COINS}`,
      ),
    );
    card.append(row);
  });
  const all = g.goals.every(isDone);
  card.append(
    el(
      "div",
      {
        marginTop: "12px",
        padding: "8px 12px",
        borderRadius: "12px",
        background: all ? "rgba(255,224,138,0.2)" : "rgba(255,255,255,0.05)",
        color: all ? "#fff3c4" : "#e8e0ff",
        font: "600 14px system-ui, sans-serif",
      },
      all
        ? `🌟 All three done! Bonus 🪙${ALL_DONE_BONUS} earned. What a good dragon day!`
        : `🌟 Do all three for a bonus 🪙${ALL_DONE_BONUS}`,
    ),
    el(
      "div",
      { marginTop: "8px", fontSize: "13px", color: "#c8bdf0" },
      "New goals every day. No rush: skipping a day is totally fine 🌙",
    ),
  );
  shade.append(card);
  document.body.append(shade);
}
