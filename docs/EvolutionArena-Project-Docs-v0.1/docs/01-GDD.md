# Game Design Document (GDD)

## 1. High Concept

**Evolution Arena** is a browser-first 2.5D action roguelite about predation and directed evolution. The player enters a compact ecosystem as a weak base creature. Killing and consuming creatures grants **Biomass** and six families of **Genes**. Biomass triggers growth; recent and cumulative prey genes determine which mutation automatically emerges. Six major evolution stages transform the creature into a specialized Apex build, after which optional overgrowth raises world and boss threat.

## 2. Target Player

Players who enjoy:

- fast roguelite runs;
- build experimentation;
- creature evolution;
- readable action combat;
- collecting discoveries;
- “one more run” progression.

## 3. Session Structure

Initial validation target:
- Normal clear/death: 12–18 minutes
- No hard maximum in the current single-player build
- First meaningful mutation: within ~90 seconds
- First elite decision: by ~4 minutes
- Stage VI unlocks the boss decision; staying longer creates overgrowth pressure
- Only add mid-run save/cocoon systems if observed median runs naturally exceed ~18 minutes

## 4. Core Run

Spawn weak → hunt prey → collect graded soul orbs → reveal an evolution tendency → automatic visual/functional growth → enter riskier regions → fight elites for stronger genes and temporary echoes → reach Stage VI → fight the boss now or risk overgrowth → win/die → inspect the gene chain → replay.

## 5. Controls — v0.1

Desktop browser:
- WASD / arrow keys: movement
- Mouse: click a visible creature to lock/attack; click ground to move
- Space: attack the current target/aim point
- 1/2/3: melee/ranged/magic combat style
- Shift: dash
- E: interact
- R: resist one pending evolution per run
- B: bestiary
- Esc: pause (required before public demo; not yet implemented)

Keep input abstraction separate so controller/mobile can be added later.

## 6. Six Evolution Stages

| Stage | Fantasy | Design Purpose |
|---|---|---|
| I — Hatchling | fragile scavenger | teach movement/combat |
| II — Adapted | first recognizable trait | first build commitment |
| III — Hunter | reliable combat identity | enable region choice |
| IV — Predator | strong synergy | elites become viable |
| V — Alpha | dramatic silhouette/power | boss preparation |
| VI — Apex | final expression of build | climax/final phase |

Each stage previews the current family tendency, then automatically commits one mutation after a short delay. Recent hunts contribute about 60% of the tendency and cumulative genes about 40%. A run grants one resist charge that delays growth while preserving most progress.

## 7. Two Resource Model

### Biomass
- Primary run progression.
- Earned from kills/consumption.
- Fills the evolution meter.
- Stronger targets grant more.
- Farming trivial prey has sharply diminishing value at later stages.

### Genes
- Determine *what* evolution emerges.
- The six current families are Fang, Wing, Carapace, Swarm, Venom and Rift.
- Hunting specific species intentionally biases the next choice.
- Player kills in a future multiplayer version may yield opponent gene samples, but this is outside v0.1.

## 8. Mutation Design

Every major mutation should answer:
1. What changed visually?
2. What changed mechanically?
3. What trade-off did I accept?
4. What prey/region made this more likely?
5. What other mutations synergize with it?

Example:
**Carapace**
- Visual: shell plates on back
- Benefit: damage reduction / stagger resistance
- Cost: lower acceleration
- Gene: Carapace
- Synergy: Spiked Shell / Heavy Charge

## 9. Enemy Hierarchy

- **Prey/Common:** safe biomass and basic gene learning
- **Hunter/Common:** credible combat threat
- **Specialist:** teaches status/mobility mechanics
- **Elite:** enhanced version with affix/behavior change
- **Boss:** authored encounter, unique gene/mutation opportunity

Current content: **24 visible species** built on **6 shared attack archetypes**, elite variants with 5 affixes, and **1 required boss**. A rare/optional second boss remains a post-validation feature.

## 10. Map Philosophy

One handcrafted map with recognizable landmarks and biome identity. Macro layout remains stable; ecology changes per run.

Randomized per run:
- player start among authored safe spawn anchors (planned; currently fixed);
- creature composition and local density (planned; currently authored encounters);
- elite locations;
- rare gene nodes/treasures;
- optional boss/event activation;
- selected hazards.

This lets players learn geography without solving the run by memorization.

## 11. Biomes

The current map uses three zones:
- Gloamwood — lower threat, Fang/Wing/Swarm access
- Rotfen — medium threat, Carapace/Venom/Swarm access
- Ashen Ruins — high threat, Rift/Carapace/Venom access

Not every biome needs a full bespoke asset set in the earliest greybox.

## 12. Boss Philosophy

Bosses are not only “large HP bars.” A boss should:
- test a mechanic learned earlier;
- visibly alter the arena;
- have 2–3 readable attack patterns;
- reward a unique or highly weighted mutation;
- create a memorable run story.

## 13. Secrets and Treasures

Include lightly in v0.1:
- 2–4 hidden landmark locations;
- rare gene cache;
- one conditional event;
- one rare mutation path.

Do **not** build a large puzzle system yet.

## 14. Meta Progression

Meta progression should unlock **possibility**, not raw permanent power:
- gene/mutation encyclopedia;
- creature discoveries;
- build history / “creature gallery”;
- new mutations entering future-run pools;
- cosmetic variants;
- optional challenge modifiers later.

Avoid permanent +HP/+damage upgrades during validation.

## 15. Win / Loss

v0.1 win:
- Collect the three regional sigils, reach Stage VI, and defeat the Rift Warden. The player may remain after Stage VI, but world and boss threat continue increasing.

Loss:
- Death anywhere, including inside the boss encounter.

Both lead to a concise results screen showing:
- survival time;
- evolution path;
- creatures consumed;
- elites/bosses defeated;
- newly discovered genes;
- final creature snapshot;
- “Play Again” as the dominant action.

## 16. Replayability Sources

Priority order:
1. Directed-but-random automatic evolution driven by prey choice
2. Different prey/ecology each run
3. Build synergies and trade-offs
4. Elite/boss route decisions
5. Secrets/rare genes
6. Meta collection
7. Dynamic events (later)
8. Multiplayer social unpredictability (future)

## 17. Multiplayer Future

The original multiplayer arena concept remains strategically interesting, but it is a **future multiplier**, not a substitute for fun.

If single-player validation succeeds, multiplayer exploration can add:
- player predation;
- gene stealing;
- bounty/Apex target mechanics;
- anti-snowball rules;
- explicit bots/ecological creatures;
- authoritative server combat.

No v0.1 architecture should make multiplayer impossible, but no multiplayer infrastructure should delay core-loop validation.
