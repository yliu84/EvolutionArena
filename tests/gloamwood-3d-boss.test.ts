import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { getGloamwoodPlayerCollisionProfile } from '../src/gloamwood-3d-collision'
import { CORAL_GECKO_PRESENTATION } from '../src/quality-3d-character-presentation'
import { SCARLET_GECKO_PRESENTATION } from '../src/scarlet-gecko-character-presentation'
import {
  GLOAMWOOD_BOSS,
  bossPatternHits,
  clampGloamwoodBossToArena,
  createGloamwoodBossState,
  damageGloamwoodBoss,
  gloamwoodBossPatternSequence,
  startGloamwoodBoss,
  stepGloamwoodBoss,
} from '../src/gloamwood-3d-boss'

describe('MapLab 5 Thorn Heart Warden', () => {
  it('uses deterministic, learnable sequences that become more varied at half health', () => {
    expect(gloamwoodBossPatternSequence(1)).toEqual(['root-slam', 'thorn-charge', 'root-slam'])
    expect(gloamwoodBossPatternSequence(2)).toEqual(['spore-ring', 'thorn-charge', 'root-slam', 'thorn-charge'])
  })

  it('has distinct circle, lane and donut answers', () => {
    const origin = { x: 0, z: 0, aimX: 6, aimZ: 0 }
    // Sampled either side of the authored radius rather than at fixed numbers.
    // The previous version asserted a miss at 4, which only held because the
    // radius was 3.35 - too small to reach a player the collision floor keeps at
    // 3.43 or further, so the pattern could never connect at all.
    const slam = GLOAMWOOD_BOSS.patterns['root-slam'].radius
    expect(bossPatternHits({ ...origin, pattern: 'root-slam' }, { x: slam - 0.5, z: 0 })).toBe(true)
    expect(bossPatternHits({ ...origin, pattern: 'root-slam' }, { x: slam + 0.5, z: 0 })).toBe(false)
    expect(bossPatternHits({ ...origin, pattern: 'thorn-charge' }, { x: 4, z: 0.6 })).toBe(true)
    expect(bossPatternHits({ ...origin, pattern: 'thorn-charge' }, { x: 4, z: 1.2 })).toBe(false)
    expect(bossPatternHits({ ...origin, pattern: 'spore-ring' }, { x: 1, z: 0 })).toBe(false)
    expect(bossPatternHits({ ...origin, pattern: 'spore-ring' }, { x: 3.5, z: 0 })).toBe(true)
  })

  it('telegraphs before every damaging contact and enters phase two at half health', () => {
    let boss = startGloamwoodBoss(createGloamwoodBossState(0, 0))
    const player = { x: 2.8, z: 0, alive: true }
    for (let index = 0; index < Math.ceil(GLOAMWOOD_BOSS.introSeconds / 0.05) + 2; index += 1) {
      boss = stepGloamwoodBoss(boss, 0.05, player).state
    }
    expect(boss.state).toBe('telegraph')
    const damaged = damageGloamwoodBoss(boss, GLOAMWOOD_BOSS.maxHealth / 2)
    const phaseFrame = stepGloamwoodBoss(damaged.state, 0.05, player)
    expect(phaseFrame.state.phase).toBe(2)
    expect(phaseFrame.events).toEqual([{ type: 'phase-changed', phase: 2 }])
  })

  it('dies exactly once and cannot take post-death damage', () => {
    const active = startGloamwoodBoss(createGloamwoodBossState())
    const killed = damageGloamwoodBoss(active, 999)
    expect(killed.defeated).toBe(true)
    expect(killed.state.health).toBe(0)
    expect(damageGloamwoodBoss(killed.state, 20).effectiveDamage).toBe(0)
  })

  it('keeps charge movement inside the readable boss clearing', () => {
    const boss = { ...createGloamwoodBossState(0, 0), x: 9, z: 12 }
    const clamped = clampGloamwoodBossToArena(boss, { x: 0, z: 0 }, 6)
    expect(Math.hypot(clamped.x, clamped.z)).toBeCloseTo(6)
  })
})

