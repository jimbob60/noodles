# Decisions Log

Newest first. Each entry says what we decided, why, and what it affects.

## 2026-11-12: Photo mode

- **Decision:** a 📷 camera button (sixth in the top-right stack) opens photo mode. Every button, the need orbs, coins, badge and build tag step aside; the den, decorations and the dragon (in its outfit) stay. A toolbar along the top (so it never covers the caption) has: **✋ Hold still** (the dragon freezes exactly where it is, so you can drag it into place first and then lock the pose; **▶ Move** lets it go again), four **faces** (as it is, 😊 happy "^ ^" grin, 😮 wow with big shiny eyes, 😴 sleepy), three **frames** (none, 🖼️ polaroid with a white border and the dragon's name and date in the corner of a cream strip, ⭐ starry vignette with twinkling gold stars), **📸 Snap** and ✕. The frame is drawn onto the screen itself, so what you see is the photo. Snap flashes white and shows the picture, with **💾 Save** (downloads a PNG named like `sprinkles-2026-11-12-1741.png`, at the screen's full resolution), **📤 Share** where the device can share files, and **📸 Another**. A small "Noodle Dragons" mark sits in the corner of every photo. Photos aren't kept inside the game (they're big); stickers for Panda Studios can come from them later.
- **Why:** phase 34 ("a photo saves to the tablet"). In the Android app (phase 49 on), saving may need a Capacitor file plugin instead of a download; the share button already uses the system share sheet.
- **Affects:** phase 49+ (saving to the Android gallery).

## 2026-11-12: Dragon wings, and all wings redone

