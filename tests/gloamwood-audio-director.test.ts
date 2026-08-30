import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GLOAMWOOD_AUDIO_MIX,
  cycleGloamwoodAudioLevel,
  gloamwoodMusicLayerMix,
  gloamwoodWeatherLayerMix,
  normalizeGloamwoodAudioMix,
  planGloamwoodMusicTransition,
  resolveGloamwoodMusicState,
} from '../src/gloamwood-audio-director'

describe('Gloamwood mature audio director', () => {
  it('normalizes four independent saved buses without accepting invalid values', () => {
    expect(normalizeGloamwoodAudioMix(null)).toEqual(DEFAULT_GLOAMWOOD_AUDIO_MIX)
    expect(normalizeGloamwoodAudioMix({ master: 1.4, music: 0.2, sfx: -1, ambience: Number.NaN, muted: true })).toEqual({
      master: 1,
      music: 0.2,
      sfx: 0,
      ambience: DEFAULT_GLOAMWOOD_AUDIO_MIX.ambience,
      muted: true,
    })
    expect(cycleGloamwoodAudioLevel(0)).toBe(0.25)
    expect(cycleGloamwoodAudioLevel(0.75)).toBe(1)
    expect(cycleGloamwoodAudioLevel(1)).toBe(0)
    expect(cycleGloamwoodAudioLevel(0.6)).toBe(0.75)
    expect(cycleGloamwoodAudioLevel(0.72)).toBe(0.75)
    expect(cycleGloamwoodAudioLevel(0.86)).toBe(1)
  })

  it('resolves terminal and Boss states ahead of ordinary combat pressure', () => {
    const base = { terminal: null, bossIntro: false, bossActive: false, bossPhase: 1 as const, eliteActive: false, committedThreats: 0 }
    expect(resolveGloamwoodMusicState(base)).toBe('explore')
    expect(resolveGloamwoodMusicState({ ...base, committedThreats: 2 })).toBe('threat')
    expect(resolveGloamwoodMusicState({ ...base, committedThreats: 2, eliteActive: true })).toBe('elite')
    expect(resolveGloamwoodMusicState({ ...base, committedThreats: 2, eliteActive: true, bossActive: true })).toBe('boss-phase-1')
    expect(resolveGloamwoodMusicState({ ...base, bossActive: true, bossPhase: 2 })).toBe('boss-phase-2')
    expect(resolveGloamwoodMusicState({ ...base, terminal: 'defeat' })).toBe('defeat')
  })

  it('keeps repeated state reports idempotent and gives Boss boundaries a deliberate transition', () => {
    expect(planGloamwoodMusicTransition('threat', 'threat', 'same facts')).toBeNull()
    expect(planGloamwoodMusicTransition('explore', 'boss-intro', 'source-root woke')).toMatchObject({
      from: 'explore', to: 'boss-intro', restart: true, fadeSeconds: 0.9,
    })
    expect(planGloamwoodMusicTransition('boss-phase-1', 'boss-phase-2', 'enraged')).toMatchObject({ restart: false })
  })

  it('adds density rather than only volume as danger rises', () => {
    expect(gloamwoodMusicLayerMix('explore')).toEqual({ world: 0.72, pulse: 0, boss: 0 })
    expect(gloamwoodMusicLayerMix('threat').pulse).toBeGreaterThan(0)
    expect(gloamwoodMusicLayerMix('boss-phase-2').pulse).toBeGreaterThan(gloamwoodMusicLayerMix('boss-phase-1').pulse)
    expect(gloamwoodMusicLayerMix('victory')).toEqual({ world: 0, pulse: 0, boss: 0 })
  })

  it('keeps weather independent from score intensity', () => {
    expect(gloamwoodWeatherLayerMix('rain').rain).toBeGreaterThan(gloamwoodWeatherLayerMix('mist').rain)
    expect(gloamwoodWeatherLayerMix('dawn').forest).toBeGreaterThan(gloamwoodWeatherLayerMix('mist').forest)
    expect(gloamwoodWeatherLayerMix('defence')).toEqual({ forest: 0.22, rain: 0, defence: 0.68 })
    expect(gloamwoodWeatherLayerMix('rain').defence).toBe(0)
  })
})
