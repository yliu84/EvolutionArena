# Random Evolution Species Matrix v1

## Product rule

Evolution is a directed random graph, not a fixed cosmetic ladder. Hunting changes weighted gene tendency; the current stage plus dominant and compatible secondary families resolves the current species. Every recognized route reaches an authored Apex endpoint with a different normal-attack profile, locomotion profile, passive, cost, visual language and authoritative stat result.

The v1 graph contains exactly:

- 1 origin species;
- 6 family lineages used during stages 1–5;
- 6 pure-family Apex endpoints;
- 7 curated two-family Apex endpoints;
- 20 core species definitions and 13 reachable final endpoints.

Supporting every possible two-family pair is a later ceiling: six pure routes plus `C(6,2)=15` pairs would create 21 endpoints and 28 core species. The first release intentionally authors only seven compatible pairs.

## Origin and lineages

| Kind | Route | Species | Mechanical identity | Cost |
|---|---|---|---|---|
| Origin | none | 苔鳞幼蜥 | Highly plastic base creature | No developed specialization |
| Lineage | Fang | 赤爪猎龙 lineage | Chasing three-hit tears and execution pressure | Weak protection and ranged control |
| Lineage | Wing | 风膜疾蜥 | Fast skirmishing, gliding and dodge recovery | Low life and poise |
| Lineage | Carapace | 铁背守蜥 | Armor, impact absorption and steady advance | Slow movement and recovery |
| Lineage | Swarm | 共生巢兽 | Brood support, consumption and kill sustain | Low direct burst |
| Lineage | Venom | 疫尾毒蜥 | Damage over time, zoning and retaliation | Delayed damage and lower life |
| Lineage | Rift | 裂腔异蜥 | Pulse range, cadence and area control | Weak close-range survival |

The accepted `scarlet-gecko` stage-1 GLB and `scarlet-hunter` stage-2 GLB are immutable Fang-lineage presentation variants. They are not universal stages for the other five families.

## Pure Apex endpoints

| Route | Endpoint | Normal attack / movement | Apex authority change | Trade-off |
|---|---|---|---|---|
| Fang | 血牙暴君 | Execution chain / burst pursuit | All normal damage and melee increase | Movement −6% |
| Wing | 风暴天翔兽 | High-speed sweep / double-wing glide | Speed +15%, dodge cooldown ×0.75 | Max health −20 |
| Carapace | 不动天甲兽 | Ground slam / fortress advance | Health +50, reduction +12% | Speed ×0.78, ranged cooldown ×1.12 |
| Swarm | 万巢母皇 | Brood hunt / colony migration | Biomass ×1.25, kill heal +8 | Direct normal damage −1 |
| Venom | 万毒疫主 | Plague pressure / zone orbit | Ranged +2, retaliation +3 | Max health −15 |
| Rift | 奇点裂界兽 | Singularity pulse / phase slide | Magic +3, radius ×1.35, cadence ×0.8 | Defense reduction −4% |

## Curated hybrid Apex endpoints

| Families | Endpoint | Combined identity | Trade-off |
|---|---|---|---|
| Fang + Wing | 疾风猎杀者 | Mobile melee reaper; speed, dodge and execution | Max health −10 |
| Wing + Venom | 瘟疫飞龙 | Fast ranged plague zoning | Max health −15 |
| Carapace + Venom | 腐蚀堡垒 | Armored retaliation tank | Speed ×0.85 |
| Carapace + Rift | 虚空重甲 | Defensive pulse fortress | Speed ×0.88 |
| Swarm + Venom | 疫群母体 | Kill sustain, resource loop and spreading poison | Low immediate burst |
| Fang + Carapace | 装甲暴君 | Heavy melee bruiser with armor | Speed ×0.82 |
| Rift + Swarm | 异界孵化者 | Area magic, biomass and brood sustain | Defense reduction −3% |

## Resolver contract

Runtime identity is resolved from:

`completed stage + cumulative genes + recent hunts + compatible secondary family + locked Apex species`

- Recent hunts retain 60% tendency weight and cumulative genes retain 40%.
- Seeded random mutation selection and wild-mutation pressure remain intact.
- Before stage 6, the dominant family selects one of six lineage definitions; a compatible close secondary family adds modular anatomy.
- At stage 6, the resolver selects one of six pure or seven curated hybrid endpoints.
- The selected Apex ID is locked. Later overgrowth hunting may raise threat but cannot silently rewrite the completed endpoint or its already-applied stats.
- Unsupported family pairs resolve to the dominant pure endpoint rather than inventing an unauthored species.

## Presentation and asset rule

The catalog is not a claim that 20 production GLBs are complete. The current validation layer uses:

- accepted stage-0 coral-gecko GLB;
- accepted Fang stage-1 scarlet-gecko GLB;
- stage-2 scarlet-hunter candidate GLB;
- procedural modular anatomy for all other routes and for stage 3–6 endpoints.

The procedural layer combines head, back, tail, skin/material, proportion and VFX traits so hybrid routes display both families. Production GLBs can replace those proxies one route at a time without changing species IDs or authoritative mechanics.

Route identity also changes the real ordinary-attack authority, not only its label: Fang/Carapace and their physical hybrids use melee, Wing/Venom/Swarm pressure routes use ranged, and Rift-led endpoints use magic. These remain ordinary attacks routed through the existing lock, range, timing, damage and feedback systems; the separate skill-attack system stays disabled. Stage 0 and Fang stage 1 use `Bite → Claw → TailSwipe`; Fang stage 2 uses the redesigned `Claw → Bite → TailSwipe` cadence. Both preserve the 8-degree contact rule.

## Deterministic acceptance URLs

Pure endpoint:

`?maplab=4&live=1&debug=1&nest=thorn-burrow&evolutionRoute=wing&evolutionStage=6`

Hybrid endpoint:

`?maplab=4&live=1&debug=1&nest=thorn-burrow&evolutionRoute=rift&evolutionSecondary=swarm&evolutionStage=6`

`evolutionRoute` accepts all six gene families, `evolutionSecondary` accepts an optional compatible second family, and `evolutionStage` accepts 1–6 in development debug mode. Debug state exposes species/form IDs, route, families, endpoint state, body plan, normal attack, locomotion, passive, trade-off, visual language, modifiers and resulting authoritative stats.

Final implementation evidence on 2026-08-15: 49 test files / 260 tests passed, production build passed, 1440×900 and 844×390 browser checks passed, representative pure/hybrid endpoints produced distinct authoritative stats and melee/ranged/magic ordinary attacks, and browser logs contained zero errors or warnings. Physical midrange-mobile performance remains a release gate.
