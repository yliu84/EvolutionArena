# Shell Stage-1 Production Model Contract V1

Status: design direction accepted by the user on 2026-08-17. This is the first non-Fang player evolution, and the first creature produced purely to measure the production line's real cost.

Standard: `evolution-arena-creature-production-v2.1`. Where this document and typed runtime code disagree, stop and reconcile before producing another creature.

Canonical production target (primary Meshy image, 3/4):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/shell-stage1-concept-b-stone-pangolin-visible-legs.png`

Extra reconstruction views (side, then front). Use only as dedicated extra-view slots, never collaged into the primary image:

- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/shell-stage1-concept-b-stone-pangolin-side.png`
- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/shell-stage1-concept-b-stone-pangolin-front.png`

Meshy job pack (upload order, prompt, reject list, drop path for the source GLB): `source/SOURCE.md`

Preserved first draft (legs hidden under the plate skirt, superseded):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/shell-stage1-concept-b-stone-pangolin.png`

Provisional names: `stone-pangolin` / 叠岩甲蜥. The Chinese name is not yet confirmed by the user and must not be written into runtime strings until it is.

## Why this form exists

Stage 0 and Fang stage 1 are the same lizard body plan at two sizes. This form is the first proof that the Shell route produces a *different animal*, not a recoloured one. `PROJECT_CONTEXT.md` states evolution must change body plan, silhouette, colour, scale and fantasy rather than adding small parts to the same body; standard §4 states a recolour, scale change or alternate crown is not a new species. Those two lines are this contract's pass condition.

## Gameplay identity

The player's Shell evolutions grant flat mitigation, not a frontal rule:

| Candidate | Authority change |
| --- | --- |
| 反应甲片 | max health +30, damage reduction 12%, move speed −8% |
| 堡垒核心 | max health +45, damage reduction 8%, move speed −12% |

Incoming player damage is `event.damage * (1 - damageReduction)` with no facing term (`src/gloamwood-3d-hunt.ts`). **The design must therefore read as "heavy and hard all over", not "armoured at the front".** A front-loaded shield silhouette would promise a directional mechanic the player does not have; that language is reserved for the Shell-family enemies, which do own a ±75.6° frontal rule.

Player decision this form changes: it trades approach speed and burst for the ability to stand inside a wave instead of orbiting it. Its cost is reach and repositioning, which matters most against the Boss's `thorn-charge` and `spore-ring`.

## Non-negotiable silhouette

- A broad, low, overlapping stone plate mound is the whole identity. Plate coverage must be continuous across back, both flanks and the full tail; no bare smooth back panel.
- Roughly 30–45 large plates in overlapping rows, each with visible thickness and a hard lifted lip where it overlaps the next. Small scattered spikes or a single fused dome both fail.
- **All armour mass is dorsal.** The gameplay camera sits at roughly a 36° pitch (`CAMERA_OFFSET (9.2, 11.8, 13.4)`), so the top surface is what the player reads for the entire run. Nothing that defines this creature may live only on its front face.
- Head stays low and forward, partly tucked under the leading plate rim, with one readable amber eye. No raised neck, no lizard head on a stalk.
- **Four legs must clear the plate skirt.** The first draft hid them and failed standard rule 3; the accepted target lifts the body so all four feet and their claws are fully visible below the skirt line. This is a deliberate, documented deviation from the source silhouette and must survive to the runtime model.
- Tail is thick, fully plated to the tip, and shorter than the torso. A long smooth tapering tail reproduces the gecko read and fails.
- Belly and throat stay soft cream, giving the plate rows something to sit against.

## Surface and material language

- Grey basalt plates over dark teal-green hide, cream underbelly, yellow-green lichen speckle in the plate seams, amber eye.
- Value separation carries this form: light stone against dark hide must hold in the Gloamwood's bright, midtone and shadow zones. Hue-only separation fails standard rule 11 — this is exactly why the buckler-head direction was not chosen for the player.
- Matte, zero metalness. No base-colour texture reused as full-strength emissive; any emissive fill stays low and measured in the map.
- The palette must not drift toward coral-red. Coral/teal-jade/cream belongs to `scarlet-gecko-first-evolution-master-v2`; two stage-1 forms sharing a palette halves the evolution read.

## Weight and solidity

User direction, 2026-08-17: the creature must feel solid and hard-edged, never light or flimsy. This project has failed that bar twice, so the requirement is written as checkable properties rather than adjectives.

Prior failures this clause exists to prevent:

- `scarlet-gecko` V1 — rejected because the body read as flat and rubber-like.
- `scarlet-hunter` native V1/V2 — rejected as a balloon-like smooth primitive construction.

Static properties:

