# Evolution V2 — Model Production Contract

This package locks only the two forms approved for first-pass production:

- `coral-gecko`: juvenile coral-crested drake (stage 0)
- `golden-ancient`: Golden Ancient Dragon Emperor (stage 6)

Do not derive the four middle forms until these two endpoints pass visual review in the game camera.

## Reference priority

For each model, use the first three separate images in `<model>/views/` as reconstruction inputs, in this order:

1. `front.png` — face, chest width, limb spacing, symmetry
2. `side.png` — silhouette, body length, neck, tail, wing proportions
3. `rear.png` — spine, pelvis, tail root, wing attachment
4. `gameplay.png` — visual QA reference only; do not upload as a reconstruction view

The approved full sheets remain the visual source of truth. Never replace anatomy with generic stock-dragon geometry.

## Required deliverables

- GLB 2.0, one skinned character per file
- PBR base color, normal, roughness, metallic and ambient-occlusion maps
- 2K textures for the juvenile; 2K initially and optional 4K source for the emperor
- Web runtime target: 35k–55k triangles juvenile, 70k–110k triangles emperor
- A clean lower LOD at roughly 45–55% of the runtime triangle count
- Pivot centered between the feet on the ground plane; positive Y is up
- No floating feet, interpenetrating limbs, open seams or inverted normals
- Separate named materials for eyes, body/armor, crest or wing membrane

## Shape locks

### Juvenile coral-crested drake

- Low quadruped silhouette; belly close to ground without touching it
- Large expressive amber eyes, short reptilian muzzle, four planted feet
- Turquoise scales with coral-orange markings and a layered coral head crest
- Long tapering tail; no wings, horns, beak or upright humanoid posture
- Cute and agile, never toy-flat or paper-like

### Golden Ancient Dragon Emperor

- Massive quadruped dragon with a long reptilian head, visible jaw and teeth
- Broad chest, thick neck, four weight-bearing legs and a long armored tail
- Large functional wings attached to the upper back; dark ruby membranes
- Interlocking gold armor-scales with ruby-red under-scales
- Regal and dangerous; never duck-like, bird-like or soft-bodied

## Rig and animation contract

Required clips, all authored in place except where noted:

- `idle` — breathing, weight shift, tail and crest/wing secondary motion
- `walk` — grounded four-beat gait, no foot sliding
- `run` — faster grounded gait with clear body compression and extension
- `turn_left` and `turn_right` — visible body-led directional change
- `attack_primary` — juvenile bite; emperor bite/claw combination
- `hit` — readable recoil without losing ground contact
- `death` — full settle, no mesh-floor penetration
- `evolve` — neutral braced pose used by the evolution effect pipeline

Optional emperor clips: `takeoff`, `fly`, `dive_attack`, `land`, `roar`.

## In-game scale and camera acceptance

- Juvenile gameplay footprint is the baseline `1.0`.
- Emperor footprint target is `2.6–3.0x` juvenile length, while its screen height must not hide nearby combat cues.
- Feet must visually meet terrain on flat ground and slopes.
- Collision uses a smaller logical body footprint than the rendered silhouette; head, tail and wings may not clip through walls.
- At the production camera height, the juvenile eyes/crest and emperor head/wings must remain identifiable without zooming in.

## Acceptance gate

A model is not accepted merely because a GLB loads. It must pass:

1. Turntable comparison against all four approved views.
2. Neutral-light material review with no baked background or lighting.
3. Animation review at 0.5x and 1.0x speed for foot sliding and intersections.
4. In-game slope, wall, turning, attack and camera-scale tests.
5. Performance test on the quality target with multiple animated enemies visible.

Keep the existing procedural GLBs only as runtime fallbacks until both new models pass every gate.
