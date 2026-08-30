import type { FeedbackVolume } from './player-hit-feedback'
import { assetUrl } from './asset-url'
import {
  DEFAULT_GLOAMWOOD_AUDIO_MIX,
  gloamwoodMusicLayerMix,
  gloamwoodWeatherLayerMix,
  normalizeGloamwoodAudioMix,
  planGloamwoodMusicTransition,
  type GloamwoodAudioMixSettings,
  type GloamwoodMusicState,
  type GloamwoodWeatherAudioState,
} from './gloamwood-audio-director'

export type GloamwoodSoundEvent =
  | 'footstep'
  | 'land'
  | 'attack-bite'
  | 'attack-pounce'
  | 'attack-claw'
  | 'attack-tail'
  | 'hit-light'
  | 'hit-heavy'
  | 'hit-blocked'
  | 'kill'
  /** An enemy has confirmed damage against the player; never a player attack cue. */
  | 'enemy-hit-player'
  | 'player-death'
  /** A collected meat drop restored health; deliberately smaller than evolution. */
  | 'heal-pickup'
  /** A family skill successfully fired; context selects the body-specific cast. */
  | 'skill-cast'
  | 'evolution-open'
  | 'evolution-select'
  | 'enemy-telegraph-fang'
  | 'enemy-telegraph-shell'
  | 'enemy-telegraph-swarm'
  | 'elite-intro'
  | 'boss-intro'
  | 'boss-phase'
  | 'boss-warning-disc'
  | 'boss-warning-line'
  | 'boss-warning-ring'
  | 'wave-start'
  | 'victory'
  | 'defeat'

export type GloamwoodSoundLayer = 'anticipation' | 'swing' | 'impact' | 'body' | 'signal'

export interface GloamwoodSoundProfile {
  tier: 'small' | 'medium' | 'large'
  oscillator: OscillatorType
  frequency: number
  endFrequency: number
  durationSeconds: number
  gain: number
}

export const RIVER_VALLEY_AMBIENT = {
  provenance: 'nene, Beautiful Forest [Orchestra], CC0; downloaded from OpenGameArt.',
  sourceUrl: 'https://opengameart.org/content/beautiful-forest-orchestra',
  filename: '/assets/audio/goal8/river-valley-forest-music.ogg',
  // The orchestral arrangement remains a backdrop: the Settings volume and the
  // combat ducking apply after this intentionally quiet baseline.
  musicGain: 0.05,
  fadeInSeconds: 2.4,
} as const

export const GLOAMWOOD_GOAL16_LOOPS = {
  music: {
    world: '/assets/audio/goal16/music-world.ogg',
    pulse: '/assets/audio/goal16/music-pulse.ogg',
    boss: '/assets/audio/goal16/music-boss.ogg',
  },
  ambience: {
    forest: '/assets/audio/goal16/ambience-forest.ogg',
    rain: '/assets/audio/goal16/ambience-rain.ogg',
    defence: '/assets/audio/goal16/ambience-defence.ogg',
  },
} as const

export interface GloamwoodExternalAudioAsset {
  url: string
  gain: number
  /** Long source files are intentionally stopped before their cinematic tails. */
  durationSeconds?: number
}

export type GloamwoodAudioBodyFamily = 'origin' | 'fang' | 'shell' | 'swarm'
export type GloamwoodAudioTargetMaterial = 'flesh' | 'shell' | 'swarm' | 'boss'

export interface GloamwoodSoundContext {
  playerFamily?: GloamwoodAudioBodyFamily
  targetMaterial?: GloamwoodAudioTargetMaterial
  bossIdentity?: 'tide' | 'cliff' | 'root' | 'warden'
}

const goal16Asset = (name: string, gain: number): GloamwoodExternalAudioAsset => ({
  url: `/assets/audio/goal16/sfx/${name}.ogg`,
  gain,
})

export const GLOAMWOOD_GOAL16_CONTEXT_AUDIO = {
  swing: {
    origin: [goal16Asset('fang-swing-01', 0.58)],
    fang: [goal16Asset('fang-swing-01', 0.72), goal16Asset('fang-swing-02', 0.68)],
    shell: [goal16Asset('shell-swing-01', 0.78)],
    swarm: [goal16Asset('swarm-swing-01', 0.64), goal16Asset('swarm-swing-02', 0.62)],
  },
  hit: {
    flesh: [goal16Asset('flesh-hit-01', 0.82), goal16Asset('flesh-hit-02', 0.8)],
    shell: [goal16Asset('shell-hit-01', 0.86), goal16Asset('shell-hit-02', 0.84)],
    swarm: [goal16Asset('swarm-hit-01', 0.78), goal16Asset('swarm-hit-02', 0.76)],
    boss: [goal16Asset('shell-hit-01', 0.94), goal16Asset('shell-hit-02', 0.92)],
  },
  hurt: [goal16Asset('player-hurt-01', 0.78), goal16Asset('player-hurt-02', 0.76)],
  kill: [goal16Asset('kill-01', 0.66), goal16Asset('kill-02', 0.64)],
  skillCast: {
    origin: [goal16Asset('skill-cast-fang', 0.62)],
    fang: [goal16Asset('skill-cast-fang', 0.72)],
    shell: [goal16Asset('skill-cast-shell', 0.74)],
    swarm: [goal16Asset('skill-cast-swarm', 0.76)],
  },
  bossIntro: {
    tide: [goal16Asset('boss-intro-tide', 0.92)],
    cliff: [goal16Asset('boss-intro-cliff', 0.94)],
    root: [goal16Asset('boss-intro-root', 0.96)],
    warden: [goal16Asset('boss-intro-warden', 0.94)],
  },
  eliteIntro: {
    flesh: [goal16Asset('elite-intro-fang', 0.82)],
    shell: [goal16Asset('elite-intro-shell', 0.84)],
    swarm: [goal16Asset('elite-intro-swarm', 0.82)],
    boss: [goal16Asset('elite-intro-shell', 0.84)],
  },
} as const

