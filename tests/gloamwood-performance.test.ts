import { describe, expect, it } from 'vitest'
import {
  formatGloamwoodPerformanceReadout,
  GloamwoodPerformanceSampler,
  readJavaScriptHeapMegabytes,
} from '../src/gloamwood-performance'

describe('Gloamwood performance evidence', () => {
  it('reports rolling average FPS and p95 frame time', () => {
    const sampler = new GloamwoodPerformanceSampler()
    for (let index = 0; index < 95; index += 1) sampler.record(16)
    for (let index = 0; index < 5; index += 1) sampler.record(32)
    expect(sampler.snapshot()).toEqual({
      fps: 59.5,
      averageFrameMs: 16.8,
      p95FrameMs: 16,
      sampleCount: 100,
    })
  })

  it('bounds the rolling window and ignores invalid samples', () => {
    const sampler = new GloamwoodPerformanceSampler()
    sampler.record(0)
    sampler.record(Number.NaN)
    for (let index = 0; index < 220; index += 1) sampler.record(20)
    expect(sampler.snapshot()).toEqual({
      fps: 50,
      averageFrameMs: 20,
      p95FrameMs: 20,
      sampleCount: 180,
    })
  })

  it('reports heap only when the browser exposes it', () => {
    expect(readJavaScriptHeapMegabytes({ memory: { usedJSHeapSize: 52_428_800 } } as never)).toBe(50)
    expect(readJavaScriptHeapMegabytes({} as Performance)).toBeNull()
  })

  it('formats a phone-screenshot-ready evidence line', () => {
    expect(formatGloamwoodPerformanceReadout(
      { fps: 59.8, averageFrameMs: 16.7, p95FrameMs: 18.2, sampleCount: 180 },
      { drawCalls: 218, triangles: 595_769, heapMegabytes: 52.04, width: 844, height: 390, pixelRatio: 1 },
    )).toBe('PERF · 59.8 FPS · P95 18.2 ms · 844×390 @1.00 · 218 calls · 596k tris · 52.0 MB')
  })
})
