import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

function buildTag(): string {
  const date = new Date().toISOString().slice(0, 10);
  try {
    const hash = execSync("git rev-parse --short HEAD").toString().trim();
    const dirty = execSync("git status --porcelain").toString().trim() ? "+" : "";
    return `${hash}${dirty} ${date}`;
  } catch {
    return date;
  }
}

export default defineConfig({
  // Relative paths so the built game works from any preview URL or inside the Android app.
  base: "./",
  // One self-contained index.html (code and font inlined): the preview page runs in a sandboxed
  // frame where separate files may not load.
  plugins: [viteSingleFile()],
  define: { __BUILD__: JSON.stringify(buildTag()) },
  build: { outDir: "dist", target: "es2022" },
  test: { include: ["tests/**/*.test.ts"] },
});
