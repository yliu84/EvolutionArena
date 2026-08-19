import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_PREY, type GloamwoodNestPrey } from '../src/gloamwood-3d-ecology'
import {
  GLOAMWOOD_VALLEY_BOSS_PLAYER_FLOOR,
  GLOAMWOOD_VALLEY_BOSS_SPECS,
  gloamwoodValleyBossClipForPhase,
  gloamwoodValleyBossHits,
  gloamwoodValleyBossRotation,
  gloamwoodValleyBossSpecFor,
  stepGloamwoodValleyBoss,
  type GloamwoodValleyBossSpec,
} from '../src/gloamwood-valley-boss'
import { GLOAMWOOD_VALLEY_BOSS_BODIES, gloamwoodValleyBodyFor } from '../src/gloamwood-modelled-prey'
import { createGloamwoodValleyCreatures } from '../src/gloamwood-valley-creatures'
import { planGloamwoodValleySpawns } from '../src/gloamwood-valley-spawns'

const PLAYER = { x: 0, z: 0, alive: true }

function bossAt(spec: GloamwoodValleyBossSpec, overrides: Partial<GloamwoodNestPrey> = {}) {
  return {
    id: 'boss', kind: 'shell' as const, phase: 'chase' as const, phaseElapsed: 0,
    health: spec.maxHealth, maxHealth: spec.maxHealth,
    x: spec.preferredRange, z: 0, facingRadians: Math.PI, attackResolved: false, slot: 0,
    bodyRadius: spec.bodyRadius, tier: 'boss',
    ...overrides,
  }
}

/** Runs a boss until it is in the named phase, or gives up. */
function runTo(spec: GloamwoodValleyBossSpec, start: ReturnType<typeof bossAt>, phase: string, player = PLAYER) {
  let state = start
  const events = []
  for (let frame = 0; frame < 2400; frame += 1) {
    if (state.phase === phase) return { state, events }
    const result = stepGloamwoodValleyBoss(state, spec, 1 / 60, player)
    state = result.state as typeof start
    events.push(...result.events)
  }
  throw new Error(`never reached ${phase}`)
}

describe('Every pattern has an answer', () => {
  it('reaches past the closest the player can ever stand', () => {
    // The Gloamwood boss shipped with two of its three phase-one patterns at a
    // radius under the collision floor: they could not connect with anything,
    // ever, for the life of the encounter. Every reach here is measured out
    // from that floor rather than picked.
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      const floor = spec.bodyRadius + GLOAMWOOD_VALLEY_BOSS_PLAYER_FLOOR
      for (const pattern of Object.values(spec.patterns)) {
        const shape = pattern.shape
        if (shape.kind === 'disc') expect(shape.radius, `${spec.bodyId}/${pattern.id}`).toBeGreaterThan(floor)
        if (shape.kind === 'line') expect(shape.length, `${spec.bodyId}/${pattern.id}`).toBeGreaterThan(floor)
        // A ring's outer edge must clear the floor or nothing is ever in it;
        // its inner edge must not, or the safe circle cannot be stood in.
        if (shape.kind === 'ring') {
          expect(shape.outerRadius).toBeGreaterThan(floor)
          expect(shape.innerRadius).toBeGreaterThan(floor)
        }
      }
    }
  })

  it('keeps the ring safe where the player can actually get to', () => {
    // Running out is the expensive answer and walking in is the cheap one. If
    // the inner edge sat below the collision floor the cheap answer would not
    // exist and the ring would be a circle you simply take.
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      for (const pattern of Object.values(spec.patterns)) {
        if (pattern.shape.kind !== 'ring') continue
        const floor = spec.bodyRadius + GLOAMWOOD_VALLEY_BOSS_PLAYER_FLOOR
        expect(pattern.shape.innerRadius - floor).toBeGreaterThan(0.6)
        // And it has to be worth walking in for: standing where the boss keeps
        // you must be inside the danger band.
        expect(spec.preferredRange).toBeGreaterThan(pattern.shape.innerRadius)
        expect(spec.preferredRange).toBeLessThan(pattern.shape.outerRadius)
      }
    }
  })

  it('hits whoever stands where the boss keeps them, for every disc', () => {
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      for (const pattern of Object.values(spec.patterns)) {
        if (pattern.shape.kind !== 'disc') continue
        const standing = { x: spec.preferredRange, z: 0 }
        expect(gloamwoodValleyBossHits(pattern.shape, { x: 0, z: 0 }, standing, standing)).toBe(true)
      }
    }
  })

  it('lets a sidestep beat every lane', () => {
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      for (const pattern of Object.values(spec.patterns)) {
        if (pattern.shape.kind !== 'line') continue
        const aim = { x: spec.preferredRange, z: 0 }
        expect(gloamwoodValleyBossHits(pattern.shape, { x: 0, z: 0 }, aim, aim)).toBe(true)
        const aside = { x: spec.preferredRange, z: pattern.shape.halfWidth + 0.1 }
        expect(gloamwoodValleyBossHits(pattern.shape, { x: 0, z: 0 }, aim, aside)).toBe(false)
      }
    }
  })

  it('never divides by a lane with no direction', () => {
    // A lunge ends on the point it aimed at, so the boss and its aim can be
    // exactly coincident. A NaN here reads as a miss and silently deletes the
    // attack rather than crashing, which is the worst way for it to fail.
    const spec = GLOAMWOOD_VALLEY_BOSS_SPECS[2]
    const lane = Object.values(spec.patterns).find((pattern) => pattern.shape.kind === 'line')!
    const here = { x: 4, z: 4 }
    expect(gloamwoodValleyBossHits(lane.shape, here, here, { x: 5, z: 4 })).toBe(true)
  })

  it('tells the three shapes apart in every rotation', () => {
    // Three patterns that are all discs are one pattern thrown three times.
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      const shapes = new Set(Object.values(spec.patterns).map((pattern) => pattern.shape.kind))
      expect(shapes.size, spec.bodyId).toBeGreaterThan(1)
    }
  })
})

