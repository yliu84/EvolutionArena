import { describe, expect, it } from 'vitest'
import {
  formalHuntEvolutionRatio,
  formalHuntGateCopy,
  formalHuntHealthRatio,
  normalizeHudBearing,
} from '../src/formal-hunt-hud'

describe('formal hunt HUD presentation contract', () => {
  it('clamps authoritative health and evolution progress', () => {
    expect(formalHuntHealthRatio({ health: 45, maxHealth: 90 })).toBe(0.5)
    expect(formalHuntHealthRatio({ health: -5, maxHealth: 90 })).toBe(0)
    expect(formalHuntEvolutionRatio({ evolution: 150, evolutionRequired: 100 })).toBe(1)
  })

  it('normalizes the objective compass to the shortest readable turn', () => {
    expect(normalizeHudBearing(190)).toBe(-170)
    expect(normalizeHudBearing(-200)).toBe(160)
    expect(normalizeHudBearing(45.04)).toBe(45)
  })

  it('shows the authoritative boss gate without inventing progression rules', () => {
    expect(formalHuntGateCopy({ bossReady: false, bossActive: false, clearedNests: 3, requiredNests: 5, stage: 4, maxStage: 6 }))
      .toBe('终局封印 · 窝点 3/5 · 进化 4/6')
    expect(formalHuntGateCopy({ bossReady: true, bossActive: false, clearedNests: 5, requiredNests: 5, stage: 6, maxStage: 6 }))
      .toBe('古林之心已经苏醒')
    expect(formalHuntGateCopy({ bossReady: true, bossActive: true, clearedNests: 5, requiredNests: 5, stage: 6, maxStage: 6 }))
      .toBe('终局猎杀进行中')
  })
})
