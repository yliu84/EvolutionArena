import { describe, expect, it } from 'vitest'
import { ENCOUNTERS, getBiomeAt } from '../src/world'
import {
  EVENT_OUTCOMES,
  REWARD_SITES,
  WORLD_EVENTS,
  canChallengeBoss,
  isLairUnlocked,
  rewardSiteForGuard,
  selectEventOutcome,
  type SigilId,
} from '../src/rewards'

describe('exploration rewards', () => {
  it('places one guarded sigil cache in every biome', () => {
    expect(REWARD_SITES).toHaveLength(3)
    expect(new Set(REWARD_SITES.map((site) => site.biome)).size).toBe(3)
    expect(new Set(REWARD_SITES.map((site) => site.sigil)).size).toBe(3)
    for (const site of REWARD_SITES) {
      const guard = ENCOUNTERS.find((encounter) => encounter.id === site.guardEncounterId)
      expect(guard?.biome).toBe(site.biome)
      expect(getBiomeAt(site.x, site.y).id).toBe(site.biome)
      expect(rewardSiteForGuard(site.guardEncounterId)?.id).toBe(site.id)
    }
  })

  it('places one discoverable random event in every biome', () => {
    expect(WORLD_EVENTS).toHaveLength(3)
    expect(new Set(WORLD_EVENTS.map((event) => event.biome)).size).toBe(3)
    for (const event of WORLD_EVENTS) expect(getBiomeAt(event.x, event.y).id).toBe(event.biome)
  })

  it('selects deterministic event outcomes at probability boundaries', () => {
    expect(selectEventOutcome(() => 0).id).toBe(EVENT_OUTCOMES[0].id)
    expect(selectEventOutcome(() => 0.5).id).toBe(EVENT_OUTCOMES[1].id)
    expect(selectEventOutcome(() => 0.999).id).toBe(EVENT_OUTCOMES[2].id)
  })

  it('unlocks the lair only after all three sigils are collected', () => {
    const sigils = new Set<SigilId>(REWARD_SITES.slice(0, 2).map((site) => site.sigil))
    expect(isLairUnlocked(sigils)).toBe(false)
    sigils.add(REWARD_SITES[2].sigil)
    expect(isLairUnlocked(sigils)).toBe(true)
  })

  it('opens the boss challenge after six evolutions and every sigil', () => {
    const sigils = new Set<SigilId>(REWARD_SITES.map((site) => site.sigil))
    expect(canChallengeBoss(sigils, 5)).toBe(false)
    expect(canChallengeBoss(new Set<SigilId>(), 6)).toBe(false)
    expect(canChallengeBoss(sigils, 6)).toBe(true)
  })
})
