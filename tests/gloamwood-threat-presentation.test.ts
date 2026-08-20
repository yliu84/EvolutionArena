import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  gloamwoodEliteThreatPulse,
  gloamwoodThreatMark,
  gloamwoodThreatTier,
  gloamwoodUsesWorldTargetPlate,
} from '../src/gloamwood-threat-presentation'

describe('River Valley threat presentation', () => {
  it('makes tier explicit with a shape as well as colour', () => {
    expect(gloamwoodThreatTier({ tier: 'pack' })).toBe('normal')
    expect(gloamwoodThreatTier({ tier: 'elite', eliteAffix: 'volatile' })).toBe('elite')
    expect(gloamwoodThreatTier({ tier: 'elite', boss: true })).toBe('boss')
    expect(gloamwoodThreatMark('normal')).toBe('')
    expect(gloamwoodThreatMark('elite')).not.toBe('')
    expect(gloamwoodThreatMark('boss')).not.toBe(gloamwoodThreatMark('elite'))
  })

  it('keeps the elite ground marker restrained and self-contained', () => {
    for (const elapsed of [0, 0.25, 0.75, 1.5, 3]) {
      expect(gloamwoodEliteThreatPulse(elapsed)).toBeGreaterThanOrEqual(0)
      expect(gloamwoodEliteThreatPulse(elapsed)).toBeLessThanOrEqual(1)
    }
  })

  it('keeps Boss identity in its one fixed encounter plate', () => {
    expect(gloamwoodUsesWorldTargetPlate('normal')).toBe(true)
    expect(gloamwoodUsesWorldTargetPlate('elite')).toBe(true)
    expect(gloamwoodUsesWorldTargetPlate('boss')).toBe(false)
  })

  it('renders Elite world plates and a dedicated Boss plate without changing combat authority', () => {
    const hunt = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
    expect(hunt).toContain('data-g3d-target-affix')
    expect(hunt).toContain('data-g3d-boss-phase')
    expect(hunt).toContain('private updateBossPlate')
    expect(hunt).toContain('gloamwoodUsesWorldTargetPlate(live.tier)')
    expect(css).toContain('.g3d-target-bar[data-tier="elite"]')
    expect(css).not.toContain('.g3d-target-bar[data-tier="boss"]')
    expect(css).toContain('.g3d-boss-plate')
  })
})
