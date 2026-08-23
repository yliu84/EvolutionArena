import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_RUN_RECORD_KEY,
  emptyGloamwoodRunRecord,
  gloamwoodRunEarnedSomething,
  loadGloamwoodRunRecord,
  parseGloamwoodRunRecord,
  recordGloamwoodRun,
  saveGloamwoodRunRecord,
} from '../src/gloamwood-run-record'

const run = (over: Partial<Parameters<typeof recordGloamwoodRun>[1]> = {}) => ({
  regionIndex: 0, biomass: 40, kills: 5, bossesFelled: [], familiesHunted: ['fang'], ...over,
})

function memory() {
  const store = new Map<string, string>()
  return { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), store }
}

describe('What a run leaves behind', () => {
  it('keeps nothing before the first run', () => {
    expect(emptyGloamwoodRunRecord().runs).toBe(0)
    expect(emptyGloamwoodRunRecord().deepestRegion).toBe(-1)
  })

  it('survives a round trip through storage', () => {
    const storage = memory()
    const { record } = recordGloamwoodRun(emptyGloamwoodRunRecord(), run({ regionIndex: 1, biomass: 156 }))
    saveGloamwoodRunRecord(storage, record)
    expect(loadGloamwoodRunRecord(storage)).toEqual(record)
    expect(storage.store.has(GLOAMWOOD_RUN_RECORD_KEY)).toBe(true)
  })

  it('only ever goes up, so a bad run cannot cost what a good one earned', () => {
    // The reason to keep a record rather than a score.
    const { record: first } = recordGloamwoodRun(emptyGloamwoodRunRecord(), run({ regionIndex: 2, biomass: 300, kills: 40 }))
    const { record: after } = recordGloamwoodRun(first, run({ regionIndex: 0, biomass: 3, kills: 1 }))
    expect(after.deepestRegion).toBe(2)
    expect(after.bestBiomass).toBe(300)
    expect(after.bestKills).toBe(40)
    expect(after.runs).toBe(2)
  })

  it('reports what this run beat, so the screen can say so', () => {
    const { record: first } = recordGloamwoodRun(emptyGloamwoodRunRecord(), run({ regionIndex: 0, biomass: 50 }))
    const { gains } = recordGloamwoodRun(first, run({ regionIndex: 1, biomass: 60 }))
    expect(gains.deeper).toBe(true)
    expect(gains.biomass).toBe(true)
    expect(gains.firstRun).toBe(false)
  })

  it('names a boss or a family only the first time it falls', () => {
    const { record: first } = recordGloamwoodRun(emptyGloamwoodRunRecord(), run({ bossesFelled: ['tide-cleaver'] }))
    const { gains } = recordGloamwoodRun(first, run({ bossesFelled: ['tide-cleaver', 'cliff-maw'] }))
    expect(gains.newBosses).toEqual(['cliff-maw'])
    expect(first.bossesFelled).toEqual(['tide-cleaver'])
  })

  it('counts a first run as something earned even when it achieves nothing', () => {
    // Dying in the shallows on run one still has to read as a start.
    const { gains } = recordGloamwoodRun(emptyGloamwoodRunRecord(), run({ regionIndex: -1, biomass: 0, kills: 0, familiesHunted: [] }))
    expect(gloamwoodRunEarnedSomething(gains)).toBe(true)
  })

  it('says plainly when a run beat nothing', () => {
    const { record } = recordGloamwoodRun(emptyGloamwoodRunRecord(), run({ regionIndex: 2, biomass: 300, kills: 40 }))
    const { gains } = recordGloamwoodRun(record, run({ regionIndex: 0, biomass: 1, kills: 0, familiesHunted: ['fang'] }))
    expect(gloamwoodRunEarnedSomething(gains)).toBe(false)
  })
})

describe('Reading a record that is not one', () => {
  it('treats anything unrecognised as no record rather than throwing', () => {
    // Stored progress is the one thing here that cannot be regenerated, and the
    // result screen reads it on the frame it opens.
    for (const raw of ['', 'not json', '{}', '[]', 'null', '{"version":2}', '{"version":1,"kills":"lots"}']) {
      expect(() => parseGloamwoodRunRecord(raw)).not.toThrow()
      expect(parseGloamwoodRunRecord(raw).version).toBe(1)
    }
  })

  it('drops nonsense values instead of carrying them forward', () => {
    const parsed = parseGloamwoodRunRecord(JSON.stringify({
      version: 1, runs: -4, bestBiomass: Number.NaN, deepestRegion: 'far',
      bossesFelled: ['ok', 7, ''], familiesHunted: 'fang',
    }))
    expect(parsed.runs).toBe(0)
    expect(parsed.bestBiomass).toBe(0)
    expect(parsed.deepestRegion).toBe(-1)
    expect(parsed.bossesFelled).toEqual(['ok'])
    expect(parsed.familiesHunted).toEqual([])
  })

  it('loses only the history when storage refuses to be written', () => {
    const blocked = { getItem: () => null, setItem: () => { throw new Error('private window') } }
    expect(() => saveGloamwoodRunRecord(blocked, emptyGloamwoodRunRecord())).not.toThrow()
  })
})
