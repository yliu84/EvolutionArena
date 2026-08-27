import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_ACHIEVEMENTS } from '../src/gloamwood-achievements'
import {
  GLOAMWOOD_Y8_ACHIEVEMENT_KEYS,
  GLOAMWOOD_Y8_KEY_PATTERN,
  gloamwoodY8AchievementKey,
} from '../src/y8-achievement-keys'

describe('Y8 unlock keys', () => {
  // This table joins two systems that share no identifier. Y8 generates an
  // opaque twenty-character key per achievement; the game has its own ids; and
  // a key that matches nothing awards nothing, silently, with no way to tell
  // from inside the game. Everything asserted here is about making a mistake
  // in it visible.

  const ids = new Set(GLOAMWOOD_ACHIEVEMENTS.map((entry) => entry.id))

  it('maps only achievements the game can actually earn', () => {
    // A stale entry - an achievement renamed or dropped locally - would sit
    // here looking correct and never fire again.
    for (const id of Object.keys(GLOAMWOOD_Y8_ACHIEVEMENT_KEYS)) {
      expect(ids.has(id), `${id} is not a known achievement`).toBe(true)
    }
  })

  it('holds keys in the shape Y8 issues, not hand-written ones', () => {
    // Twenty lowercase hex characters. A truncated paste or an accidental
    // space is otherwise indistinguishable from a working key.
    for (const [id, key] of Object.entries(GLOAMWOOD_Y8_ACHIEVEMENT_KEYS)) {
      expect(GLOAMWOOD_Y8_KEY_PATTERN.test(key), `${id} -> ${key}`).toBe(true)
    }
  })

  it('never reuses one key for two achievements', () => {
    const keys = Object.values(GLOAMWOOD_Y8_ACHIEVEMENT_KEYS)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('returns null for an achievement Y8 does not know yet', () => {
    // A half-filled table has to degrade rather than break: the local unlock
    // still happens, and only the portal mirror is skipped.
    expect(gloamwoodY8AchievementKey('not-created-on-y8-yet')).toBeNull()
  })

  it('resolves the keys it does hold', () => {
    expect(gloamwoodY8AchievementKey('valley-cleared')).toBe('331d330138e23495e99a')
  })
})
