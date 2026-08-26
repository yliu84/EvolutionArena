import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_POISON_FADE_SECONDS,
  applyGloamwoodPoison,
  gloamwoodPoisonOn,
  gloamwoodPoisonTint,
  gloamwoodPoisonDuration,
  gloamwoodPoisonRemaining,
  gloamwoodPoisonTotalDamage,
  gloamwoodSporeSplashTargets,
  pruneGloamwoodPoison,
  stepGloamwoodPoison,
  type GloamwoodPoisonSpec,
  type GloamwoodPoisonStack,
} from '../src/gloamwood-poison'
import { GLOAMWOOD_SKILLS } from '../src/gloamwood-skills'

const SPEC: GloamwoodPoisonSpec = { tickSeconds: 0.6, damagePerTick: 10, ticks: 6 }

/** Runs a stack to expiry at a fixed frame rate and reports what it paid. */
function burn(stacks: GloamwoodPoisonStack[], frameSeconds: number, frames: number) {
  const paid: Array<{ at: number; damage: number }> = []
  let current = stacks
  for (let index = 1; index <= frames; index += 1) {
    const stepped = stepGloamwoodPoison(current, frameSeconds)
    current = stepped.stacks
    for (const tick of stepped.ticks) paid.push({ at: +(index * frameSeconds).toFixed(4), damage: tick.damage })
  }
  return { stacks: current, paid }
}