- Every plate keeps a hard lifted lip and real thickness at its overlap. A bevelled edge that rounds away at gameplay distance reads as rubber.
- Plate seams must carry genuine dark occlusion. A uniform mid-value surface is the single largest cause of the plastic-toy read; the form needs a true dark end, not only a light one.
- Semi-matte response with zero metalness, following the accepted stage-1 material fix: base colour must not be reused as full-strength emissive, because that erases body planes and produces the watercolour/cardboard read (standard rule 11). Stage 1 settled at 0.18 emissive fill, 1.16 contrast, 1.24 saturation — use those as the starting point, not neutral defaults.
- No pale flat tints and no black albedo. Both collapse volume in the Gloamwood's lighting.

Dynamic properties — weight is carried more by motion than by mesh:

- Heaviest cadence in the game, with plant compression and stop settle above the stage-2 values (0.052 lift / 0.072 plant / 0.082 settle are the stage-2 reference floor for this form).
- Every foot plant emits pooled dust; a heavy body that lands silently reads weightless regardless of how it is modelled.
- `Slam` must have visible anticipation, a hard contact frame and a slow recovery. Fast symmetric motion is what makes armour look like foam.
- Three-layer contact shadow must track the body, head and tail mass, as on the accepted forms.

None of these may alter authoritative damage, range, targeting or collision (standard rule 10).

## Readable size at the gameplay camera

Measured from runtime values, not estimated: the camera is a 44° FOV perspective at 20.09 units and a 36.0° pitch, so the visible frame is 16.23 world units tall. A 2.16-unit stage-1 form therefore occupies **13.3% of screen height — roughly 144 px on a 1080p display**.

Consequences that bind this form's production:

- Outer contour and value separation are the only properties that survive at that size. They receive the quality budget.
- Individual plates, micro-bevels and texture detail are not resolvable at 144 px and must not absorb production time.
- Aggressive decimation is therefore safe. When reducing from the source, preserve the silhouette's outer notching — the sawtooth the plate rows cut into the body outline — and allow interior plates to merge.

## Scale and world footprint

Stage-1 world height is **2.16** (`GLOAMWOOD_3D_CHARACTER_HEIGHTS`), and the runtime scales by height alone:

```
scale = gloamwoodCharacterWorldHeight(stage) / boundingBox.size.y
```

A low wide creature normalised to 2.16 height becomes proportionally longer and wider than the gecko. Greater bulk is correct for this form, but the footprint is not free and must be measured, not assumed:

- define a typed player body radius for Shell stage 1 rather than inheriting the Fang value;
- verify traversal against the map's 82–83 collision obstacles, the nest's 6.4 clear radius, and the Boss arena's 4.2 activity / 7.8 clear radii;
- verify the front/body/rear oriented probes during travel, turning, attack approach and authoritative knockback (standard rule 12).

If traversal proves hostile, the correction is a form-specific world height recorded here as an intentional deviation — never a silent change to collision or attack range.

### Measured result, 2026-08-17 — the predicted risk is real

Runtime GLBs measured in Blender and converted to world units at each form's stage height:

| Form | Width | Length | Height |
|---|---|---|---|
| coral-gecko (stage 0) | 1.72 | 3.94 | 1.80 |
| scarlet-gecko (Fang stage 1) | 1.56 | 3.99 | 2.16 |
| **stone-pangolin (Shell stage 1)** | **2.16** | **6.98** | **2.16** |

Normalising this body to 2.16 height makes it **1.38× wider and 1.75× longer** than the Fang form. Its raw proportions are 1 : 3.23 : 1 (w : l : h) against the gecko's 0.72 : 1.85 : 1 — the elongation accepted at source review, which was judged on silhouette readability, turns into footprint here.

The collision profile is still the stage-based Fang value (radius 0.62, front 0.58, rear 0.66), giving a roughly 2.48-unit collision extent against a 6.98-unit body: about 36% coverage, against 62% for the gecko. A typed Shell body radius is therefore required, not optional.

**Open decision, blocking runtime acceptance.** Two admissible corrections:

1. Keep 2.16 height, define a Shell-specific body radius near 1.05–1.30, and accept a visibly large creature.
2. Give Shell stage 1 a form-specific world height below 2.16 so length lands near the gecko's 4.0–4.6, expressing its growth as breadth and mass rather than height. This is the deviation this section already permits, and suits an armoured form that should grow heavier rather than taller.

Traversal against the 82 obstacles, the nest's 6.4 clear radius and the Boss arena's 4.2/7.8 radii has **not yet been run** — an in-session attempt could not drive the player during the guardian phase. It must be completed before either option is committed.

## Rig, budget and deformation

| Item | Contract |
| --- | --- |
| Triangles | Target parity with Fang stage 1 (19,406). Plates keep their hard edges; decimate hide and underbelly first. |
| Bones | Quadruped rig with weighted jaw, four tracked feet and a segmented tail, in the region of the 27-bone stage-1 rig. |
| Clips | `Idle`, `Walk`, `Run`, `Turn`, `Bite`, `Slam`, `TailSwipe`, `Hit`, `Death` |
| Runtime GLB | `public/assets/quality-3d/models/stone-pangolin-rigged-v1.glb`, compressed runtime variant ≤2 MB |
| Validator | `npm run validate:gltf` at zero errors and zero warnings |

