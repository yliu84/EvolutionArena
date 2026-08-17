# Creature Production Standard v2.1

Status: **current mandatory baseline for every new player form, monster and Boss**  
Standard ID: `evolution-arena-creature-production-v2.1`  
Accepted on: 2026-08-16  
Reference entry: `?maplab=5&debug=1&evolutionRoute=fang&evolutionStage=2`

This standard consolidates the accepted character, movement, combat and browser-integration work into one versioned production contract. The coral-gecko document remains the immutable stage-0 source history; this document is the current cross-species rule. A later improvement must publish v2.1 or v3 and explicitly state which creatures migrate. It must not silently rewrite an accepted model.

## 1. Sources of Truth

- Reusable locomotion feel: `../../../../src/gloamwood-3d-locomotion.ts`
- Stage-aware world collision: `../../../../src/gloamwood-3d-collision.ts`
- Living-entity spacing and encounter movement: `../../../../src/gloamwood-3d-ecology.ts`
- Turn-before-move and Three.js integration: `../../../../src/gloamwood-3d-hunt.ts`
- Authoritative basic attack: `../../../../src/formal-hunt-basic-attack.ts`
- Authoritative encounter state: `../../../../src/gloamwood-3d-combat.ts`
- Stage-2 presentation contract: `../../../../src/scarlet-hunter-character-presentation.ts`
- GLB mapping and required rig nodes: `../../../../src/quality-3d-glb-assets.ts`
- Current stage-2 runtime model: `../../../../public/assets/quality-3d/models/scarlet-hunter-quadruped-v1.glb`
- Chronological evidence and rejected attempts: `../../../DEVELOPMENT-LOG.md`

Typed code owns numeric runtime values. This document owns production intent, mandatory gates and version policy. If they disagree, stop and reconcile them before producing another creature.

## 2. Current Reference Specimen

The current movement/combat reference is the stage-2 Scarlet Hunter, not because every creature must look like it, but because it is the first form that passes the complete same-world 3D control and encounter pipeline.

| Area | Accepted reference |
|---|---|
| Presentation ID | `scarlet-hunter-quadruped-template-v1` |
| Combat ID | `scarlet-hunter-combat-master-v1` |
| Runtime asset | 54,828 triangles, 27 bones, 2K texture, approximately 8.1 MB before later compression/LOD work |
| Named clips | `Idle`, `Walk`, `Run`, `Turn`, `Claw`, `Pounce`, `TailSwipe`, `Hit`, `Death` |
| Stage world heights | 1.80 / 2.16 / 2.55 for stage 0 / 1 / 2; accepted growth is +20%, then approximately +18% |
| Camera | perspective FOV 44°, approximately 36–37° pitch, 20.09-unit follow distance |
| Movement authority | 6.2 world units/second; input direction never changes this presentation standard |
| Direction rule | 5.8 radians/second turn; no translation until remaining error is 6° or less |
| Leg ownership | authored GLB Run at 100% weight; zero additive leg/foot rotation in runtime |
| Heavy cadence | 1.28 body cycles/second, approximately 2.56 alternating foot plants/second |
| Weight layer | 0.052 lift, 0.072 plant compression, 0.082 stop settle, 0.028-radian body rock, 0.026 impact dip |
| Footstep feedback | 0.045 presentation-only camera trauma; no hit-stop on routine movement |
| Dust | 36 pooled soft sprites, up to 8 per foot plant, approximately 0.46-second lifetime, automatic recycle |
| Contact shadows | three layers following body/head/tail mass and foot-contact intensity |
| Stage-0 basic chain | `Bite → Pounce → TailSwipe`; short forelegs use a ground-safe root-only leap bite, while TailSwipe uses a local 360° body spin that crosses the locked target at 180° |
| Stage-1 basic chain | `Bite → Pounce → TailSwipe`; inherits the same terrain-safe leap/landing and 360° spin contracts at its own scale and timings |
| Stage-2 basic chain | `Claw → Pounce → TailSwipe`; keeps the mature authored claw/pounce anatomy while inheriting the ground-safe landing and 360° spin contracts, one primary input, skills disabled |
| Targeting | current live selected target, action range and maximum 8° contact error checked on every strike |
| Collision footprint | stage-aware oriented front/body/rear probes plus typed player/prey body radii; visible prop and living-body spacing apply during travel, turning, chase, attack approach and knockback |
| Validation snapshot | 60 test files / 320 tests, production build passed, desktop and landscape-mobile responsive checks, console 0 errors / 0 warnings |

The desktop/mobile FPS samples are development-machine evidence, not physical midrange-mobile certification. Package compression and LOD remain release gates.

### 2.1 How large a creature actually is on screen

Clarification added 2026-08-17. This does not change any rule below; it states the size at which every rule below is judged, because production time was at risk of going into detail no player can resolve.

