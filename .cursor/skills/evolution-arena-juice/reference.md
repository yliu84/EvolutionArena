# Juice numeric bar

Source of truth is `COMBAT_JUICE` in `src/combat-juice.ts`. Keep this file aligned when those constants change.

## Feel target

Warcraft 3 unit attacks: play anim, maybe a missile, a small splat. This game’s camera sits on one hunter, so **one connected hit must read louder** than that: a readable telegraph, a short world hitch, a bright contact spark, and a style-shaped burst that lasts long enough to see.

Not the target: Diablo 4 screen-filling particles, Warcraft hero skill cinematics, or photoreal blood.

## Timing

| Event | Budget |
|---|---|
| Melee connected hitstop | 48–60ms real time, timeScale ~0.18 |
| Magic connected hitstop | 64–80ms real time |
| Ranged bolt connect | 32–48ms real time |
| Whiff melee | no hitstop |
| Melee burst | ~280ms |
| Ranged muzzle burst | ~220ms |
| Magic burst | ~420ms |
| Spark lifetime | ~280ms |
| Camera shake | <100ms, intensity ≤ 0.008 |

Hitstop must not exceed ~80ms. Longer than that steals control.

## Shapes

- **Melee**: filled crescent + thick white slash + gold sparks on the body
- **Ranged**: fat mint tracer + muzzle bloom + spark at impact
- **Magic**: expanding rings + vertical pillar, spark on each body inside the radius

## Colors (support, not identity)

- Melee `#ffe39a` / white edge
- Ranged `#9effcf`
- Magic `#e0b0ff`

Color-blind check: if you strip hue, the wedge / spike / ring still differ.

## Caps

- Active hit sparks ≤ 40
- Do not spawn a new burst particle system per frame
- Offscreen enemies still take gameplay hits; skip extra sparks if the target is outside the camera

## Debug

`getState().combat` should include:

- `lastImpact.style` / `lastImpact.hits`
- `juice.hitstop`
- `juice.burstStyle`
- `juice.burstProgress` (0–1 while playing)
