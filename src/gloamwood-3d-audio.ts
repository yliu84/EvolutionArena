import type { FeedbackVolume } from './player-hit-feedback'
import { assetUrl } from './asset-url'

export type GloamwoodSoundEvent =
  | 'footstep'
  | 'land'
  | 'attack-bite'
  | 'attack-pounce'
  | 'attack-claw'
  | 'attack-tail'
  | 'hit-light'
  | 'hit-heavy'
  | 'kill'
  /** An enemy has confirmed damage against the player; never a player attack cue. */
  | 'enemy-hit-player'
  | 'player-death'
  | 'evolution-open'
  | 'evolution-select'
  | 'elite-intro'
  | 'boss-intro'
  | 'boss-phase'
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
  provenance: 'congusbongus, Cathedral in the forest (ambient loop), CC0; downloaded from OpenGameArt.',
  sourceUrl: 'https://opengameart.org/content/cathedral-in-the-forest-ambient-loop',
  filename: '/assets/audio/goal8/river-valley-forest-music.ogg',
  // Music stays behind movement and combat; user volume applies at the master bus.
  musicGain: 0.035,
  fadeInSeconds: 2.4,
} as const

export interface GloamwoodExternalAudioAsset {
  url: string
  gain: number
  /** Long source files are intentionally stopped before their cinematic tails. */
  durationSeconds?: number
}

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
  'attack-bite': [{ url: '/assets/audio/goal8/attack-bite-swish-01.m4a', gain: 0.042, durationSeconds: 0.24 }],
  'attack-pounce': [{ url: '/assets/audio/goal8/attack-pounce-swish-01.m4a', gain: 0.048, durationSeconds: 0.28 }],
  'attack-claw': [{ url: '/assets/audio/goal8/attack-bite-swish-01.m4a', gain: 0.04, durationSeconds: 0.2 }],
  'attack-tail': [{ url: '/assets/audio/goal8/attack-tail-swish-01.m4a', gain: 0.048, durationSeconds: 0.28 }],
  'hit-light': [{ url: '/assets/audio/goal8/hit-bite-crunch-01.ogg', gain: 0.055, durationSeconds: 0.14 }],
  'hit-heavy': [{ url: '/assets/audio/goal8/hit-bite-crunch-02.ogg', gain: 0.065, durationSeconds: 0.18 }],
  kill: [{ url: '/assets/audio/goal8/hit-bite-crunch-02.ogg', gain: 0.05, durationSeconds: 0.14 }],
  'enemy-hit-player': [{ url: '/assets/audio/goal8/player-hurt-creature-01.ogg', gain: 0.04, durationSeconds: 0.16 }],
  'player-death': [{ url: '/assets/audio/goal8/player-hurt-creature-01.ogg', gain: 0.065, durationSeconds: 0.3 }],
}

export function getGloamwoodExternalAudioAssets(event: GloamwoodSoundEvent) {
  return GLOAMWOOD_EXTERNAL_AUDIO[event] ?? []
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
  kill: { tier: 'large', oscillator: 'triangle', frequency: 156, endFrequency: 42, durationSeconds: 0.3, gain: 0.068 },
  'enemy-hit-player': { tier: 'medium', oscillator: 'triangle', frequency: 94, endFrequency: 37, durationSeconds: 0.16, gain: 0.04 },
  'player-death': { tier: 'large', oscillator: 'sawtooth', frequency: 88, endFrequency: 26, durationSeconds: 0.56, gain: 0.067 },
  'evolution-open': { tier: 'large', oscillator: 'sine', frequency: 174, endFrequency: 392, durationSeconds: 0.46, gain: 0.052 },
  'evolution-select': { tier: 'large', oscillator: 'triangle', frequency: 220, endFrequency: 523, durationSeconds: 0.54, gain: 0.06 },
  'elite-intro': { tier: 'large', oscillator: 'square', frequency: 98, endFrequency: 62, durationSeconds: 0.34, gain: 0.055 },
  'boss-intro': { tier: 'large', oscillator: 'sawtooth', frequency: 68, endFrequency: 27, durationSeconds: 0.66, gain: 0.071 },
  'boss-phase': { tier: 'large', oscillator: 'sawtooth', frequency: 76, endFrequency: 30, durationSeconds: 0.5, gain: 0.068 },
  victory: { tier: 'large', oscillator: 'triangle', frequency: 196, endFrequency: 659, durationSeconds: 0.74, gain: 0.065 },
  defeat: { tier: 'large', oscillator: 'sawtooth', frequency: 92, endFrequency: 28, durationSeconds: 0.7, gain: 0.062 },
}

export function getGloamwoodSoundProfile(event: GloamwoodSoundEvent) {
  return { ...PROFILES[event] }
}

/** A miss deliberately stops after anticipation + swing; impact is a separate confirmed event. */
export function getGloamwoodSoundLayers(event: GloamwoodSoundEvent): readonly GloamwoodSoundLayer[] {
  if (event.startsWith('attack-')) return ['anticipation', 'swing']
  if (event === 'hit-light' || event === 'hit-heavy' || event === 'enemy-hit-player' || event === 'land') return ['impact', 'body']
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
}

export function isGloamwoodEncounterSignal(event: GloamwoodSoundEvent) {
  return event === 'elite-intro' || event === 'boss-intro'
}