/** A generous cap keeps combat cues reliable while bounding extreme crowd overlap. */
export const MAX_GLOAMWOOD_EXTERNAL_SOURCES = 10

const EXTERNAL_EVENT_COOLDOWNS: Partial<Record<GloamwoodSoundEvent, number>> = {
  footstep: 0.18,
  land: 0.12,
  // Several enemies can land together. Damage remains authoritative, but the
  // incoming body cue collapses so a crowd cannot make an audio wall.
  'enemy-hit-player': 0.2,
}

/**
 * Only presentation assets live here. Existing gameplay events still decide
 * when these clips play; the audio files never create a hit or kill.
 */
export const GLOAMWOOD_EXTERNAL_AUDIO: Partial<Record<GloamwoodSoundEvent, readonly GloamwoodExternalAudioAsset[]>> = {
  footstep: [
    { url: '/assets/audio/goal8/footstep-grass-01.ogg', gain: 0.055 },
    { url: '/assets/audio/goal8/footstep-grass-02.ogg', gain: 0.055 },
  ],
  land: [{ url: '/assets/audio/goal8/land-soft-heavy-01.ogg', gain: 0.08 }],
  'enemy-hit-player': GLOAMWOOD_GOAL16_CONTEXT_AUDIO.hurt,
  'hit-blocked': [goal16Asset('blocked-hit', 0.84)],
  'player-death': [goal16Asset('player-death', 0.88)],
  'heal-pickup': [goal16Asset('heal-pickup', 0.48)],
  'evolution-open': [goal16Asset('evolution-open', 0.7)],
  'evolution-select': [goal16Asset('evolution-select', 0.76)],
  'enemy-telegraph-fang': [goal16Asset('enemy-telegraph-fang', 0.68)],
  'enemy-telegraph-shell': [goal16Asset('enemy-telegraph-shell', 0.72)],
  'enemy-telegraph-swarm': [goal16Asset('enemy-telegraph-swarm', 0.66)],
  'elite-intro': [goal16Asset('elite-intro-fang', 0.82)],
  'boss-phase': [goal16Asset('boss-phase', 0.82)],
  'boss-warning-disc': [goal16Asset('boss-warning-disc', 0.86)],
  'boss-warning-line': [goal16Asset('boss-warning-line', 0.86)],
  'boss-warning-ring': [goal16Asset('boss-warning-ring', 0.88)],
  'wave-start': [goal16Asset('mode-select', 0.58)],
  victory: [goal16Asset('victory', 0.78)],
  defeat: [goal16Asset('defeat', 0.74)],
}

export function getGloamwoodExternalAudioAssets(event: GloamwoodSoundEvent, context: GloamwoodSoundContext = {}) {
  if (event.startsWith('attack-')) return GLOAMWOOD_GOAL16_CONTEXT_AUDIO.swing[context.playerFamily ?? 'origin']
  if (event === 'kill') return GLOAMWOOD_GOAL16_CONTEXT_AUDIO.kill
  if (event === 'skill-cast') return GLOAMWOOD_GOAL16_CONTEXT_AUDIO.skillCast[context.playerFamily ?? 'origin']
  if (event === 'hit-light' || event === 'hit-heavy') {
    return GLOAMWOOD_GOAL16_CONTEXT_AUDIO.hit[context.targetMaterial ?? 'flesh']
  }
  if (event === 'elite-intro') return GLOAMWOOD_GOAL16_CONTEXT_AUDIO.eliteIntro[context.targetMaterial ?? 'flesh']
  if (event === 'boss-intro') return GLOAMWOOD_GOAL16_CONTEXT_AUDIO.bossIntro[context.bossIdentity ?? 'warden']
  return GLOAMWOOD_EXTERNAL_AUDIO[event] ?? []
}

function allGloamwoodExternalAudioAssets() {
  return [
    ...Object.values(GLOAMWOOD_EXTERNAL_AUDIO).flat(),
    ...Object.values(GLOAMWOOD_GOAL16_CONTEXT_AUDIO.swing).flat(),
    ...Object.values(GLOAMWOOD_GOAL16_CONTEXT_AUDIO.hit).flat(),
    ...GLOAMWOOD_GOAL16_CONTEXT_AUDIO.kill,
    ...Object.values(GLOAMWOOD_GOAL16_CONTEXT_AUDIO.skillCast).flat(),
    ...Object.values(GLOAMWOOD_GOAL16_CONTEXT_AUDIO.bossIntro).flat(),
    ...Object.values(GLOAMWOOD_GOAL16_CONTEXT_AUDIO.eliteIntro).flat(),
  ]
}

