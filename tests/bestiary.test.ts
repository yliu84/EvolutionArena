import { describe, expect, it } from 'vitest'
import {
  BESTIARY_STORAGE_KEY,
  emptyBestiary,
  loadBestiary,
  parseBestiary,
  recordMonsterKill,
  saveBestiary,
  unlockedMonsterTypes,
} from '../src/bestiary'

describe('bestiary persistence', () => {
  it('records cumulative kills and unlocks each species once', () => {
    const first = recordMonsterKill(emptyBestiary(), 'mantis')
    const second = recordMonsterKill(first, 'mantis')
    const third = recordMonsterKill(second, 'spider')
    expect(third.kills).toEqual({ mantis: 2, spider: 1 })
    expect(unlockedMonsterTypes(third)).toEqual(['mantis', 'spider'])
  })

  it('filters corrupt, unknown, negative, and fractional stored values', () => {
    expect(parseBestiary('{broken')).toEqual(emptyBestiary())
    expect(parseBestiary(JSON.stringify({
      version: 1,
      kills: { mantis: 2.8, unknown: 9, spider: -2, wasp: '4' },
    }))).toEqual({ version: 1, kills: { mantis: 2 } })
  })

  it('loads and saves through a minimal storage adapter', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    }
    const state = recordMonsterKill(emptyBestiary(), 'fireant')
    saveBestiary(storage, state)
    expect(values.has(BESTIARY_STORAGE_KEY)).toBe(true)
    expect(loadBestiary(storage)).toEqual(state)
  })
})
