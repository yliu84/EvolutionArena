import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  gloamwoodHuntRhythmStopsAutoEngage,
  resolveGloamwoodHuntRhythm,
} from '../src/gloamwood-hunt-rhythm'

describe('Boss hunt rhythm', () => {
  it('does not let the standing order close into a committed Boss attack', () => {
    for (const phase of ['telegraph', 'strike', 'attack']) {
      const rhythm = resolveGloamwoodHuntRhythm(true, phase)
      expect(rhythm).toBe('evade')
      expect(gloamwoodHuntRhythmStopsAutoEngage(rhythm)).toBe(true)
    }
  })

  it('labels recovery as the existing single-button counter window', () => {
    const rhythm = resolveGloamwoodHuntRhythm(true, 'recover')
    expect(rhythm).toBe('counter')
    expect(gloamwoodHuntRhythmStopsAutoEngage(rhythm)).toBe(false)
  })

  it('leaves ordinary prey and non-committed Boss phases alone', () => {
    expect(resolveGloamwoodHuntRhythm(false, 'telegraph')).toBe('advance')
    expect(resolveGloamwoodHuntRhythm(true, 'chase')).toBe('advance')
    expect(resolveGloamwoodHuntRhythm(true, 'dead')).toBe('advance')
  })

  it('uses the same rhythm to pause the live standing order without cancelling the lock', () => {
    const hunt = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
    expect(hunt).toContain('private lockedBossRhythm(): GloamwoodHuntRhythm')
    expect(hunt).toContain('if (gloamwoodHuntRhythmStopsAutoEngage(this.lockedBossRhythm()))')
    expect(hunt).toContain('this.target.copy(this.playerRoot.position)')
  })
})
