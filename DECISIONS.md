# Decisions Log

Newest first. Each entry says what we decided, why, and what it affects.

## 2026-11-07: Title look — Pacifico font, dragons as the "o"s

- **Decision:** the title uses the free Pacifico script font (OFL license, bundled so it works offline). Every "o" in "Noodle Dragons" is a tiny curled-up noodle dragon drawn by code, in cyan, gold (sleepy) and mint.
- **Why:** Jacob asked for a fancier font with dragons in the letters.
- **Affects:** the title screen now, and the menus in phase 44.

## 2026-11-07: Toolchain

- **Decision:** TypeScript, Vite for builds, Vitest for tests, Prettier for code style, and Playwright to screenshot every build as a tablet in landscape and portrait.
- **Why:** all free, fast, and well known. Vite's relative paths mean the same build works as a preview link and inside the Android app.
- **Affects:** every phase from here on. Playwright is used from the machine, not installed as a dependency; the cloud build in phase 50 will set it up itself.

## 2026-11-07: Use the existing `noodles` repo

- **Decision:** the game lives in `jimbob60/noodles`, not a new `noodle-dragons` repo as the plan first said.
- **Why:** the repo already exists and Claude has access to it. A second repo would only split things up.
- **Affects:** phase 2. The game's name is still "Noodle Dragons".

## 2026-11-07: Vision locked in

- **Decision:** super cute dragons, a night-and-glow world, lo-fi chill music. Must-haves are petting, breeding and rare dragons, and dress-up and decorating. We avoid stress and timers, anything sad or scary, and lots of reading.
- **Why:** Jacob's answers to the five Phase 1 vibe questions.
- **Affects:** every phase. See [VISION.md](VISION.md).

## 2026-11-01: Web game first, then Android

- **Decision:** TypeScript and HTML canvas, wrapped with Capacitor, with the APK built by GitHub Actions.
- **Why:** Jacob can play-test every phase from his tablet's browser, and the same code becomes the Android app with no rewrite. Godot on the tablet can't export an APK, and Godot with C# has no web export for quick previews.
- **Affects:** the whole build.
