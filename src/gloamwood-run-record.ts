/**
 * What a run leaves behind after it ends.
 *
 * Checked against the deployed build, `localStorage` held nothing at all: a
 * player who died had no reason to open the page again, which is the first
 * thing a public listing needs and the last thing this build had.
 *
 * It records rather than rewards. Permanent power would make every later run
 * easier for reasons unrelated to how it was played, and this project has found
 * every one of its balance defects by playing and reading the result - a boss
 * that could not be beaten, a road that refilled, a blow that did five damage.
 * Handing out a stacking bonus would have hidden all three under "the numbers
 * feel better now".
 *
 * So: what you got further than, what you have ever felled, how many times you
 * have come back. Nothing here touches a live run.
 */

export const GLOAMWOOD_RUN_RECORD_KEY = 'evolution-arena-lite:run-record:v1'

export interface GloamwoodRunRecordStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface GloamwoodRunRecord {
  version: 1
  runs: number
  /** How far up the road any run has ever got, as a region index. */
  deepestRegion: number
  bestBiomass: number
  bestKills: number
  /** Bosses ever felled, and creature families ever killed. Sets, kept sorted. */
  bossesFelled: string[]
  familiesHunted: string[]
}

/** One finished run, as the result screen already knows it. */
export interface GloamwoodRunSummary {
  regionIndex: number
  biomass: number
  kills: number
  bossesFelled: readonly string[]
  familiesHunted: readonly string[]
}

/** What this run beat. Empty when it beat nothing, which is most runs. */
export interface GloamwoodRunGains {
  firstRun: boolean
  deeper: boolean
  biomass: boolean
  kills: boolean
  /** Bosses and families seen for the very first time, in this run. */
  newBosses: string[]
  newFamilies: string[]
}

export function emptyGloamwoodRunRecord(): GloamwoodRunRecord {
  return { version: 1, runs: 0, deepestRegion: -1, bestBiomass: 0, bestKills: 0, bossesFelled: [], familiesHunted: [] }
}

const asCount = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0

const asNames = (value: unknown) =>
  Array.isArray(value)
    ? [...new Set(value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))].sort()
    : []

/**
 * Reads a record, and treats anything it does not recognise as no record.
 *
 * A player's stored progress is the one thing here that cannot be regenerated,
 * so a malformed or half-written value must degrade to an empty record rather
 * than throw on the frame the result screen opens.
 */
export function parseGloamwoodRunRecord(raw: string | null): GloamwoodRunRecord {
  if (!raw) return emptyGloamwoodRunRecord()
  try {
    const parsed = JSON.parse(raw) as Partial<GloamwoodRunRecord> & { version?: unknown }
    if (parsed.version !== 1) return emptyGloamwoodRunRecord()
    return {
      version: 1,
      runs: asCount(parsed.runs),
      deepestRegion: typeof parsed.deepestRegion === 'number' && Number.isFinite(parsed.deepestRegion)
        ? Math.max(-1, Math.floor(parsed.deepestRegion))
        : -1,
      bestBiomass: asCount(parsed.bestBiomass),
      bestKills: asCount(parsed.bestKills),
      bossesFelled: asNames(parsed.bossesFelled),
      familiesHunted: asNames(parsed.familiesHunted),
    }
  } catch {
    return emptyGloamwoodRunRecord()
  }
}

export function loadGloamwoodRunRecord(storage: GloamwoodRunRecordStorage): GloamwoodRunRecord {
  try {
    return parseGloamwoodRunRecord(storage.getItem(GLOAMWOOD_RUN_RECORD_KEY))
  } catch {
    return emptyGloamwoodRunRecord()
  }
}

export function saveGloamwoodRunRecord(storage: GloamwoodRunRecordStorage, record: GloamwoodRunRecord) {
  try {
    storage.setItem(GLOAMWOOD_RUN_RECORD_KEY, JSON.stringify(record))
  } catch {
    // Storage can be disabled, full, or blocked in a private window. The run
    // that just ended still shows its own result; only the history is lost.
  }
}

/**
 * Folds a finished run into the record, and says what it beat.
 *
 * Every field only ever goes up. A bad run cannot cost the player something an
 * earlier run earned - which is the whole reason to keep a record rather than a
 * score.
 */
export function recordGloamwoodRun(
  record: GloamwoodRunRecord,
  summary: GloamwoodRunSummary,
): { record: GloamwoodRunRecord; gains: GloamwoodRunGains } {
  const newBosses = summary.bossesFelled.filter((id) => !record.bossesFelled.includes(id))
  const newFamilies = summary.familiesHunted.filter((id) => !record.familiesHunted.includes(id))
  return {
    record: {
      version: 1,
      runs: record.runs + 1,
      deepestRegion: Math.max(record.deepestRegion, summary.regionIndex),
      bestBiomass: Math.max(record.bestBiomass, Math.max(0, Math.floor(summary.biomass))),
      bestKills: Math.max(record.bestKills, Math.max(0, Math.floor(summary.kills))),
      bossesFelled: [...new Set([...record.bossesFelled, ...summary.bossesFelled])].sort(),
      familiesHunted: [...new Set([...record.familiesHunted, ...summary.familiesHunted])].sort(),
    },
    gains: {
      firstRun: record.runs === 0,
      deeper: summary.regionIndex > record.deepestRegion,
      biomass: summary.biomass > record.bestBiomass,
      kills: summary.kills > record.bestKills,
      newBosses,
      newFamilies,
    },
  }
}

/** True when this run gave the player something they did not have before. */
export function gloamwoodRunEarnedSomething(gains: GloamwoodRunGains) {
  return gains.firstRun || gains.deeper || gains.biomass || gains.kills
    || gains.newBosses.length > 0 || gains.newFamilies.length > 0
}
