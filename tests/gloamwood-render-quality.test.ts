import { describe, expect, it } from 'vitest'
import {
  GLOAMWOOD_RENDER_QUALITY,
  resolveGloamwoodRenderPixelRatio,
  shouldGloamwoodRenderContinuously,
} from '../src/gloamwood-render-quality'

describe('Gloamwood render quality', () => {
  it('keeps standard-density desktop output sharp without oversampling it', () => {
    expect(resolveGloamwoodRenderPixelRatio(1, false)).toBe(1)
    expect(resolveGloamwoodRenderPixelRatio(1.25, false)).toBe(1.25)
  })

  it('caps Retina and coarse-pointer render targets to protect continuous GPU cost', () => {
    expect(resolveGloamwoodRenderPixelRatio(2, false)).toBe(GLOAMWOOD_RENDER_QUALITY.desktopPixelRatioCap)
    expect(resolveGloamwoodRenderPixelRatio(3, true)).toBe(GLOAMWOOD_RENDER_QUALITY.coarsePointerPixelRatioCap)
  })

  it('falls back safely when a browser reports an invalid device pixel ratio', () => {
    expect(resolveGloamwoodRenderPixelRatio(Number.NaN, false)).toBe(1)
  })

  it('stops continuous WebGL rendering behind frozen menus and terminal results', () => {
    expect(shouldGloamwoodRenderContinuously({ paused: false, evolutionChoosing: false, mutationOffering: false, terminal: false })).toBe(true)
    expect(shouldGloamwoodRenderContinuously({ paused: true, evolutionChoosing: false, mutationOffering: false, terminal: false })).toBe(false)
    expect(shouldGloamwoodRenderContinuously({ paused: false, evolutionChoosing: true, mutationOffering: false, terminal: false })).toBe(false)
    expect(shouldGloamwoodRenderContinuously({ paused: false, evolutionChoosing: false, mutationOffering: true, terminal: false })).toBe(false)
    expect(shouldGloamwoodRenderContinuously({ paused: false, evolutionChoosing: false, mutationOffering: false, terminal: true })).toBe(false)
  })
})
