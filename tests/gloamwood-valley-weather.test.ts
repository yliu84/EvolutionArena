import { describe, expect, it } from 'vitest'

import { gloamwoodValleyDressingFor } from '../src/gloamwood-valley-dressing'
import {
  GLOAMWOOD_VALLEY_WEATHER,
  gloamwoodValleyWeatherAtmosphere,
  resolveGloamwoodValleyWeather,
} from '../src/gloamwood-valley-weather'
import { resolveGloamwoodWeatherRunSeed } from '../src/gloamwood-run-weather'

describe('River Valley presentation weather', () => {
  it('accepts explicit review weather while keeping seeded selection reproducible', () => {
    expect(resolveGloamwoodValleyWeather('rain', 'anything').id).toBe('rain')
    expect(resolveGloamwoodValleyWeather('not-weather', 'goal10').id)
      .toBe(resolveGloamwoodValleyWeather(null, 'goal10').id)
    expect(GLOAMWOOD_VALLEY_WEATHER.map((weather) => weather.id)).toEqual(['dawn', 'mist', 'rain'])
  })

  it('keeps the rain mood readable rather than turning the valley into black night', () => {
    const base = gloamwoodValleyDressingFor('shallows')
    const rain = resolveGloamwoodValleyWeather('rain', 'goal10')
    const frame = gloamwoodValleyWeatherAtmosphere(base, rain)

    expect(rain.rain).toBe(true)
    expect(frame.sunIntensity).toBeGreaterThan(1)
    expect(frame.fogDensity).toBeLessThan(0.02)
    expect(frame.ambientIntensity).toBeGreaterThan(0.5)
  })

  it('changes only the presentation atmosphere, preserving the regional climb', () => {
    const dawn = resolveGloamwoodValleyWeather('dawn', 'goal10')
    const mist = resolveGloamwoodValleyWeather('mist', 'goal10')
    const shallows = gloamwoodValleyDressingFor('shallows')
    const headwater = gloamwoodValleyDressingFor('headwater')

    expect(gloamwoodValleyWeatherAtmosphere(shallows, mist).fogDensity)
      .toBeLessThan(gloamwoodValleyWeatherAtmosphere(headwater, dawn).fogDensity)
  })

  it('uses a fresh presentation seed for each unseeded run while preserving reproducible review seeds', () => {
    expect(resolveGloamwoodWeatherRunSeed('review-7', () => 'unused')).toBe('weather-seed:review-7')
    expect(resolveGloamwoodWeatherRunSeed(null, () => 'run-a')).toBe('weather-run:run-a')
    expect(resolveGloamwoodWeatherRunSeed(null, () => 'run-b')).toBe('weather-run:run-b')
  })

  it('can produce all three weather moods across distinct run seeds', () => {
    const moods = new Set(
      Array.from({ length: 36 }, (_, index) => resolveGloamwoodValleyWeather(
        undefined,
        resolveGloamwoodWeatherRunSeed(null, () => `run-${index}`),
      ).id),
    )
    expect(moods).toEqual(new Set(['dawn', 'mist', 'rain']))
  })
})
