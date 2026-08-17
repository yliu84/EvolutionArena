import type { FeedbackVolume } from './player-hit-feedback'

export type GloamwoodSoundEvent =
  | 'footstep'
  | 'attack-bite'
  | 'attack-pounce'
  | 'attack-claw'
  | 'attack-tail'
  | 'hit-light'
  | 'hit-heavy'
  | 'kill'
  | 'player-hit'
  | 'evolution-open'
  | 'evolution-select'
  | 'boss-phase'
  | 'victory'
  | 'defeat'

export interface GloamwoodSoundProfile {
  tier: 'small' | 'medium' | 'large'
  oscillator: OscillatorType
  frequency: number
  endFrequency: number
  durationSeconds: number
  gain: number
  noiseGain: number
}

const PROFILES: Record<GloamwoodSoundEvent, GloamwoodSoundProfile> = {
  footstep: { tier: 'small', oscillator: 'sine', frequency: 82, endFrequency: 48, durationSeconds: 0.09, gain: 0.022, noiseGain: 0.018 },
  'attack-bite': { tier: 'small', oscillator: 'triangle', frequency: 210, endFrequency: 92, durationSeconds: 0.12, gain: 0.032, noiseGain: 0.026 },
  'attack-pounce': { tier: 'medium', oscillator: 'sawtooth', frequency: 138, endFrequency: 54, durationSeconds: 0.19, gain: 0.043, noiseGain: 0.04 },
  'attack-claw': { tier: 'small', oscillator: 'triangle', frequency: 330, endFrequency: 126, durationSeconds: 0.11, gain: 0.03, noiseGain: 0.035 },
  'attack-tail': { tier: 'medium', oscillator: 'sawtooth', frequency: 116, endFrequency: 42, durationSeconds: 0.22, gain: 0.046, noiseGain: 0.052 },
  'hit-light': { tier: 'medium', oscillator: 'square', frequency: 104, endFrequency: 51, durationSeconds: 0.1, gain: 0.047, noiseGain: 0.044 },
  'hit-heavy': { tier: 'medium', oscillator: 'square', frequency: 82, endFrequency: 38, durationSeconds: 0.16, gain: 0.06, noiseGain: 0.06 },
  kill: { tier: 'large', oscillator: 'triangle', frequency: 146, endFrequency: 46, durationSeconds: 0.28, gain: 0.068, noiseGain: 0.055 },
  'player-hit': { tier: 'medium', oscillator: 'square', frequency: 96, endFrequency: 39, durationSeconds: 0.17, gain: 0.06, noiseGain: 0.052 },
  'evolution-open': { tier: 'large', oscillator: 'sine', frequency: 174, endFrequency: 392, durationSeconds: 0.46, gain: 0.052, noiseGain: 0.012 },
  'evolution-select': { tier: 'large', oscillator: 'triangle', frequency: 220, endFrequency: 523, durationSeconds: 0.54, gain: 0.06, noiseGain: 0.018 },
  'boss-phase': { tier: 'large', oscillator: 'sawtooth', frequency: 72, endFrequency: 31, durationSeconds: 0.48, gain: 0.07, noiseGain: 0.065 },
  victory: { tier: 'large', oscillator: 'triangle', frequency: 196, endFrequency: 659, durationSeconds: 0.72, gain: 0.065, noiseGain: 0.012 },
  defeat: { tier: 'large', oscillator: 'sawtooth', frequency: 92, endFrequency: 28, durationSeconds: 0.68, gain: 0.062, noiseGain: 0.045 },
}

export function getGloamwoodSoundProfile(event: GloamwoodSoundEvent) {
  return { ...PROFILES[event] }
}

export class GloamwoodAudioBus {
  private context?: AudioContext
  private volume: FeedbackVolume
  private sequence = 0

  constructor(volume: FeedbackVolume) {
    this.volume = volume
  }

  setVolume(volume: FeedbackVolume) {
    this.volume = volume
  }

  unlock() {
    try {
      this.context ??= new AudioContext()
      if (this.context.state === 'suspended') void this.context.resume()
    } catch {
      // The complete run remains playable when Web Audio is blocked.
    }
  }

  play(event: GloamwoodSoundEvent) {
    const context = this.context
    if (!context || context.state !== 'running' || this.volume === 0) return false
    const profile = PROFILES[event]
    const now = context.currentTime
    const duration = profile.durationSeconds
    const variation = 1 + ((this.sequence++ % 5) - 2) * 0.018
    const oscillator = context.createOscillator()
    const oscillatorGain = context.createGain()
    oscillator.type = profile.oscillator
    oscillator.frequency.setValueAtTime(profile.frequency * variation, now)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, profile.endFrequency * variation), now + duration)
    oscillatorGain.gain.setValueAtTime(0.0001, now)
    oscillatorGain.gain.exponentialRampToValueAtTime(profile.gain * this.volume, now + Math.min(0.012, duration * 0.16))
    oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(oscillatorGain).connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.01)
    if (profile.noiseGain > 0) this.playNoise(profile, now, variation)
    return true
  }

  private playNoise(profile: GloamwoodSoundProfile, now: number, variation: number) {
    const context = this.context
    if (!context) return
    const sampleCount = Math.max(64, Math.floor(context.sampleRate * profile.durationSeconds))
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < sampleCount; index += 1) {
      const envelope = 1 - index / sampleCount
      data[index] = (Math.sin(index * 12.9898) * 0.62 + Math.sin(index * 3.73) * 0.38) * envelope
    }
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    filter.type = 'lowpass'
    filter.frequency.value = Math.max(320, profile.frequency * 5.5 * variation)
    gain.gain.setValueAtTime(profile.noiseGain * this.volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.durationSeconds)
    source.buffer = buffer
    source.connect(filter).connect(gain).connect(context.destination)
    source.start(now)
  }

  dispose() {
    void this.context?.close()
    this.context = undefined
  }
}
