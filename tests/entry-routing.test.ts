import { describe, expect, it } from 'vitest'

import { isGloamwood3DEntry, gloamwoodMapFromEntry } from '../src/entry-routing'

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

  it('routes historical stack selectors to the shipped River Valley build', () => {
    for (const search of [
      '?maplab=1', '?maplab=2', '?maplab=3', '?maplab=4',
      '?huntlab=1', '?nestlab=1', '?quality=1', '?quality3d=1',
    ]) {
      expect(isGloamwood3DEntry(search), search).toBe(true)
    }
  })

  it('does not revive the classic prototype from an old query', () => {
    expect(isGloamwood3DEntry('?classic=1')).toBe(true)
  })

  it('is not confused by unrelated query parameters', () => {
    expect(isGloamwood3DEntry('?lang=zh&evolutionSeed=goal5')).toBe(true)
    expect(isGloamwood3DEntry('?maplab=2&lang=en')).toBe(true)
  })
})

describe('Which map a run is played on', () => {
  it('answers only to its own query', () => {
    expect(gloamwoodMapFromEntry('?map=valley')).toBe('valley')
    expect(gloamwoodMapFromEntry('?map=valley&mapSeed=7')).toBe('valley')
    expect(gloamwoodMapFromEntry('?map=gloamwood')).toBe('gloamwood')
  })

  it('opens the river valley from the front door', () => {
    // The valley is the complete player route. The compact nest map remains
    // available for focused combat checks, but a stranger must not be sent to
    // it by a bare production link.
    expect(gloamwoodMapFromEntry('')).toBe('valley')
    expect(isGloamwood3DEntry('')).toBe(true)
  })

  it('keeps both maps inside the one entry, so they cannot drift apart', () => {
    // The valley used to be its own entry, and it grew a second player, a
    // second combat loop and a second HUD beside the ones the hunt has.
    expect(isGloamwood3DEntry('?map=valley')).toBe(true)
  })
})