const PROFILES: Record<GloamwoodSoundEvent, GloamwoodSoundProfile> = {
  footstep: { tier: 'small', oscillator: 'sine', frequency: 78, endFrequency: 44, durationSeconds: 0.075, gain: 0.018 },
  land: { tier: 'medium', oscillator: 'sine', frequency: 88, endFrequency: 38, durationSeconds: 0.16, gain: 0.038 },
  'attack-bite': { tier: 'small', oscillator: 'triangle', frequency: 238, endFrequency: 106, durationSeconds: 0.13, gain: 0.034 },
  'attack-pounce': { tier: 'medium', oscillator: 'sawtooth', frequency: 152, endFrequency: 52, durationSeconds: 0.22, gain: 0.045 },
  'attack-claw': { tier: 'small', oscillator: 'triangle', frequency: 382, endFrequency: 148, durationSeconds: 0.12, gain: 0.032 },
  'attack-tail': { tier: 'medium', oscillator: 'sawtooth', frequency: 126, endFrequency: 39, durationSeconds: 0.24, gain: 0.048 },
  'hit-light': { tier: 'medium', oscillator: 'square', frequency: 112, endFrequency: 48, durationSeconds: 0.1, gain: 0.046 },
  'hit-heavy': { tier: 'medium', oscillator: 'square', frequency: 84, endFrequency: 34, durationSeconds: 0.17, gain: 0.061 },
  'hit-blocked': { tier: 'medium', oscillator: 'triangle', frequency: 118, endFrequency: 72, durationSeconds: 0.16, gain: 0.038 },
  kill: { tier: 'large', oscillator: 'triangle', frequency: 156, endFrequency: 42, durationSeconds: 0.3, gain: 0.068 },
  'enemy-hit-player': { tier: 'medium', oscillator: 'triangle', frequency: 94, endFrequency: 37, durationSeconds: 0.16, gain: 0.04 },
  'player-death': { tier: 'large', oscillator: 'sawtooth', frequency: 88, endFrequency: 26, durationSeconds: 0.56, gain: 0.067 },
  'heal-pickup': { tier: 'small', oscillator: 'sine', frequency: 440, endFrequency: 988, durationSeconds: 0.58, gain: 0.026 },
  'skill-cast': { tier: 'medium', oscillator: 'triangle', frequency: 174, endFrequency: 440, durationSeconds: 0.64, gain: 0.044 },
  'evolution-open': { tier: 'large', oscillator: 'sine', frequency: 174, endFrequency: 392, durationSeconds: 0.46, gain: 0.052 },
  'evolution-select': { tier: 'large', oscillator: 'triangle', frequency: 220, endFrequency: 523, durationSeconds: 0.54, gain: 0.06 },
  'enemy-telegraph-fang': { tier: 'small', oscillator: 'triangle', frequency: 214, endFrequency: 132, durationSeconds: 0.18, gain: 0.03 },
  'enemy-telegraph-shell': { tier: 'medium', oscillator: 'triangle', frequency: 144, endFrequency: 92, durationSeconds: 0.28, gain: 0.036 },
  'enemy-telegraph-swarm': { tier: 'small', oscillator: 'triangle', frequency: 318, endFrequency: 244, durationSeconds: 0.22, gain: 0.028 },
  'elite-intro': { tier: 'large', oscillator: 'square', frequency: 98, endFrequency: 62, durationSeconds: 0.34, gain: 0.055 },
  'boss-intro': { tier: 'large', oscillator: 'sawtooth', frequency: 68, endFrequency: 27, durationSeconds: 0.66, gain: 0.071 },
  'boss-phase': { tier: 'large', oscillator: 'sawtooth', frequency: 76, endFrequency: 30, durationSeconds: 0.5, gain: 0.068 },
  'boss-warning-disc': { tier: 'large', oscillator: 'triangle', frequency: 126, endFrequency: 84, durationSeconds: 0.46, gain: 0.052 },
  'boss-warning-line': { tier: 'large', oscillator: 'triangle', frequency: 186, endFrequency: 112, durationSeconds: 0.42, gain: 0.05 },
  'boss-warning-ring': { tier: 'large', oscillator: 'triangle', frequency: 238, endFrequency: 156, durationSeconds: 0.52, gain: 0.05 },
  'wave-start': { tier: 'large', oscillator: 'triangle', frequency: 164, endFrequency: 246, durationSeconds: 0.42, gain: 0.048 },
  victory: { tier: 'large', oscillator: 'triangle', frequency: 196, endFrequency: 659, durationSeconds: 0.74, gain: 0.065 },
  defeat: { tier: 'large', oscillator: 'sawtooth', frequency: 92, endFrequency: 28, durationSeconds: 0.7, gain: 0.062 },
}

export function getGloamwoodSoundProfile(event: GloamwoodSoundEvent) {
  return { ...PROFILES[event] }
}

/** A miss deliberately stops after anticipation + swing; impact is a separate confirmed event. */
export function getGloamwoodSoundLayers(event: GloamwoodSoundEvent): readonly GloamwoodSoundLayer[] {
  if (event.startsWith('attack-')) return ['anticipation', 'swing']
  if (event === 'hit-light' || event === 'hit-heavy' || event === 'hit-blocked' || event === 'enemy-hit-player' || event === 'land') return ['impact', 'body']
  if (event === 'kill' || event === 'player-death' || event === 'defeat') return ['impact', 'body', 'signal']
  return ['signal']
}

export function canScheduleGloamwoodAudio(
  contextState: AudioContextState,
  visibilityState: DocumentVisibilityState = 'visible',
) {
  return contextState === 'running' && visibilityState === 'visible'
}

export interface GloamwoodAudioSnapshot {
  unlocked: boolean
  contextState: AudioContextState | 'unavailable' | 'closed'
  ambientActive: boolean
  muted: boolean
  volume: FeedbackVolume
  pendingEncounterSignal: GloamwoodSoundEvent | null
  bufferedExternalAssets: number
  loadingExternalAssets: number
  activeExternalSources: number
  musicState: GloamwoodMusicState
  weatherState: GloamwoodWeatherAudioState
  activeMusicLayers: string[]
  activeAmbienceLayers: string[]
  busGains: GloamwoodAudioMixSettings
  lastTransitionReason: string
}

export interface GloamwoodDecodedAudioMetrics {
  sampleRate: number
  channels: number
  durationSeconds: number
  peakDbfs: number
  rmsDbfs: number
  onsetMilliseconds: number
  trailingSilenceMilliseconds: number
  loopEdgeJump: number
  endWindowPeakDbfs: number
  usefulBandRatio: number
}

export interface GloamwoodDecodedAudioAuditRecord extends GloamwoodDecodedAudioMetrics {
  url: string
  loop: boolean
}

export interface GloamwoodDecodedAudioAudit {
  records: GloamwoodDecodedAudioAuditRecord[]
  failures: string[]
  stressPeakDbtp: number
  passed: boolean
}

export interface GloamwoodPcmBuffer {
  sampleRate: number
  numberOfChannels: number
  length: number
  duration: number
  getChannelData(channel: number): Float32Array
}

function dbfs(value: number) {
  return 20 * Math.log10(Math.max(1e-9, value))
}

export const GLOAMWOOD_MASTER_LIMITER = {
  knee: 0.72,
  ceiling: 0.88,
  output: 0.96,
} as const

