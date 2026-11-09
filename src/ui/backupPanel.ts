import { cornerButton } from "./layout";
import type { Point } from "../noodle/spine";

/** The backup button: a small bubble in the top-right corner, under the mode tag. */
export function backupButton(width: number, height: number): Point & { r: number } {
  return cornerButton(0, width, height);
}

export function onBackupButton(p: Point, width: number, height: number): boolean {
  const b = backupButton(width, height);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.3;
}

/** A little save disk icon in a bubble. */
export function drawBackupButton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const b = backupButton(width, height);
  ctx.save();
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = "rgba(122,243,255,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const s = b.r * 0.55;
  ctx.translate(b.x, b.y);
  ctx.fillStyle = "#bff9ff";
  ctx.beginPath();
  ctx.moveTo(-s, -s);
  ctx.lineTo(s * 0.6, -s);
  ctx.lineTo(s, -s * 0.6);
  ctx.lineTo(s, s);
  ctx.lineTo(-s, s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(20,14,60,1)";
  ctx.fillRect(-s * 0.55, -s, s * 1.0, s * 0.6);
  ctx.fillRect(-s * 0.6, s * 0.1, s * 1.2, s * 0.7);
  ctx.restore();
}

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) =>
  Object.assign(el.style, style);

function button(label: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.textContent = label;
  css(b, {
    font: "600 16px system-ui, sans-serif",
    color: "#1a1040",
    background: "#7af3ff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 20px",
    minHeight: "44px",
    cursor: "pointer",
  });
  return b;
}

function box(readOnly: boolean): HTMLTextAreaElement {
  const t = document.createElement("textarea");
  t.readOnly = readOnly;
  t.spellcheck = false;
  css(t, {
    width: "100%",
    boxSizing: "border-box",
    height: "84px",
    font: "13px ui-monospace, monospace",
    color: "#e8fcff",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(122,243,255,0.4)",
    borderRadius: "12px",
    padding: "10px",
    resize: "none",
    wordBreak: "break-all",
  });
  return t;
}

/**
 * The backup panel: your dragon as a code to copy and keep, and a box to paste a code back in.
 * A plain HTML panel over the game, so the code can be selected and pasted like normal text.
 */
export function openBackupPanel(
  code: string,
  onRestore: (code: string) => boolean,
  savesOnDevice: boolean,
): void {
  document.getElementById("backup-panel")?.remove();
  const shade = document.createElement("div");
  shade.id = "backup-panel";
  css(shade, {
    position: "fixed",
    inset: "0",
    background: "rgba(8,6,30,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: "10",
  });
  const card = document.createElement("div");
  css(card, {
    width: "min(440px, 100%)",
    background: "#1c1450",
    border: "2px solid rgba(183,160,255,0.6)",
    borderRadius: "20px",
    padding: "20px",
    color: "#f3ecff",
    font: "15px system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "0 0 40px rgba(183,160,255,0.35)",
  });
  const title = document.createElement("div");
  title.textContent = "💾 Backup code";
  css(title, { font: '22px "Pacifico", cursive', color: "#ff8ad8" });
  const status = document.createElement("div");
  status.textContent = savesOnDevice
    ? "✓ Your dragon saves on this device."
    : "⚠ This window can't save. Copy your code to keep your dragon!";
  css(status, { color: savesOnDevice ? "#9dffc8" : "#ffd27a", fontSize: "14px" });

  const out = box(true);
  out.value = code;
  const copy = button("Copy");
  copy.addEventListener("click", () => {
    out.select();
    navigator.clipboard
      ?.writeText(code)
      .then(() => (copy.textContent = "✓ Copied"))
      .catch(() => (copy.textContent = "Selected — copy it"));
    if (!navigator.clipboard) copy.textContent = "Selected — copy it";
  });

  const paste = box(false);
  paste.placeholder = "Paste a code here to bring a dragon back";
  const restore = button("Restore");
  const note = document.createElement("div");
  css(note, { fontSize: "14px", minHeight: "18px" });
  restore.addEventListener("click", () => {
    if (onRestore(paste.value)) {
      shade.remove();
    } else {
      note.textContent = "Hmm, that code didn't work. Check it's all there.";
      note.style.color = "#ffb3e6";
    }
  });

  const close = button("✕");
  css(close, {
    alignSelf: "flex-end",
    background: "rgba(255,255,255,0.12)",
    color: "#f3ecff",
    padding: "6px 14px",
  });
  close.addEventListener("click", () => shade.remove());
  shade.addEventListener("click", (e) => {
    if (e.target === shade) shade.remove();
  });

  const row = (...els: HTMLElement[]) => {
    const r = document.createElement("div");
    css(r, { display: "flex", gap: "10px", alignItems: "center" });
    r.append(...els);
    return r;
  };
  card.append(row(title, close), status, out, row(copy), paste, row(restore, note));
  close.style.marginLeft = "auto";
  shade.append(card);
  document.body.append(shade);
}