describe('Spore poison', () => {
  // The design this replaced drained health per frame from a patch of ground.
  // That is arithmetically the same damage and it showed the player nothing:
  // no number ever appeared, because a fraction of a point per frame floors to
  // zero, and nothing about the creature changed. Reported as "is this even a
  // skill". Everything asserted here is about being *readable*, not about being
  // correct - the previous version was already correct.

  it('pays in whole instalments rather than per-frame fractions', () => {
    const { paid } = burn(applyGloamwoodPoison([], 'a', SPEC), 1 / 60, 240)
    expect(paid.every((tick) => Number.isInteger(tick.damage))).toBe(true)
    expect(paid.every((tick) => tick.damage === 10)).toBe(true)
  })

  it('pays on a beat slow enough to count, and the advertised number of times', () => {
    const { paid } = burn(applyGloamwoodPoison([], 'a', SPEC), 1 / 60, 240)
    expect(paid).toHaveLength(6)
    // Six instalments 0.6s apart. Allowing one frame of slack, because a tick
    // lands on the first frame that crosses its beat, not before it.
    for (const [index, tick] of paid.entries()) {
      expect(tick.at).toBeGreaterThanOrEqual((index + 1) * 0.6)
      expect(tick.at).toBeLessThan((index + 1) * 0.6 + 1 / 60 + 1e-9)
    }
  })

  it('waits a full beat before the first one, so it never lands on the impact number', () => {
    const stepped = stepGloamwoodPoison(applyGloamwoodPoison([], 'a', SPEC), 1 / 60)
    expect(stepped.ticks).toHaveLength(0)
  })

  it('pays the same total however coarse the frames are', () => {
    const smooth = burn(applyGloamwoodPoison([], 'a', SPEC), 1 / 120, 480)
    const choppy = burn(applyGloamwoodPoison([], 'a', SPEC), 0.25, 20)
    const total = (paid: Array<{ damage: number }>) => paid.reduce((sum, tick) => sum + tick.damage, 0)
    expect(total(smooth.paid)).toBe(60)
    expect(total(choppy.paid)).toBe(60)
    expect(total(smooth.paid)).toBe(gloamwoodPoisonTotalDamage(SPEC))
  })

  it('pays every advertised instalment under frame deltas that are not exact', () => {
    // Measured in engine, and the reason this is counted in instalments rather
    // than run for a duration: six beats of 0.6 is exactly 3.6, so under a
    // duration the last one falls due on the frame the status expires, and
    // float drift in the real frame delta decides which happens first. It paid
    // five. A headless sweep at a clean 1/60 saw six and proved nothing.
    for (const jitter of [0.999, 1.001, 1.0007, 0.9993]) {
      const { paid, stacks } = burn(applyGloamwoodPoison([], 'a', SPEC), (1 / 60) * jitter, 400)
      expect(paid).toHaveLength(SPEC.ticks)
      expect(stacks).toHaveLength(0)
    }
  })

  it('reports the time it has left, derived from what it still owes', () => {
    const fresh = applyGloamwoodPoison([], 'a', SPEC)[0]
    expect(gloamwoodPoisonRemaining(fresh)).toBeCloseTo(gloamwoodPoisonDuration(SPEC), 6)
    const half = burn(applyGloamwoodPoison([], 'a', SPEC), 1 / 60, 108).stacks[0]
    expect(gloamwoodPoisonRemaining(half)).toBeCloseTo(1.8, 2)
  })

  it('never settles a backlog at once when a hidden tab hands back a huge delta', () => {
    // Restoring a backgrounded tab hands the first frame a delta measured in
    // minutes. Without the cap that frame kills everything on the field from a
    // poison the player watched land one tick at a time.
    const stepped = stepGloamwoodPoison(applyGloamwoodPoison([], 'a', SPEC), 600)
    expect(stepped.ticks.length).toBeLessThanOrEqual(4)
    expect(stepped.stacks).toHaveLength(1)
    expect(stepped.stacks[0].ticksLeft).toBe(SPEC.ticks - 4)
  })

  it('stops when it is over rather than paying out on the way past its own end', () => {
    const { stacks, paid } = burn(applyGloamwoodPoison([], 'a', SPEC), 1 / 60, 600)
    expect(stacks).toHaveLength(0)
    expect(paid).toHaveLength(6)
  })

  it('refreshes rather than stacking, so a splash cannot double-dip the body it struck', () => {
    // The orb poisons what it hit and then poisons everything in the splash,
    // which includes what it hit. Stacking there would give one creature twice
    // the poison of its neighbours for a reason the player cannot see.
    const once = applyGloamwoodPoison([], 'a', SPEC)
    const twice = applyGloamwoodPoison(once, 'a', SPEC)
    expect(twice).toHaveLength(1)
    expect(burn(twice, 1 / 60, 600).paid).toHaveLength(6)
  })

  it('keeps the harder poison when a weaker one refreshes it', () => {
    const strong = applyGloamwoodPoison([], 'a', { ...SPEC, damagePerTick: 18 })
    const refreshed = applyGloamwoodPoison(strong, 'a', SPEC)
    expect(refreshed[0].damagePerTick).toBe(18)
    expect(refreshed[0].ticksLeft).toBe(SPEC.ticks)
  })

  it('keeps one clock per creature', () => {
    let stacks = applyGloamwoodPoison([], 'a', SPEC)
    stacks = stepGloamwoodPoison(stacks, 1.8).stacks
    stacks = applyGloamwoodPoison(stacks, 'b', SPEC)
    expect(gloamwoodPoisonOn(stacks, 'a')?.ticksLeft).toBe(3)
    expect(gloamwoodPoisonOn(stacks, 'b')?.ticksLeft).toBe(6)
    expect(gloamwoodPoisonOn(stacks, 'c')).toBeNull()
  })

  it('lets a corpse go, so nothing carries a status off the field', () => {
    const stacks = applyGloamwoodPoison(applyGloamwoodPoison([], 'a', SPEC), 'b', SPEC)
    expect(pruneGloamwoodPoison(stacks, new Set(['b']))).toHaveLength(1)
    // Same array back when nothing changed, so the common frame allocates nothing.
    expect(pruneGloamwoodPoison(stacks, new Set(['a', 'b']))).toBe(stacks)
  })

  it('fades out instead of vanishing between two frames', () => {
    // Otherwise the player never learns the status ended; they only notice the
    // numbers stopped, some time after they stopped.
    const fresh = applyGloamwoodPoison([], 'a', SPEC)[0]
    expect(gloamwoodPoisonTint(fresh)).toBe(1)
    const withRemaining = (remaining: number) =>
      gloamwoodPoisonTint({ ...fresh, ticksLeft: 1, untilNextTick: remaining })
    expect(withRemaining(GLOAMWOOD_POISON_FADE_SECONDS)).toBe(1)
    expect(withRemaining(GLOAMWOOD_POISON_FADE_SECONDS / 2)).toBeCloseTo(0.5, 6)
    expect(withRemaining(0)).toBe(0)
    expect(gloamwoodPoisonTint({ ...fresh, ticksLeft: 0 })).toBe(0)
    expect(gloamwoodPoisonTint(null)).toBe(0)
  })

  it('is worth the nine-second wait it costs', () => {
    // Sized against just attacking: the swarm stage-1 chain is 11+9+9+21 = 50
    // on one target with no cooldown at all. The previous version was reported
    // as worse than a basic attack, and it was.
    const bloom = GLOAMWOOD_SKILLS.swarm.shape
    expect(bloom.kind).toBe('projectile')
    if (bloom.kind !== 'projectile') return
    const onePrimary = bloom.impactDamage + gloamwoodPoisonTotalDamage(bloom.poison)
    expect(onePrimary).toBeGreaterThan(50)
    // And it reaches, which is the point of the line's answer to distance.
    expect(bloom.castRange).toBeGreaterThan(GLOAMWOOD_SKILLS.fang.shape.kind === 'dash'
      ? GLOAMWOOD_SKILLS.fang.shape.range
      : 0)
    expect(bloom.splashRadius).toBeGreaterThan(0)
  })

  it('leaves the orb slow enough to watch cross the gap', () => {
    const bloom = GLOAMWOOD_SKILLS.swarm.shape
    if (bloom.kind !== 'projectile') throw new Error('expected a projectile')
    // A cast the player cannot see travel is the teleporting pounce again.
    const flight = bloom.castRange / bloom.speed
    expect(flight).toBeGreaterThan(0.35)
    expect(flight).toBeLessThan(1.5)
  })
})

