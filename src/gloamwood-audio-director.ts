export type GloamwoodMusicState =
  | 'explore'
  | 'threat'
  | 'elite'
  | 'boss-intro'
  | 'boss-phase-1'
  | 'boss-phase-2'
  | 'victory'
  | 'defeat'

export type GloamwoodWeatherAudioState = 'dawn' | 'mist' | 'rain' | 'defence'

export interface GloamwoodAudioMixSettings {
  master: number
  music: number
  sfx: number
  ambience: number
  muted: boolean
}

export const DEFAULT_GLOAMWOOD_AUDIO_MIX: Readonly<GloamwoodAudioMixSettings> = {
  master: 0.8,
  music: 0.72,
  sfx: 0.86,
  ambience: 0.62,
  muted: false,
}

export const GLOAMWOOD_AUDIO_MIX_STORAGE_KEY = 'evolution-arena-audio-mix-v2'

function finiteUnit(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback
}

export function normalizeGloamwoodAudioMix(value: unknown): GloamwoodAudioMixSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_GLOAMWOOD_AUDIO_MIX }
  const candidate = value as Partial<GloamwoodAudioMixSettings>
  return {
    master: finiteUnit(candidate.master, DEFAULT_GLOAMWOOD_AUDIO_MIX.master),
    music: finiteUnit(candidate.music, DEFAULT_GLOAMWOOD_AUDIO_MIX.music),
    sfx: finiteUnit(candidate.sfx, DEFAULT_GLOAMWOOD_AUDIO_MIX.sfx),
    ambience: finiteUnit(candidate.ambience, DEFAULT_GLOAMWOOD_AUDIO_MIX.ambience),
    muted: typeof candidate.muted === 'boolean' ? candidate.muted : DEFAULT_GLOAMWOOD_AUDIO_MIX.muted,
  }
}

/** Five useful positions stay fast on touch while preserving independent buses. */
export function cycleGloamwoodAudioLevel(value: number) {
  const steps = [0, 0.25, 0.5, 0.75, 1] as const
  const current = steps.findIndex((step) => Math.abs(step - value) < 0.01)
  if (current >= 0) return steps[(current + 1) % steps.length]
  // Authored defaults intentionally sit between the coarse touch-friendly
  // steps. Their first press must move *up* to the next readable level, not
  // fall through the old `findIndex === -1` arithmetic and mute the bus.
  return steps.find((step) => step > value) ?? steps[0]
}

export interface GloamwoodMusicSituation {
  terminal?: 'victory' | 'defeat' | null
  bossIntro: boolean
  bossActive: boolean
  bossPhase: 1 | 2
  eliteActive: boolean
  committedThreats: number
}

/**
 * Pure priority resolver. Presentation reports facts; the audio director never
 * infers damage, wakes a creature or changes combat authority.
 */
export function resolveGloamwoodMusicState(situation: GloamwoodMusicSituation): GloamwoodMusicState {
  if (situation.terminal) return situation.terminal
  if (situation.bossIntro) return 'boss-intro'
  if (situation.bossActive) return situation.bossPhase === 2 ? 'boss-phase-2' : 'boss-phase-1'
  if (situation.eliteActive) return 'elite'
  if (situation.committedThreats > 0) return 'threat'
  return 'explore'
}

export interface GloamwoodMusicTransition {
  from: GloamwoodMusicState
  to: GloamwoodMusicState
  fadeSeconds: number
  restart: boolean
  reason: string
}

export function planGloamwoodMusicTransition(
  from: GloamwoodMusicState,
  to: GloamwoodMusicState,
  reason: string,
): GloamwoodMusicTransition | null {
  if (from === to) return null
  const terminal = to === 'victory' || to === 'defeat'
  const bossBoundary = to === 'boss-intro' || to.startsWith('boss-phase') || from.startsWith('boss-')
  return {
    from,
    to,
    fadeSeconds: terminal ? 0.55 : bossBoundary ? 0.9 : 1.35,
    restart: to === 'boss-intro' || terminal,
    reason,
  }
}

export interface GloamwoodMusicLayerMix {
  world: number
  pulse: number
  boss: number
}

/** Layer gains are programme targets before the user's music control. */
export function gloamwoodMusicLayerMix(state: GloamwoodMusicState): GloamwoodMusicLayerMix {
  switch (state) {
    case 'explore': return { world: 0.72, pulse: 0, boss: 0 }
    case 'threat': return { world: 0.62, pulse: 0.42, boss: 0 }
    case 'elite': return { world: 0.54, pulse: 0.68, boss: 0 }
    case 'boss-intro': return { world: 0.12, pulse: 0.2, boss: 0.72 }
    case 'boss-phase-1': return { world: 0, pulse: 0.18, boss: 0.82 }
    case 'boss-phase-2': return { world: 0, pulse: 0.46, boss: 0.92 }
    case 'victory':
    case 'defeat': return { world: 0, pulse: 0, boss: 0 }
  }
}

export function gloamwoodWeatherLayerMix(weather: GloamwoodWeatherAudioState) {
  if (weather === 'defence') return { forest: 0.22, rain: 0, defence: 0.68 }
  if (weather === 'rain') return { forest: 0.48, rain: 0.72, defence: 0 }
  if (weather === 'mist') return { forest: 0.42, rain: 0.08, defence: 0 }
  return { forest: 0.62, rain: 0, defence: 0 }
}
