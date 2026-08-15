# Map, UI and Creature Polish Plan

This plan begins after the calibrated core build is stable. Do not polish all three surfaces at once; each gate must pass in the live hunt scene before the next expands.

## Gate 0 — Entry and Baseline

- stylesheet loads in development and production;
- starter selection, HUD and results fit desktop and mobile landscape;
- full run remains completable;
- capture a fixed-seed desktop baseline and FPS/entity sample.

## Gate 1 — Gloamwood Map Lab V2

Do not integrate the old Map Lab ground or trees. Rebuild the forest from the selected master reference in isolated layers: ground → elevation → river/banks → trees → rocks/ruins → fog/light. Each layer requires visual approval before the next begins.

Current status: ground, elevation, river/banks, trees and rocks/ruins are approved. The fog/light candidate is implemented at `?maplab=2`, with `1–6` switching through the isolated visual stages. It validates low-density edge/river mist, cool ambient depth, restrained warm route light and preserved crossing visibility. Final fog/light still requires separate overlays or shaders plus live combat readability and performance checks. Do not integrate the composite into the hunt scene until this sixth layer is approved.

The first Gate 1 live slice is now available at `?huntlab=1&debug=1`. It maps the accepted composite into the real spawn area while preserving authoritative movement, targeting, enemy AI, attacks, fog, drops and evolution. Desktop and mobile-landscape samples hold 60 FPS with 27 active entities, and the first kill/drop/progression loop passes. This is not the final map: the next sub-gate is independent tree trunk/canopy assets with bottom anchors, y-sort, behind-tree fading and minimal collision, followed by another combat-readability pass.

The independent-tree sub-gate now passes for four representative props: two transparent asset types, bottom anchors, y-sort, trunk-only collision shared by player/enemies, and 52% proximity fading behind canopies. The next sub-gate authors only the essential cliff, deep-water and ruin-base blockers and verifies route width before expanding prop density.

The live slice exposed a scale failure: 1672×941 is only about 1.3 desktop views, while 282–330-high trees consume too much combat visibility. `?maplab=3&debug=1` is now the authoritative spatial gate. Its 3600×2200 skeleton is 5.03× the old slice area and contains four clearings linked by five 300–360-wide routes. Main combat clearings have a minimum 980 short axis, exceeding the 940-unit requirement derived from the 430 magic range plus reposition margin. Approve this topology before repainting ground; the V2 composite remains a style reference, not the production map dimensions.

The first V3 painted-ground layer now sits behind the same entry and can be compared with the approved skeleton using `G`. It uses a new 1605×980 source displayed at 3600×2200, preserving the exact world aspect ratio. It includes only moss/soil/leaf ground, broad routes, the vertical river, shallow crossings and forest-edge ground masses. Trees, cliffs, rocks, ruins, fog, enemies and collision remain excluded until the ground composition is approved.

Run-duration review showed that even V3 can be crossed too quickly at the 330 combat movement speed. `?maplab=4&debug=1` is therefore the pacing topology gate: a 7200×4400 world, four seed-selected safe spawns, eight lineage nests, six connected routes and one separate boss lair. The route network totals about 29954 units and the pacing model targets 12.7–14.3 minutes when a run clears five to seven nests. Do not repaint this entire world or author all nest art yet; approve scale and implement one complete nest loop first.

Pass conditions:
- the selected master camera, scale, light and shadow direction remain consistent;
- paths and two viable hunt directions are readable without opening a map;
- trees have believable scale, ground contact and y-sort occlusion;
- player, targets, soul orbs and attack warnings remain visible under foliage and fog;
- collision never traps the player or hides a required interaction;
- the forest contains intentional clearings, edges and landmarks rather than uniform decoration;
- the complete forest spans multiple camera views; major combat clearings fit twice the longest basic attack range plus reposition margin, and ordinary routes remain at least 300 world units wide;
- 30 active combatants plus VFX meet the measured performance budget.

Only after every isolated layer passes should the new forest enter the live hunt scene. Do not start a second map.

## Gate 2 — Combat UI Hierarchy

Persistent UI should show only health, current combat style, evolution progress/tendency and the current objective. Target details, buffs, interaction prompts and boss information appear contextually.

Pass conditions:
- a new player can explain the objective and attack controls within one minute;
- target lock, out-of-range state and incoming danger are distinguishable without reading long text;
- the evolution tendency is readable during movement but does not cover combat;
- desktop 1440×900 and mobile landscape 844×390 keep the full canvas and critical HUD visible;
- focus, contrast, reduced motion/flash and 44px touch targets are supported before public release.

## Gate 3 — Six Attack Archetypes

Polish behavior foundations before polishing 24 species individually:

1. Pounce — readable crouch/aim, committed leap, landing recovery.
2. Dash — line/direction tell, burst movement, wall/overshoot handling.
3. Brace — frontal defense tell, counter window, clear rear/side solution.
4. Drain — attach/contact tell, interrupt rule, visible healing transfer.
5. Projectile — aim tell, projectile identity, impact and dodge window.
6. Spread — cone/fan preview, safe gaps, stronger recovery.

Every damaging action must have Telegraph → Active → Impact → Recovery. Tune numbers only after those four phases are visible.

## Gate 4 — Family Skills and 24 Species Identity

Layer one family talent and one visual modifier onto the shared archetype. A species is complete when it has:

- recognizable silhouette at gameplay zoom;
- readable family and threat tier;
- one signature behavior or timing variation;
- distinct telegraph/impact shape where needed;
- a known counter or safe response;
- a gene reward that matches what it demonstrates;
- sound/VFX hooks and measured performance;
- no collision, return-to-home or regeneration regression.

Do this in biome-sized batches, starting with the Gloamwood roster. Do not create 24 independent AI update loops.

## Gate 5 — Boss and Route Acceptance

- Boss death ends the run;
- all three attacks remain readable with forest/ruins art and full VFX;
- Fang, Carapace and Rift six-stage routes produce visibly and mechanically different final creatures;
- testers can state which prey caused their build and voluntarily attempt another route.

## Review Sheet Per Creature

Record: species, family, archetype, biome, threat, telegraph time, active time, recovery, signature skill, counter, gene reward, visual issue, audio issue, test result and tuning notes.