describe('The rotation', () => {
  it('holds a phase-two pattern back until phase two', () => {
    const spec = GLOAMWOOD_VALLEY_BOSS_SPECS[2]
    const held = Object.values(spec.patterns).filter((pattern) => pattern.phaseTwoOnly).map((pattern) => pattern.id)
    expect(held.length).toBeGreaterThan(0)
    for (const id of held) {
      expect(gloamwoodValleyBossRotation(spec, 1)).not.toContain(id)
      expect(gloamwoodValleyBossRotation(spec, 2)).toContain(id)
    }
  })

  it('names only patterns that exist', () => {
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      for (const phase of [1, 2] as const) {
        expect(gloamwoodValleyBossRotation(spec, phase).length).toBe(spec.rotation[phase].length)
      }
    }
  })

  it('presses harder in phase two without shortening a single wind-up', () => {
    // Recovery is the right lever: cutting it costs the player nothing they
    // were reading. The telegraphs are where the fight stays legible.
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      expect(spec.recoverSeconds[2]).toBeLessThan(spec.recoverSeconds[1])
    }
  })
})

describe('One fight, one frame at a time', () => {
  const spec = GLOAMWOOD_VALLEY_BOSS_SPECS[0]

  it('walks in to where it can reach and then commits', () => {
    const far = bossAt(spec, { x: 40, z: 0 })
    const { state } = runTo(spec, far, 'telegraph')
    expect(Math.hypot(state.x, state.z)).toBeLessThanOrEqual(spec.preferredRange + 0.01)
    expect(state.bossPattern).toBe(spec.rotation[1][0])
  })

  it('commits its aim at the wind-up, so a lane can be walked out of', () => {
    const { state } = runTo(spec, bossAt(spec), 'telegraph')
    expect(state.aimX).toBe(PLAYER.x)
    expect(state.aimZ).toBe(PLAYER.z)
  })

  it('carries the wind-up through even if the player leaves', () => {
    // Prey drop a telegraph the moment the player steps out of reach, because a
    // prey wind-up is part of an approach. A boss pattern is a commitment, and
    // one that could be walked out of would never land at all.
    let state = runTo(spec, bossAt(spec), 'telegraph').state
    const gone = { x: 60, z: 60, alive: true }
    for (let frame = 0; frame < 200 && state.phase === 'telegraph'; frame += 1) {
      state = stepGloamwoodValleyBoss(state, spec, 1 / 60, gone).state as typeof state
    }
    expect(state.phase).toBe('strike')
  })

  it('lands exactly one blow per pattern', () => {
    let state = runTo(spec, bossAt(spec), 'telegraph').state
    const attacks = []
    for (let frame = 0; frame < 400; frame += 1) {
      const result = stepGloamwoodValleyBoss(state, spec, 1 / 60, PLAYER)
      state = result.state as typeof state
      attacks.push(...result.events.filter((event) => event.type === 'prey-attack'))
      if (state.phase === 'recover') break
    }
    expect(attacks).toHaveLength(1)
  })

  it('cannot be interrupted', () => {
    // The stun immunity is refreshed every frame rather than granted once, so
    // the damage gate's own decay can never open a window mid-pattern.
    const { state } = runTo(spec, bossAt(spec), 'telegraph')
    expect(state.stunImmuneSeconds).toBeGreaterThan(GLOAMWOOD_PREY.shell.stunSeconds)
  })

  it('turns at half health, once, and gives the player a beat to see it', () => {
    const hurt = bossAt(spec, { health: spec.maxHealth * 0.5 })
    const result = stepGloamwoodValleyBoss(hurt, spec, 1 / 60, PLAYER)
    expect(result.events).toContainEqual({ type: 'boss-enraged', preyId: 'boss', phase: 2 })
    expect(result.state.bossPhase).toBe(2)
    expect(result.state.phase).toBe('recover')
    // And not again on the next frame, or it would never attack again.
    const after = stepGloamwoodValleyBoss(result.state, spec, 1 / 60, PLAYER)
    expect(after.events.filter((event) => event.type === 'boss-enraged')).toHaveLength(0)
  })

  it('stops fighting a dead player rather than beating the corpse', () => {
    const { state } = runTo(spec, bossAt(spec), 'telegraph')
    const result = stepGloamwoodValleyBoss(state, spec, 1 / 60, { x: 0, z: 0, alive: false })
    expect(result.state.phase).toBe('chase')
    expect(result.events).toHaveLength(0)
  })

  it('keeps throwing patterns for a whole fight', () => {
    // The Gloamwood boss stopped attacking forever the first time the player
    // backed out past its preferred range, because its approach could land on
    // the boundary and keep testing true by a rounding error.
    let state = bossAt(spec, { x: 30, z: 0 })
    let attacks = 0
    for (let frame = 0; frame < 60 * 60; frame += 1) {
      const result = stepGloamwoodValleyBoss(state, spec, 1 / 60, PLAYER)
      state = result.state as typeof state
      attacks += result.events.filter((event) => event.type === 'prey-attack').length
    }
    expect(attacks).toBeGreaterThan(10)
  })
})

