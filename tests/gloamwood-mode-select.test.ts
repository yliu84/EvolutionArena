import { describe, expect, it } from 'vitest'

import { gloamwoodMapFromEntry, gloamwoodMapFromSearch } from '../src/entry-routing'
import {
  GLOAMWOOD_MODES,
  normalizeGloamwoodMode,
  rememberGloamwoodMode,
  rememberedGloamwoodMode,
} from '../src/gloamwood-mode-select'

/**
 * The front door. Two things have to hold: a link that names a mode reproduces
 * that mode without asking, and nothing the player has not been offered can
 * come back out of storage.
 */

describe('a link decides, and only a link', () => {
  it('answers null when nobody has named a map', () => {
    // The distinction the picker is built on. Folding this into 'valley' is why
    // the defence mode was reachable only by typing a query string.
    expect(gloamwoodMapFromSearch('')).toBeNull()
    expect(gloamwoodMapFromSearch('?lang=zh')).toBeNull()
  })

  it('reproduces the map a link names', () => {
    expect(gloamwoodMapFromSearch('?map=defence')).toBe('defence')
    expect(gloamwoodMapFromSearch('?map=valley')).toBe('valley')
    // The retired combat lab is still addressable, and still not offered.
    expect(gloamwoodMapFromSearch('?map=gloamwood')).toBe('gloamwood')
    expect(GLOAMWOOD_MODES).not.toContain('gloamwood')
  })

  it('still resolves to the valley for callers that need a map either way', () => {
    expect(gloamwoodMapFromEntry('')).toBe('valley')
    expect(gloamwoodMapFromEntry('?map=defence')).toBe('defence')
  })

  it('ignores a map nobody has heard of rather than guessing', () => {
    expect(gloamwoodMapFromSearch('?map=atlantis')).toBeNull()
  })
})

describe('the remembered choice', () => {
  const store = (value: string | null) => ({
    getItem: () => value,
    setItem: () => {},
  })

  it('comes back when it is a mode that is actually offered', () => {
    expect(rememberedGloamwoodMode(store('defence'))).toBe('defence')
    expect(rememberedGloamwoodMode(store('valley'))).toBe('valley')
  })

  it('refuses a stale key naming the retired lab', () => {
    // This is the one that matters. `gloamwood` was a real value once, it is a
    // retired combat lab now, and a browser that still holds it must not send
    // its owner somewhere the picker would never have offered.
    expect(rememberedGloamwoodMode(store('gloamwood'))).toBeNull()
    expect(normalizeGloamwoodMode('gloamwood')).toBeNull()
  })

  it('treats an empty or corrupt value as no choice', () => {
    expect(rememberedGloamwoodMode(store(null))).toBeNull()
    expect(rememberedGloamwoodMode(store(''))).toBeNull()
    expect(normalizeGloamwoodMode(7)).toBeNull()
    expect(normalizeGloamwoodMode(undefined)).toBeNull()
  })

  it('survives storage that throws instead of answering', () => {
    // Private browsing raises on access rather than returning null, and failing
    // to remember a preference is not a reason to fail to start a game.
    const hostile = {
      getItem() { throw new Error('denied') },
      setItem() { throw new Error('denied') },
    }
    expect(rememberedGloamwoodMode(hostile)).toBeNull()
    expect(() => rememberGloamwoodMode('valley', hostile)).not.toThrow()
  })
})
