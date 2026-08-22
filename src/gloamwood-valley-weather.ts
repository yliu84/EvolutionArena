import type { GloamwoodValleyDressing } from './gloamwood-valley-dressing'

/**
 * Presentation-only weather for the River Valley.
 *
 * These are deliberately weather moods, not an authoritative day/night clock:
 * the hunt stays readable, seeded sessions stay reproducible, and no combat or
 * map rule changes when a different sky is selected.
 */
export type GloamwoodValleyWeatherId = 'dawn' | 'mist' | 'rain'

export interface GloamwoodValleyWeather {
  id: GloamwoodValleyWeatherId
  /** Scene clear colour beyond the existing distance fog. */
  backgroundColor: number
  /** Amount of the regional fog colour replaced by this weather's tint. */
  fogTint: number
  fogTintStrength: number
  fogDensityMultiplier: number
  sunTint: number
  sunTintStrength: number
  sunIntensityMultiplier: number
  ambientMultiplier: number
  /** One camera-local line batch only; never a world-wide rain simulation. */
  rain: boolean
}

export interface GloamwoodValleyWeatherAtmosphere {
  fogColor: number
  fogDensity: number
  sunColor: number
  sunIntensity: number
  ambientIntensity: number
}

export const GLOAMWOOD_VALLEY_WEATHER: readonly GloamwoodValleyWeather[] = [
  {
    id: 'dawn',
    backgroundColor: 0x8ba7a0,
    fogTint: 0xb8c8b8,
    fogTintStrength: 0.16,
    fogDensityMultiplier: 0.94,
    sunTint: 0xffe1ae,
    sunTintStrength: 0.22,
    sunIntensityMultiplier: 1.08,
    ambientMultiplier: 1.03,
    rain: false,
  },
  {
    id: 'mist',
    backgroundColor: 0x667a76,
    fogTint: 0x93aaa1,
    fogTintStrength: 0.52,
    fogDensityMultiplier: 1.16,
    sunTint: 0xd7e0d0,
    sunTintStrength: 0.38,
    sunIntensityMultiplier: 0.82,
    ambientMultiplier: 0.98,
    rain: false,
  },
  {
    // Dusk, not black night: every target plate and Boss ground tell must stay
    // legible on a phone without introducing a new lighting gameplay rule.
    id: 'rain',
    backgroundColor: 0x3f5860,
    fogTint: 0x6f8988,
    fogTintStrength: 0.58,
    fogDensityMultiplier: 1.1,
    sunTint: 0x9fb7be,
    sunTintStrength: 0.64,
    sunIntensityMultiplier: 0.72,
    ambientMultiplier: 0.94,
    rain: true,
  },
]

export function resolveGloamwoodValleyWeather(
  requested: string | null | undefined,
  seed: string | number,
): GloamwoodValleyWeather {
  const explicit = GLOAMWOOD_VALLEY_WEATHER.find((weather) => weather.id === requested)
  if (explicit) return explicit
  return GLOAMWOOD_VALLEY_WEATHER[stableWeatherHash(String(seed)) % GLOAMWOOD_VALLEY_WEATHER.length]
}

export function gloamwoodValleyWeatherAtmosphere(
  region: Pick<GloamwoodValleyDressing, 'fogColor' | 'fogDensity' | 'sunColor' | 'sunIntensity'>,
  weather: GloamwoodValleyWeather,
): GloamwoodValleyWeatherAtmosphere {
  return {
    fogColor: blendHex(region.fogColor, weather.fogTint, weather.fogTintStrength),
    fogDensity: region.fogDensity * weather.fogDensityMultiplier,
    sunColor: blendHex(region.sunColor, weather.sunTint, weather.sunTintStrength),
    sunIntensity: region.sunIntensity * weather.sunIntensityMultiplier,
    ambientIntensity: (0.55 + region.sunIntensity * 0.3) * weather.ambientMultiplier,
  }
}

function stableWeatherHash(value: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function blendHex(from: number, to: number, amount: number) {
  const t = Math.max(0, Math.min(1, amount))
  const blend = (shift: number) => {
    const a = (from >> shift) & 0xff
    const b = (to >> shift) & 0xff
    return Math.round(a + (b - a) * t)
  }
  return (blend(16) << 16) | (blend(8) << 8) | blend(0)
}