describe('Which boss is which', () => {
  it('reads the boss off the body it already wears', () => {
    // Position mapped to a boss in two places once, and the two disagreed.
    for (const creature of createGloamwoodValleyCreatures(0x5a11e)) {
      const spec = gloamwoodValleyBossSpecFor(creature)
      if (creature.tier !== 'boss') {
        expect(spec).toBeUndefined()
        continue
      }
      const body = gloamwoodValleyBodyFor({
        kind: creature.kind, role: creature.role, branch: creature.branch, tier: 'boss', s: creature.spawnS,
      })
      expect(spec?.bodyId).toBe(body?.id)
    }
  })

  it('gives every boss body a spec, and every spec a real body', () => {
    expect(GLOAMWOOD_VALLEY_BOSS_SPECS).toHaveLength(GLOAMWOOD_VALLEY_BOSS_BODIES.length)
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      const body = GLOAMWOOD_VALLEY_BOSS_BODIES.find((entry) => entry.id === spec.bodyId)
      expect(body, spec.bodyId).toBeDefined()
      // The reach is measured from the body's real footprint, so a model
      // re-exported at a different size cannot leave the patterns behind.
      expect(spec.bodyRadius).toBe(body?.footprintRadius)
    }
  })

  it('answers the same for a placed creature and the spawn it came from', () => {
    // The spawn calls the route position `s` and the creature calls it
    // `spawnS`. Reading only one of them put every boss in the valley behind
    // the Source Root's health, because the body registry answers an unknown
    // position with its last boss rather than with nothing.
    for (const spawn of planGloamwoodValleySpawns(0x5a11e)) {
      if (spawn.tier !== 'boss') continue
      const placed = createGloamwoodValleyCreatures(0x5a11e).find((creature) => creature.id === spawn.id)!
      expect(gloamwoodValleyBossSpecFor(spawn)?.bodyId).toBe(gloamwoodValleyBossSpecFor(placed)?.bodyId)
    }
  })

  it('gives the three bosses three different health pools', () => {
    const creatures = createGloamwoodValleyCreatures(0x5a11e).filter((creature) => creature.tier === 'boss')
    expect(new Set(creatures.map((creature) => creature.maxHealth)).size).toBe(3)
  })

  it('climbs, boss to boss', () => {
    const health = GLOAMWOOD_VALLEY_BOSS_SPECS.map((spec) => spec.maxHealth)
    expect(health[1]).toBeGreaterThan(health[0])
    expect(health[2]).toBeGreaterThan(health[1])
  })
})

describe('The clip a boss plays', () => {
  const spec = GLOAMWOOD_VALLEY_BOSS_SPECS[2]
  const config = GLOAMWOOD_VALLEY_BOSS_BODIES[2]

  it('plays the clip the pattern names, not the one the body defaults to', () => {
    for (const pattern of Object.values(spec.patterns)) {
      const selection = gloamwoodValleyBossClipForPhase(
        { phase: 'telegraph', bossPattern: pattern.id }, spec, config, 2, 'chase',
      )
      expect(selection.clip).toBe(pattern.clip)
      expect(selection.once).toBe(true)
    }
  })

  it('does not restart the take when the blow follows its own wind-up', () => {
    const selection = gloamwoodValleyBossClipForPhase(
      { phase: 'strike', bossPattern: 'root-slam' }, spec, config, 2, 'telegraph',
    )
    expect(selection.restart).toBe(false)
  })

  it('stretches the take over wind-up plus blow', () => {
    const pattern = spec.patterns['root-slam']
    const selection = gloamwoodValleyBossClipForPhase(
      { phase: 'telegraph', bossPattern: 'root-slam' }, spec, config, 2.32, 'chase',
    )
    expect(selection.rate).toBeCloseTo(2.32 / (pattern.telegraphSeconds + pattern.attackSeconds), 5)
  })

  it('falls back to idle rather than to a pattern it does not have', () => {
    const selection = gloamwoodValleyBossClipForPhase(
      { phase: 'telegraph', bossPattern: 'not-a-pattern' }, spec, config, 2, 'chase',
    )
    expect(selection.clip).toBe(config.clips.idle)
  })
})
