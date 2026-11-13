import type { Point } from "../noodle/spine";
import { cornerButton } from "./layout";
import { logEvent } from "./log";

/**
 * Where feedback goes: Jacob's Google Form. `id` is the long id from the form's link
 * (…/forms/d/e/<id>/viewform), and each `entry` is a question's field number, read from a
 * pre-filled link. Until `id` is filled in, the form can only be copied.
 */
export const FORM = {
  id: "1FAIpQLSdQUCVPwIn3SLN5bMlyCamTwj0kBKuE8QfSLsn_WCbPRig_tQ",
  entry: {
    kind: "2005712614",
    rating: "965723229",
    knewWhatToDo: "304176767",
    triedFirst: "1987889160",
    annoying: "1370901594",
    smile: "841695291",
    comeBack: "2040947556",
    bug: "1597311425",
    name: "392374081",
    log: "618206400",
  },
};

/** The help button (❓): last in the top-right stack. */
export function helpButton(width: number, height: number): Point & { r: number } {
  return cornerButton(7, width, height);
}

export function onHelpButton(p: Point, width: number, height: number): boolean {
  const b = helpButton(width, height);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.3;
}

export function drawHelpButton(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const b = helpButton(width, height);
  ctx.save();
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = "rgba(255,224,138,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe08a";
  ctx.font = `700 ${Math.round(b.r * 1.15)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", b.x, b.y + 1);
  ctx.restore();
}

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) =>
  Object.assign(el.style, style);
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
function button(label: string, bg: string, color = "#1a1040"): HTMLButtonElement {
  return el(
    "button",
    {
      font: "600 15px system-ui, sans-serif",
      color,
      background: bg,
      border: "none",
      borderRadius: "999px",
      padding: "10px 16px",
      minHeight: "44px",
      cursor: "pointer",
    },
    label,
  );
}
function shell(id: string): { shade: HTMLDivElement; card: HTMLDivElement; close: () => void } {
  document.getElementById(id)?.remove();
  const shade = el("div", {
    position: "fixed",
    inset: "0",
    background: "rgba(8,6,30,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: "11",
  });
  shade.id = id;
  const card = el("div", {
    width: "min(480px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#1c1450",
    border: "2px solid rgba(255,224,138,0.55)",
    borderRadius: "20px",
    padding: "18px",
    color: "#f3ecff",
    font: "15px system-ui, sans-serif",
    lineHeight: "1.4",
  });
  shade.appendChild(card);
  document.body.appendChild(shade);
  return { shade, card, close: () => shade.remove() };
}

const TIPS: [string, string][] = [
  ["👆", "Drag your finger and your dragon swims after it."],
  ["🤲", "Rub your dragon to pet it. Find its secret tickle spots!"],
  ["🍜", "Drag food from the bottom left to its mouth (or let it float)."],
  ["⚽", "Throw the ball or wave the ribbon (bottom right) to play."],
  ["🧽", "The sponge gives a bath; the 🌙 moon puts it to bed."],
  ["🫧", "The orbs top left show Food, Love, Energy and Hygiene."],
  ["🪙", "Care and play earn coins. Spend them in the 🛍️ shop and 🎀 closet."],
  ["💕", "The family button lets you adopt more dragons and invite friends over."],
  ["📷", "The camera takes photos. Tap the name badge for your dragon's profile."],
  ["🐈‍⬛", "Tap Jinxy the cat for a purr."],
];

/**
 * How to play: a short card with what each thing does, then feedback and bug-report buttons.
 * `gift` shows the tester gift message on the first visit.
 */
export function openHowTo(opts: {
  gift: number;
  onFeedback: () => void;
  onBug: () => void;
  onClose?: () => void;
}): void {
  const { card, close } = shell("howto-panel");
  logEvent("opened how-to");
  card.appendChild(
    el("div", { font: '24px "Pacifico", cursive', color: "#ffe08a" }, "How to play"),
  );
  if (opts.gift > 0) {
    const g = el(
      "div",
      {
        margin: "10px 0",
        padding: "10px 12px",
        borderRadius: "14px",
        background: "rgba(157,255,200,0.14)",
        color: "#9dffc8",
        fontWeight: "600",
      },
      `🎁 Thanks for testing! Here are ${opts.gift} coins to try everything.`,
    );
    g.id = "tester-gift";
    card.appendChild(g);
  }
  const list = el("div", { display: "grid", gap: "6px", margin: "8px 0 14px" });
  for (const [icon, text] of TIPS) {
    const row = el("div", { display: "flex", gap: "10px", alignItems: "flex-start" });
    row.append(
      el("span", { fontSize: "20px", width: "26px", flex: "none" }, icon),
      el("span", {}, text),
    );
    list.appendChild(row);
  }
  card.appendChild(list);
  card.appendChild(
    el(
      "div",
      { fontSize: "13px", color: "#c9bdf0", marginBottom: "10px" },
      "Testing for us? We'd love to hear what you think, or about anything that went wrong.",
    ),
  );
  const row = el("div", { display: "flex", gap: "8px", flexWrap: "wrap" });
  const fb = button("💬 Send feedback", "#ff8ad8");
  fb.addEventListener("click", () => {
    close();
    opts.onFeedback();
  });
  const bug = button("🐛 Report a bug", "#7af3ff");
  bug.addEventListener("click", () => {
    close();
    opts.onBug();
  });
  const ok = button("Let's play!", "#ffe08a");
  ok.id = "howto-ok";
  ok.addEventListener("click", () => {
    close();
    opts.onClose?.();
  });
  row.append(ok, fb, bug);
  card.appendChild(row);
}

/** The answers one form sends. */
export type Answers = Partial<Record<keyof typeof FORM.entry, string>>;

/** The link to the form with the answers filled in (for opening it in a new tab). */
export function prefilledLink(a: Answers): string {
  const q = new URLSearchParams({ usp: "pp_url" });
  for (const [k, v] of Object.entries(a)) {
    const entry = FORM.entry[k as keyof typeof FORM.entry];
    if (entry && v) q.set(`entry.${entry}`, v);
  }
  return `https://docs.google.com/forms/d/e/${FORM.id}/viewform?${q.toString()}`;
}

