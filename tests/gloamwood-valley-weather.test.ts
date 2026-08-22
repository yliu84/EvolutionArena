import { describe, expect, it } from 'vitest'

import { gloamwoodValleyDressingFor } from '../src/gloamwood-valley-dressing'
import {
  GLOAMWOOD_VALLEY_WEATHER,
  gloamwoodValleyWeatherAtmosphere,
  resolveGloamwoodValleyWeather,
} from '../src/gloamwood-valley-weather'

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
})
