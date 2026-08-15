import { describe, expect, it } from 'vitest'
import {
  MONSTER_NEST_LAB,
  canDamageNestCore,
  isMonsterNestLabRequested,
  nestWaveForPhase,
  nextNestPhase,
} from '../src/monster-nest'

describe('monster nest vertical slice', () => {
  it('uses an explicit isolated route', () => {
    expect(isMonsterNestLabRequested('?nestlab=1&debug=1')).toBe(true)
    expect(isMonsterNestLabRequested('?maplab=4')).toBe(false)
  })

  it('defines two distinct combat waves before the core opens', () => {
    expect(MONSTER_NEST_LAB.waves).toHaveLength(2)
    expect(MONSTER_NEST_LAB.waves.every((wave) => wave.length >= 3)).toBe(true)
    const ids = MONSTER_NEST_LAB.waves.flat().map((spawn) => spawn.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(MONSTER_NEST_LAB.waves[1].some((spawn) => spawn.elite)).toBe(true)
    expect(nestWaveForPhase('wave-1')).toBe(1)
    expect(nestWaveForPhase('wave-2')).toBe(2)
  })

  it('keeps the core sealed until both waves are cleared', () => {
    expect(nextNestPhase('dormant')).toBe('wave-1')
    expect(nextNestPhase('wave-1')).toBe('intermission-1')
    expect(nextNestPhase('intermission-1')).toBe('wave-2')
    expect(nextNestPhase('wave-2')).toBe('core-vulnerable')
    expect(canDamageNestCore('wave-2')).toBe(false)
    expect(canDamageNestCore('core-vulnerable')).toBe(true)
    expect(nextNestPhase('core-vulnerable')).toBe('cleared')
  })

  it('grants a meaningful family reward and reveals the surrounding region', () => {
    expect(MONSTER_NEST_LAB.reward.fangGenes).toBeGreaterThanOrEqual(3)
    expect(MONSTER_NEST_LAB.reward.evolution).toBeGreaterThan(0)
    expect(MONSTER_NEST_LAB.revealRadius).toBeGreaterThan(MONSTER_NEST_LAB.triggerRadius)
  })
})
