import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_RUN_PACING,
  classifyGloamwoodRunPace,
  gloamwoodRunPaceVisible,
} from '../src/gloamwood-3d-run'

describe('Gloamwood complete-run pacing', () => {
  it('uses the requested inclusive 8–13 minute acceptance window', () => {
    expect(GLOAMWOOD_RUN_PACING).toEqual({ targetMinimumSeconds: 480, targetMaximumSeconds: 780 })
    expect(classifyGloamwoodRunPace(479).pace).toBe('fast')
    expect(classifyGloamwoodRunPace(480).pace).toBe('target')
    expect(classifyGloamwoodRunPace(780).pace).toBe('target')
    expect(classifyGloamwoodRunPace(781).pace).toBe('slow')
  })

  it('never treats a debug skip as natural-run timing evidence', () => {
    expect(classifyGloamwoodRunPace(600, true)).toMatchObject({ pace: 'debug', label: '调试局' })
  })
})

describe('Who the pacing readout is for', () => {
  it('stays hidden unless it is asked for', () => {
    // It is a development instrument, not player copy: "this run does not count
    // toward the 8-13 minute acceptance" is a note to the producer about a
    // gate. Goal 5 needs three English-speaking testers with no instructions,
    // and they were being shown an untranslated internal acceptance note on the
    // death screen.
    expect(gloamwoodRunPaceVisible('')).toBe(false)
    expect(gloamwoodRunPaceVisible('?map=valley')).toBe(false)
  })

  it('appears for whoever asks by URL', () => {
    // By URL rather than gated on DEV, because the producer reviews the
    // deployed build too, and a dev-only switch does nothing where the review
    // actually happens.
    expect(gloamwoodRunPaceVisible('?pace=1')).toBe(true)
    expect(gloamwoodRunPaceVisible('?map=valley&pace=1')).toBe(true)
  })
})
