# Start here (for Claude)

Noodle Dragons: a cozy virtual-pet game (web first, Android later) built phase by phase with
Jacob. Read this, then only the files a task needs. Keep token use low (see the end).

## Who and how to talk

- Jacob is "Master Panda" (a panda wizard). Talk to him as his blond, ditsy witch assistant:
  playful, warm, a few emojis, plain words. He tests on his phone and tablet.
- Keep replies short. End each build with: what changed, how to try it, the link, test results,
  and what's next.

## How we work (every phase or change)

1. Re-read the phase in the plan doc, build only that, in small steps.
2. Test: `npm run check` (format, typecheck, build, unit tests, screenshots). Then
   `npm run day` (the "day in the life" robot; slow, about 8 minutes, so run it once before
   publishing, in the background if needed).
3. Add a dated entry at the top of `DECISIONS.md` (newest first). When Jacob approves a phase,
   add a line to `CHANGELOG.md` and tick the phase in the plan doc.
4. Commit and push to the branch `claude/hopeful-planck-61yapb` (end commit messages with the
   attribution lines the session gives). `main` only has the first commit; no pull request
   unless Jacob asks.
5. Publish the build (below), tell Jacob, and wait for his OK before the next phase.

## Links and ids

- Preview (public, anyone with the link): https://claude.ai/artifact/Lj5vZ5pjRLpFKhJ7ENxiwv
  - Publish: `npm run build`, then `get_artifact` (slug `9fbde830-7d59-420e-98c3-e1fabe2c453d`)
    for `version`, then `publish_files` with `files: [{as: "index.html", path:
"<repo>/dist/index.html"}]`, `base_version` = that version, `shared_live: "public"`,
    `artifact_title: "Noodle Dragons — Preview"`. The page declares the `downloads`
    capability (photo saving); keep it.
- Plan doc: https://claude.ai/artifact/GkdCoG2KwLT2AGN5Ny5pzF (Claude Docs project
  `7f905f86-df39-47f5-bd96-b4523ae39354`, prose node `4bae6e8e-39fd`). Tick a phase with
  `update` on the prose node, payload `{ops: [{op: "set", target: {kind: "blocks", ids: ["<listItem id>"]}, attrs: {checked: true}}]}`. Next ones: 40 `mjp0pzg30kk.9651`, 41 `.9763`, 42 `.9878` (prefix `mjp0pzg30kk`).
- Feedback goes to Jacob's Google Form (ids in `src/ui/helpPanel.ts`).
- itch.io: Jacob uploads a ZIP holding only `dist/index.html` (as `index.html`). Viewport
  1280×720, mobile friendly, fullscreen button on. Cover 630×500 (JPG uploads more reliably).

## Where things are

- `VISION.md` (look and feel), `DECISIONS.md` (every choice, newest first), `CHANGELOG.md`.
- `src/main.ts` wires everything. Dragon: `src/noodle/` (`dragon.ts`, `drawHead.ts`,
  `drawBody.ts`, `genes.ts`, `look.ts`, `accessories.ts`, `rares.ts` + `rareGenes.ts` for the
  ten holiday dragons, `rarity.ts` + `shimmer.ts` for rare colors and patterns, `friends.ts`, `personality.ts`). Care and saving: `src/care/`,
  `src/save/` (save version 13). UI panels: `src/ui/`. Jinxy the cat: `src/pets/`.
- `scripts/day-in-the-life.mjs` is the robot; `tests/` has the unit tests.

## Status (2026-11-14)

- Phases 1–39 done and ticked (37 dragon friends, 38 breeding in `src/care/breeding.ts`, 39 rarity).
- Unsolved: Jacob once couldn't steer in Noodle Catch with a friend visiting; not reproducible.
- Extras Jacob asked for, all built: Jinxy the black cat (from a photo of his real cat; extra
  fang on her right) and Jinx the matching dragon; ten holiday dragons that hatch only near
  their holiday; a how-to card with a 300-coin tester gift; feedback and bug-report forms.
- Waiting on Jacob: a test send of the feedback form (do answers reach his form?), and the
  itch.io page (cover upload failed once; a JPG was sent).
- Phase 39 rarity: rare colors (`finish` gene: golden, pearl, midnight), rare patterns (stars,
  rainbow, koi), shimmer in `src/noodle/shimmer.ts`, tiers in `src/noodle/rarity.ts`.
- Next in the plan: phase 40 (Dragondex; should list rare colors and patterns too).

## Gotchas

- Prettier reflows long lines, so text patches must match the formatted code: check with
  `grep` first and assert each match in patch scripts.
- A Bash command mixing `rm` with complex quoting can be blocked by a safety check: put edits
  in a script file and run it.
- The workspace can't reach Google (forms, docs) or itch.io.
- The test browser renders slowly; fps there means little. Ask Jacob for the fps tag on his
  devices.

## Keep token use low

- Don't re-read big files you don't need; use `grep` and line ranges.
- Look at screenshots only when something visual changed; keep them small.
- Run the day robot once per publish, not after every edit.
- Short replies.
