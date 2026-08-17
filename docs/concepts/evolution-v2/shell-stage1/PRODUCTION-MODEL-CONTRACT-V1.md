# Shell Stage-1 Production Model Contract V1

Status: design direction accepted by the user on 2026-08-17. This is the first non-Fang player evolution, and the first creature produced purely to measure the production line's real cost.

Standard: `evolution-arena-creature-production-v2.1`. Where this document and typed runtime code disagree, stop and reconcile before producing another creature.

Canonical production target:

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/shell-stage1-concept-b-stone-pangolin-visible-legs.png`

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

1. Image-to-3D generation from the production target. Text-to-3D is not permitted for this form — see rejected candidates.
2. Silhouette review against this contract before any rigging work.
3. Rig, weights, nine clips, validator pass.
4. Runtime integration behind the `(stage, family)` asset key; debug `characterFamilyMatched` must report `true` for `shell`.
5. Footprint and traversal verification per the scale section.
6. Browser verification at desktop and 844×390: full three-step chain, authoritative damage, grounded feet, zero console errors or warnings.
7. User gameplay acceptance. Only then does the identifier move from `candidate` to `master`.

## Rejected candidates

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| 1 | 2026-08-17 | Meshy text-to-3D | **Rejected.** Output reverted to a generic armoured monitor lizard: spinal spike ridge instead of plate coverage, long smooth tapering tail, tall upright stance, raised head on a visible neck. Body plan was indistinguishable from stage 0/1 at the gameplay camera. Root cause: `lizard` / `reptile` / `quadruped` in the prompt dominate the generator's prior and reduce "armour" to bolted-on decoration. |

Record every further attempt here with date, method and outcome. **Cost measurement is this creature's primary deliverable** — the stage-2 hunter needed 13 GLB attempts, and the number of attempts this form needs is what decides whether the species matrix is produced in full or cut.

## Related, not in scope here

`shell-stage1-concept-c-buckler-head.png` is banked as the design target for a **Shell-family enemy** (the 岩盾甲虫 line or a 腐根巢卫 upgrade), not for the player. Its front-loaded shield reads as "armoured at the front, flank it" — which is a literal description of the enemy's real ±75.6° frontal rule and of the flanking window opened on 2026-08-17. It is not contracted or scheduled by this document.