/**
 * Sends the answers to the Google Form quietly. Google doesn't tell a page whether it worked, so
 * this only knows whether the request went out. If it can't go out (some places block it),
 * the form opens in a new tab with everything filled in, ready to submit.
 */
async function send(a: Answers): Promise<"sent" | "opened" | "none"> {
  if (!FORM.id) return "none";
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(a)) {
    const entry = FORM.entry[k as keyof typeof FORM.entry];
    if (entry && v) body.set(`entry.${entry}`, v);
  }
  try {
    await fetch(`https://docs.google.com/forms/d/e/${FORM.id}/formResponse`, {
      method: "POST",
      mode: "no-cors",
      body,
    });
    return "sent";
  } catch {
    const w = window.open(prefilledLink(a), "_blank", "noopener");
    return w ? "opened" : "none";
  }
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function field(label: string, rows = 2): { box: HTMLDivElement; input: HTMLTextAreaElement } {
  const box = el("div", { margin: "8px 0" });
  box.appendChild(el("div", { fontSize: "14px", fontWeight: "600", marginBottom: "4px" }, label));
  const input = el("textarea", {
    width: "100%",
    boxSizing: "border-box",
    font: "15px system-ui, sans-serif",
    padding: "8px 10px",
    borderRadius: "12px",
    border: "1px solid rgba(183,160,255,0.5)",
    background: "#130d3a",
    color: "#ffffff",
    resize: "vertical",
  });
  input.rows = rows;
  box.appendChild(input);
  return { box, input };
}

/**
 * The feedback form: a star rating and Jacob's five questions, or (for a bug) what happened,
 * with the log attached. `log` makes the log text when the form is sent.
 */
