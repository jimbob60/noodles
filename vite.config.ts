import { defineConfig } from "vite";

export default defineConfig({
  // Relative paths so the built game works from any preview URL or inside the Android app.
  base: "./",
  build: { outDir: "dist", target: "es2022" },
  test: { include: ["tests/**/*.test.ts"] },
});