Derived from runtime values — a 44° FOV perspective camera at 20.09 units and a 36.0° pitch — the visible frame is 16.23 world units tall. Therefore:

| Stage | World height | Share of screen height | Pixels at 1080p |
|---|---|---|---|
| 0 | 1.80 | 11.1% | ~120 |
| 1 | 2.16 | 13.3% | ~144 |
| 2 | 2.55 | 15.7% | ~170 |

Consequences for every creature:

- Outer contour and value separation are what survive at this size, and they receive the quality budget.
- Micro-bevels, individual scales or plates, and fine texture detail are not resolvable and must not absorb production time.
- Decimation may be aggressive provided the silhouette's outer profile is preserved.
- A turntable at screen-filling size is not a review. Judge every candidate at the gameplay camera angle and size before rigging.

## 3. Non-Negotiable Rules for Every Ground Creature

1. **Readable silhouette:** head, chest/shoulder, waist, pelvis, load-bearing limbs and tail/abdomen must read at the gameplay camera. Smooth balloons, accidental flat sheets, intersecting primitive piles and floating decorations fail.
2. **Coherent topology and weights:** deformation must preserve limb volume in front, side and diagonal travel. A shared rig is allowed only when anatomy genuinely matches. Do not force a new body plan through old spatial weights.
3. **Real locomotion:** feet must have non-zero authored animation curves, and gait cadence must be measured against world distance. Root-only translation, foot cycles too slow for travel speed, or tiny unreadable strides all fail. Runtime may add whole-body weight, shadow and particles, but must not rotate animated legs a second time.
4. **Anatomy-compatible attacks:** an attack must fit the creature's actual reach. Short forelegs must not be stretched into a long claw pose; use a bite, body check, leap or another silhouette the rig can support. Root motion must stay uniformly scaled and return to neutral.
5. **Turn before travel:** keyboard and touch axes are camera-relative screen directions; click and direct intent join the same world-facing calculation. A creature may define a form-specific turn speed/tolerance, but it cannot translate sideways or diagonally while visually facing another direction unless strafing is an explicit designed ability.
6. **Ground response:** terrain contact, contact shadow, body compression and footstep effects must agree. Dust is emitted by discrete foot plants, not continuously by velocity.
7. **Readable attacks:** every damaging move has anticipation, contact and recovery with a distinct silhouette. Damage timing belongs to authoritative combat state, never an animation callback or particle.
8. **Selected-target integrity:** melee contact uses the same live locked target, range and facing tolerance. Death clears or invalidates the target; presentation cannot silently redirect damage.
9. **Complete lifecycle:** at minimum provide Idle, locomotion, Turn, primary attack, Hit and Death. Encounter creatures also need readable telegraph, attack and recover states.
10. **Presentation separation:** dust, slash marks, flash, camera trauma, hit-stop and visual knockback communicate confirmed events. They never calculate health, collision, movement or evolution.
11. **Player-readable materials:** major color, value, roughness and texture regions must survive the actual gameplay forest's bright, midtone and shadow areas. Neutral turntables alone are insufficient. A base-color texture must not be reused as full-strength emissive lighting because that erases body planes and produces a watercolor/cardboard read; any emissive fill must be low, intentional and measured in the map. Do not rely on pale flat tints, black albedo, micro-noise or close-up-only detail to create quality.
12. **Solid-world integrity:** a creature cannot enter the visible footprint of buildings, rocks, tree roots or another living combat body. Collision scales with the form's body length and width, rotates with facing, resolves clustered contacts, and remains active during turning, chase, attack approach and authoritative knockback. An attack may reach the target edge but cannot embed the attacker's complete body in it. Decorative extremities may stay non-authoritative only when turn-before-travel guarantees they cannot lead movement into geometry.

Flying, burrowing, limbless and stationary creatures may replace ground-specific clauses with a documented locomotion contract, but they must still meet silhouette, intent, attack, lifecycle, authority and browser-validation gates.

## 4. Form-Specific Design Is Mandatory

This standard is a quality floor, not a command to clone one monster.

Every new species must define:

- gameplay role, dominant attribute, passive, cost and counterplay;
- unique body-plan and value/color hierarchy;
- locomotion language and cadence appropriate to its mass;
- ordinary-attack vocabulary with form-specific timing, range, damage and feedback;
- what player decision changes compared with existing species.

A recolor, scale change or alternate crown is not a new species. Evolution must change appearance and playstyle together. A heavy Shell creature may use slower cadence and stronger compression; a Swarm form may use lighter steps and less dust; a flying form replaces foot plants with lift, banking and landing events. Deviations must be intentional and typed, not accidental.

## 5. Required Asset Package

Before runtime integration, every creature receives:

