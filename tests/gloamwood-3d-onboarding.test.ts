import { describe, expect, it } from 'vitest'
import { setLocale, t } from '../src/i18n'

import { deriveGloamwoodOnboardingStep, type GloamwoodOnboardingSnapshot } from '../src/gloamwood-3d-onboarding'

function snapshot(overrides: Partial<GloamwoodOnboardingSnapshot> = {}): GloamwoodOnboardingSnapshot {
  return {
    runPhase: 'hunt',
    movedDistance: 0,
    nestPhase: 'dormant',
    targetLocked: false,
    targetKind: null,
    attackStarted: false,
    kills: 0,
    biomass: 0,
    genes: { fang: 0, shell: 0, swarm: 0 },
    evolutionPhase: 'collecting',
    objectiveDistance: 18.4,
    bossPattern: 'root-slam',
    bossPhase: 1,
    controls: { move: 'W/A/S/D', lock: 'Tab', attack: 'Space' },
    ...overrides,
  }
}

describe('Gloamwood contextual onboarding', () => {
  it('starts with movement and advances to the authored nest objective from real movement', () => {
    expect(deriveGloamwoodOnboardingStep(snapshot()).phase).toBe('move')
    const approach = deriveGloamwoodOnboardingStep(snapshot({ movedDistance: 1.26 }))
    expect(approach).toMatchObject({ phase: 'approach', step: 1, progress: t('guide.approach.progress', { distance: 18 }) })
    expect(approach.reason).toContain('Biomass')
  })

  it('teaches lock before attack and preserves the selected-target contact rule', () => {
    expect(deriveGloamwoodOnboardingStep(snapshot({ nestPhase: 'wave' }))).toMatchObject({ phase: 'lock', step: 2 })
    const attack = deriveGloamwoodOnboardingStep(snapshot({ nestPhase: 'wave', targetLocked: true, targetKind: 'fang' }))
    expect(attack).toMatchObject({ phase: 'attack', step: 2 })
    expect(attack.reason).toContain('8°')
  })

  it('explains that prey Genes weight random candidates instead of guaranteeing a skin', () => {
    const hunt = deriveGloamwoodOnboardingStep(snapshot({
      nestPhase: 'wave', targetLocked: true, targetKind: 'shell', attackStarted: true, kills: 2, biomass: 13,
    }))
    expect(hunt).toMatchObject({ phase: 'hunt', step: 3, progress: t('guide.hunt.progress', { kills: 2, biomass: 13 }) })
    expect(hunt.instruction).toBe(t('hint.family.shell'))
    expect(hunt.reason).toContain('Genes')

    const evolution = deriveGloamwoodOnboardingStep(snapshot({
      runPhase: 'evolution', nestPhase: 'cleared', evolutionPhase: 'choosing', genes: { fang: 3, shell: 2, swarm: 6 },
    }))
    expect(evolution).toMatchObject({ phase: 'evolution', step: 4 })
    expect(evolution.reason).toContain('never guarantee')
    expect(evolution.progress).toContain('Swarm 6')
  })

  it('gives distinct guardian and learnable boss safe-space instructions', () => {
    expect(deriveGloamwoodOnboardingStep(snapshot({ runPhase: 'guardian', objectiveDistance: 5.7 })))
      .toMatchObject({ phase: 'guardian', step: 5, progress: t('guide.guardian.progress', { distance: 6 }) })
    expect(deriveGloamwoodOnboardingStep(snapshot({ runPhase: 'boss', bossPattern: 'root-slam' }))).toMatchObject({ step: 6, instruction: t('hint.boss.root-slam') })
    expect(deriveGloamwoodOnboardingStep(snapshot({ runPhase: 'boss', bossPattern: 'thorn-charge' })).instruction).toBe(t('hint.boss.thorn-charge'))
    expect(deriveGloamwoodOnboardingStep(snapshot({ runPhase: 'boss', bossPhase: 2, bossPattern: 'spore-ring' }))).toMatchObject({ step: 7, instruction: t('hint.boss.spore-ring') })
  })

  it('uses terminal outcomes for completion and reason-specific recovery guidance', () => {
    expect(deriveGloamwoodOnboardingStep(snapshot({ runPhase: 'victory' }))).toMatchObject({ phase: 'complete', tone: 'complete' })
    expect(deriveGloamwoodOnboardingStep(snapshot({ runPhase: 'defeat' }))).toMatchObject({ phase: 'recover', tone: 'danger' })
  })
})
