import { describe, expect, it } from 'vitest'
import { createV4EnvironmentProps, isV4PropPositionSafe } from '../src/v4-environment-props'

describe('V4 environment props', () => {
  it('is deterministic for a run seed', () => {
    expect(createV4EnvironmentProps('same-seed')).toEqual(createV4EnvironmentProps('same-seed'))
    expect(createV4EnvironmentProps('same-seed')).not.toEqual(createV4EnvironmentProps('different-seed'))
  })

  it('keeps every trunk outside routes, arenas, boss space and safe spawns', () => {
    for (const seed of ['gloamwood-v4-default', 'v4-seed-a', 'v4-seed-e']) {
      const props = createV4EnvironmentProps(seed)
      expect(props.length).toBeGreaterThanOrEqual(30)
      expect(props.every((prop) => isV4PropPositionSafe(prop.x, prop.y))).toBe(true)
    }
  })

  it('caps the requested prop count', () => {
    expect(createV4EnvironmentProps('dense', 12)).toHaveLength(12)
  })
})
