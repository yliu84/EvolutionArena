import { describe, expect, it } from 'vitest'

import {
  defineGloamwoodTunable,
  gloamwoodTunableGroups,
  gloamwoodTuningReport,
  gloamwoodTuningRequested,
  onGloamwoodTunablesChanged,
  resetGloamwoodTunables,
  setGloamwoodTunable,
} from '../src/gloamwood-tuning'

/**
 * The registry is shared module state, so these tests define their own entries
 * under a prefix nothing else uses rather than leaning on the real ones.
 */
const spec = (id: string, value: number, min = 0, max = 1, step = 0.01) =>
  defineGloamwoodTunable({ id: `test.${id}`, group: 'Test', label: id, value, min, max, step })

describe('a tunable holds a live value', () => {
  const entry = spec('basic', 0.5)

  it('starts at its declared value and remembers it', () => {
    expect(entry.value).toBe(0.5)
    expect(entry.initial).toBe(0.5)
  })

  it('clamps to the declared range rather than trusting the slider', () => {
    expect(setGloamwoodTunable('test.basic', 99)).toBe(1)
    expect(setGloamwoodTunable('test.basic', -99)).toBe(0)
  })

  it('snaps to the step and rounds off float noise', () => {
    // A step of 0.01 otherwise yields values like 0.15000000000000002, which is
    // not something anyone wants to paste back into a source file.
    setGloamwoodTunable('test.basic', 0.153)
    expect(entry.value).toBe(0.15)
    expect(String(entry.value)).toBe('0.15')
  })

  it('ignores a value that is not a number', () => {
    setGloamwoodTunable('test.basic', 0.4)
    setGloamwoodTunable('test.basic', Number.NaN)
    expect(entry.value).toBe(0.4)
  })

  it('answers null for an id it does not know', () => {
    expect(setGloamwoodTunable('test.nothing-here', 1)).toBeNull()
  })
})

describe('the report is the point of the whole thing', () => {
  const moved = spec('moved', 0.2)
  const still = spec('still', 0.8)

  it('lists only what changed, with the id of the constant to edit', () => {
    setGloamwoodTunable('test.moved', 0.35)
    const report = gloamwoodTuningReport([moved, still])
    expect(report).toContain('test.moved')
    expect(report).toContain('0.2')
    expect(report).toContain('0.35')
    // A report that also lists the thirty numbers nobody touched is a report
    // nobody reads to the end.
    expect(report).not.toContain('test.still')
  })

  it('says nothing when nothing moved', () => {
    expect(gloamwoodTuningReport([still])).toBe('')
  })

  it('puts everything back on reset', () => {
    resetGloamwoodTunables()
    expect(moved.value).toBe(0.2)
    expect(gloamwoodTuningReport([moved, still])).toBe('')
  })
})

describe('registration', () => {
  it('refuses a duplicate id, which would make the report ambiguous', () => {
    spec('unique', 1)
    expect(() => spec('unique', 1)).toThrow(/Duplicate/)
  })

  it('tells the panel when a late effect brings its own numbers', () => {
    // The boss FX scene is dynamically imported the first time a boss winds up,
    // so its values are not in the registry when the panel mounts. A panel
    // built once at startup would be missing the group most in need of a
    // slider - the one whose brightness came back wrong twice.
    let told = 0
    const stop = onGloamwoodTunablesChanged(() => { told += 1 })
    spec('late-arrival', 0.5)
    expect(told).toBe(1)
    stop()
    spec('later-still', 0.5)
    expect(told).toBe(1)
  })

  it('groups entries for the panel', () => {
    expect(gloamwoodTunableGroups().get('Test')?.length).toBeGreaterThan(0)
  })

  it('is only reachable when asked for', () => {
    expect(gloamwoodTuningRequested('?tune=1')).toBe(true)
    expect(gloamwoodTuningRequested('')).toBe(false)
    expect(gloamwoodTuningRequested('?tune=0')).toBe(false)
  })
})
