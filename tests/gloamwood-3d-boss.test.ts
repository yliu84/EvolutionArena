import { describe, expect, it } from 'vitest'

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
    expect(bossPatternHits({ ...origin, pattern: 'root-slam' }, { x: 3, z: 0 })).toBe(true)
    expect(bossPatternHits({ ...origin, pattern: 'root-slam' }, { x: 4, z: 0 })).toBe(false)
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