describe('What a burst catches', () => {
  // The rule lives in a pure function because the boundary cannot be staged
  // reliably in a live fight - creatures walk, and a grazing distance measured
  // one frame after impact is not the distance the decision was made at. Two
  // engine runs demonstrated the ends of it (a crowd all poisoned by one orb;
  // a pack 37 units away untouched); the exact edge is decided here.

  const at = (id: string, x: number, z: number) => ({ id, x, z })
  const struck = at('struck', 0, 0)
  const small = () => 1
  const ids = (list: Array<{ id: string }>) => list.map((value) => value.id).sort()

  it('always catches the body it struck, even with no splash at all', () => {
    expect(ids(gloamwoodSporeSplashTargets(struck, [struck], 0, small))).toEqual(['struck'])
  })

  it('measures to each body surface rather than to its centre', () => {
    // A large creature at the same centre distance as a small one is visibly
    // inside the cloud while the small one is visibly beside it. Attack reach
    // in this game already works this way.
    const far = at('far', 4, 0)
    const radii = (candidate: { id: string }) => (candidate.id === 'far' ? 1.6 : 1)
    expect(ids(gloamwoodSporeSplashTargets(struck, [struck, far], 2.6, small))).toEqual(['struck'])
    expect(ids(gloamwoodSporeSplashTargets(struck, [struck, far], 2.6, radii))).toEqual(['far', 'struck'])
  })

  it('includes the edge and excludes everything past it', () => {
    const inside = at('inside', 3.5999, 0)
    const edge = at('edge', 3.6, 0)
    const outside = at('outside', 3.6001, 0)
    const caught = ids(gloamwoodSporeSplashTargets(struck, [struck, inside, edge, outside], 2.6, small))
    expect(caught).toEqual(['edge', 'inside', 'struck'])
  })

  it('measures in the ground plane in every direction', () => {
    const ring = [0, 0.7, 1.6, 2.5, 3.4, 4.3, 5.2, 6.1].map((angle, index) =>
      at(`ring-${index}`, Math.cos(angle) * 3.2, Math.sin(angle) * 3.2))
    // All eight sit at the same distance, so all eight must share a verdict.
    expect(gloamwoodSporeSplashTargets(struck, [struck, ...ring], 2.6, small)).toHaveLength(9)
    expect(gloamwoodSporeSplashTargets(struck, [struck, ...ring], 1.5, small)).toHaveLength(1)
  })
})
