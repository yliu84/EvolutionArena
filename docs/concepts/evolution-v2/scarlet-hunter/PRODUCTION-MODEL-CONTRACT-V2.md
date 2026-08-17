# Scarlet Hunter Production Model Contract V2

Status: visual target accepted by the user on 2026-08-15. This contract replaces the rejected native-toon V1/V2 construction direction.

Canonical design board:

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/scarlet-hunter-production-target-v2.png`

Canonical stylized single-view Meshy reconstruction source:

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/scarlet-hunter-meshy-source-stylized-v3.png`

The multi-pose design board must never be uploaded directly to a single-image 3D generator. It remains the human review reference for anatomy and attack silhouettes. The earlier `scarlet-hunter-meshy-source-v2.png` is preserved as a higher-frequency rendering study; the V3 source keeps the approved form but establishes the cleaner stylized material language that must bridge to the environment.

## Non-negotiable silhouette

- Predatory wedge skull, separate upper skull and lower jaw, readable amber eye socket and 4–5 swept-back crown plates.
- Neck must bridge into a visible shoulder girdle; the chest cannot be a sphere intersecting another sphere.
- Ribcage narrows into a waist before expanding into a mechanically readable pelvis.
- Four athletic load-bearing limbs must expose shoulder/elbow/wrist and hip/knee/hock relationships at gameplay distance.
- Feet are broad and planted with three purposeful claws; no mitten feet or isolated floating claws.
- Tail is one continuous muscular S-curve with a heavy root and tapered tip, not overlapping cones or visible sections.
- The stage-2 scale remains 18% above stage 1, but the live camera must preserve combat visibility.

## Surface and material language

- Medium-poly sculptural planes: broad curved surfaces separated by deliberate creases and bevel transitions.
- Never use fully flat-shaded micro-triangles, uniform smooth spheres, noisy realistic scales or procedural posterization as the primary design language.
- Deep scarlet and warm coral own the main masses; cream identifies jaw, throat, belly and claws; teal is a restrained Fang-route accent.
- Armor plates must follow anatomy and flow backward. They cannot read as random spikes or floating attachments.
- Meshy high detail is a source-fidelity setting, not permission to ship photoreal microdetail. Runtime retopology must consolidate scratches and tiny facets into broad hand-painted value planes.

## Rig and deformation

- Build a form-specific armature and weights. Do not reuse spatial weights from `rig_coral_gecko.py` as the production solution.
- Required control coverage: root, pelvis/body, chest, neck, head, independent jaw, four-segment tail minimum, scapula/upper/lower/foot for each limb, plus optional crown/secondary controls.
- Elbows, hocks, jaw hinge and tail root must preserve volume in side view and during turns.
- Four-direction locomotion must face the movement vector before translation and must not introduce sideways skating.

## Attack silhouette gates

- `Claw`: planted hind legs, compressed anticipation, forward pounce, one unmistakable striking foreleg and a clear contact line. No alternating torso dance.
- `Bite`: visible jaw gape, head pullback, neck-driven forward lunge, jaw snap and short tear recovery. The torso supports the action but does not replace it.
- `TailSwipe`: lowered center of mass, all feet braced, pelvis initiates, and the tail crosses a broad low horizontal arc. Head/chest counter-rotate only enough to preserve balance.
- Each attack must remain identifiable from a single muted silhouette frame before hit effects are added.

## Acceptance sequence

1. Compare neutral side and three-quarter renders against the canonical board.
2. Review the four idle/claw/bite/tail-swipe silhouette frames before runtime integration.
3. Validate GLB structure and named clips.
4. Test grounded idle, four-direction turn-before-move, run, all three attacks, hit and death in the `maplab=5` world.
5. Promote only after the user accepts both the visual model and attack readability. Until then the runtime identifier must remain a candidate.

## Explicitly rejected approaches

- `scarlet-hunter-native-toon-v1`: coarse fully faceted construction.
- `scarlet-hunter-native-toon-v2`: balloon-like uniformly smoothed overlapping primitive construction.
- Generic inherited attack curves used as a substitute for form-specific animation.
