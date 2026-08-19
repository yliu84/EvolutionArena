import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_PREY, gloamwoodPreyBodyRadius } from '../src/gloamwood-3d-ecology'
import { createGloamwoodValleyCreatures } from '../src/gloamwood-valley-creatures'
import {
  GLOAMWOOD_FORD_FANG_PREY,
  GLOAMWOOD_MODELLED_PREY_CONFIGS,
  GLOAMWOOD_WALK_STRIDE_FACTOR,
  gloamwoodModelledPreyFor,
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
      const body = gloamwoodModelledPreyFor(creature.kind, creature.role, creature.branch)
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
      expect(entry.footprintRadius).toBeLessThan(2)
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
