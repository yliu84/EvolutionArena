import { describe, expect, it } from 'vitest'

import {
  RIVER_VALLEY_AMBIENT,
  GLOAMWOOD_GOAL16_LOOPS,
  GLOAMWOOD_MASTER_LIMITER,
  MAX_GLOAMWOOD_EXTERNAL_SOURCES,
  canScheduleGloamwoodAudio,
  getGloamwoodExternalAudioAssets,
  getGloamwoodSoundLayers,
  getGloamwoodSoundProfile,
  inspectGloamwoodDecodedAudio,
  createGloamwoodMasterLimiterCurve,
  isGloamwoodEncounterSignal,
  type GloamwoodSoundEvent,
} from '../src/gloamwood-3d-audio'

describe('Gloamwood procedural sound profiles', () => {
  it('assigns every authoritative event a bounded audible profile', () => {
    const events: GloamwoodSoundEvent[] = [
      'footstep', 'land', 'attack-bite', 'attack-pounce', 'attack-claw', 'attack-tail', 'hit-light', 'hit-heavy', 'hit-blocked',
      'kill', 'enemy-hit-player', 'player-death', 'heal-pickup', 'skill-cast', 'evolution-open', 'evolution-select', 'elite-intro', 'boss-intro',
      'enemy-telegraph-fang', 'enemy-telegraph-shell', 'enemy-telegraph-swarm',
      'boss-phase', 'boss-warning-disc', 'boss-warning-line', 'boss-warning-ring', 'wave-start', 'victory', 'defeat',
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
    expect(getGloamwoodSoundLayers('hit-blocked')).toEqual(['impact', 'body'])
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

  it('keeps the master path linear below its knee and bounded above it', () => {
    const curve = createGloamwoodMasterLimiterCurve(8193)
    const centre = (curve.length - 1) / 2
    const indexFor = (value: number) => Math.round(centre + value / 4 * centre)
    expect(curve[indexFor(0.5)]).toBeCloseTo(0.5, 3)
    expect(curve[indexFor(-0.5)]).toBeCloseTo(-0.5, 3)
    expect(Math.max(...curve)).toBeLessThanOrEqual(GLOAMWOOD_MASTER_LIMITER.ceiling)
    expect(Math.min(...curve)).toBeGreaterThanOrEqual(-GLOAMWOOD_MASTER_LIMITER.ceiling)
    expect(GLOAMWOOD_MASTER_LIMITER.ceiling * GLOAMWOOD_MASTER_LIMITER.output).toBeLessThan(0.86)
  })

  it('keeps the rejected Goal 8 source as history while routing active combat through the Goal 16 body palette', () => {
    expect(RIVER_VALLEY_AMBIENT.provenance).toContain('CC0')
    expect(RIVER_VALLEY_AMBIENT.provenance).toContain('Beautiful Forest')
    expect(RIVER_VALLEY_AMBIENT.sourceUrl).toContain('beautiful-forest-orchestra')
    expect(RIVER_VALLEY_AMBIENT.filename).toMatch(/river-valley-forest-music\.ogg$/)
    expect(RIVER_VALLEY_AMBIENT.musicGain).toBe(0.05)
    expect(RIVER_VALLEY_AMBIENT.fadeInSeconds).toBeGreaterThanOrEqual(2)
    expect(getGloamwoodExternalAudioAssets('attack-bite', { playerFamily: 'fang' })[0]?.url).toMatch(/goal16\/sfx\/fang-swing-01\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('attack-bite', { playerFamily: 'shell' })[0]?.url).toMatch(/goal16\/sfx\/shell-swing-01\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('attack-bite', { playerFamily: 'swarm' })[0]?.url).toMatch(/goal16\/sfx\/swarm-swing-01\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('hit-light', { targetMaterial: 'flesh' })[0]?.url).toMatch(/flesh-hit-01\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('hit-heavy', { targetMaterial: 'shell' })[0]?.url).toMatch(/shell-hit-01\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('hit-heavy', { targetMaterial: 'swarm' })[0]?.url).toMatch(/swarm-hit-01\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('hit-blocked')[0]?.url).toMatch(/blocked-hit\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('enemy-hit-player')[0]?.url).toMatch(/player-hurt-01\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('heal-pickup')[0]?.url).toMatch(/heal-pickup\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('heal-pickup')[0]?.url).not.toMatch(/evolution-select/)
    expect(getGloamwoodExternalAudioAssets('heal-pickup')[0]?.gain).toBeLessThanOrEqual(0.48)
    expect(getGloamwoodExternalAudioAssets('kill').every((asset) => asset.gain <= 0.66)).toBe(true)
    expect(getGloamwoodExternalAudioAssets('skill-cast', { playerFamily: 'fang' })[0]?.url).toMatch(/skill-cast-fang\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('skill-cast', { playerFamily: 'shell' })[0]?.url).toMatch(/skill-cast-shell\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('skill-cast', { playerFamily: 'swarm' })[0]?.url).toMatch(/skill-cast-swarm\.ogg$/)
    expect(MAX_GLOAMWOOD_EXTERNAL_SOURCES).toBe(10)
    expect(getGloamwoodExternalAudioAssets('boss-intro', { bossIdentity: 'tide' })[0]?.url).toMatch(/boss-intro-tide\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('boss-intro', { bossIdentity: 'cliff' })[0]?.url).toMatch(/boss-intro-cliff\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('boss-intro', { bossIdentity: 'root' })[0]?.url).toMatch(/boss-intro-root\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('boss-intro', { bossIdentity: 'warden' })[0]?.url).toMatch(/boss-intro-warden\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('elite-intro', { targetMaterial: 'flesh' })[0]?.url).toMatch(/elite-intro-fang\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('elite-intro', { targetMaterial: 'shell' })[0]?.url).toMatch(/elite-intro-shell\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('elite-intro', { targetMaterial: 'swarm' })[0]?.url).toMatch(/elite-intro-swarm\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('boss-phase')[0]?.url).toMatch(/boss-phase\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('wave-start')[0]?.url).toMatch(/mode-select\.ogg$/)
  })

  it('resolves public audio through the deployment base instead of the domain root', async () => {
    const source = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../src/gloamwood-3d-audio.ts', import.meta.url), 'utf8'))
    expect(source).toContain("import { assetUrl } from './asset-url'")
    expect(source).toContain('new Audio(assetUrl(url))')
    expect(source).toContain('fetch(assetUrl(url))')
    expect(source).toContain('this.playPendingEncounterSignal(pendingEncounterSignal)')
    expect(source).toContain("this.loadExternalBuffer(first.url).then((buffer)")
    expect(source).toContain('activeAmbienceLayers: [...this.loopGains.entries()]')
    expect(Object.values(GLOAMWOOD_GOAL16_LOOPS.music)).toHaveLength(3)
    expect(Object.values(GLOAMWOOD_GOAL16_LOOPS.ambience)).toHaveLength(3)
    expect(GLOAMWOOD_GOAL16_LOOPS.ambience.defence).toMatch(/ambience-defence\.ogg$/)
    for (const path of [...Object.values(GLOAMWOOD_GOAL16_LOOPS.music), ...Object.values(GLOAMWOOD_GOAL16_LOOPS.ambience)]) {
      expect(path).toMatch(/^\/assets\/audio\/goal16\/.+\.ogg$/)
    }
  })

  it('ships semantic pre-damage warnings for all enemy families and Boss shapes', () => {
    expect(getGloamwoodExternalAudioAssets('enemy-telegraph-fang')[0]?.url).toMatch(/enemy-telegraph-fang\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('enemy-telegraph-shell')[0]?.url).toMatch(/enemy-telegraph-shell\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('enemy-telegraph-swarm')[0]?.url).toMatch(/enemy-telegraph-swarm\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('boss-warning-disc')[0]?.url).toMatch(/boss-warning-disc\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('boss-warning-line')[0]?.url).toMatch(/boss-warning-line\.ogg$/)
    expect(getGloamwoodExternalAudioAssets('boss-warning-ring')[0]?.url).toMatch(/boss-warning-ring\.ogg$/)
  })

  it('measures decoded onset, peak, tail, loop edge and phone-readable spectral energy', () => {
    const sampleRate = 44_100
    const samples = new Float32Array(8192)
    const onset = 441
    const tail = 441
    for (let index = onset; index < samples.length - tail; index += 1) {
      samples[index] = Math.sin(2 * Math.PI * 1000 * (index - onset) / sampleRate) * 0.5
    }
    const metrics = inspectGloamwoodDecodedAudio({
      sampleRate,
      numberOfChannels: 1,
      length: samples.length,
      duration: samples.length / sampleRate,
      getChannelData: () => samples,
    })
    expect(metrics.onsetMilliseconds).toBeCloseTo(10, 0)
    expect(metrics.trailingSilenceMilliseconds).toBeCloseTo(10, 0)
    expect(metrics.peakDbfs).toBeCloseTo(-6.02, 1)
    expect(metrics.loopEdgeJump).toBe(0)
    expect(metrics.endWindowPeakDbfs).toBeLessThan(-50)
    expect(metrics.usefulBandRatio).toBeGreaterThan(0.9)
  })

  it('does not mistake sub-phone rumble for useful warning energy', () => {
    const sampleRate = 44_100
    const samples = Float32Array.from({ length: 8192 }, (_, index) => Math.sin(2 * Math.PI * 40 * index / sampleRate) * 0.5)
    const metrics = inspectGloamwoodDecodedAudio({
      sampleRate,
      numberOfChannels: 1,
      length: samples.length,
      duration: samples.length / sampleRate,
      getChannelData: () => samples,
    })
    expect(metrics.usefulBandRatio).toBeLessThan(0.2)
  })

  it('routes warnings from real telegraph transitions and introduces a Boss before its first warning layer', async () => {
    const source = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8'))
    expect(source).toContain("prey.phase !== 'telegraph' || previousPhases.get(prey.id) === 'telegraph'")
    expect(source).toContain("this.playSound(`boss-warning-${pattern.shape.kind}`")
    expect(source.indexOf('this.announceAwakenedThreats()')).toBeLessThan(source.indexOf('this.playNewPreyTelegraphs(previousPreyPhases)'))
  })

  it('does not reuse the evolution confirmation for healing or skill casts', async () => {
    const source = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8'))
    expect(source).toContain("this.playSound('heal-pickup')")
    expect(source).toContain("this.playSound('skill-cast', { playerFamily: attempt.skill.family })")
  })
})
