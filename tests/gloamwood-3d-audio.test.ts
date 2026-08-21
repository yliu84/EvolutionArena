import { describe, expect, it } from 'vitest'

import {
  RIVER_VALLEY_AMBIENT,
  MAX_GLOAMWOOD_EXTERNAL_SOURCES,
  canScheduleGloamwoodAudio,
  getGloamwoodExternalAudioAssets,
  getGloamwoodSoundLayers,
  getGloamwoodSoundProfile,
  isGloamwoodEncounterSignal,
  type GloamwoodSoundEvent,
} from '../src/gloamwood-3d-audio'

describe('Gloamwood procedural sound profiles', () => {
  it('assigns every authoritative event a bounded audible profile', () => {
    const events: GloamwoodSoundEvent[] = [
      'footstep', 'land', 'attack-bite', 'attack-pounce', 'attack-claw', 'attack-tail', 'hit-light', 'hit-heavy',
      'kill', 'enemy-hit-player', 'player-death', 'evolution-open', 'evolution-select', 'elite-intro', 'boss-intro',
      'boss-phase', 'victory', 'defeat',
    ]
    for (const event of events) {
      const profile = getGloamwoodSoundProfile(event)
      expect(profile.frequency).toBeGreaterThan(20)
      expect(profile.durationSeconds).toBeGreaterThan(0)
      expect(profile.durationSeconds).toBeLessThanOrEqual(0.74)
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

  it('keeps a whiff to anticipation and swing while confirmed contact adds impact', () => {
    expect(getGloamwoodSoundLayers('attack-claw')).toEqual(['anticipation', 'swing'])
    expect(getGloamwoodSoundLayers('hit-heavy')).toEqual(['impact', 'body'])
    expect(getGloamwoodSoundLayers('kill')).toEqual(['impact', 'body', 'signal'])
  })

  it('drops suspended combat cues instead of replaying them after their action has ended', () => {
    expect(canScheduleGloamwoodAudio('suspended', 'visible')).toBe(false)
    expect(canScheduleGloamwoodAudio('suspended', 'hidden')).toBe(false)
    expect(canScheduleGloamwoodAudio('running', 'hidden')).toBe(false)
    expect(canScheduleGloamwoodAudio('running', 'visible')).toBe(true)
    expect(canScheduleGloamwoodAudio('closed', 'visible')).toBe(false)
    expect(isGloamwoodEncounterSignal('elite-intro')).toBe(true)
    expect(isGloamwoodEncounterSignal('boss-intro')).toBe(true)
    expect(isGloamwoodEncounterSignal('attack-bite')).toBe(false)
  })

  it('uses a restrained forest music loop and creature-combat palette instead of cinematic whooshes or drum-like impacts', () => {
    expect(RIVER_VALLEY_AMBIENT.provenance).toContain('CC0')
    expect(RIVER_VALLEY_AMBIENT.provenance).toContain('Beautiful Forest')
    expect(RIVER_VALLEY_AMBIENT.sourceUrl).toContain('beautiful-forest-orchestra')
    expect(RIVER_VALLEY_AMBIENT.filename).toMatch(/river-valley-forest-music\.ogg$/)
    expect(RIVER_VALLEY_AMBIENT.musicGain).toBe(0.05)
    expect(RIVER_VALLEY_AMBIENT.fadeInSeconds).toBeGreaterThanOrEqual(2)
    expect(getGloamwoodExternalAudioAssets('attack-bite')[0]?.url).toMatch(/attack-bite-swish-01\.m4a$/)
    expect(getGloamwoodExternalAudioAssets('attack-pounce')[0]?.url).toMatch(/attack-pounce-swish-01\.m4a$/)
    expect(getGloamwoodExternalAudioAssets('attack-tail')[0]?.url).toMatch(/attack-tail-swish-01\.m4a$/)
    expect(getGloamwoodExternalAudioAssets('attack-bite')[0]?.durationSeconds).toBeLessThanOrEqual(0.24)
    expect(getGloamwoodExternalAudioAssets('attack-tail')[0]?.durationSeconds).toBeLessThanOrEqual(0.28)
    expect(getGloamwoodExternalAudioAssets('hit-light')[0]?.url).toMatch(/hit-bite-crunch-01\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('hit-heavy')[0]?.url).toMatch(/hit-bite-crunch-02\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('enemy-hit-player')[0]?.url).toMatch(/player-hurt-creature-01\.ogg$/)
    expect(MAX_GLOAMWOOD_EXTERNAL_SOURCES).toBe(10)
    expect(getGloamwoodExternalAudioAssets('boss-intro')).toEqual([])
  })

  it('resolves public audio through the deployment base instead of the domain root', async () => {
    const source = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../src/gloamwood-3d-audio.ts', import.meta.url), 'utf8'))
    expect(source).toContain("import { assetUrl } from './asset-url'")
    expect(source).toContain('new Audio(assetUrl(RIVER_VALLEY_AMBIENT.filename))')
    expect(source).toContain('fetch(assetUrl(url))')
  })
})
