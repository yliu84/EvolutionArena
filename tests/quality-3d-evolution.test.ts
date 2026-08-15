import { describe, expect, it } from 'vitest'
import {
  getQuality3DEvolutionEnvelope,
  getQuality3DEvolutionStage,
  mixQuality3DMorphology,
  QUALITY_3D_EVOLUTION_STAGES,
} from '../src/quality-3d-evolution'

describe('quality 3D evolution sequence', () => {
  it('defines the hatchling plus six increasingly powerful stages', () => {
    expect(QUALITY_3D_EVOLUTION_STAGES).toHaveLength(7)
    for (let index = 1; index < QUALITY_3D_EVOLUTION_STAGES.length; index += 1) {
      const previous = QUALITY_3D_EVOLUTION_STAGES[index - 1].morphology
      const current = QUALITY_3D_EVOLUTION_STAGES[index].morphology
      expect(current.overallScale).toBeGreaterThan(previous.overallScale)
      expect(current.hornGrowth).toBeGreaterThan(previous.hornGrowth)
      expect(current.wingGrowth).toBeGreaterThan(previous.wingGrowth)
    }
  })

  it('clamps stage selection and morph interpolation', () => {
    expect(getQuality3DEvolutionStage(-4).stage).toBe(0)
    expect(getQuality3DEvolutionStage(99).stage).toBe(6)
    const first = QUALITY_3D_EVOLUTION_STAGES[0].morphology
    const final = QUALITY_3D_EVOLUTION_STAGES[6].morphology
    expect(mixQuality3DMorphology(first, final, -1)).toEqual(first)
    expect(mixQuality3DMorphology(first, final, 2)).toEqual(final)
    expect(mixQuality3DMorphology(first, final, 0.5).overallScale).toBeCloseTo((first.overallScale + final.overallScale) / 2)
  })

  it('runs anticipation, growth, impact and settle before completing', () => {
    expect(getQuality3DEvolutionEnvelope(0).growth).toBe(0)
    expect(getQuality3DEvolutionEnvelope(2.07).impact).toBeGreaterThan(0.95)
    expect(getQuality3DEvolutionEnvelope(2.8).complete).toBe(true)
    expect(getQuality3DEvolutionEnvelope(2.8).growth).toBe(1)
  })
})
