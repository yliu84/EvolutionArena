import { describe, expect, it } from 'vitest'
import {
  DEFAULT_COMBAT_FEEDBACK_SETTINGS,
  cycleFeedbackVolume,
  damageDirectionDegrees,
  incomingHitKindForAttack,
  normalizeCombatFeedbackSettings,
  resolvePlayerHitFeedback,
} from '../src/player-hit-feedback'

describe('player hit feedback', () => {
  it('maps monster attacks to distinct incoming feedback classes', () => {
    expect(incomingHitKindForAttack('pounce')).toBe('contact')
    expect(incomingHitKindForAttack('projectile')).toBe('ranged')
    expect(incomingHitKindForAttack('brace')).toBe('area')
    expect(incomingHitKindForAttack('spread')).toBe('area')
  })

  it('makes area attacks heavier than aimed projectiles', () => {
    const area = resolvePlayerHitFeedback('area', 5, false)
    const ranged = resolvePlayerHitFeedback('ranged', 5, false)
    expect(area.shakeDurationMs).toBeGreaterThan(ranged.shakeDurationMs)
    expect(area.indicatorMs).toBeGreaterThan(ranged.indicatorMs)
  })

  it('strengthens lethal feedback without changing its damage class', () => {
    const hit = resolvePlayerHitFeedback('contact', 5, false)
    const lethal = resolvePlayerHitFeedback('contact', 5, true)
    expect(lethal.kind).toBe(hit.kind)
    expect(lethal.flashMs).toBeGreaterThan(hit.flashMs)
    expect(lethal.toneHz).toBeLessThan(hit.toneHz)
  })

  it('reports readable cardinal damage directions', () => {
    expect(damageDirectionDegrees(0, 0, 100, 0)).toBe(0)
    expect(damageDirectionDegrees(0, 0, 0, 100)).toBe(90)
    expect(damageDirectionDegrees(0, 0, -100, 0)).toBe(180)
    expect(damageDirectionDegrees(0, 0)).toBeNull()
  })

  it('cycles volume and repairs malformed stored settings', () => {
    expect(cycleFeedbackVolume(0.6)).toBe(1)
    expect(cycleFeedbackVolume(1)).toBe(0)
    expect(cycleFeedbackVolume(0)).toBe(0.6)
    expect(normalizeCombatFeedbackSettings({ shake: false, flash: true, volume: 1, muted: true })).toEqual({ shake: false, flash: true, volume: 1, muted: true })
    expect(normalizeCombatFeedbackSettings({ shake: false, flash: true, volume: 1 })).toEqual({ shake: false, flash: true, volume: 1, muted: false })
    expect(normalizeCombatFeedbackSettings({ volume: 0.2 })).toEqual(DEFAULT_COMBAT_FEEDBACK_SETTINGS)
  })
})
