import { describe, expect, it } from 'vitest'

import { isGloamwood3DEntry } from '../src/entry-routing'

describe('What a bare URL opens', () => {
  it('opens the live body, since that is what the playtest link is for', () => {
    // ?maplab=5 started as a dev switch, so the deployed site defaulted to the
    // frozen Phaser prototype. A no-instruction tester handed the plain URL had
    // no way to know they were playing the wrong game.
    expect(isGloamwood3DEntry('')).toBe(true)
    expect(isGloamwood3DEntry('?debug=1')).toBe(true)
    expect(isGloamwood3DEntry('?maplab=5')).toBe(true)
    expect(isGloamwood3DEntry('?world3d=1')).toBe(true)
    expect(isGloamwood3DEntry('?maplab=4&live=1')).toBe(true)
  })

  it('keeps every frozen stack reachable by name', () => {
    for (const search of [
      '?maplab=1', '?maplab=2', '?maplab=3', '?maplab=4',
      '?huntlab=1', '?nestlab=1', '?quality=1', '?quality3d=1',
    ]) {
      expect(isGloamwood3DEntry(search), search).toBe(false)
    }
  })

  it('gives the classic prototype its own name, now that it lost the empty query', () => {
    expect(isGloamwood3DEntry('?classic=1')).toBe(false)
  })

  it('is not confused by unrelated query parameters', () => {
    expect(isGloamwood3DEntry('?lang=zh&evolutionSeed=goal5')).toBe(true)
    expect(isGloamwood3DEntry('?maplab=2&lang=en')).toBe(false)
  })
})