Overlapping plates are the main deformation risk. Plates must be skinned so rows slide against each other without interpenetrating or losing volume through the spine's bend range (standard rule 2). Do not force this body plan through the scarlet-gecko weights.

## Locomotion contract

- Heaviest cadence in the game: slower step rate than stage 1, deeper plant compression, stronger stop settle.
- Feet carry real authored curves; runtime adds whole-body weight only and never rotates animated legs a second time (standard rule 3).
- Dust is emitted by discrete foot plants, never continuously by velocity (standard rule 6).
- Turn-before-travel is unchanged. A form-specific turn speed is allowed and expected to be slower than stage 1; it must be typed, not improvised.

## Attack silhouette gates

The chain is `Bite → Slam → TailSwipe` on the single primary input. These are ordinary attacks. The skill-attack system stays disabled; no mana, no slots, no independent cooldowns.

- **Pounce is removed for this form.** Short stout forelimbs and a low head cannot sell a leap, and standard rule 4 forbids stretching a body into an attack it cannot support. Inheriting the Fang chain is what made the stage-2 native-toon candidates unreadable.
- `Bite`: low forward snap from the tucked head, short reach, fastest step.
- `Slam`: the signature. The creature rears slightly and drives the front plate mass down and forward — the armour itself becomes the weapon. Root motion stays uniformly scaled and returns to neutral; ground-safe landing envelope shared with the existing leap contract.
- `TailSwipe`: heavy plated tail arc. It may reuse the accepted 360° spin contract or define a shorter arc appropriate to the shorter tail, recorded here either way.
- Every contact re-checks the live locked target, action range measured to the hurt surface, and the 8° aim tolerance. Damage timing belongs to authoritative combat state, never an animation callback.

## Acceptance sequence

1. ~~Image-to-3D generation from the production target.~~ **Done, attempt 2.** Text-to-3D is not permitted for this form — see attempt 1.
2. ~~Silhouette review against this contract before any rigging work.~~ **Done and accepted by the user on 2026-08-17**, reviewed at the true 36° camera angle.
3. Staged decimation from 1,986,110 to 19,406, preserving the outer contour notching. Rig, weights, nine clips, validator pass.
4. Runtime integration behind the `(stage, family)` asset key; debug `characterFamilyMatched` must report `true` for `shell`.
5. Footprint and traversal verification per the scale section.
6. Browser verification at desktop and 844×390: full three-step chain, authoritative damage, grounded feet, zero console errors or warnings.
7. User gameplay acceptance. Only then does the identifier move from `candidate` to `master`.

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| 1 | 2026-08-17 | Meshy text-to-3D | **Rejected.** Output reverted to a generic armoured monitor lizard: spinal spike ridge instead of plate coverage, long smooth tapering tail, tall upright stance, raised head on a visible neck. Body plan was indistinguishable from stage 0/1 at the gameplay camera. Root cause: `lizard` / `reptile` / `quadruped` in the prompt dominate the generator's prior and reduce "armour" to bolted-on decoration. |
| 2 | 2026-08-17 | Meshy image-to-3D from the production target | **Accepted as source geometry.** 1,986,110 triangles / 992,973 vertices. Continuous overlapping plate coverage across back, flanks and tail; four legs clear of the plate skirt with visible claws; head low, forward and tucked under the leading rim; tail shorter than the torso and plated to the tip. Reviewed at the true 36° camera angle: the outer contour reads as a plated mound and cannot be confused with the stage-1 gecko. Back arch is flatter and the body longer than the concept board, accepted because neither is resolvable at 13.3% screen height. Source triangle count is ~6× the heaviest previous source (coral gecko's 320,506 cleaned high), so decimation is staged, not single-pass. |

Record every further attempt here with date, method and outcome. **Cost measurement is this creature's primary deliverable** — the stage-2 hunter needed 13 GLB attempts, and the number of attempts this form needs is what decides whether the species matrix is produced in full or cut. Running total for this form: **2 attempts to usable source geometry**, versus 13 GLBs for the stage-2 hunter.

Decimation reference from `coral-gecko/derived/PROCESSING.md`: 320,506 cleaned high → 54,997 web candidate → 32,000 runtime LOD. This form targets 19,406 for parity with Fang stage 1, from a 1,986,110 source.

## Related, not in scope here

`shell-stage1-concept-c-buckler-head.png` is banked as the design target for a **Shell-family enemy** (the 岩盾甲虫 line or a 腐根巢卫 upgrade), not for the player. Its front-loaded shield reads as "armoured at the front, flank it" — which is a literal description of the enemy's real ±75.6° frontal rule and of the flanking window opened on 2026-08-17. It is not contracted or scheduled by this document.