/** Linear below the knee, smoothly asymptotic above it. */
export function createGloamwoodMasterLimiterCurve(size = 4096) {
  const curve = new Float32Array(size)
  const { knee, ceiling } = GLOAMWOOD_MASTER_LIMITER
  for (let index = 0; index < size; index += 1) {
    const input = (index / (size - 1) * 2 - 1) * 4
    const sign = Math.sign(input)
    const absolute = Math.abs(input)
    const limited = absolute <= knee
      ? absolute
      : knee + (ceiling - knee) * (1 - Math.exp(-(absolute - knee) / (ceiling - knee)))
    curve[index] = sign * limited
  }
  return curve
}

/**
 * Decoded-PCM evidence used by the browser audit. Header checks cannot catch a
 * silent prefix, a clipped Vorbis decode or a warning whose energy lives only
 * below phone-speaker range.
 */
export function inspectGloamwoodDecodedAudio(buffer: GloamwoodPcmBuffer): GloamwoodDecodedAudioMetrics {
  const threshold = 10 ** (-50 / 20)
  const mixed = new Float32Array(buffer.length)
  let peak = 0
  let onset = buffer.length
  let lastAudible = -1
  let energy = 0
  let edgeJump = 0
  let endWindowPeak = 0
  const endWindowStart = Math.max(0, buffer.length - Math.round(buffer.sampleRate * 0.005))
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel)
    edgeJump = Math.max(edgeJump, Math.abs((samples[0] ?? 0) - (samples[samples.length - 1] ?? 0)))
    for (let index = 0; index < samples.length; index += 1) {
      const absolute = Math.abs(samples[index])
      if (absolute > peak) peak = absolute
      if (index >= endWindowStart && absolute > endWindowPeak) endWindowPeak = absolute
      if (absolute >= threshold) {
        if (index < onset) onset = index
        if (index > lastAudible) lastAudible = index
      }
      mixed[index] += samples[index] / Math.max(1, buffer.numberOfChannels)
    }
  }
  for (const sample of mixed) energy += sample * sample
  return {
    sampleRate: buffer.sampleRate,
    channels: buffer.numberOfChannels,
    durationSeconds: buffer.duration,
    peakDbfs: dbfs(peak),
    rmsDbfs: dbfs(Math.sqrt(energy / Math.max(1, mixed.length))),
    onsetMilliseconds: onset >= buffer.length ? buffer.duration * 1000 : onset / buffer.sampleRate * 1000,
    trailingSilenceMilliseconds: lastAudible < 0 ? buffer.duration * 1000 : (buffer.length - 1 - lastAudible) / buffer.sampleRate * 1000,
    loopEdgeJump: edgeJump,
    endWindowPeakDbfs: dbfs(endWindowPeak),
    usefulBandRatio: gloamwoodUsefulBandRatio(mixed, buffer.sampleRate),
  }
}

function gloamwoodUsefulBandRatio(samples: Float32Array, sampleRate: number) {
  const size = 2048
  if (samples.length < size) return 0
  const windows = Math.min(8, Math.max(1, Math.floor(samples.length / size)))
  let useful = 0
  let audible = 0
  for (let windowIndex = 0; windowIndex < windows; windowIndex += 1) {
    const start = Math.round((samples.length - size) * (windows === 1 ? 0.5 : windowIndex / (windows - 1)))
    const real = new Float64Array(size)
    const imaginary = new Float64Array(size)
    for (let index = 0; index < size; index += 1) {
      const hann = 0.5 - 0.5 * Math.cos(2 * Math.PI * index / (size - 1))
      real[index] = samples[start + index] * hann
    }
    gloamwoodFft(real, imaginary)
    const maximumBin = Math.min(size / 2, Math.floor(20_000 * size / sampleRate))
    for (let bin = 1; bin <= maximumBin; bin += 1) {
      const frequency = bin * sampleRate / size
      if (frequency < 20) continue
      const power = real[bin] * real[bin] + imaginary[bin] * imaginary[bin]
      audible += power
      if (frequency >= 120 && frequency <= 6000) useful += power
    }
  }
  return audible > 0 ? useful / audible : 0
}

function gloamwoodFft(real: Float64Array, imaginary: Float64Array) {
  const length = real.length
  for (let index = 1, reversed = 0; index < length; index += 1) {
    let bit = length >> 1
    for (; reversed & bit; bit >>= 1) reversed ^= bit
    reversed ^= bit
    if (index < reversed) {
      const realValue = real[index]
      real[index] = real[reversed]
      real[reversed] = realValue
      const imaginaryValue = imaginary[index]
      imaginary[index] = imaginary[reversed]
      imaginary[reversed] = imaginaryValue
    }
  }
  for (let span = 2; span <= length; span <<= 1) {
    const angle = -2 * Math.PI / span
    const stepReal = Math.cos(angle)
    const stepImaginary = Math.sin(angle)
    for (let offset = 0; offset < length; offset += span) {
      let twiddleReal = 1
      let twiddleImaginary = 0
      for (let index = 0; index < span / 2; index += 1) {
        const even = offset + index
        const odd = even + span / 2
        const oddReal = real[odd] * twiddleReal - imaginary[odd] * twiddleImaginary
        const oddImaginary = real[odd] * twiddleImaginary + imaginary[odd] * twiddleReal
        real[odd] = real[even] - oddReal
        imaginary[odd] = imaginary[even] - oddImaginary
        real[even] += oddReal
        imaginary[even] += oddImaginary
        const nextReal = twiddleReal * stepReal - twiddleImaginary * stepImaginary
        twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal
        twiddleReal = nextReal
      }
    }
  }
}

export function isGloamwoodEncounterSignal(event: GloamwoodSoundEvent) {
  return event === 'elite-intro' || event === 'boss-intro'
}

