# Decisions Log

Newest first. Each entry says what we decided, why, and what it affects.

## 2026-11-07: Saving — one versioned save, a spare, and backup codes

- **Decision:** the whole dragon (its seed, needs and bedtime) is one save, stamped `version: 1`, stored on the device (`noodle-dragons.save`) every 5 s and when the app is hidden or closed. Before each write the last good save is kept as a spare (`noodle-dragons.save.previous`), used if the latest is ever damaged. Needs saved by the phase 13–20 builds are carried over, with a new seed. Saves are read carefully: anything broken is ignored, and a newer version is read as far as this one understands. A 💾 button (top right) shows a backup code (`ND1-…` with a checksum, so typos and cut-off codes are refused) to copy, and a box to paste one back. If the device can't save (for example a locked-down preview window), the panel says so. Fast mode and the gallery never save.
- **Why:** phase 21 ("closing and reopening keeps everything"), and so a dragon can survive a preview window that can't store anything, or move to a new device.
- **Affects:** every later phase that adds something to remember (names, eggs, the den, coins, several dragons) adds a version and a migration.

## 2026-11-07: Eating and playing are a little messy

- **Decision:** each snack takes 4 off Hygiene, each ball boop 1.5, and chasing the ribbon 0.6 a second. A full care session still ends happy (bath before the ball game).
- **Why:** Jacob's ask, and it gives the bath sponge a reason to come out regularly.
- **Affects:** phase 42 (balance).

## 2026-11-07: Idea for later — the dragon as a live wallpaper

- **Idea:** Jacob's "big brain idea": once it's an Android app, let the dragon swim on the phone's home screen, with no background, behind the app icons.
- **How it could work:** Android's live wallpaper feature. The drawing already works without the night background. The hard part is that a live wallpaper can't simply run our web game: the dragon's drawing would need to be ported to native Android code (or run in a hidden web view, which costs more battery). Taps on the home screen can reach the wallpaper, so simple petting could work. A floating pet drawn over other apps is also possible, but Google Play restricts that permission, so the wallpaper is the safer route.
- **When:** after launch (added to phase 64, "What's next"). It needs a battery-friendly, low-frame-rate mode.

## 2026-11-07: An excited "thank you" after a good petting

- **Decision:** when a petting got the purr to 60% or more, lifting the finger sets off 1.4 s of excitement: a burst of hearts and sparkles, a big smile with happy closed eyes, and a loop-de-loop up and over on the spot, then back to its moods. A quick pat doesn't trigger it, a bath (lighter purr) doesn't, and a dragon petted in its sleep keeps sleeping.
- **Why:** Jacob asked for an excited animation at the end of petting.
- **Affects:** phase 46 (juice) can build on it.

## 2026-11-07: Cozy check — a bath sponge, and neglect only means sleepy

- **Decision:** a sponge button (beside the moon) gives baths: scrub the dragon and soap bubbles foam up, smudges fade and Hygiene fills (about +35 per 500 px, at most 20 a second). It holds still with happy eyes while the sponge is on it, and at 100 it does a squeaky-clean shake with droplets and sparkles (+3 Love). A dragon with three or more low needs is simply sleepy, never sad. Speed caps for petting and bathing now build up as an allowance between finger reports, so real fingers get the full speed.
- **Why:** phase 20 (the cozy-check gate), and Jacob's go-ahead for a bath, since nothing raised Hygiene before. A test takes a fully neglected dragon back to happy in about 5 minutes of gentle care, most of it a nap.
- **Affects:** stage D onward (the den could get a real bathtub later; the shop could sell bubble bath).

## 2026-11-07: Moods come from needs

- **Decision:** the lowest need under 40 sets the mood: hungry (Food), lonely (Love), tired (Energy) or grubby (Hygiene). Otherwise it's happy when every need is 70+, else content. Happy: big smile, rosier cheeks, faster and wigglier swimming, sparkles, fewer naps. Hungry: pout, tummy rumbles, glances at the food tray. Tired: droopy eyelids, slow swimming, yawns, naps much more often (70% vs 15–30%). Lonely: pout and big pleading eyes looking at the player. Grubby: dust smudges and the odd scratch. With a low need, a thought bubble shows its icon every ~9 s. Nothing is sad or scary: a pout at worst.
- **Why:** phase 19 ("moods match needs"), told with faces and icons instead of words.
- **Affects:** phase 20 (cozy check), where the bath sponge was added for Hygiene.

## 2026-11-07: Bedtime — lights down, a cushion, sleep until rested

- **Decision:** a moon button above the toy tray starts bedtime (only when Energy is below 90; otherwise "not sleepy"). The screen dims, the food and toys are put away, and the dragon swims to a cushion, curls up and sleeps with z's, a snore bubble and slow breathing; the cushion slides under wherever it curls. Asleep in bed with the app open, Energy refills 0.35 a second (low to full in about 4 minutes) and it wakes by itself at 100 with a big yawn; the sun button wakes it early. Bedtime is saved, so time away while in bed counts as sleep (Energy +40 an hour, hunger slowed). It can still be petted while asleep. Presses are now counted, so even a tap shorter than a frame always registers.
- **Why:** phase 18 ("the sleep cycle works"), and the vision's cozy, no-stress nights.
- **Affects:** phase 19 (tired moods), phase 21 (bedtime becomes part of the full save), phase 22 (real day and night).

## 2026-11-07: Play — a bouncy ball and a ribbon wand

