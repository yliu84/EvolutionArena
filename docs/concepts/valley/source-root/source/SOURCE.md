# Valley Final Boss / 谷源母根 source record

Status: **Meshy job pack, awaiting user-supplied GLB.** Do not start Blender cleanup, retopology or rigging until the downloaded mesh passes the silhouette gates below.

- Prepared: 2026-08-18
- Identity: 谷源母根 (`source-root`)
- Source type: user-run Meshy Image to 3D from the accepted 3/4 concept
- Contract: `../PRODUCTION-MODEL-CONTRACT-V1.md`
- Generation service: Meshy web application, generated and supplied by the user for this project
- Downstream runtime (not this step): `public/assets/quality-3d/models/source-root-runtime-v1.glb`

When Meshy finishes, drop the downloaded textured GLB into **this folder** (`docs/concepts/valley/source-root/source/`). Keep the original Meshy filename, then record it, the SHA-256 and the selected license in the blank fields below. The source GLB is immutable. Derived cleanup/rig files must use separately named paths.

- Downloaded:
- Original Meshy filename:
- Stored source:
- SHA-256:
- License selected in Meshy:
- Required attribution: identify Meshy as the generation tool in public asset or game credits

**Commercial-license evidence is a release blocker and is still outstanding for every Meshy asset on this project.** Record it here before public release. This record does not invent terms that were not supplied with the download.

## Upload order

Do **not** collage views into one sheet. Scarlet-hunter already proved a multi-pose board in a single-image job merges several bodies into one mesh.

| Order | Role | File |
| --- | --- | --- |
| 1 | **Primary reconstruction image** (3/4 standing pose). Use this alone - it is currently the only authored view. | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-source-root-meshy-source-three-quarter.png` |
| 2 | Extra view — right profile. **Not yet authored.** Body length vs height, the spread of the root feet, and the position of the chest knot. | `valley-source-root-meshy-source-side-right.png` |
| 3 | Extra view — left profile, exact horizontal mirror of view 2. Generated from view 2, never drawn separately. | `valley-source-root-meshy-source-side-left.png` |

The left profile is a horizontal flip of the right so proportions and markings cannot drift between the two sides. That mirror is the step that corrected the Carapace form's length:height from 3.23 to 2.54. If the UI has only one extra-view slot, use the **right** profile.

Running the job on the 3/4 alone is allowed and is the current state. The profiles buy proportion accuracy; without them, expect the length:height ratio to need correcting after download rather than before.

Do **not** upload:

- `valley-cliff-maw-concept.png`, `valley-ford-fang-concept.png`, `valley-spotted-fordbug-concept.png`, `valley-brow-shield-concept.png`, `valley-drowned-host-concept.png`
- `valley-source-root-concept.png` as a second primary — it is the same pose as the three-quarter source; use the `meshy-source-three-quarter` filename
- Any combined turnaround or attack-pose board

## Meshy prompt (paste English)

The image carries the silhouette; the prompt only locks identity and rejects the known failure modes.

```
A large four-legged creature grown from bark and roots, like the source of a valley turned into an animal. Limbs ending in splayed root feet that grip the ground. Bark plating over the shoulders and flanks with the grain running along the limbs. A single large amber eye under a heavy brow ridge. Moss sheeting across the back and hindquarters only, bare bark at the front. A visible amber sap knot at the chest. Stylised game asset, single creature, neutral grey background, standing on four planted feet.
```

Negative / avoid:

```
no stone, no rock plates, no sandstone, no pincers, no crab shapes, no long snout, no row of dorsal spines, no pair of eyes, no humanoid torso, no biped, no leaves or flowers, no glowing runes, no multiple creatures, no turnaround sheet
```

## Known source defects to expect

Every Meshy export this project has received has carried at least one of these. The processing script removes them; they are listed so a silhouette review is not derailed by them.

- An `Icosphere` viewport helper mesh, unrelated to the creature. On the Ford Fang it was 230 times the creature's size, and measuring the scene with it still in gives an answer 230 times too big.
- A non-unit armature scale, typically 0.01.
- Either one baked take named `Armature|Unreal Take|baselayer`, or no animation at all. Every clip is authored in Blender either way.
- Bones named `Bone_000`…`Bone_NNN` when the auto-rig is used, in which case roles are recovered from the rest pose rather than from names.

## Acceptance gate

Silhouette review against `../PRODUCTION-MODEL-CONTRACT-V1.md` before Blender is opened. Blender is not opened on a mesh that fails a gate.