export class GloamwoodAudioBus {
  private context?: AudioContext
  private masterGain?: GainNode
  private musicGain?: GainNode
  private sfxGain?: GainNode
  private ambienceGain?: GainNode
  private readonly loopMedia = new Map<string, HTMLAudioElement>()
  private readonly loopSources = new Map<string, MediaElementAudioSourceNode>()
  private readonly loopGains = new Map<string, GainNode>()
  private readonly externalBytes = new Map<string, Promise<ArrayBuffer | undefined>>()
  private readonly externalBuffers = new Map<string, AudioBuffer>()
  private readonly externalBufferLoads = new Map<string, Promise<AudioBuffer | undefined>>()
  private readonly activeExternalSources = new Set<AudioBufferSourceNode>()
  private readonly lastExternalEventAt = new Map<GloamwoodSoundEvent, number>()
  private volume: FeedbackVolume
  private muted: boolean
  private mix: GloamwoodAudioMixSettings
  private musicState: GloamwoodMusicState = 'explore'
  private weatherState: GloamwoodWeatherAudioState = 'dawn'
  private lastTransitionReason = 'initial exploration'
  private sequence = 0
  private unlocked = false
  private pendingEncounterSignal?: { event: GloamwoodSoundEvent; soundContext: GloamwoodSoundContext }

  constructor(volumeOrMix: FeedbackVolume | GloamwoodAudioMixSettings, muted = false) {
    const mix = typeof volumeOrMix === 'number'
      ? { ...DEFAULT_GLOAMWOOD_AUDIO_MIX, master: volumeOrMix, muted }
      : normalizeGloamwoodAudioMix(volumeOrMix)
    this.mix = mix
    this.volume = mix.master === 0 || mix.master === 0.6 || mix.master === 1 ? mix.master : 1
    this.muted = mix.muted
    // Downloading these small files is silent. It removes the only uncertain
    // network step before the player's first actual swing without violating
    // the first-gesture audio-start boundary.
    for (const url of new Set(allGloamwoodExternalAudioAssets().map((asset) => asset.url))) {
      void this.prefetchExternalBytes(url)
    }
  }

  setVolume(volume: FeedbackVolume) {
    this.volume = volume
    this.mix.master = volume
    this.applyMasterGain()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.mix.muted = muted
    this.applyMasterGain()
  }

  setMix(mix: GloamwoodAudioMixSettings) {
    this.mix = normalizeGloamwoodAudioMix(mix)
    this.muted = this.mix.muted
    this.applyBusGains()
  }

  setMusicState(state: GloamwoodMusicState, reason: string) {
    const transition = planGloamwoodMusicTransition(this.musicState, state, reason)
    if (!transition) return false
    this.musicState = state
    this.lastTransitionReason = reason
    if (state === 'boss-intro') {
      const boss = this.loopMedia.get('music:boss')
      if (boss) {
        try { boss.currentTime = 0 } catch { /* metadata can still be loading */ }
        void boss.play().catch(() => {})
      }
    }
    this.applyMusicState(transition.fadeSeconds)
    return true
  }

  setWeatherState(weather: GloamwoodWeatherAudioState) {
    if (weather === this.weatherState) return false
    this.weatherState = weather
    this.applyWeatherState(1.8)
    return true
  }

  unlock() {
    this.unlocked = true
    try {
      this.context ??= new AudioContext()
      this.ensureGraph()
      const pendingEncounterSignal = this.pendingEncounterSignal
      this.pendingEncounterSignal = undefined
      const beginAudio = () => {
        this.ensureAmbient()
        this.warmExternalBuffers()
        if (pendingEncounterSignal) this.playPendingEncounterSignal(pendingEncounterSignal)
      }
      if (this.context.state !== 'running' && this.context.state !== 'closed') {
        void this.context.resume().then(beginAudio).catch(() => {})
      } else beginAudio()
    } catch {
      // The complete run remains playable when Web Audio is blocked.
    }
  }

  /** Mobile browsers suspend audio after tab/app changes; only resume a bus the player already unlocked. */
  resume() {
    if (!this.unlocked || !this.context || this.context.state === 'closed') return
    if (this.context.state !== 'running') void this.context.resume().then(() => this.ensureAmbient()).catch(() => {})
    else this.ensureAmbient()
  }

  play(event: GloamwoodSoundEvent, soundContext: GloamwoodSoundContext = {}) {
    const context = this.context
    if (!context) {
      // Debug gates can awaken an encounter before the player's first trusted
      // gesture. Preserve only that high-value cue; routine combat sounds must
      // never queue and burst when audio later unlocks.
      if (isGloamwoodEncounterSignal(event)) this.pendingEncounterSignal = { event, soundContext: { ...soundContext } }
      return false
    }
    if (this.mix.master === 0 || this.mix.sfx === 0 || this.muted) return false
    // Never schedule an ordinary combat source onto a suspended context. It
    // would play only after resume, detached from the action that caused it.
    // Missing one cue during a lifecycle transition is preferable to a late
    // cue that teaches the player the wrong combat timing.
    const visibility = typeof document === 'undefined' ? 'visible' : document.visibilityState
    if (!canScheduleGloamwoodAudio(context.state, visibility)) {
      if (visibility === 'visible') this.resume()
      return false
    }
    this.ensureGraph()
    const profile = PROFILES[event]
    const now = context.currentTime
    const sequence = this.sequence++
    const externalAssets = getGloamwoodExternalAudioAssets(event, soundContext)
    if (externalAssets.length > 0) {
      this.playExternal(event, externalAssets[sequence % externalAssets.length], now)
    } else this.playImpact(event, profile, now, 1 + ((sequence % 5) - 2) * 0.018)
    if (profile.tier === 'large') this.duckMusic(now, profile.durationSeconds)
    return true
  }

  snapshot(): GloamwoodAudioSnapshot {
    return {
      unlocked: this.unlocked,
      contextState: this.context?.state ?? (this.unlocked ? 'unavailable' : 'closed'),
      ambientActive: [...this.loopMedia.entries()].some(([key, media]) => key.startsWith('ambience:') && !media.paused),
      muted: this.muted,
      volume: this.volume,
      pendingEncounterSignal: this.pendingEncounterSignal?.event ?? null,
      bufferedExternalAssets: this.externalBuffers.size,
      loadingExternalAssets: this.externalBufferLoads.size,
      activeExternalSources: this.activeExternalSources.size,
      musicState: this.musicState,
      weatherState: this.weatherState,
      activeMusicLayers: [...this.loopGains.entries()]
        .filter(([key, gain]) => key.startsWith('music:') && gain.gain.value > 0.01)
        .map(([key]) => key.slice('music:'.length)),
      activeAmbienceLayers: [...this.loopGains.entries()]
        .filter(([key, gain]) => key.startsWith('ambience:') && gain.gain.value > 0.01)
        .map(([key]) => key.slice('ambience:'.length)),
      busGains: { ...this.mix },
      lastTransitionReason: this.lastTransitionReason,
    }
  }