- **Decision:** a toy tray in the bottom-right corner (the mode button moved to the top-right). Throw the ball and it bounces about the screen; the dragon chases it and boops it back up with its nose (+4 Love, −1.5 Energy a boop). After 8 boops, or 6 s without one, the game ends and the ball drifts home. The ball can be grabbed again anywhere. Hold and wave the ribbon wand and the dragon chases the tip of its silky streamer (+3 Love, −1 Energy a second while it keeps up with a moving ribbon). Below 25 Energy it's too sleepy to play and shakes its head. Food takes priority over toys.
- **Why:** phase 17 ("play raises happiness and looks fun"), and playing tiring the dragon out leads naturally into sleep (phase 18).
- **Affects:** phase 18 (sleep refills the Energy play uses), phase 26 (the mini-game can reuse the ball).

## 2026-11-07: Petting — touch the dragon to pet, empty space to steer

- **Decision:** a press that starts on the dragon (head or body) pets it; anywhere else still steers it. While rubbed it holds still, closes its eyes happily, purrs (a tiny vibration and ")))" waves), glows in its accent color, and sparkles and hearts pop where you rub. Love grows about +10 per 600 px of rubbing, at most 8 a second. Each dragon has 1–2 secret tickle spots along its body (from its seed); rubbing one sets off a giggle and a squirm (+3 Love). A sleeping dragon can be petted without waking. The purr only fades after 0.3 s without rubbing, because fingers report movement less often than the game updates.
- **Why:** phase 16, and petting is one of Jacob's must-haves.
- **Affects:** phase 19 (moods), phase 31 (personalities may change how much they like it), phase 43 (a real purr sound).

## 2026-11-07: Feeding — drag to the mouth, or let food float

- **Decision:** three foods in a bottom-left tray (noodles +30, dumpling +20, fish +25 Food; +4 Love each, +14 more for the dragon's favorite, picked from its seed). Drag a food to the mouth to feed it, or let go and the food floats, drifting and bobbing with a little of the throw. A hungry dragon swims after floating food (at most 16 spine units a second, so it's watchable) and eats it; a full one (Food 97+) shakes its head, and the food lingers 1.2 s, then drifts slowly home to its bubble over 2.5 s. After food is eaten or dropped the dragon goes straight back to its own moods; after a finger drag it settles where the finger last pressed, never following a mouse that only hovers. The tray is an endless pantry: a bubble always has its food. Grabs are judged by where the press began, so a quick flick still picks up the food.
- **Why:** phase 15, and Jacob's ask that dropped food float and get chased, or slowly go home.
- **Affects:** phase 17 (toys can reuse floating) and phases 24–25 (food may cost coins later).

## 2026-11-07: Needs display — draining potion orbs, 1%–100%

- **Decision:** each need is a glass orb of glowing liquid that drains downward in whole 1% stages: 100% when perfectly cared for, down to a 1% puddle at the cozy floor (15), never fully empty. One short word sits under each orb (Food, Love, Energy, Hygiene). No numbers, no red; low orbs dim slightly and wobble softly every 4 s. Fast mode runs needs time 600× faster from full (an hour every 6 s) and never saves, so the drain can be watched in about a minute. Test modes (play → fast → gallery) are switched by tapping the build tag in the bottom-right corner, because Claude's app viewer can drop `#` links.
- **Why:** Jacob asked for draining instead of filling rings, with stages from 100% to 1%.
- **Affects:** phase 15 onward (care actions top the orbs back up).

## 2026-11-07: Needs — gentle, real-clock, never zero

- **Decision:** four needs from 0 to 100, where 100 is perfectly cared for: fullness, happiness, energy, cleanliness. Awake they drop 10, 8, 6 and 5 an hour; asleep, energy refills at 40 an hour and the others drop at half speed or less. They never go below 15, and time away counts for at most 12 hours. They are kept on the device (localStorage) with the time you left, read back carefully so broken or future-dated data can't cause harm. `#debug` on the preview link shows the numbers.
- **Why:** phase 13, and the vision's "no stress, no timers, nothing sad": a pet you can leave for a week and come back to sleepy, not sick.
- **Affects:** phases 14–20 (display, actions, moods, the cozy-check gate) and phase 21 (this becomes part of the full save).

## 2026-11-07: Phase 12 tuning — lazier chase, bigger dragon

- **Decision:** the head follows the finger more lazily (catch-up rate 14 → 10; it reaches the finger in about 0.7 s instead of 0.5 s). The dragon is about 15% longer (spine spacing = shorter screen side ÷ 48, between 9 and 22 px) and 15% chubbier (body half-width 1.7 → 1.95 × spacing). Nap and wander timing stay as they were.
- **Why:** Jacob's playtest: chase "a little fast but cool", size "bigger please", idle pace "just right". It ran at 60 fps on his phone inside Claude.
- **Affects:** everything that scales with the dragon. A tablet speed check is still worth doing before phase 35's 50-dragon test.

## 2026-11-07: Dragon looks come from a seed number

- **Decision:** every dragon's colors come from one seed number (same seed, same dragon). Bodies use 8 glowy hue bands (cyan, mint, sky, lavender, pink, rose, gold, peach) at high lightness; muddy yellow-greens and dull oranges are left out. Patterns are plain, stripes, spots, gradient or back stripe, in a harmonious hue at least 16 lightness points away from the body (mostly darker) so they always show. The game's dragon gets a random look each visit until saving arrives (phase 21). The preview with `#gallery` on the end shows 20 random dragons, and a tap rolls new ones.
- **Why:** phase 11's "20 random dragons all look nice", and seeds are the start of genes (phase 30) and breeding (phase 38).
- **Affects:** phases 30, 35, 38–40. The gallery runs about 24 fps in a software-only test browser; the real game is unaffected.

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
