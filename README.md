# Noodle Dragons

A cozy pet game about raising super cute, glowing noodle dragons in a nighttime den, with lo-fi music in the background. Made by Panda Studios.

The game is built as a web game first (TypeScript and an HTML canvas). Later it is wrapped as an Android app with Capacitor, and GitHub Actions builds the APK.

## Where things are

| File                         | What it holds                                             |
| ---------------------------- | --------------------------------------------------------- |
| [VISION.md](VISION.md)       | The game's look, feel and rules, from the Phase 1 kickoff |
| [DECISIONS.md](DECISIONS.md) | Every big choice we made, and why                         |
| [CHANGELOG.md](CHANGELOG.md) | One line per finished phase                               |

## The plan

The full 64-phase build plan lives in the [Noodle Dragons build plan doc](https://claude.ai/artifact/GkdCoG2KwLT2AGN5Ny5pzF). We build one phase per session, and every phase ends in something Jacob can play on his tablet.

## Working on the code

You need Node.js 22 or newer.

| Command              | What it does                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `npm install`        | Installs the tools                                                                                                      |
| `npm run dev`        | Runs the game locally with live reload                                                                                  |
| `npm run build`      | Type-checks and builds the game into `dist/`                                                                            |
| `npm test`           | Runs the unit tests                                                                                                     |
| `npm run format`     | Tidies the code style                                                                                                   |
| `npm run screenshot` | Opens the built game in headless Chromium as a tablet, saves screenshots to `screenshots/`, and fails on any page error |
| `npm run check`      | All of the above checks in one go                                                                                       |

The screenshot step needs Playwright with Chromium installed on the machine; it is not a project dependency.

## Status

| Stage          | Phases | Status                        |
| -------------- | ------ | ----------------------------- |
| A. Foundations | 1–5    | In progress (phases 1–3 done) |
| B. The Noodle  | 6–12   | Not started                   |
