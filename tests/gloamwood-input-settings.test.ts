import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GLOAMWOOD_INPUT_BINDINGS,
  formatGloamwoodInputCode,
  gloamwoodMovementBindingLabel,
  normalizeGloamwoodInputBindings,
  rebindGloamwoodInput,
} from '../src/gloamwood-input-settings'

describe('Gloamwood input bindings', () => {
  it('repairs malformed or duplicate stored bindings', () => {
    expect(normalizeGloamwoodInputBindings(null)).toEqual(DEFAULT_GLOAMWOOD_INPUT_BINDINGS)
    const repaired = normalizeGloamwoodInputBindings({ ...DEFAULT_GLOAMWOOD_INPUT_BINDINGS, moveUp: 'KeyQ', moveDown: 'KeyQ', attack: 'not-a-code' })
    expect(repaired.moveUp).toBe('KeyQ')
    expect(repaired.moveDown).toBe('KeyS')
    expect(repaired.attack).toBe('Space')
  })

  it('swaps conflicts instead of assigning one key to two actions', () => {
    const rebound = rebindGloamwoodInput(DEFAULT_GLOAMWOOD_INPUT_BINDINGS, 'attack', 'KeyW')
    expect(rebound.attack).toBe('KeyW')
    expect(rebound.moveUp).toBe('Space')
    expect(new Set(Object.values(rebound)).size).toBe(7)
  })

  it('formats keyboard codes for compact HUD and onboarding copy', () => {
    expect(formatGloamwoodInputCode('KeyW')).toBe('W')
    // Key caps stay language-neutral glyphs rather than translated prose.
    expect(formatGloamwoodInputCode('ArrowLeft')).toBe('←')
    expect(gloamwoodMovementBindingLabel(DEFAULT_GLOAMWOOD_INPUT_BINDINGS)).toBe('W/A/S/D')
  })
})