describe('The boss never stops fighting back', () => {
  function fight(standoff: number, seconds = 40) {
    let boss = { ...createGloamwoodBossState(), state: 'chase' as const }
    const player = { x: boss.x + standoff, z: boss.z, alive: true }
    let attacks = 0
    for (let frame = 0; frame < 60 * seconds; frame += 1) {
      const step = stepGloamwoodBoss(boss, 1 / 60, player)
      boss = step.state
      attacks += step.events.filter((event) => event.type === 'boss-attack').length
    }
    return attacks
  }

  it('attacks from any starting distance, including beyond its preferred range', () => {
    // Regression: closing clamped travel to exactly `distance - preferredRange`,
    // so a boss that had to walk in landed on the boundary and the strict
    // comparison kept answering true by a rounding error. It edged forward by
    // 1e-16 a frame and never left chase. Any player standing further out than
    // 3.82 - or knocked back past it - saw the boss walk up and then stand
    // there for the rest of the run.
    const inside = fight(3)
    expect(inside).toBeGreaterThan(10)
    for (const standoff of [4.5, 6, 9, 14]) {
      expect(fight(standoff), `standoff ${standoff}`).toBeGreaterThan(10)
    }
  })

  it('leaves chase once it has closed, rather than hovering on the boundary', () => {
    let boss = { ...createGloamwoodBossState(), state: 'chase' as const }
    const player = { x: boss.x + 6, z: boss.z, alive: true }
    let chaseFrames = 0
    for (let frame = 0; frame < 60 * 10; frame += 1) {
      boss = stepGloamwoodBoss(boss, 1 / 60, player).state
      if (boss.state === 'chase') chaseFrames += 1
    }
    // Walking 2.18 units at 1.62/s is about 1.35s; anything near the full ten
    // seconds means it is stuck at the threshold again.
    expect(chaseFrames).toBeLessThan(60 * 3)
  })
})

describe('A boss must be able to use its own patterns from its own spacing', () => {
  /**
   * The reach band each pattern can resolve within, as the authority computes it.
   * A ring has a safe centre, so it has a floor as well as a ceiling.
   */
  function patternBand(pattern: keyof typeof GLOAMWOOD_BOSS.patterns) {
    const spec = GLOAMWOOD_BOSS.patterns[pattern] as Record<string, number>
    if ('innerRadius' in spec) return { floor: spec.innerRadius, ceiling: spec.outerRadius }
    if ('radius' in spec) return { floor: 0, ceiling: spec.radius }
    return { floor: 0, ceiling: spec.length }
  }

  /**
   * Closest the runtime will let a player stand to the boss, over every form.
   *
   * resolveObstacles pushes the player out to their combat body radius plus the
   * boss body plus 0.22, so no pattern can ever resolve inside this.
   */
  function collisionFloor() {
    const reserve = CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.visualTravel
      * SCARLET_GECKO_PRESENTATION.combat.pounceVisualTravelScale
    let worst = 0
    for (const family of ['fang', 'shell', 'swarm'] as const) {
      const profile = getGloamwoodPlayerCollisionProfile(1, family)
      const neutral = profile.radius + Math.max(profile.frontOffset, profile.rearOffset)
      const combatRadius = neutral + (family === 'shell' ? 0 : reserve)
      worst = Math.max(worst, combatRadius + GLOAMWOOD_BOSS.bodyRadius + 0.22)
    }
    return worst
  }

  it('can reach a player it is physically unable to get closer to', () => {
    // The one that cost the most. root-slam resolved inside 3.35 while the
    // collision floor is 3.43 to 3.50 depending on form, so it could not connect
    // with anything, ever - and it fills two of the three phase-one slots. Two
    // thirds of the boss's early attacks were guaranteed misses for the whole
    // life of the encounter, which is why the fight read as harmless.
    const floor = collisionFloor()
    for (const pattern of Object.keys(GLOAMWOOD_BOSS.patterns) as (keyof typeof GLOAMWOOD_BOSS.patterns)[]) {
      expect(patternBand(pattern).ceiling, `${pattern} against the collision floor`).toBeGreaterThanOrEqual(floor)
    }
  })

  it('waits at a distance it can actually reach', () => {
    // Dropping preferredRange below the collision floor meant the boss could
    // never arrive at the spacing it was waiting for, so it stopped attacking
    // outright - a live fight went completely passive.
    expect(GLOAMWOOD_BOSS.preferredRange).toBeGreaterThanOrEqual(collisionFloor())
  })

  it('reaches the player at every distance it chooses to stand at', () => {
    // Found by measurement, not by looking: preferredRange was 3.82 while
    // root-slam resolves inside 3.35, so the boss walked to a distance where its
    // most frequent pattern could not connect. This is exactly the class of
    // error that is computable before a creature ships.
    for (const pattern of Object.keys(GLOAMWOOD_BOSS.patterns) as (keyof typeof GLOAMWOOD_BOSS.patterns)[]) {
      const band = patternBand(pattern)
      expect(GLOAMWOOD_BOSS.preferredRange, `${pattern} at preferred range`).toBeLessThanOrEqual(band.ceiling)
      expect(GLOAMWOOD_BOSS.minimumRange, `${pattern} at minimum range`).toBeGreaterThanOrEqual(band.floor)
    }
  })

  it('keeps enough room for a pattern with a safe centre to land', () => {
    // spore-ring is safe inside 2.15. Chase only ever closed, so once a charge
    // left the boss standing on the player it stayed there and the ring landed
    // once in thirty-one seconds - a third of the phase-two rotation was dead.
    const ring = GLOAMWOOD_BOSS.patterns['spore-ring']
    expect(GLOAMWOOD_BOSS.minimumRange).toBeGreaterThan(ring.innerRadius)
    expect(GLOAMWOOD_BOSS.minimumRange).toBeLessThan(GLOAMWOOD_BOSS.preferredRange)
  })

  function attacksPerMinute(phase: 1 | 2) {
    let boss = { ...createGloamwoodBossState(), state: 'chase' as const, phase,
      health: phase === 2 ? GLOAMWOOD_BOSS.maxHealth * 0.4 : GLOAMWOOD_BOSS.maxHealth }
    const player = { x: boss.x + 3.4, z: boss.z, alive: true }
    let attacks = 0
    for (let frame = 0; frame < 60 * 120; frame += 1) {
      const step = stepGloamwoodBoss(boss, 1 / 60, player)
      boss = { ...step.state, health: phase === 2 ? GLOAMWOOD_BOSS.maxHealth * 0.4 : boss.health }
      attacks += step.events.filter((event) => event.type === 'boss-attack').length
    }
    return attacks / 2
  }

  it('presses harder in its second phase than its first', () => {
    // Measured before this work: 24 attacks a minute in phase one against 21 in
    // phase two, so reaching half health made the boss safer. Phase two spent
    // longer winding up than phase one saved in recovery.
    const first = attacksPerMinute(1)
    const second = attacksPerMinute(2)
    expect(first).toBeGreaterThan(24)
    expect(second).toBeGreaterThan(first)
  })
})

