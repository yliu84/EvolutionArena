import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'

import { GLOAMWOOD_TELEGRAPH_RIM_GLOW, writeGlowForReview } from '../src/gloamwood-boss-fx-scene'
import { GLOAMWOOD_BOSS_FX } from '../src/gloamwood-boss-fx'
import { GLOAMWOOD_BLOOM } from '../src/gloamwood-bloom'

const luminance = (colour: THREE.Color) =>
  0.2126 * colour.r + 0.7152 * colour.g + 0.0722 * colour.b

describe('a boss telegraph throws light without losing its edge', () => {
  it('writes both phases at the same luminance, whatever their hue', () => {
    // The bloom pass thresholds on luminance, and luminance is 71% green. The
    // wind-up amber and the enraged red are far apart on that scale, so a single
    // shared multiplier would have phase two - the hotter phase, whose entire
    // tell is that nothing changed but the light - glow less than phase one.
    const amber = new THREE.Color()
    const enraged = new THREE.Color()
    writeGlowForReview(amber, GLOAMWOOD_BOSS_FX.telegraphColor, GLOAMWOOD_TELEGRAPH_RIM_GLOW)
    writeGlowForReview(enraged, GLOAMWOOD_BOSS_FX.enragedColor, GLOAMWOOD_TELEGRAPH_RIM_GLOW)
    expect(luminance(amber)).toBeCloseTo(GLOAMWOOD_TELEGRAPH_RIM_GLOW, 4)
    expect(luminance(enraged)).toBeCloseTo(GLOAMWOOD_TELEGRAPH_RIM_GLOW, 4)
  })

  it('keeps the hue, so the phase is still read from the colour', () => {
    const enraged = new THREE.Color()
    writeGlowForReview(enraged, GLOAMWOOD_BOSS_FX.enragedColor, GLOAMWOOD_TELEGRAPH_RIM_GLOW)
    // Still unmistakably red-dominant, just brighter.
    expect(enraged.r).toBeGreaterThan(enraged.g * 2)
    expect(enraged.g).toBeGreaterThan(enraged.b)
  })

  it('lights the outline partway through the wind-up rather than at the start', () => {
    // The glow is part of the clock. A rim that already glows on the first
    // frame says nothing about how long is left.
    const rimAt = (windup: number) => 0.5 + windup * 0.42
    expect(GLOAMWOOD_TELEGRAPH_RIM_GLOW * rimAt(0)).toBeLessThan(GLOAMWOOD_BLOOM.threshold)
    expect(GLOAMWOOD_TELEGRAPH_RIM_GLOW * rimAt(1)).toBeGreaterThan(GLOAMWOOD_BLOOM.threshold)
  })

  it('leaves the blow itself ungained, because its layers already add', () => {
    // The fill, the rim and the impact ring all land on the same pixels on the
    // frame the blow resolves. Measured in the linear buffer, that overlap was
    // 2.24 - past the bloom threshold and past white - before the opacities
    // came down, and gaining any of them made it worse rather than better.
    const scene = readFileSync(new URL('../src/gloamwood-boss-fx-scene.ts', import.meta.url), 'utf8')
    const impactBlock = scene.slice(scene.indexOf('visual.wave.visible = true'), scene.indexOf('flashStrength = Math'))
    expect(impactBlock).toContain('setHex(frame.flashColor)')
    expect(impactBlock).not.toContain('writeGlow')

    const flash = new THREE.Color(GLOAMWOOD_BOSS_FX.flashColor)
    const fx = readFileSync(new URL('../src/gloamwood-boss-fx.ts', import.meta.url), 'utf8')
    const fill = Number(fx.match(/fillOpacity: ([\d.]+) \* \(1 - wash\)/)![1])
    const rim = Number(fx.match(/rimOpacity: ([\d.]+) \* \(1 - wash\)/)![1])
    const wave = Number(scene.match(/\(1 - travel\) \*\* 1\.5 \* ([\d.]+)/)![1])
    const overlap = luminance(flash) * (fill + rim + wave)
    // It still flares - it is a blow - but it no longer erases what is under it.
    expect(overlap).toBeGreaterThan(GLOAMWOOD_BLOOM.threshold)
    expect(overlap).toBeLessThan(1.7)
  })

  it('leaves the fill under the threshold, so the danger zone keeps its contrast', () => {
    // The fill is the whole area. If it blooms, the difference between standing
    // inside it and outside stops being visible, which is the one thing the
    // player is actually reading off the ground.
    const source = readFileSync(new URL('../src/gloamwood-boss-fx.ts', import.meta.url), 'utf8')
    const formula = source.match(/fillOpacity: ([\d.]+) \+ windup \* ([\d.]+)/)
    expect(formula, 'fill opacity is no longer where this test thought').not.toBeNull()
    const peakFill = Number(formula![1]) + Number(formula![2])
    const fill = new THREE.Color(GLOAMWOOD_BOSS_FX.telegraphColor)
    expect(luminance(fill) * peakFill).toBeLessThan(GLOAMWOOD_BLOOM.threshold)
    // And the scene must not be quietly gaining it the way it gains the rim.
    const scene = readFileSync(new URL('../src/gloamwood-boss-fx-scene.ts', import.meta.url), 'utf8')
    const fillBlock = scene.slice(scene.indexOf('if (visual.fill) {'), scene.indexOf('const rimOpacity'))
    expect(fillBlock).toContain('material.color.setHex(color)')
    expect(fillBlock).not.toContain('writeGlow')
  })
})
