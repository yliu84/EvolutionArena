import { describe, expect, it } from 'vitest'
import { monsterImpactWeight, resolveImpactFeedback } from '../src/combat-impact-feedback'

describe('combat impact feedback', () => {
  it('classifies physical monster weight without changing combat health', () => {
    expect(monsterImpactWeight('razorwing')).toBe('light')
    expect(monsterImpactWeight('mantis')).toBe('medium')
    expect(monsterImpactWeight('shellback')).toBe('heavy')
    expect(monsterImpactWeight('hornbeetle')).toBe('medium')
    expect(monsterImpactWeight('mantis', true)).toBe('heavy')
  })

  it('makes melee weightier than ranged hits', () => {
    const melee = resolveImpactFeedback('melee', 'pouncer')
    const ranged = resolveImpactFeedback('ranged', 'pouncer')
    expect(melee.hitStopMs).toBeGreaterThan(ranged.hitStopMs)
    expect(melee.knockback).toBeGreaterThan(ranged.knockback)
    expect(melee.shakeIntensity).toBeGreaterThan(ranged.shakeIntensity)
  })

  it('lets heavy monsters visibly resist knockback', () => {
    const light = resolveImpactFeedback('melee', 'pouncer')
    const heavy = resolveImpactFeedback('melee', 'shellback')
    expect(heavy.knockback).toBeLessThan(light.knockback * 0.5)
    expect(heavy.toneHz).toBeLessThan(light.toneHz)
  })

  it('gives magic the broadest burst while keeping melee hit-stop strongest', () => {
    const magic = resolveImpactFeedback('magic', 'spitter')
    const melee = resolveImpactFeedback('melee', 'spitter')
    expect(magic.burstScale).toBeGreaterThan(melee.burstScale)
    expect(magic.hitStopMs).toBeLessThan(melee.hitStopMs)
  })

  it('upgrades feedback on a killing blow without changing weight', () => {
    const hit = resolveImpactFeedback('ranged', 'shellback', false, false)
    const kill = resolveImpactFeedback('ranged', 'shellback', false, true)
    expect(kill.weight).toBe(hit.weight)
    expect(kill.hitStopMs).toBeGreaterThan(hit.hitStopMs)
    expect(kill.knockback).toBeGreaterThan(hit.knockback)
    expect(kill.toneDurationMs).toBeGreaterThan(hit.toneDurationMs)
  })
})
