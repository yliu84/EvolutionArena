import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_PREY, gloamwoodPreyBodyRadius } from '../src/gloamwood-3d-ecology'
import { createGloamwoodValleyCreatures } from '../src/gloamwood-valley-creatures'
import { GLOAMWOOD_VALLEY } from '../src/gloamwood-valley-terrain'
import {
  GLOAMWOOD_FORD_FANG_PREY,
  GLOAMWOOD_ELITE_BODY_SCALE,
  GLOAMWOOD_MODELLED_PREY_CONFIGS,
  GLOAMWOOD_VALLEY_BOSS_BODIES,
  GLOAMWOOD_VALLEY_BOSS_SLOTS,
  GLOAMWOOD_WALK_STRIDE_FACTOR,
  gloamwoodValleyBodyFor,
  gloamwoodPreyWalkRate,
  gloamwoodPreyClipForPhase,
  gloamwoodPreyClipRate,
} from '../src/gloamwood-modelled-prey'

const config = GLOAMWOOD_FORD_FANG_PREY

describe('Footprint', () => {
  it('is what actually blocks the player', () => {
    // The Goal 2 rule, unchanged: blocking must match the visible footprint.
    // What changed is where the number comes from. It used to be the family's,
    // which made every Fang-typed creature the same size - and a river
    // crocodilian at a goat's radius read as a lizard on the path. A modelled
    // animal now carries its own size and the family lends only its stats.
    const creatures = createGloamwoodValleyCreatures(0x5a11e)
    for (const creature of creatures) {
      // The same lookup the runtime uses, tier included. Reading family alone
      // is exactly the bug this replaced: it put three region bosses on the
      // road as ordinary beetles.
      const body = gloamwoodValleyBodyFor({
        kind: creature.kind, role: creature.role, branch: creature.branch,
        tier: creature.tier, s: creature.spawnS,
      })
      if (!body) continue
      expect(gloamwoodPreyBodyRadius(creature)).toBeCloseTo(body.footprintRadius, 5)
    }
  })

  it('keeps every modelled body inside the range the spacing table was built for', () => {
    // Reach is derived from the radius - stop distance takes it, strike
    // distance takes stop distance - so a size change cannot put an attack out
    // of range. It can still make a creature too wide to fight in a choke,
    // which is nine units of floor at its narrowest.
    for (const entry of GLOAMWOOD_MODELLED_PREY_CONFIGS) {
      expect(entry.footprintRadius).toBeGreaterThan(0.5)
      // The narrowest choke is nine units of floor. A body wider than a quarter
      // of it cannot be fought in the gate it guards.
      // The bowls a boss stands in give 22.8 units of floor either side of the
      // route, so this is about what can be fought rather than what fits.
      expect(entry.footprintRadius).toBeLessThanOrEqual(4)
    }
  })

  it('gives every config a yaw correction rather than leaving it to chance', () => {
    // The first modelled boss shipped attacking ninety degrees off.
    for (const entry of GLOAMWOOD_MODELLED_PREY_CONFIGS) {
      expect(typeof entry.modelYaw).toBe('number')
    }
  })
})

describe('Choosing a clip', () => {
  it('walks while chasing and idles when it stops', () => {
    expect(gloamwoodPreyClipForPhase('chase', config, 'chase', true).clip).toBe('Walk')
    expect(gloamwoodPreyClipForPhase('chase', config, 'chase', false).clip).toBe('Idle')
  })

  it('carries one take from wind-up through the blow', () => {
    // Restarting on the strike would put the swing back at its own beginning
    // halfway through, so the blow lands during the tell.
    const entering = gloamwoodPreyClipForPhase('telegraph', config, 'chase', true)
    expect(entering).toEqual({ clip: 'Bite', restart: true, once: true })
    const striking = gloamwoodPreyClipForPhase('strike', config, 'telegraph', false)
    expect(striking).toEqual({ clip: 'Bite', restart: false, once: true })
  })

  it('restarts the attack after a stun instead of resuming mid-swing', () => {
    // The authority throws the interrupted attempt away. A clip that resumed
    // where it was would swing with no wind-up in front of it - which is the
    // guardian defect exactly: it looked like it was still attacking after it
    // had been reset.
    const resumed = gloamwoodPreyClipForPhase('telegraph', config, 'stunned', false)
    expect(resumed.restart).toBe(true)
  })

  it('flinches again on a second hit', () => {
    expect(gloamwoodPreyClipForPhase('stunned', config, 'chase', false).restart).toBe(true)
    // Held while the stun lasts, so it does not retrigger every frame.
    expect(gloamwoodPreyClipForPhase('stunned', config, 'stunned', false).restart).toBe(false)
  })

  it('plays the death once and holds it', () => {
    const dying = gloamwoodPreyClipForPhase('dead', config, 'strike', false)
    expect(dying).toEqual({ clip: 'Death', restart: true, once: true })
    expect(gloamwoodPreyClipForPhase('dead', config, 'dead', false).restart).toBe(false)
  })

  it('idles through recovery', () => {
    expect(gloamwoodPreyClipForPhase('recover', config, 'strike', false).clip).toBe('Idle')
  })

  it('never asks for a clip the model does not carry', () => {
    const phases = ['chase', 'telegraph', 'strike', 'recover', 'stunned', 'dead'] as const
    for (const entry of GLOAMWOOD_MODELLED_PREY_CONFIGS) {
      const available = new Set(Object.values(entry.clips))
      for (const phase of phases) {
        for (const moving of [true, false]) {
          expect(available.has(gloamwoodPreyClipForPhase(phase, entry, 'chase', moving).clip)).toBe(true)
        }
      }
    }
  })
})

