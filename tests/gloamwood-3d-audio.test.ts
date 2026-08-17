import { describe, expect, it } from 'vitest'

import { getGloamwoodSoundProfile, type GloamwoodSoundEvent } from '../src/gloamwood-3d-audio'

describe('Gloamwood procedural sound profiles', () => {
  it('assigns every authoritative event a bounded audible profile', () => {
    const events: GloamwoodSoundEvent[] = [
      'footstep', 'attack-bite', 'attack-pounce', 'attack-claw', 'attack-tail', 'hit-light', 'hit-heavy',
      'kill', 'player-hit', 'evolution-open', 'evolution-select', 'boss-phase', 'victory', 'defeat',
    ]
    for (const event of events) {
      const profile = getGloamwoodSoundProfile(event)
      expect(profile.frequency).toBeGreaterThan(20)
      expect(profile.durationSeconds).toBeGreaterThan(0)
      expect(profile.durationSeconds).toBeLessThanOrEqual(0.72)
      expect(profile.gain).toBeGreaterThan(0)
      expect(profile.gain).toBeLessThan(0.08)
    }
  })

  it('keeps routine footsteps quieter and shorter than boss or result events', () => {
    const footstep = getGloamwoodSoundProfile('footstep')
    const phase = getGloamwoodSoundProfile('boss-phase')
    const victory = getGloamwoodSoundProfile('victory')
    expect(footstep.tier).toBe('small')
    expect(phase.tier).toBe('large')
    expect(footstep.gain).toBeLessThan(phase.gain)
    expect(footstep.durationSeconds).toBeLessThan(victory.durationSeconds)
  })
})