export function openFeedback(kind: "feedback" | "bug", log: () => string): void {
  const { card, close, shade } = shell("feedback-panel");
  shade.id = "feedback-panel";
  logEvent(`opened ${kind} form`);
  card.appendChild(
    el(
      "div",
      { font: '24px "Pacifico", cursive', color: kind === "bug" ? "#7af3ff" : "#ff8ad8" },
      kind === "bug" ? "🐛 Report a bug" : "💬 Feedback",
    ),
  );
  const answers: Answers = { kind };
  const fields: [keyof Answers, HTMLTextAreaElement][] = [];
  if (kind === "feedback") {
    // Stars.
    const stars = el("div", { display: "flex", gap: "4px", margin: "10px 0" });
    stars.appendChild(el("span", { fontWeight: "600", marginRight: "6px" }, "How fun is it?"));
    const set = (n: number) => {
      answers.rating = String(n);
      [...stars.querySelectorAll("button")].forEach((b, k) => (b.textContent = k < n ? "★" : "☆"));
    };
    for (let k = 1; k <= 5; k++) {
      const b = el(
        "button",
        {
          font: "26px system-ui",
          color: "#ffe08a",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 2px",
          minHeight: "40px",
        },
        "☆",
      );
      b.setAttribute("aria-label", `${k} stars`);
      b.addEventListener("click", () => set(k));
      stars.appendChild(b);
    }
    card.appendChild(stars);
    for (const [key, label] of [
      ["knewWhatToDo", "After the egg hatched, did you know what to do?"],
      ["triedFirst", "What did you try first? Anything you never found?"],
      ["annoying", "Was anything annoying, confusing or slow?"],
      ["smile", "What made you smile?"],
      ["comeBack", "Would you want to come back tomorrow? Why?"],
    ] as const) {
      const f = field(label);
      fields.push([key, f.input]);
      card.appendChild(f.box);
    }
  } else {
    const f = field("What happened? What were you doing just before?", 4);
    fields.push(["bug", f.input]);
    card.appendChild(f.box);
    card.appendChild(
      el(
        "div",
        { fontSize: "13px", color: "#c9bdf0" },
        "A log is attached: the game version, your screen and device type, the last things you tapped and any errors. No names or saved data.",
      ),
    );
  }
  const name = field("Your name (optional)", 1);
  fields.push(["name", name.input]);
  card.appendChild(name.box);

  const status = el("div", { minHeight: "20px", margin: "6px 0", fontWeight: "600" });
  const row = el("div", { display: "flex", gap: "8px", flexWrap: "wrap" });
  const sendB = button(FORM.id ? "📨 Send" : "📋 Copy answers", "#ffe08a");
  sendB.id = "feedback-send";
  const copyLog = button("📋 Copy log", "rgba(255,255,255,0.14)", "#f3ecff");
  const cancel = button("Close", "rgba(255,255,255,0.14)", "#f3ecff");
  cancel.addEventListener("click", close);
  copyLog.addEventListener("click", async () => {
    status.textContent = (await copy(log()))
      ? "✓ Log copied: paste it in a message"
      : "Couldn't copy here";
  });
  sendB.addEventListener("click", async () => {
    for (const [k, input] of fields) answers[k] = input.value.trim().slice(0, 1500);
    answers.log = log().slice(0, 1800);
    logEvent(`sent ${kind}`);
    const r = await send(answers);
    if (r === "sent" || r === "opened") {
      status.style.color = "#9dffc8";
      status.textContent =
        r === "sent" ? "💖 Thank you! It's on its way." : "Opened the form: press Submit there 💖";
      sendB.disabled = true;
      setTimeout(close, r === "sent" ? 1600 : 400);
      document.body.dataset.feedbackSent = String(
        Number(document.body.dataset.feedbackSent ?? 0) + 1,
      );
      return;
    }
    // No form set up (or nothing worked): copy everything, to paste in a message.
    const text = Object.entries(answers)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    status.style.color = "#ffe08a";
    status.textContent = (await copy(text))
      ? "✓ Copied! Paste it in a message to Jacob."
      : "Couldn't send or copy here, sorry!";
  });
  row.append(sendB, kind === "bug" ? copyLog : cancel, ...(kind === "bug" ? [cancel] : []));
  card.append(status, row);
}