describe('Clip rate', () => {
  it('stretches the take over the authored wind-up and blow', () => {
    const spec = GLOAMWOOD_PREY.fang
    // The Bite clip runs 34 frames at 24fps.
    const rate = gloamwoodPreyClipRate(34 / 24, spec.telegraphSeconds, spec.strikeSeconds)
    expect((34 / 24) / rate).toBeCloseTo(spec.telegraphSeconds + spec.strikeSeconds, 5)
  })

  it('stays inside a rate the eye can follow', () => {
    for (const spec of Object.values(GLOAMWOOD_PREY)) {
      for (const clipSeconds of [0.2, 1, 4, 30]) {
        const rate = gloamwoodPreyClipRate(clipSeconds, spec.telegraphSeconds, spec.strikeSeconds)
        expect(rate).toBeGreaterThanOrEqual(0.1)
        expect(rate).toBeLessThanOrEqual(4)
      }
    }
  })
})

describe('Walking without sliding', () => {
  it('speeds the cycle up as the creature moves faster', () => {
    // A walk clip at a fixed rate slides: the creature is carried by its
    // movement and its legs swing at whatever they were authored for, and the
    // two have nothing to do with each other.
    const slow = gloamwoodPreyWalkRate(2, 1.55, 1)
    const fast = gloamwoodPreyWalkRate(2, 1.55, 3.65)
    expect(fast).toBeGreaterThan(slow)
  })

  it('plays a cycle in the time the creature takes to cover a stride', () => {
    const clipSeconds = 2
    const radius = 1.55
    const speed = 3.65
    const stride = GLOAMWOOD_WALK_STRIDE_FACTOR * 2 * radius
    const rate = gloamwoodPreyWalkRate(clipSeconds, radius, speed)
    expect((clipSeconds / rate) * speed).toBeCloseTo(stride, 5)
  })

  it('gives a bigger animal a slower cycle at the same speed', () => {
    // Longer legs cover more ground per stride, so they swing less often.
    expect(gloamwoodPreyWalkRate(2, 1.55, 3)).toBeLessThan(gloamwoodPreyWalkRate(2, 0.7, 3))
  })

  it('never freezes and never blurs', () => {
    for (const speed of [0, 0.01, 40]) {
      const rate = gloamwoodPreyWalkRate(2, 1.55, speed)
      expect(rate).toBeGreaterThanOrEqual(0.35)
      expect(rate).toBeLessThanOrEqual(4)
    }
  })
})

describe('Telling the tiers apart', () => {
  const creatures = createGloamwoodValleyCreatures(0x5a11e)

  it('gives each region boss its own body, not the beetle', () => {
    // They spawned as `shell`, the lookup read family alone, and three region
    // bosses stood on the road as ordinary ladybirds. Nobody could find them.
    const bosses = creatures.filter((creature) => creature.tier === 'boss')
    expect(bosses).toHaveLength(3)
    const bodies = bosses.map((boss) => gloamwoodValleyBodyFor({
      kind: boss.kind, role: boss.role, branch: boss.branch, tier: boss.tier, s: boss.spawnS,
    })!.id)
    expect(new Set(bodies).size).toBe(3)
    expect(bodies).toEqual(GLOAMWOOD_VALLEY_BOSS_BODIES.map((body) => body.id))
  })

  it('makes a boss the biggest thing the player meets', () => {
    for (const boss of creatures.filter((creature) => creature.tier === 'boss')) {
      for (const other of creatures.filter((creature) => creature.tier !== 'boss')) {
        expect(gloamwoodPreyBodyRadius(boss)).toBeGreaterThan(gloamwoodPreyBodyRadius(other))
      }
    }
  })

  it('makes an elite visibly bigger than the pack it stands in', () => {
    // Until now the only way to learn you were fighting one was that it would
    // not die.
    for (const elite of creatures.filter((creature) => creature.tier === 'elite')) {
      const ordinary = creatures.find(
        (creature) => creature.tier === 'pack' && creature.kind === elite.kind && creature.role === elite.role,
      )
      if (!ordinary) continue
      expect(gloamwoodPreyBodyRadius(elite)).toBeGreaterThan(gloamwoodPreyBodyRadius(ordinary) * 1.2)
    }
  })

  it('keeps the boss slots it reads in step with the map', () => {
    // The registry keeps its own copy so the payload test does not pull the
    // whole valley in behind it. This is what stops the copy drifting.
    expect([...GLOAMWOOD_VALLEY_BOSS_SLOTS]).toEqual([...GLOAMWOOD_VALLEY.bossSlots])
  })
})

describe('Size says rank', () => {
  it('does not rank bosses by footprint, because they are not the same shape', () => {
    // The Tide Cleaver is a wide flat crab and the Cliff Maw is a cube. Ranking
    // by one dimension would force one of them into a shape it is not, which is
    // how the crab ended up scaled to 0.83 and reading as a beetle. What has to
    // hold is that every boss outsizes every elite, not that they outsize each
    // other in a straight line.
    const spans = GLOAMWOOD_VALLEY_BOSS_BODIES.map((body) => body.footprintRadius)
    expect(new Set(spans).size).toBe(spans.length)
  })

  it('puts every boss above every elite it could be confused with', () => {
    // A first boss smaller than a promoted prey teaches the player that size
    // means nothing, and then nothing else can be said with it.
    const ceiling = Math.max(...GLOAMWOOD_MODELLED_PREY_CONFIGS
      .filter((body) => !GLOAMWOOD_VALLEY_BOSS_BODIES.includes(body))
      .map((body) => body.footprintRadius * GLOAMWOOD_ELITE_BODY_SCALE))
    for (const boss of GLOAMWOOD_VALLEY_BOSS_BODIES) {
      expect(boss.footprintRadius).toBeGreaterThan(ceiling)
    }
  })
})
