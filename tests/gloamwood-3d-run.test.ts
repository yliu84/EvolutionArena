import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_RUN_PACING, classifyGloamwoodRunPace } from '../src/gloamwood-3d-run'

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