- **Decision:** a new back accessory, **dragon wings** (100 coins, the dearest). Then, after Jacob said all the wings still looked bad, every wing was redone. Wings now have real depth: the far wing is drawn behind the body and tilted up so it peeks out, and the near wing in front; they attach at the shoulders, are bigger, and are outlined in a darker shade of their own color instead of black ink. **Dragon wings** are bat-like: an arm rising to a little clawed wrist, a long top edge sweeping back to a pointed tip, finger bones out to a four-scallop trailing edge, and a soft sheen; slow, strong flaps (a swing, not a squash). **Fairy wings** are two pairs of long see-through teardrops, lighter toward the tips, with white veins and twinkling stars, fluttering fast. **Butterfly wings** are a big round upper wing and a smaller lower one, always **yellow and black** like a swallowtail (Jacob's pick): sunny yellow with a thick black border, black stripes fanning out from the body and white dots round the edge; the chosen color only tints the little eye spot on the lower wing. All are sized from the body, so babies get small wings. 30 accessories in all.
- **Why:** Jacob asked for dragon wings, then for all wings to be redone.
- **Affects:** phase 42 (prices); a flying pose could use the wings later.

## 2026-11-12: The head grows up too

- **Decision:** the head used to stay the same size from baby to grown-up (its "big baby head" bonus shrank exactly as the body thickened), so grown-ups risked looking like small heads on big necks. Now the head grows too, just slower than the body: from 82% to 108% of a grown body's half-width × 1.3, about a third bigger by the time it's grown. A baby's head is still a little big for its slim body (cute), and a grown-up's head is a touch bigger than before. Hats and neck things follow, since they're sized from the head.
- **Why:** Jacob asked ("make the head grow too so we don't end up with huge-neck dragons").
- **Affects:** nothing else; sizes only.

## 2026-11-12: More accessories, and the bad ones redrawn

- **Decision:** after Jacob's look ("fix the ones that look bad, like the tail bow"), every accessory was checked at full size. Fixed: hats were far too small for the head (now drawn 1.45× bigger); neck things were hidden under the mane, so they now sit just behind it, are drawn after the head, and collars are clipped to the body's outline so they wrap the neck instead of poking out like poles; the tail bow looked like a stick person, so bows are now real ribbon bows (two puffy loops with folds, a knot, notched ribbon ends); tail rings are chunky gold bands with a gem. Added 17 more, 29 in all, and a fourth slot, **back**: hats and headwear (hair bow, chef hat, Santa hat, propeller cap with a spinning propeller, cowboy hat, halo that floats and glows), neck (flower lei, heart locket, pearl necklace), back (tiny backpack, hero cape that flutters, butterfly wings and fairy wings that flap and sparkle) and tail (tail flower, swinging tail bell, ribbon streamers, star charm). Prices 30–90 coins (balance in phase 42). The save format is unchanged (the back slot just appears in the closet; older closets have nothing on their back).
- **Why:** Jacob asked for more accessories and for the ugly ones to be fixed.
- **Affects:** phase 34 (photo mode), phase 42 (prices).

## 2026-11-12: Accessories — a closet of hats, neck things and tail things; save version 11

- **Decision:** 12 accessories drawn by code, bought once with coins and kept forever (30–80 coins; balance in phase 42): **hats** (party hat 40, flower crown 50, cozy beanie 45, witch hat 60, top hat 70, royal crown 80), **neck** (bow tie 30, bandana 35, bell collar 40, cozy scarf 45) and **tail** (tail bow 30, tail rings 55). One per slot can be worn at once, each in any of six colors. Hats are drawn in the head's own coordinates, so they turn, tilt and shake with the head and grow with it; neck things sit on the first spine point clear of the head, on the belly side, and the scarf's ends flutter along the body; tail things sit near the tail tip and follow it. A new 🎀 **closet** button (fifth in the top-right stack; the stack wraps into two columns on very short screens) opens the closet: a live picture of the whole dragon in its outfit, then hats, neck and tail tiles: tap to buy (it goes straight on), tap to put on or take off, color dots to recolor what's worn. The profile portrait shows the hat. The gallery dresses its dragons at random, and a test draws every accessory on several dragons as babies and grown-ups. The save is now version 11 (adds `wardrobe`: owned and worn); older saves start with an empty closet. The page shows what's worn as `data-outfit`.
- **Why:** phase 33 ("dressing up works on any dragon"); dress-up is one of Jacob's must-haves.
- **Affects:** phase 34 (photo mode will show outfits off), phase 36 (each dragon its own closet or a shared one, to decide then), phase 42 (prices).

## 2026-11-12: Names, birthdays and the profile card; saved as save version 10

- **Decision:** every dragon has an **identity**: a name (up to 16 letters, emoji welcome) and a birthday (when it hatched). Right after a new player's egg hatches, a card asks for a name, with a cute suggestion already filled in (food-and-sky names like Mochi, Bao, Comet or NoodlePuff) and a 🎲 for another idea; any name will do, so it never blocks play. The badge under the coins now shows the name and stage; **tapping it opens the profile card**: a portrait of its smiling head, the name with ✏️ to rename, "Hatched Nov 9, 2026 · 3 days old" (age counts calendar days), its stage and growth bar, "Mostly Shy 🙈" with a meter for each personality trait, its favorite food, chips for its special looks (horns, back, tail, teeth, pattern, marks, size and so on) and its dragon number. The save is now version 10 (adds `identity`); older dragons get a name from their seed (always the same one) and a birthday worked out from how long they have been growing. The page shows the name as `data-name` for automated checks, and the day robot now names its dragon Biscuit and opens the profile card.
- **Why:** phase 32 ("every dragon has an identity").
- **Affects:** phase 36 (several dragons, each with its own name), phase 34 (photo mode can show the name), phase 38 (babies need naming too).

## 2026-11-10: Personalities — playful, sleepy, greedy and shy act differently

- **Decision:** the four personality genes now steer behavior (`src/noodle/personality.ts`). Each dragon has one clear **main trait**, its strongest: that trait shows fully and the others at half strength, and any trait under 0.4 doesn't show at all. **Playful:** swims up to 40% faster and wigglier, naps less, and does surprise zoomies (a quick sparkly loop-de-loop) every 12–45 s. **Sleepy:** naps much more often and up to twice as long, swims slower, yawns every 12–40 s, and its eyes are always a little heavy. **Greedy:** begs every 14–40 s (a food thought bubble and a look at the food tray, even when not hungry), rushes to food up to 60% faster, and does a happy wiggle after every snack. **Shy:** mostly wanders and naps near the walls and the floor, follows a finger but keeps a little distance, and blushes and looks away when a finger comes close; after a lovely petting it trusts you for two minutes (much less shy). Personality only changes behavior, never needs or rewards (nothing is better or worse). The gallery shows each dragon's main trait under it, and the page shows thought bubbles as `data-thinking` for automated checks.
- **Why:** phase 31 ("Jacob can tell them apart by behavior").
- **Affects:** phase 32 (the profile card shows the traits), phase 37 (dragon friends), phase 38 (breeding mixes personalities).

## 2026-11-10: Lots more genes, including teeth

- **Decision:** at Jacob's request ("make a ton more genes", "some with lots of sharp teeth"), 18 more genes: eye color and eye size; snout length (only the muzzle stretches, and the whiskers and feeding mouth move with it); a forehead mark (none, gem, star, moon or heart); freckles; cheek frills (webbed fins); horn shape (branching antlers, curly ram horns or straight spikes); back ridge style (spikes, round scallops or a see-through sail fin) and size; tail tip style (flame, fish-like fan or fluffy pompom) and size; chubbiness (the body only, not the head); leg length; glow strength; how clearly the scales show; whisker color (white, gold or the accent); mane color (accent, pattern or horn color); and **teeth** (none showing, two fangs, a grin full of sharp little teeth, or a snaggle-tooth). Teeth follow the mouth: along the lip when shut, top and bottom rows when chomping. The extras come from a third random stream, so no gene a dragon already had changed. Genes saved before these existed get the extras from their seed, the same way every time, so the save format stays version 9.
- **Why:** more variety, so every dragon looks like itself; it also gives breeding (phase 38) and rarity (phase 39) a lot to work with.
- **Affects:** phase 35 (the 50-dragon test will check these combinations), phase 38, phase 39, phase 40 (Dragondex).

## 2026-11-10: Genes — one record makes each dragon; saved as save version 9

- **Decision:** every dragon carries **genes** (`src/noodle/genes.ts`): its colors and pattern (as before), horn length (0.75–1.3) and branches (0–2 tines each), mane length, whisker length, size (0.9–1.1: a big dragon is a few spine points longer and a little chunkier when grown), a personality (playful, sleepy, greedy and shy, each 0–1), its favorite food and its secret tickle spots. Drawing and behavior read only the genes, so the same genes always make the same dragon; a test draws two dragons from the same genes into a recording canvas and checks every drawing call matches. A wild dragon's genes come from its seed. The new body-shape genes come from a separate random stream, so every existing dragon kept its colors, favorite food and tickle spots. The save is now version 9 (adds `genes`); older saves get the genes their seed always made, and broken genes fall back to the seed the same way. Personality is only data for now: phase 31 makes dragons act on it.
- **Why:** phase 30 ("the same genes always make the same dragon"), and so breeding (phase 38) can mix two dragons' genes.
- **Affects:** phase 31 (personalities), phase 32 (profile card shows traits), phase 38 (breeding), phase 39 (rarity).

## 2026-11-10: Growing up — baby, kid, teen, grown-up; saved as save version 8

- **Decision:** a dragon grows with **hours of good care**: kid at 24 h, teen at 60 h, grown-up at 96 h (about four days). Good care means the four needs average at least 45; sleeping counts. Neglect only pauses growing: a dragon never shrinks and never gets stuck (VISION: no punishment). Time away counts like the needs do, up to 12 hours at once, if it was left well cared for. Growing is smooth: the noodle gets longer bit by bit, from 12 spine points just hatched to 26 grown, and a little thicker. Babies have bigger heads for their size, tiny nub horns, a short mane and small back fins. Reaching a new stage shows a banner ("Your dragon is a kid now!"), a happy wiggle, and a 25-coin gift. A small badge under the coins shows the stage and a bar toward the next. Fast mode grows its own dragon from a baby 600× faster (grown-up in about 10 minutes) and never saves. The save is now version 8 (adds `growth.hours`). Older saves start again as babies, so every dragon gets to grow up; the egg had only just arrived, so no dragon was older than a few days anyway.
- **Why:** phase 29 ("a dragon grows over a few days of care").
- **Affects:** phase 30 (genes can set grown size), phase 42 (balance: the hours), breeding later (only grown-ups).

## 2026-11-09: Corner buttons fit short screens; scales on the head

- **Decision:** the four small top-right buttons (backup, decorate, shop, game) now share one layout (`cornerButton` in `src/ui/layout.ts`). On roomy screens nothing changes (18 px bubbles, 46 px apart). On short screens, like a phone on its side or inside the Claude app, the stack squeezes and the bubbles shrink so the last one stays clear of the sponge and moon buttons. The tray buttons share `trayRadius`. The head now has the same faint fish scales as the body over its crown and neck, stopping before the muzzle so the face stays clean.
- **Why:** Jacob saw the buttons overlap in landscape on his phone, and the smooth head didn't match the scaly body.
- **Affects:** phase 44 (menus) and phase 47 (accessibility) can build on the shared layout.

## 2026-11-09: Side profile — one eye, all feet under the belly

- **Decision:** at Jacob's request the dragon is now seen in true side profile. The head shows one big eye (the far eye is gone). All four legs hang from the belly, the side facing down the screen: each pair is a near leg a little forward and a far leg a little back, drawn a shade darker behind it. When the body turns over, the feet slide smoothly under the body to the new belly side instead of jumping.
- **Why:** a mixed view (side-on head, legs on both sides as if seen from above) looked confused next to the new Eastern look.
- **Affects:** phase 29 (growing up), any future poses.

## 2026-11-09: Redesign — cute Eastern dragons

- **Decision:** from Jacob's picture of a red-and-gold Eastern dragon ("cute Eastern, but the snout and eyes have to change, the snout looks like a pig's"). The round pale snout with two nostril dots is gone: the head is now one shape, a round crown sloping into a tapered muzzle with a slightly upturned nose, a nostril curl on top, a pale chin, and a mouth line along the muzzle (chomp drops the jaw, smile is a wide grin, pout turns down). Eyes are big almond jewel eyes slanting back, with a brow ridge, a colored iris (a deep shade of the accent color) and a soft slit pupil, still sparkly; blink, droop, pleading and sleep all kept. Swept-back antler horns with a branch, a flame-like mane and a chin tuft in the accent color. Body: faint fish scales, a spiny ridge of fins along the upper edge (they shrink away where the body runs straight up or down, so they never flip sides), clawed feet instead of toe beans, and a flickering flame tail fin instead of the fluffy tuft. Whiskers now grow from the tip of the nose. The mouth point used by feeding and Noodle Catch moved with the new mouth (`MOUTH` in drawHead.ts). Body size and length are unchanged, so nothing in play changed.
- **Why:** Jacob asked for it; it fits the vision (still super cute and glowing).
- **Affects:** phase 29 (growing up: babies can have smaller horns and ridge), phase 30+ (colors and rarity can use the new parts).

## 2026-11-07: Decorations — drag, tap, put away; saved as save version 2

- **Decision:** a decorate button (top right, under 💾) opens a drawer near the top (below the need orbs, wrapping into rows on phones) with ten detailed code-drawn decorations: a paper lantern, fairy lights, a moon mobile, a firefly jar, a crystal lamp, a tufted cushion with tassels, a mushroom stool, a flowering potted plant, a tea set and a fringed rug. Drag one out to place it, drag placed ones to move them, tap one to cycle through its three colors, and drag one onto the drawer to put it away. Floor things (cushion, stool, plant, crystal lamp, tea set, rug) stay on the floor; lanterns, lights, the mobile and jars can float, and the glowing ones glow more at night. At most 16. Positions are kept as a share of the screen so they fit any size. The save format is now version 2 (adds the decorations); version 1 saves upgrade with an empty den. While decorating, food, toys and care buttons step aside. The drawer sits up top so the whole floor is free. More detail and five more kinds were added at Jacob's request.
- **Why:** phase 23 ("Jacob can decorate").
- **Affects:** phases 24–25 (the shop can sell more decorations), phase 44 (menus).

## 2026-11-07: The den — a cave with a window on a real-clock sky

- **Decision:** the play screen is now the den: rounded rock walls with glowing crystals frame a big arched opening onto two rows of hills and the sky; a mossy floor with grass and glowing mushrooms; vines with lantern bulbs; fireflies. Layers are painted once (again on resize and every 15 minutes of sky time) and drift slightly at different speeds as the dragon moves (parallax). The sky follows the device's local clock through night (stars, moon), dawn (pink), day (a soft twilight, never above 62% lightness) and dusk (peach), blending smoothly; crystals, mushrooms and fireflies glow brighter in the dark. Fast mode runs the day 600× too. The title leaves the play screen until the title screen in phase 44. The bed sits lower, on the den floor.
- **Why:** phase 22 ("the den feels like home"), in the night-and-glow look of VISION.md.
- **Affects:** phase 23 (decorations go in the den), phase 26 (the mini-game can reuse the sky).

## 2026-11-07: Saving — one versioned save, a spare, and backup codes

- **Decision:** the whole dragon (its seed, needs and bedtime) is one save, stamped `version: 1`, stored on the device (`noodle-dragons.save`) every 5 s and when the app is hidden or closed. Before each write the last good save is kept as a spare (`noodle-dragons.save.previous`), used if the latest is ever damaged. Needs saved by the phase 13–20 builds are carried over, with a new seed. Saves are read carefully: anything broken is ignored, and a newer version is read as far as this one understands. A 💾 button (top right) shows a backup code (`ND1-…` with a checksum, so typos and cut-off codes are refused) to copy, and a box to paste one back. If the device can't save (for example a locked-down preview window), the panel says so. Fast mode and the gallery never save.
- **Why:** phase 21 ("closing and reopening keeps everything"), and so a dragon can survive a preview window that can't store anything, or move to a new device.
- **Affects:** every later phase that adds something to remember (names, eggs, the den, coins, several dragons) adds a version and a migration.

## 2026-11-07: Eating and playing are a little messy

- **Decision:** each snack takes 4 off Hygiene, each ball boop 1.5, and chasing the ribbon 0.6 a second. A full care session still ends happy (bath before the ball game).
- **Why:** Jacob's ask, and it gives the bath sponge a reason to come out regularly.
- **Affects:** phase 42 (balance).

## 2026-11-09: Eggs — every new dragon hatches

- **Decision:** a brand-new player starts with an egg in a nest in the den. Rub it to warm it (about 600 px of rubbing; it cools gently if left, never below cold), then tap it three times to crack it (cracks spread and light shines through), and it bursts open: the top of the shell tumbles away with crumbs, sparkles and a flash, and the dragon pops out with the excited loop-de-loop and hearts. The egg is tinted with the dragon's own colors and speckled with its pattern color, so it hints at who is inside. A wordless finger hint shows rubbing, then tapping. Nothing is saved until it hatches. Existing dragons stay hatched; the mode button's 🥚 hatch test mode replays your own dragon's hatching without saving anything.
- **Why:** phase 28 ("hatching feels special").
- **Affects:** phase 38 (breeding lays eggs), phase 45 (the tutorial's talking egg).

## 2026-11-09: A "day in the life" robot as the Stage D gate

- **Decision:** `npm run day` (scripts/day-in-the-life.mjs) plays a whole session on a tablet-sized screen in headless Chromium: a new dragon and the daily hello, a snack and a polite "no thanks" when full, petting, a ball game, a bath, buying and placing a lantern, a Noodle Catch round played by a bot, and a full bedtime to waking. Then it closes and reopens (same dragon, den, coins and best score) and comes back 36 hours later (every need above the cozy floor). Any page error fails it. It joins the checks to run before each phase is published.
- **Why:** phase 27 ("nothing is lost and Jacob enjoys a full session"). The first run found the test's own wrong expectations, not game bugs.
- **Affects:** every later phase; it grows as features are added.

## 2026-11-09: Noodle Catch — a 45-second dumpling-catching mini-game

- **Decision:** a 🎮 button (top right, under the shop) starts a round: a 3-2-1 countdown, then 45 s of dumplings falling from the sky; the finger steers the dragon and its mouth catches them. Dumplings are 1 point; golden ones (1 in 8, a little faster) are 3. They fall faster and more often as the round goes on. Nothing bad ever falls, and a miss just bounces off the floor. Each catch is a little Food. At the end: score, best score (saved; save version 7), and coins = half the score, at most 25 a round (the daily soft cap still applies), plus +6 Love and −8 Energy. Below 25 Energy it's too sleepy to play. Food, toys and other buttons are put away during a round.
- **Why:** phase 26 ("a round is fun and lasts about a minute"); it also gives a faster way to earn coins toward the big shop goals.
- **Affects:** phase 42 (balance), phase 43 (sounds).

## 2026-11-09: Toys in the shop — five new balls that each play differently

- **Decision:** the shop gets a ⚽ Toys section: yarn ball (1,000; heavy, rolls, barely bounces, trails yarn), star ball (1,100; floaty, sparkle trail), bubble ball (1,250; very light and slow), jelly ball (1,350; super bouncy, squishes on landing) and rainbow ball (1,500; shifting colors, extra Love per boop). Because toys are kept forever, Jacob set them as big goals (1,000–1,500, all different); at about 50 coins a day they take weeks, which is where gems come in later. Each has its own gravity, bounce, air drag, floor grip and Love bonus. Toys are bought once and kept (unlike decorations, which are placed). The beach ball stays free. Tap the ball bubble to cycle through owned balls (dots show how many); drag to throw. Save version 6 adds the owned balls.
- **Why:** Jacob asked for more games like the ball, with different balls.
- **Affects:** phase 26 (the mini-game could reuse balls), phase 42 (balance).

## 2026-11-09: Decorations are bought one at a time and kept in storage

- **Decision:** at Jacob's request, buying a decoration gets you one item, not an unlock: two lanterns means buying two. Prices: lantern 10, cushion 12, jar 15, plant 15, rug 18, stool 20, tea set 25, fairy lights 25, beanbag 30, moon mobile 30, crystal lamp 35, bonsai 40, planet lamp 50. Decorations are bought only in the 🛍️ shop. The decorate drawer is the storage: it shows only decorations you have, each with a green count (an empty drawer says so and points to the shop). Placing one takes it out of storage; dragging it back onto the drawer returns it, so nothing paid for is lost. Recoloring is free. Storage holds up to 9 of each. Save version 5 adds `storage`; decorations "unlocked" by the version 4 shop become one each in storage unless already placed, and placed decorations stay placed. The shop panel shows how many are in storage.
- **Why:** Jacob wants each decoration bought, like a real shop.
- **Affects:** phase 42 (balance: a new player earns about 50 coins a day).

## 2026-11-09: The shop — treats and new decorations; everyday things stay free

- **Decision:** a 🛍️ button (top right, under the decorate button) opens the shop. It sells treats in packs of 3, which go in the pantry and show in a row above the food tray with a count: berry bowls (6 coins; Food +15 and extra Love) and moon cakes (15 coins; Food +30, more Love and a little Energy). It also unlocks three new decorations for good: a star beanbag (30), a blossom bonsai (40) and a planet lamp (50). The three everyday foods, the toys and the 10 starter decorations stay free forever, so care never depends on coins. The pantry holds up to 30 of each treat. Save version 4 adds the stash (pantry and unlocked decorations); older saves start empty.
- **Why:** phase 25 ("buying works and prices feel fair"), keeping the no-stress vision.
- **Affects:** phase 26 (the mini-game earns coins), phase 42 (balance), and later gems (phase 64).

## 2026-11-07: Noodle coins — earned only by caring and playing

- **Decision:** coins for a snack (2), the favorite food (3), a good petting that ends in the excited loop (3), a ball boop (1), every 5 s of ribbon chasing (2), a squeaky-clean bath (4), waking up rested (5), and a daily hello on the first visit each day (10). After 150 in a day, everyday care pays half, so there's no grinding; it resets the next day. Coins pop out and fly to a counter under the need orbs. Fast mode never pays. Saved with the dragon (save version 3; older saves start at 0). No real money anywhere; spending comes with the shop (phase 25).
- **Why:** phase 24 ("coins add up correctly").
- **Affects:** phase 25 (shop prices), phase 42 (balance).

## 2026-11-07: Idea for later — a premium currency

- **Idea:** Jacob's: a premium currency (say, gems 💎) bought with real money, alongside the free noodle coins.
- **How it could work:** Google Play Billing (Capacitor has plugins for it); gems buy cosmetic extras like special decorations, accessories or rare patterns. Real-money sales need the Play Console's payments profile and tax info, a store listing that says "In-app purchases", and careful rules if children play (Play's Families policies). To keep the cozy, no-stress vision: never pay-to-win, never pressure, everything that matters still reachable with coins.
- **Swap for coins:** Jacob's plan is that gems can be swapped for noodle coins, so a player could reach a big goal like a 1,000+ coin ball sooner. (Earning coins by play must stay a fair, steady path.)
- **When:** after launch (phase 64). Phase 24's coins stay earned-only, and nothing is built for gems yet, so no real money is anywhere in the game for now. This also answers part of the open question "free, or a small price?".

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
