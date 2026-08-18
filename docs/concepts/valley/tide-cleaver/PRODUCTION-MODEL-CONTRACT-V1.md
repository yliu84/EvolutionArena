# Valley Gate-1 Production Model Contract V1 — 溯流刀甲

Status: **design direction accepted by the user on 2026-08-18** (concept C, rim visor). No source GLB yet. Do not start Blender, retopology or rigging until the Meshy mesh passes the silhouette gates below.

Standard: `evolution-arena-creature-production-v2.1`. Where this document and typed runtime code disagree, stop and reconcile before producing another creature.

Canonical production target (primary Meshy image, 3/4, pincer blades thickened ~50%):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/tide-cleaver-meshy-source-three-quarter.png`

Identity lock (human review; do not upload as the primary Meshy image):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/river-crustacean-boss-concept-c-rim-visor.png`

Extra reconstruction views (side, then front). Use only as dedicated extra-view slots, never collaged into the primary image:

- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/tide-cleaver-meshy-source-side.png`
- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/tide-cleaver-meshy-source-front.png`

Meshy job pack (upload order, prompt, reject list, drop path for the source GLB): `source/SOURCE.md`

Rejected siblings (do not upload):

- `river-crustacean-boss-concept-a-shield-span.png`
- `river-crustacean-boss-concept-b-river-boulder.png`

Names: `tide-cleaver` / **溯流刀甲**. The Chinese name is taken from `docs/design/maps/VALLEY-MAP-SPEC-V1.md` and may be used in runtime strings unless the user revises it.

## Why this form exists

The project has never shipped a modelled boss. 荆心守卫 is assembled Three.js primitives. 腐根巢卫 is the Shell grunt scaled by `bodyScale: 1.28`. Valley gate 1 is the first boss that must prove a regional encounter is a *different animal*, not an enlarged 叠岩甲蜥.

Concept C was selected over A and B because:

- pincer-span to carapace-width is about **2.65** (A ≈ 1.49, B ≈ 2.25), so a ring attack of inner 1.6 / outer 4.2 can be read from the silhouette;
- the shell is layered angular slate, not a smooth dome or shingled mound — those two reads belong to Shell.

`PROJECT_CONTEXT.md` states evolution and encounter identity must change body plan, silhouette, colour, scale and fantasy. Standard §4 states a recolour or scale change is not a new species. Those two lines are this contract's pass condition.

## Gameplay identity

Gate 1 teaches **lateral dodge**. Proposed authority (map spec, not yet implemented):

| Move | Shape | Parameters | Telegraph |
| --- | --- | --- | --- |
| 横扫钳击 | ring | inner 1.6 / outer 4.2 | 0.95s |
| 溯流冲撞 | line | length 7.0 / half-width 0.95 | 1.05s |

The ring forces the player to stand inside or outside, not at mid-range. That is the same lesson as the existing onboarding line about not standing in the middle of a surrounding ring, taught here by a boss for the first time.

Do not invent a fourth hit-shape. Circle, line and ring are the only accepted Boss geometries until a separate authority milestone says otherwise.

Player decision this form changes: at the first valley choke, you learn the pincer span is the real threat radius. Walking straight at the shell is the wrong read.

## Non-negotiable silhouette

- Exactly **four** limbs. Front pair = thick arms ending in flattened paddle-pincers held low and wide. Rear pair = short sturdy walking legs. Extra crab legs fail.
- Pincer span clearly wider than the carapace. The sweep is what the player must read from the gameplay camera.
- Pincer blades are **thick paddles**, not paper sheets. The Meshy primary already thickens the selected C blades by about 50% without changing outer span.
- Broad low flattened **wedge** carapace, wider than long, with a heavy overhanging **V visor rim**. Layered angular slate plates. Not a turtle dome. Not pangolin shingles.
- Small deep-set eyes under the rim. Short thick tail plate tucked beneath. One connected creature.

## Surface and material language

- Wet river-stone: dark slate grey-green shell, paler mineral streaking, waterworn pale bone on the visor rim and pincer edges.
- Value separation: pale bone rim against dark slate must hold at gameplay distance. Hue-only mottling will vanish.
- Semi-matte, zero metalness. Do not reuse the whole base-colour map as full-strength emissive (standard rule 11).
- Palette must not drift toward Fang coral-red or Shell basalt-shingle + cream belly. Those belong to player forms.

## Readable size at the gameplay camera

Same camera as the accepted forms: 44° FOV, ~20.09 follow distance, ~36° pitch. A regional boss will occupy more screen than a stage-1 player, but the quality budget is still the outer contour: visor, pincer span, four-limb stance.

Micro-plates, mineral cracks and visor-edge bevels are not the production target.

## Scale and world footprint

Do not invent a world height before the mesh exists. After the source GLB lands, measure width × length × height in Blender. The pincer span is part of the **visible** threat, but authoritative collision must not include decorative reach that would jam the gate corridor.

Typed collision, if needed, is a later integration task keyed by this form, never by copying Shell's `bodyScale: 1.28`.

## Rig, budget and deformation

| Item | Contract |
| --- | --- |
| Triangles | First modelled boss; target the Shell stage-1 region (~20k) until a measured budget is recorded |
| Bones | Verified 27-bone quadruped template is admissible because the body is four-limbed. Do not force extra crab-leg bones. |
| Clips (after mesh passes) | `Idle`, `Walk`, `Turn`, `PincerSweep`, `TideCharge`, `Hit`, `Death`. No third attack clip until the map spec adds a third move. |
| Runtime GLB | `public/assets/quality-3d/models/tide-cleaver-rigged-v1.glb` (name locked after the source passes) |
| Validator | `npm run validate:gltf` at zero errors and zero warnings |

Do not force this body through scarlet-gecko or stone-pangolin weights. Pincers need their own reach; they are not gecko jaws.

## Attack silhouette gates

Ordinary boss moves, not player skills. Skills stay off.

- `PincerSweep`: both paddles advertise a horizontal ring wider than the body. Anticipation must open the span before contact.
- `TideCharge`: the visor rim leads; the body stays low. A leap is the wrong read for this anatomy (standard rule 4).
- Every contact uses the live locked target and the accepted facing/range authority. Presentation never decides damage.

## Acceptance sequence

1. Image-to-3D generation from the thickened 3/4 target. **Text-to-3D is not permitted** — Shell attempt 1 proved generic-lizard priors overwrite identity.
2. Silhouette review against this contract before any rigging work: four limbs, thick paddles, span wider than body, V visor, layered plates, tucked tail, not turtle, not pangolin.
3. Staged decimation, rig, weights, named clips, validator pass.
4. Runtime integration as the valley gate-1 boss only. Do not replace 腐根巢卫 or 荆心守卫 by silent substitution.
5. Browser verification of both moves, telegraph readability, and zero console errors.
6. User gameplay acceptance. Only then does the identifier move from `candidate` to `master`.

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| — | — | — | None yet. Record every Meshy job here. Attempt count is the first production-cost number for a modelled boss. |

## Related, not in scope here

Valley map implementation, gate collision, and the other two valley bosses (崖壁石喉, 谷源母根) are separate. This contract does not authorise starting those models. Swarm stage-1 remains waiting on its own user-run Meshy job and is not displaced by this pack.
