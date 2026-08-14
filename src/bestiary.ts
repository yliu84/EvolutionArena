import { MONSTER_TYPES, type MonsterType } from './monsters'

export const BESTIARY_STORAGE_KEY = 'evolution-arena-lite:bestiary:v1'

export interface BestiaryState {
  version: 1
  kills: Partial<Record<MonsterType, number>>
}

export interface BestiaryStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function emptyBestiary(): BestiaryState {
  return { version: 1, kills: {} }
}

export function parseBestiary(raw: string | null): BestiaryState {
  if (!raw) return emptyBestiary()
  try {
    const parsed = JSON.parse(raw) as { version?: unknown; kills?: unknown }
    if (parsed.version !== 1 || typeof parsed.kills !== 'object' || parsed.kills === null) return emptyBestiary()
    const kills: Partial<Record<MonsterType, number>> = {}
    for (const type of MONSTER_TYPES) {
      const count = (parsed.kills as Record<string, unknown>)[type]
      if (typeof count === 'number' && Number.isFinite(count) && count > 0) kills[type] = Math.floor(count)
    }
    return { version: 1, kills }
  } catch {
    return emptyBestiary()
  }
}

export function loadBestiary(storage: BestiaryStorage): BestiaryState {
  try {
    return parseBestiary(storage.getItem(BESTIARY_STORAGE_KEY))
  } catch {
    return emptyBestiary()
  }
}

export function saveBestiary(storage: BestiaryStorage, state: BestiaryState) {
  try {
    storage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be disabled or full; the current run still keeps its in-memory record.
  }
}

export function recordMonsterKill(state: BestiaryState, type: MonsterType): BestiaryState {
  return {
    version: 1,
    kills: { ...state.kills, [type]: (state.kills[type] ?? 0) + 1 },
  }
}

export function unlockedMonsterTypes(state: BestiaryState): MonsterType[] {
  return MONSTER_TYPES.filter((type) => (state.kills[type] ?? 0) > 0)
}
