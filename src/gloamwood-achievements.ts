import type { GloamwoodMapId } from './entry-routing'

/**
 * Achievements, earned from what a run already knows about itself.
 *
 * Nothing here instruments the game. Every measure below reads a fact the run
 * had to compute anyway to print its own result screen - kills, waves, what was
 * left of the altar, how many lives it cost - so this layer cannot drift away
 * from what actually happened and cannot slow a frame down.
 *
 * They are also the game's first memory. Nothing except the chosen mode has
 * ever survived a run until now, so this is where "you have played this before"
 * starts being a thing the game can know.
 */

export type GloamwoodAchievementMode = 'valley' | 'defence' | 'any'

/** What a finished run leaves behind for the achievement layer to read. */
export interface GloamwoodRunSummary {
  map: GloamwoodMapId
  victory: boolean
  seconds: number
  kills: number
  biomass: number
  /** How many mutations were held at the end, not how many were offered. */
  mutations: number
  evolutions: number
  livesLost: number
  /** Defence only; zero elsewhere. */
  wave: number
  altarRemaining: number
  altarMax: number
}

export interface GloamwoodAchievement {
  id: string
  mode: GloamwoodAchievementMode
  /** Reaching this value unlocks it. Progress below it is worth showing. */
  target: number
  /**
   * `best` keeps the highest single run, `sum` adds every run together.
   *
   * The distinction is the difference between "get to wave six" - which one
   * good run earns and a bad one cannot take away - and "kill a hundred
   * things", which is meant to add up over an evening.
   */
  accumulate: 'best' | 'sum'
  /**
   * Derived entries are measured from other achievements rather than from the
   * run, so they are evaluated in a second pass. Flagged rather than ordered:
   * a list whose correctness depends on its own order is a trap for whoever
   * adds the tenth entry.
   */
  derived?: boolean
  measure(summary: GloamwoodRunSummary, progress: GloamwoodAchievementProgress): number
}

export type GloamwoodAchievementProgress = Record<string, number>

const clearedValley = (summary: GloamwoodRunSummary) =>
  summary.map === 'valley' && summary.victory
const heldAltar = (summary: GloamwoodRunSummary) =>
  summary.map === 'defence' && summary.victory

export const GLOAMWOOD_ACHIEVEMENTS: readonly GloamwoodAchievement[] = [
  {
    id: 'valley-cleared',
    mode: 'valley',
    target: 1,
    accumulate: 'best',
    measure: (summary) => (clearedValley(summary) ? 1 : 0),
  },
  {
    id: 'valley-unspent',
    mode: 'valley',
    target: 1,
    accumulate: 'best',
    measure: (summary) => (clearedValley(summary) && summary.livesLost === 0 ? 1 : 0),
  },
  {
    // Deliberately not "take five offers": a run can be handed more than it
    // keeps, and what is being asked for is a build, not a shopping list.
    id: 'many-mutations',
    mode: 'any',
    target: 5,
    accumulate: 'best',
    measure: (summary) => summary.mutations,
  },
  {
    id: 'altar-wave-six',
    mode: 'defence',
    target: 6,
    accumulate: 'best',
    measure: (summary) => (summary.map === 'defence' ? summary.wave : 0),
  },
  {
    id: 'altar-held',
    mode: 'defence',
    target: 1,
    accumulate: 'best',
    measure: (summary) => (heldAltar(summary) ? 1 : 0),
  },
  {
    id: 'altar-untouched',
    mode: 'defence',
    target: 1,
    accumulate: 'best',
    measure: (summary) =>
      heldAltar(summary) && summary.altarMax > 0 && summary.altarRemaining >= summary.altarMax ? 1 : 0,
  },
  {
    id: 'altar-unspent',
    mode: 'defence',
    target: 1,
    accumulate: 'best',
    measure: (summary) => (heldAltar(summary) && summary.livesLost === 0 ? 1 : 0),
  },
  {
    id: 'hundred-kills',
    mode: 'any',
    target: 100,
    accumulate: 'sum',
    measure: (summary) => summary.kills,
  },
  {
    id: 'both-ways',
    mode: 'any',
    target: 2,
    accumulate: 'best',
    derived: true,
    measure: (_summary, progress) =>
      (isGloamwoodAchievementUnlocked('valley-cleared', progress) ? 1 : 0)
      + (isGloamwoodAchievementUnlocked('altar-held', progress) ? 1 : 0),
  },
]