describe('An arena fight has to hold both sides', () => {
  it('keeps the player where the boss can still reach them', () => {
    // The boss is clamped inside the arena and the player was clamped only to
    // the world, which is 50 by 36. Walk far enough and the boss physically
    // cannot follow: it stands at the arena edge and never attacks again.
    // Knockback nudges the player out on every hit, which is why the fight died
    // three quarters of the way in rather than at the start.
    const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
    expect(source).toContain('private confineToArena(position: THREE.Vector3)')
    // Three writers: movement, prey knockback and boss knockback. Movement
    // alone was not enough - knockback writes the position directly and would
    // have kept walking the player out one hit at a time.
    expect((source.match(/this\.confineToArena\(/g) ?? []).length).toBe(3)
  })

  it('bounds the player inside what the boss can close on', () => {
    // The boss can only reach `playerDistance - arenaRadius`, so a bound past
    // arenaRadius + preferredRange strands it however long the fight runs.
    const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
    const bound = Number(source.match(/const GLOAMWOOD_ARENA_PLAYER_RADIUS = ([\d.]+)/)?.[1])
    const arena = Number(source.match(/const GLOAMWOOD_BOSS_ARENA_RADIUS = ([\d.]+)/)?.[1])
    const clearRadius = Number(source.match(/const GLOAMWOOD_BOSS_ARENA_CLEAR_RADIUS = ([\d.]+)/)?.[1])
    expect(bound).toBeLessThanOrEqual(arena + GLOAMWOOD_BOSS.preferredRange)
    // And inside the radius props are cleared from, so the wall never puts the
    // player inside scenery.
    expect(bound).toBeLessThanOrEqual(clearRadius)
  })
})