  /**
   * Debug-only, explicit review surface. Decodes the exact deployment URLs in
   * the browser engine that will play them, sequentially so six long loops do
   * not sit in memory together. This never runs during a normal play session.
   */
  async auditDecodedAssetsForReview(): Promise<GloamwoodDecodedAudioAudit> {
    const context = this.context
    if (!context || context.state === 'closed') throw new Error('Audio must be unlocked before decoded audit')
    const loopUrls = new Set<string>([
      ...Object.values(GLOAMWOOD_GOAL16_LOOPS.music),
      ...Object.values(GLOAMWOOD_GOAL16_LOOPS.ambience),
    ])
    const urls = [...new Set([...loopUrls, ...allGloamwoodExternalAudioAssets().map((asset) => asset.url)])]
    const records: GloamwoodDecodedAudioAuditRecord[] = []
    const failures: string[] = []
    const stressUrls = new Set([
      GLOAMWOOD_GOAL16_LOOPS.music.pulse,
      GLOAMWOOD_GOAL16_LOOPS.music.boss,
      GLOAMWOOD_GOAL16_LOOPS.ambience.forest,
      GLOAMWOOD_GOAL16_LOOPS.ambience.defence,
      '/assets/audio/goal16/sfx/boss-intro-warden.ogg',
      '/assets/audio/goal16/sfx/boss-warning-line.ogg',
      '/assets/audio/goal16/sfx/boss-warning-disc.ogg',
      '/assets/audio/goal16/sfx/boss-warning-ring.ogg',
      '/assets/audio/goal16/sfx/shell-hit-01.ogg',
      '/assets/audio/goal16/sfx/shell-hit-02.ogg',
      '/assets/audio/goal16/sfx/flesh-hit-01.ogg',
      '/assets/audio/goal16/sfx/player-hurt-01.ogg',
      '/assets/audio/goal16/sfx/kill-01.ogg',
      '/assets/audio/goal16/sfx/kill-02.ogg',
    ])
    const stressBuffers = new Map<string, AudioBuffer>()
    for (const url of urls) {
      let buffer = this.externalBuffers.get(url)
      if (!buffer) {
        const response = await fetch(assetUrl(url))
        if (!response.ok) throw new Error(`Audio audit fetch failed ${response.status}: ${url}`)
        buffer = await context.decodeAudioData(await response.arrayBuffer())
      }
      const record = { url, loop: loopUrls.has(url), ...inspectGloamwoodDecodedAudio(buffer) }
      if (stressUrls.has(url)) stressBuffers.set(url, buffer)
      records.push(record)
      // decodeAudioData resamples to the hardware AudioContext (commonly
      // 48 kHz). Source-rate authority remains the OGG-header verifier.
      if (record.peakDbfs > -1) failures.push(`${url}: peak ${record.peakDbfs.toFixed(2)} dBFS`)
      if (!record.loop && record.onsetMilliseconds > 12) failures.push(`${url}: onset ${record.onsetMilliseconds.toFixed(1)} ms`)
      if (!record.loop && record.trailingSilenceMilliseconds > 50) failures.push(`${url}: silent tail ${record.trailingSilenceMilliseconds.toFixed(1)} ms`)
      if (!record.loop && record.endWindowPeakDbfs > -30) failures.push(`${url}: cut tail ${record.endWindowPeakDbfs.toFixed(1)} dBFS`)
      if (record.loop && record.loopEdgeJump > 0.08) failures.push(`${url}: loop edge ${record.loopEdgeJump.toFixed(4)}`)
      if (/boss-warning|enemy-telegraph/.test(url) && record.usefulBandRatio < 0.35) {
        failures.push(`${url}: useful-band ratio ${record.usefulBandRatio.toFixed(3)}`)
      }
    }
    const stressPeakDbtp = await this.renderStressPeakForReview(stressBuffers)
    if (stressPeakDbtp > -1) failures.push(`stress mix peak ${stressPeakDbtp.toFixed(2)} dBTP`)
    return { records, failures, stressPeakDbtp, passed: failures.length === 0 }
  }

  /** Four-times output rate approximates inter-sample true peak. */
  private async renderStressPeakForReview(buffers: ReadonlyMap<string, AudioBuffer>) {
    const sampleRate = 192_000
    const offline = new OfflineAudioContext(2, sampleRate * 2, sampleRate)
    const compressor = offline.createDynamicsCompressor()
    compressor.threshold.value = -10
    compressor.knee.value = 16
    compressor.ratio.value = 4
    compressor.attack.value = 0.012
    compressor.release.value = 0.22
    const limiter = offline.createWaveShaper()
    limiter.curve = createGloamwoodMasterLimiterCurve()
    limiter.oversample = '4x'
    const ceiling = offline.createGain()
    ceiling.gain.value = GLOAMWOOD_MASTER_LIMITER.output
    compressor.connect(limiter).connect(ceiling).connect(offline.destination)
    const layers = [
      [GLOAMWOOD_GOAL16_LOOPS.music.pulse, 0.46, 0],
      [GLOAMWOOD_GOAL16_LOOPS.music.boss, 0.92, 0],
      [GLOAMWOOD_GOAL16_LOOPS.ambience.forest, 0.22, 0],
      [GLOAMWOOD_GOAL16_LOOPS.ambience.defence, 0.68, 0],
      ['/assets/audio/goal16/sfx/boss-intro-warden.ogg', 0.94, 0.2],
      ['/assets/audio/goal16/sfx/boss-warning-line.ogg', 0.86, 0.55],
      ['/assets/audio/goal16/sfx/boss-warning-disc.ogg', 0.86, 0.7],
      ['/assets/audio/goal16/sfx/boss-warning-ring.ogg', 0.88, 0.7],
      ['/assets/audio/goal16/sfx/shell-hit-01.ogg', 0.94, 0.72],
      ['/assets/audio/goal16/sfx/shell-hit-02.ogg', 0.92, 0.72],
      ['/assets/audio/goal16/sfx/flesh-hit-01.ogg', 0.82, 0.72],
      ['/assets/audio/goal16/sfx/player-hurt-01.ogg', 0.78, 0.72],
      ['/assets/audio/goal16/sfx/kill-01.ogg', 0.66, 0.72],
      ['/assets/audio/goal16/sfx/kill-02.ogg', 0.64, 0.72],
    ] as const
    for (const [url, gainAmount, start] of layers) {
      const buffer = buffers.get(url)
      if (!buffer) throw new Error(`Stress audit buffer missing: ${url}`)
      const source = offline.createBufferSource()
      const gain = offline.createGain()
      source.buffer = buffer
      gain.gain.value = gainAmount
      source.connect(gain).connect(compressor)
      source.start(start)
    }
    const rendered = await offline.startRendering()
    let peak = 0
    for (let channel = 0; channel < rendered.numberOfChannels; channel += 1) {
      for (const sample of rendered.getChannelData(channel)) peak = Math.max(peak, Math.abs(sample))
    }
    return dbfs(peak)
  }