export class GloamwoodAudioBus {
  private context?: AudioContext
  private masterGain?: GainNode
  private musicGain?: GainNode
  private sfxGain?: GainNode
  private ambientMedia?: HTMLAudioElement
  private ambientMediaSource?: MediaElementAudioSourceNode
  private readonly externalBytes = new Map<string, Promise<ArrayBuffer | undefined>>()
  private readonly externalBuffers = new Map<string, AudioBuffer>()
  private readonly externalBufferLoads = new Map<string, Promise<AudioBuffer | undefined>>()
  private readonly activeExternalSources = new Set<AudioBufferSourceNode>()
  private readonly lastExternalEventAt = new Map<GloamwoodSoundEvent, number>()
  private volume: FeedbackVolume
  private muted: boolean
  private sequence = 0
  private unlocked = false
  private pendingEncounterSignal?: GloamwoodSoundEvent

  constructor(volume: FeedbackVolume, muted = false) {
    this.volume = volume
    this.muted = muted
    // Downloading these small files is silent. It removes the only uncertain
    // network step before the player's first actual swing without violating
    // the first-gesture audio-start boundary.
    for (const url of new Set(Object.values(GLOAMWOOD_EXTERNAL_AUDIO).flat().map((asset) => asset.url))) {
      void this.prefetchExternalBytes(url)
    }
  }

  setVolume(volume: FeedbackVolume) {
    this.volume = volume
    this.applyMasterGain()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.applyMasterGain()
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
        if (pendingEncounterSignal) this.play(pendingEncounterSignal)
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

  play(event: GloamwoodSoundEvent) {
    const context = this.context
    if (!context) {
      // Debug gates can awaken an encounter before the player's first trusted
      // gesture. Preserve only that high-value cue; routine combat sounds must
      // never queue and burst when audio later unlocks.
      if (isGloamwoodEncounterSignal(event)) this.pendingEncounterSignal = event
      return false
    }
    if (this.volume === 0 || this.muted) return false
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
    const externalAssets = getGloamwoodExternalAudioAssets(event)
    if (externalAssets.length > 0) {
      this.playExternal(event, externalAssets[sequence % externalAssets.length], now)
      if (event === 'kill') this.playTone('sine', 174, 208, now + 0.045, 0.12, 0.012)
      else if (event === 'player-death') this.playTone('triangle', 78, 42, now + 0.07, 0.24, 0.018)
    } else this.playImpact(event, profile, now, 1 + ((sequence % 5) - 2) * 0.018)
    if (profile.tier === 'large') this.duckMusic(now, profile.durationSeconds)
    return true
  }

  snapshot(): GloamwoodAudioSnapshot {
    return {
      unlocked: this.unlocked,
      contextState: this.context?.state ?? (this.unlocked ? 'unavailable' : 'closed'),
      ambientActive: Boolean(this.ambientMedia && !this.ambientMedia.paused),
      muted: this.muted,
      volume: this.volume,
      pendingEncounterSignal: this.pendingEncounterSignal ?? null,
      bufferedExternalAssets: this.externalBuffers.size,
      loadingExternalAssets: this.externalBufferLoads.size,
      activeExternalSources: this.activeExternalSources.size,
    }
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
    // A forest bed should enter like the player has walked into it, not like a
    // menu track has started. `ensureAmbient` raises it only after media.play.
    this.musicGain.gain.value = 0
    this.sfxGain.gain.value = 1
    this.musicGain.connect(this.masterGain)
    this.sfxGain.connect(this.masterGain)
    this.masterGain.connect(limiter).connect(context.destination)
    this.applyMasterGain()
  }

  private applyMasterGain() {
    if (!this.context || !this.masterGain) return
    const now = this.context.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, now, 0.018)
  }

  private ensureAmbient() {
    const context = this.context
    if (!context || !this.musicGain || this.ambientMedia || typeof Audio === 'undefined') return
    const media = new Audio(assetUrl(RIVER_VALLEY_AMBIENT.filename))
    media.loop = true
    media.preload = 'auto'
    const source = context.createMediaElementSource(media)
    source.connect(this.musicGain)
    this.ambientMedia = media
    this.ambientMediaSource = source
    void media.play().then(() => this.fadeAmbientIn()).catch(() => {})
  }

  private fadeAmbientIn() {
    const context = this.context
    const gain = this.musicGain?.gain
    if (!context || !gain) return
    const now = context.currentTime
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(0, now)
    gain.linearRampToValueAtTime(RIVER_VALLEY_AMBIENT.musicGain, now + RIVER_VALLEY_AMBIENT.fadeInSeconds)
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
    const urls = new Set(Object.values(GLOAMWOOD_EXTERNAL_AUDIO).flat().map((asset) => asset.url))
    for (const url of urls) void this.loadExternalBuffer(url)
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
    gain.linearRampToValueAtTime(RIVER_VALLEY_AMBIENT.musicGain * 0.58, now + 0.035)
    gain.linearRampToValueAtTime(RIVER_VALLEY_AMBIENT.musicGain, now + eventDuration + 0.42)
  }

  dispose() {
    this.ambientMedia?.pause()
    this.ambientMediaSource?.disconnect()
    this.ambientMedia?.removeAttribute('src')
    this.ambientMedia?.load()
    this.ambientMedia = undefined
    this.ambientMediaSource = undefined
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
  }
}
