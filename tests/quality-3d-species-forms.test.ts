import { describe, expect, it } from 'vitest'
import { getQuality3DSpeciesForm, QUALITY_3D_LIZARD_DRAGON_FORMS } from '../src/quality-3d-species-forms'

describe('quality 3D independent species forms', () => {
  it('defines seven different body plans instead of scaling one lizard', () => {
    expect(QUALITY_3D_LIZARD_DRAGON_FORMS).toHaveLength(7)
    expect(new Set(QUALITY_3D_LIZARD_DRAGON_FORMS.map((form) => form.formId)).size).toBe(7)
    expect(new Set(QUALITY_3D_LIZARD_DRAGON_FORMS.map((form) => form.bodyPlan)).size).toBe(7)
  })

  it('crosses clear silhouette gates from ground lizard to giant dragon', () => {
    expect(QUALITY_3D_LIZARD_DRAGON_FORMS.slice(0, 3).every((form) => form.wingSpan === 0)).toBe(true)
    expect(QUALITY_3D_LIZARD_DRAGON_FORMS[3].legCount).toBe(2)
    expect(QUALITY_3D_LIZARD_DRAGON_FORMS[6].wingSpan).toBeGreaterThan(QUALITY_3D_LIZARD_DRAGON_FORMS[3].wingSpan)
    expect(QUALITY_3D_LIZARD_DRAGON_FORMS[6].bodyLength).toBeGreaterThan(QUALITY_3D_LIZARD_DRAGON_FORMS[0].bodyLength * 2)
    expect(QUALITY_3D_LIZARD_DRAGON_FORMS[6].hornCount).toBeGreaterThan(QUALITY_3D_LIZARD_DRAGON_FORMS[0].hornCount)
  })

  it('changes the full palette between consecutive species and clamps lookup', () => {
    for (let index = 1; index < QUALITY_3D_LIZARD_DRAGON_FORMS.length; index += 1) {
      expect(QUALITY_3D_LIZARD_DRAGON_FORMS[index].primary).not.toBe(QUALITY_3D_LIZARD_DRAGON_FORMS[index - 1].primary)
      expect(QUALITY_3D_LIZARD_DRAGON_FORMS[index].secondary).not.toBe(QUALITY_3D_LIZARD_DRAGON_FORMS[index - 1].secondary)
    }
    expect(getQuality3DSpeciesForm(-1).stage).toBe(0)
    expect(getQuality3DSpeciesForm(99).stage).toBe(6)
  })
})
