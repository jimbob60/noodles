# Decisions Log

Newest first. Each entry says what we decided, why, and what it affects.

## 2026-11-07: Idle life — three moods, finger always wins

- **Decision:** when nobody is touching it, the dragon picks its own mood: wander (6–10 s), float (6–9 s) or nap (10–15 s, curling into a coil, eyes shut, breathing, floating "z"s). A touch always takes over and wakes it; 2.5 s after the finger lets go it goes back to its moods, starting with a float. A mouse only steers while its button is held.
- **Why:** it should be fun to just watch (phase 10), and naps fit the cozy, no-stress vision.
- **Affects:** phases 13–20 (needs and moods will change how often it naps and wanders).

## 2026-11-07: Engine basics — fixed-step loop, pointer input, cached backdrop

- **Decision:** game logic runs in fixed 1/60-second steps (catching up at most 0.25 s, pausing while the app is hidden). Touch, pen and mouse all go through one pointer-event input that follows the first finger. Sharpness is capped at 2× pixel density. Things that only change on resize (sky, stars, title) are drawn once to a hidden canvas and copied each frame.
- **Why:** the same feel on slow and fast tablets, no jumps after switching apps, and glow effects are too slow to redraw every frame on a mid-range tablet.
- **Affects:** every moving thing from phase 6 on.

## 2026-11-07: Preview builds are one self-contained page

- **Decision:** every build is a single `index.html` with the code and font inlined (vite-plugin-singlefile, MIT). It is published to one private preview page that Claude republishes after each phase, and a build tag (commit and date) shows in the corner.
- **Why:** the preview page runs in a sandboxed frame where separate files may not load. One file also works offline and inside the Android app.
- **Affects:** every phase from here on. If the game outgrows one file (big sounds in phase 43), we revisit this.

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