- immutable source/provenance record: source service or artist, date, license, original hash and attribution;
- concept/production target showing one coherent body plus separate action references;
- processing record covering cleanup, topology, rig, weights, texture/material conversion and rejected candidates;
- unique runtime filename and versioned presentation/combat IDs; never overwrite an accepted GLB;
- triangle, texture, material, bone, animation, file-size and expected LOD budgets;
- exact forward axis, model yaw, ground origin, collision footprint and tracked contact nodes;
- turntable, four-direction gameplay views, locomotion frames and every attack contact pose.

AI-generated geometry is a source, not a finished asset. It still requires topology, rig/weight, material consistency, license and gameplay-camera inspection.

## 6. Acceptance Matrix

Each new or upgraded creature must pass all relevant rows:

| Gate | Required evidence |
|---|---|
| Static art | front, side, rear and gameplay-angle screenshots; no accidental intersections, flat-sheet read or balloon anatomy |
| Rig/deformation | named bone inventory; extreme-pose and side-travel checks; no stretched, folded or shortened feet |
| Locomotion | start, sustained travel, 90°/180° turn, stop and terrain transition at normal speed; record body-lengths travelled per gait cycle and verify foot cadence/stride amplitude match world speed; inspect Hips/chest/head yaw and roll across the complete cycle so internal spine sway cannot contradict the parent facing |
| Direction | keyboard and touch up/down/left/right in the real camera; verify both orthogonality and signed screen projection so left/right cannot pass while mirrored; position remains fixed above the form's turning tolerance |
| Grounding | tracked contacts and maximum error recorded; shadow and effects remain on terrain |
| Material | inspect bright, midtone and shadow samples inside the actual gameplay map; body planes and primary/secondary/accent regions remain readable without looking bleached, flat or crushed black |
| World collision | travel, in-place turn and knockback against representative rock, tree/root, building edge and clustered props; debug clearance never remains negative |
| Entity collision | neutral contact, player walk-in, prey chase, telegraph/strike, Pounce contact, knockback and two-or-more-enemy surround; minimum living-entity clearance never remains negative |
| Combat | every basic-chain step reaches its named clip, locked target, contact time, range, facing rejection, health delta and recovery |
| Lifecycle | Hit, Death and reset/respawn visible and state-correct; after every one-shot, Idle/Run owns the complete active pose without a clamped attack/reaction final frame remaining in the mixer |
| Feedback | effects occur only after confirmed events; routine steps never use hit-stop |
| Responsive UI | 1440×900 desktop and 844×390 landscape; controls and target/health information remain usable |
| Engineering | automated tests, TypeScript, production build, glTF validator 0 errors/0 warnings and browser console 0 errors/0 warnings |
| Performance | draw calls, triangles, textures, package size and FPS recorded; physical midrange mobile 30 FPS remains a release gate |
| Human acceptance | user judges silhouette, material, movement weight and attacks at the real gameplay camera before a candidate becomes master |

## 7. Version and Upgrade Policy

- A new creature starts as `*-candidate-v1`; it becomes `*-master-v1` only after the complete matrix and user acceptance.
- Rejected candidates remain traceable but must be removed from active runtime mapping.
- A parameter improvement that should apply to future creatures updates this standard to v2.1 and lists affected contracts.
- A breaking change to animation, combat authority, camera scale or asset pipeline publishes v3. Existing masters do not migrate automatically.
- Every accepted change updates typed configuration, automated tests, processing notes when assets change, development log, project context and this standard in the same task.
- Never replace a working accepted model merely to make all creatures mechanically identical. Standardize evidence and quality; preserve species identity.

## 8. Mandatory Pre-Handoff Regression

Before asking the user to test any new or revised creature, the developer must complete and record all four checks below in addition to the full acceptance matrix:

1. **Gait versus distance:** observe normal-speed travel in the real map, record playback/cadence and confirm visible limb travel matches distance without skating or frantic bobbing.
2. **Four-way intent:** test keyboard and touch up/down/left/right at the gameplay camera; confirm the creature turns first and then moves along the requested screen axis without diagonal side travel.
3. **Map-lit material:** capture the creature in bright, midtone and shadow areas; reject pale/flat, crushed-black or textureless readings before handoff.
4. **Living-body spacing:** walk into one enemy, allow multiple enemies to chase, and complete every attack step including Pounce/knockback; debug living-entity clearance must remain zero or positive and bodies must not visibly stack.

Failure in any row keeps the form internal. These checks are mandatory even when the GLB itself validates cleanly.

## 9. Current Open Release Gates

- real midrange mobile device at stable 30 FPS or better;
- package split, texture compression and at least one measured LOD strategy for the 8.1 MB stage-2 asset;
- final audio layer and accessibility settings for reduced shake/flash/particle density;
- unfamiliar-player test proving movement, target lock and basic attack are understood without explanation.

Until these pass, the current standard is the accepted development-production baseline, not a claim of finished commercial release certification.