const BY_ID = new Map(GLOAMWOOD_ACHIEVEMENTS.map((entry) => [entry.id, entry]))

export function isGloamwoodAchievementUnlocked(id: string, progress: GloamwoodAchievementProgress) {
  const entry = BY_ID.get(id)
  return entry ? (progress[id] ?? 0) >= entry.target : false
}

export function gloamwoodAchievementsUnlocked(progress: GloamwoodAchievementProgress) {
  return GLOAMWOOD_ACHIEVEMENTS.filter((entry) => isGloamwoodAchievementUnlocked(entry.id, progress))
}

/**
 * Drops anything not currently defined, and anything that is not a number.
 *
 * Stored progress outlives the build that wrote it. An id that has since been
 * renamed or retired must not sit in the file forever quietly counting toward
 * nothing, and a corrupt value must not be able to unlock something.
 */
export function normalizeGloamwoodAchievementProgress(value: unknown): GloamwoodAchievementProgress {
  if (!value || typeof value !== 'object') return {}
  const progress: GloamwoodAchievementProgress = {}
  for (const [id, amount] of Object.entries(value as Record<string, unknown>)) {
    if (!BY_ID.has(id)) continue
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) continue
    progress[id] = amount
  }
  return progress
}

export interface GloamwoodAchievementOutcome {
  progress: GloamwoodAchievementProgress
  /** Ids unlocked by this run specifically, in definition order. */
  earned: string[]
}

/**
 * Folds one finished run into the stored progress.
 *
 * Pure, and returns a new object rather than mutating: the caller shows what
 * was earned and persists the result, and neither of those should be able to
 * happen halfway.
 */
export function applyGloamwoodRun(
  summary: GloamwoodRunSummary,
  stored: GloamwoodAchievementProgress,
): GloamwoodAchievementOutcome {
  const before = normalizeGloamwoodAchievementProgress(stored)
  const progress: GloamwoodAchievementProgress = { ...before }
  const fold = (entry: GloamwoodAchievement) => {
    const measured = entry.measure(summary, progress)
    if (!Number.isFinite(measured) || measured <= 0) return
    const held = progress[entry.id] ?? 0
    progress[entry.id] = entry.accumulate === 'sum'
      ? held + measured
      : Math.max(held, measured)
  }
  for (const entry of GLOAMWOOD_ACHIEVEMENTS) if (!entry.derived) fold(entry)
  // Second pass, so a derived entry sees this run's own unlocks rather than the
  // ones the player arrived with.
  for (const entry of GLOAMWOOD_ACHIEVEMENTS) if (entry.derived) fold(entry)

  const earned = GLOAMWOOD_ACHIEVEMENTS
    .filter((entry) =>
      isGloamwoodAchievementUnlocked(entry.id, progress)
      && !isGloamwoodAchievementUnlocked(entry.id, before))
    .map((entry) => entry.id)
  return { progress, earned }
}

export const GLOAMWOOD_ACHIEVEMENT_STORAGE_KEY = 'evolution-arena-achievements-v1'

/**
 * Storage is separated from the rules above so the rules stay testable without
 * a browser, and so a hostile or full storage can never stop a run finishing.
 */
export function readGloamwoodAchievements(
  storage: Pick<Storage, 'getItem'> = localStorage,
): GloamwoodAchievementProgress {
  try {
    return normalizeGloamwoodAchievementProgress(JSON.parse(storage.getItem(GLOAMWOOD_ACHIEVEMENT_STORAGE_KEY) ?? 'null'))
  } catch {
    // Private browsing throws on access, and a half-written value throws here.
    // Either way the player starts from nothing rather than from a crash.
    return {}
  }
}

export function writeGloamwoodAchievements(
  progress: GloamwoodAchievementProgress,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  try {
    storage.setItem(GLOAMWOOD_ACHIEVEMENT_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Losing the record is a disappointment, not a reason to break the result
    // screen the player is currently reading.
  }
}
