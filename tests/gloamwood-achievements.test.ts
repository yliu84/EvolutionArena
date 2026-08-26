import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_ACHIEVEMENTS,
  applyGloamwoodRun,
  gloamwoodAchievementsUnlocked,
  isGloamwoodAchievementUnlocked,
  normalizeGloamwoodAchievementProgress,
  type GloamwoodRunSummary,
} from '../src/gloamwood-achievements'
import { TRANSLATIONS } from '../src/i18n'

const RUN: GloamwoodRunSummary = {
  map: 'valley',
  victory: false,
  seconds: 300,
  kills: 10,
  biomass: 40,
  mutations: 1,
  evolutions: 1,
  livesLost: 1,
  wave: 0,
  altarRemaining: 0,
  altarMax: 0,
}
const run = (patch: Partial<GloamwoodRunSummary>): GloamwoodRunSummary => ({ ...RUN, ...patch })

describe('every entry is complete and reachable', () => {
  it('has a unique id, a positive target and copy in both locales', () => {
    const ids = GLOAMWOOD_ACHIEVEMENTS.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const entry of GLOAMWOOD_ACHIEVEMENTS) {
      expect(entry.target, entry.id).toBeGreaterThan(0)
      for (const suffix of ['name', 'detail']) {
        const copy = TRANSLATIONS[`achievement.${entry.id}.${suffix}` as keyof typeof TRANSLATIONS]
        expect(copy, `${entry.id}.${suffix}`).toBeDefined()
        expect(copy.en.trim(), `${entry.id}.${suffix}`).not.toBe('')
        expect(copy.zh.trim(), `${entry.id}.${suffix}`).not.toBe('')
      }
    }
  })
})

describe('a run folds into progress', () => {
  it('unlocks clearing the valley, and says so once', () => {
    const first = applyGloamwoodRun(run({ victory: true }), {})
    expect(first.earned).toContain('valley-cleared')
    // Doing it again is not news.
    const second = applyGloamwoodRun(run({ victory: true }), first.progress)
    expect(second.earned).not.toContain('valley-cleared')
    expect(isGloamwoodAchievementUnlocked('valley-cleared', second.progress)).toBe(true)
  })

  it('keeps the best single run rather than the last one', () => {
    // Reaching wave nine and then dying on wave two must not take wave nine
    // away - the achievement is a thing you did, not a thing you are doing.
    const deep = applyGloamwoodRun(run({ map: 'defence', wave: 9 }), {})
    const shallow = applyGloamwoodRun(run({ map: 'defence', wave: 2 }), deep.progress)
    expect(shallow.progress['altar-wave-six']).toBe(9)
  })

  it('adds up the cumulative one across runs', () => {
    let progress = {}
    for (let index = 0; index < 4; index += 1) {
      progress = applyGloamwoodRun(run({ kills: 30 }), progress).progress
    }
    expect(progress).toMatchObject({ 'hundred-kills': 120 })
    expect(isGloamwoodAchievementUnlocked('hundred-kills', progress)).toBe(true)
  })

  it("will not award one mode's achievement to the other mode", () => {
    // Winning the valley is not holding the altar, however good the run was.
    const valley = applyGloamwoodRun(run({ victory: true, wave: 12, altarRemaining: 600, altarMax: 600 }), {})
    expect(valley.earned).not.toContain('altar-held')
    expect(valley.earned).not.toContain('altar-untouched')
    expect(valley.progress['altar-wave-six'] ?? 0).toBe(0)
  })

  it('only counts a spotless altar when it really is spotless', () => {
    const grazed = applyGloamwoodRun(
      run({ map: 'defence', victory: true, altarRemaining: 599, altarMax: 600 }), {})
    expect(grazed.earned).toContain('altar-held')
    expect(grazed.earned).not.toContain('altar-untouched')
    const spotless = applyGloamwoodRun(
      run({ map: 'defence', victory: true, altarRemaining: 600, altarMax: 600 }), {})
    expect(spotless.earned).toContain('altar-untouched')
  })

  it("sees this run's own unlocks when deciding the derived one", () => {
    // The second pass exists for exactly this: a player who clears the valley
    // having already held the altar must be told about both in the same breath,
    // not on some later run.
    const held = applyGloamwoodRun(run({ map: 'defence', victory: true, wave: 12 }), {})
    expect(isGloamwoodAchievementUnlocked('both-ways', held.progress)).toBe(false)
    const both = applyGloamwoodRun(run({ victory: true }), held.progress)
    expect(both.earned).toContain('valley-cleared')
    expect(both.earned).toContain('both-ways')
  })
})

describe('stored progress outlives the build that wrote it', () => {
  it('drops ids this build no longer defines', () => {
    const cleaned = normalizeGloamwoodAchievementProgress({ 'valley-cleared': 1, 'retired-thing': 40 })
    expect(cleaned).toEqual({ 'valley-cleared': 1 })
  })

  it('refuses values that are not usable numbers', () => {
    expect(normalizeGloamwoodAchievementProgress({ 'hundred-kills': 'lots' })).toEqual({})
    expect(normalizeGloamwoodAchievementProgress({ 'hundred-kills': -5 })).toEqual({})
    expect(normalizeGloamwoodAchievementProgress({ 'hundred-kills': Number.NaN })).toEqual({})
    expect(normalizeGloamwoodAchievementProgress(null)).toEqual({})
    expect(normalizeGloamwoodAchievementProgress('nope')).toEqual({})
  })

  it('reports what is unlocked without being confused by a partial score', () => {
    const progress = { 'hundred-kills': 99, 'valley-cleared': 1 }
    expect(gloamwoodAchievementsUnlocked(progress).map((entry) => entry.id)).toEqual(['valley-cleared'])
  })
})