  private ensureGraph() {
    const context = this.context
    if (!context || this.masterGain) return
    const limiter = context.createDynamicsCompressor()
    limiter.threshold.value = -10
    limiter.knee.value = 16
    limiter.ratio.value = 4
    limiter.attack.value = 0.012
    limiter.release.value = 0.22
    this.masterGain = context.createGain()
    this.musicGain = context.createGain()
    this.sfxGain = context.createGain()
    this.ambienceGain = context.createGain()
    // A forest bed should enter like the player has walked into it, not like a
    // menu track has started. `ensureAmbient` raises it only after media.play.
    this.musicGain.gain.value = 0
    this.sfxGain.gain.value = this.mix.sfx
    this.ambienceGain.gain.value = this.mix.ambience
    this.musicGain.connect(this.masterGain)
    this.sfxGain.connect(this.masterGain)
    this.ambienceGain.connect(this.masterGain)
    const softLimiter = context.createWaveShaper()
    softLimiter.curve = createGloamwoodMasterLimiterCurve()
    softLimiter.oversample = '4x'
    const ceiling = context.createGain()
    ceiling.gain.value = GLOAMWOOD_MASTER_LIMITER.output
    this.masterGain.connect(limiter).connect(softLimiter).connect(ceiling).connect(context.destination)
    this.applyBusGains()
  }

  private applyMasterGain() {
    if (!this.context || !this.masterGain) return
    const now = this.context.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.mix.master, now, 0.018)
  }

  private applyBusGains() {
    const now = this.context?.currentTime
    if (now === undefined) return
    this.applyMasterGain()
    this.musicGain?.gain.setTargetAtTime(this.mix.music, now, 0.025)
    this.sfxGain?.gain.setTargetAtTime(this.mix.sfx, now, 0.025)
    this.ambienceGain?.gain.setTargetAtTime(this.mix.ambience, now, 0.025)
  }

  private ensureAmbient() {
    const context = this.context
    if (!context || !this.musicGain || !this.ambienceGain || typeof Audio === 'undefined') return
    if (this.loopMedia.size === 0) {
      for (const [name, url] of Object.entries(GLOAMWOOD_GOAL16_LOOPS.music)) this.createLoop(`music:${name}`, url, this.musicGain)
      for (const [name, url] of Object.entries(GLOAMWOOD_GOAL16_LOOPS.ambience)) this.createLoop(`ambience:${name}`, url, this.ambienceGain)
      this.applyMusicState(0)
      this.applyWeatherState(0)
    }
    void Promise.all([...this.loopMedia.values()].map((media) => media.play().catch(() => undefined)))
  }

  private createLoop(key: string, url: string, output: GainNode) {
    const context = this.context
    if (!context || this.loopMedia.has(key)) return
    const media = new Audio(assetUrl(url))
    media.loop = true
    media.preload = 'auto'
    const source = context.createMediaElementSource(media)
    const gain = context.createGain()
    gain.gain.value = 0
    source.connect(gain).connect(output)
    this.loopMedia.set(key, media)
    this.loopSources.set(key, source)
    this.loopGains.set(key, gain)
  }

  private rampLoop(key: string, target: number, seconds: number) {
    const context = this.context
    const gain = this.loopGains.get(key)?.gain
    if (!context || !gain) return
    const now = context.currentTime
    gain.cancelScheduledValues(now)
    const start = gain.value
    gain.setValueAtTime(start, now)
    if (seconds <= 0) gain.setValueAtTime(target, now)
    else {
      // A matched sine/cosine pair keeps perceived energy steady when one
      // state leaves as another enters. Linear crossfades dip in the middle,
      // which sounded like a loading gap exactly when danger arrived.
      const curve = new Float32Array(32)
      for (let index = 0; index < curve.length; index += 1) {
        const progress = index / (curve.length - 1)
        const shaped = target >= start
          ? Math.sin(progress * Math.PI * 0.5)
          : 1 - Math.cos(progress * Math.PI * 0.5)
        curve[index] = start + (target - start) * shaped
      }
      gain.setValueCurveAtTime(curve, now, seconds)
    }
  }

  private applyMusicState(seconds: number) {
    const mix = gloamwoodMusicLayerMix(this.musicState)
    this.rampLoop('music:world', mix.world, seconds)
    this.rampLoop('music:pulse', mix.pulse, seconds)
    this.rampLoop('music:boss', mix.boss, seconds)
  }

  private applyWeatherState(seconds: number) {
    const mix = gloamwoodWeatherLayerMix(this.weatherState)
    this.rampLoop('ambience:forest', mix.forest, seconds)
    this.rampLoop('ambience:rain', mix.rain, seconds)
    this.rampLoop('ambience:defence', mix.defence, seconds)
  }

  private playImpact(event: GloamwoodSoundEvent, profile: GloamwoodSoundProfile, now: number, variation: number) {
    this.playTone(profile.oscillator, profile.frequency * variation, profile.endFrequency * variation, now, profile.durationSeconds, profile.gain)
    if (event === 'kill') this.playTone('sine', 146 * variation, 292 * variation, now + 0.055, 0.24, 0.026)
    else if (event === 'boss-intro') this.playTone('triangle', 49 * variation, 98 * variation, now + 0.12, 0.54, 0.05)
    else if (event === 'victory') this.playTone('sine', 294 * variation, 784 * variation, now + 0.12, 0.62, 0.036)
  }

  private playTone(oscillatorType: OscillatorType, frequency: number, endFrequency: number, start: number, duration: number, gainAmount: number) {
    const context = this.context
    const output = this.sfxGain
    if (!context || !output) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = oscillatorType
    oscillator.frequency.setValueAtTime(Math.max(24, frequency), start)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, endFrequency), start + duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainAmount), start + Math.min(0.012, duration * 0.16))
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain).connect(output)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.01)
  }

  private warmExternalBuffers() {
    const urls = new Set(allGloamwoodExternalAudioAssets().map((asset) => asset.url))
    for (const url of urls) void this.loadExternalBuffer(url)
  }

  /**
   * The one cue allowed to survive the autoplay boundary must wait for its
   * authored buffer. Calling `play()` immediately after `resume()` races the
   * first decode and silently loses the entrance; routine combat deliberately
   * keeps the stricter drop-rather-than-replay rule.
   */
  private playPendingEncounterSignal(pending: { event: GloamwoodSoundEvent; soundContext: GloamwoodSoundContext }) {
    const assets = getGloamwoodExternalAudioAssets(pending.event, pending.soundContext)
    const first = assets[0]
    if (!first) {
      this.play(pending.event, pending.soundContext)
      return
    }
    void this.loadExternalBuffer(first.url).then((buffer) => {
      if (!buffer || !this.context || this.context.state !== 'running') return
      this.play(pending.event, pending.soundContext)
    })
  }

  private prefetchExternalBytes(url: string) {
    const existing = this.externalBytes.get(url)
    if (existing) return existing
    const request = fetch(assetUrl(url))
      .then((response) => response.ok ? response.arrayBuffer() : undefined)
      .catch(() => undefined)
    this.externalBytes.set(url, request)
    return request
  }

  private loadExternalBuffer(url: string) {
    const context = this.context
    if (!context || context.state === 'closed' || this.externalBuffers.has(url)) return Promise.resolve(this.externalBuffers.get(url))
    const activeLoad = this.externalBufferLoads.get(url)
    if (activeLoad) return activeLoad
    const loading = this.prefetchExternalBytes(url)
      .then((bytes) => bytes ? context.decodeAudioData(bytes) : undefined)
      .then((buffer) => {
        if (buffer && this.context === context && context.state !== 'closed') this.externalBuffers.set(url, buffer)
        return buffer
      })
      .catch(() => undefined)
      .finally(() => this.externalBufferLoads.delete(url))
    this.externalBufferLoads.set(url, loading)
    return loading
  }

  private playExternal(event: GloamwoodSoundEvent, asset: GloamwoodExternalAudioAsset, now: number) {
    const context = this.context
    const output = this.sfxGain
    if (!context || !output) return
    const cooldown = EXTERNAL_EVENT_COOLDOWNS[event] ?? 0
    const lastPlayedAt = this.lastExternalEventAt.get(event) ?? -Infinity
    if (now - lastPlayedAt < cooldown) return
    if (this.activeExternalSources.size >= MAX_GLOAMWOOD_EXTERNAL_SOURCES) {
      // Footsteps are expendable; a real attack or confirmed hit is not.
      if (event === 'footstep') return
      const oldest = this.activeExternalSources.values().next().value as AudioBufferSourceNode | undefined
      try { oldest?.stop() } catch { /* source may already have ended */ }
    }
    const buffer = this.externalBuffers.get(asset.url)
    if (!buffer) {
      // Never create a one-off HTML media graph in the combat loop. A silent
      // first cue is preferable to a frame hitch; the decoded buffer handles
      // the next identical event.
      void this.loadExternalBuffer(asset.url)
      return
    }
    const source = context.createBufferSource()
    source.buffer = buffer
    const gain = context.createGain()
    gain.gain.setValueAtTime(asset.gain, now)
    source.connect(gain).connect(output)
    const cleanup = () => {
      source.disconnect()
      gain.disconnect()
      this.activeExternalSources.delete(source)
    }
    source.addEventListener('ended', cleanup, { once: true })
    this.activeExternalSources.add(source)
    this.lastExternalEventAt.set(event, now)
    source.start(now)
    if (asset.durationSeconds && asset.durationSeconds < buffer.duration) source.stop(now + asset.durationSeconds)
  }

  private duckMusic(now: number, eventDuration: number) {
    const gain = this.musicGain?.gain
    if (!gain) return
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(gain.value, now)
    gain.linearRampToValueAtTime(this.mix.music * 0.62, now + 0.035)
    gain.linearRampToValueAtTime(this.mix.music, now + eventDuration + 0.42)
  }

  dispose() {
    for (const media of this.loopMedia.values()) {
      media.pause()
      media.removeAttribute('src')
      media.load()
    }
    for (const source of this.loopSources.values()) source.disconnect()
    for (const gain of this.loopGains.values()) gain.disconnect()
    this.loopMedia.clear()
    this.loopSources.clear()
    this.loopGains.clear()
    for (const source of this.activeExternalSources) {
      source.disconnect()
      try { source.stop() } catch { /* source may already have ended */ }
    }
    this.activeExternalSources.clear()
    this.lastExternalEventAt.clear()
    this.externalBytes.clear()
    this.externalBuffers.clear()
    this.externalBufferLoads.clear()
    void this.context?.close()
    this.context = undefined
    this.masterGain = undefined
    this.musicGain = undefined
    this.sfxGain = undefined
    this.ambienceGain = undefined
  }
}
