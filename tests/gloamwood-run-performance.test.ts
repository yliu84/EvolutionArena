import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_STALL_MS,
  GLOAMWOOD_WARMUP_FRAMES,
  GloamwoodRunPerformance,
  gloamwoodRunPerformanceVisible,
} from '../src/gloamwood-performance'

/**
 * Goal 5 asks whether a real device holds 30 FPS for a run. The rolling
 * sampler beside this one cannot answer that - it forgets everything older
 * than three seconds - so what is guarded here is that a run-long figure is
 * honest about the frames it counts and the ones it throws away.
 */

function run(frames: number[], warm = true) {
  const record = new GloamwoodRunPerformance()
  if (warm) for (let i = 0; i < GLOAMWOOD_WARMUP_FRAMES; i += 1) record.record(16.7)
  for (const frame of frames) record.record(frame)
  return record.report()
}

describe('the run-long frame record', () => {
  it('reports the average over the whole run, not the last few seconds', () => {
    const report = run(Array.from({ length: 600 }, () => 20))
    expect(report.frames).toBe(600)
    expect(report.meanFps).toBeCloseTo(50, 0)
  })

  it('counts the share that missed 30 FPS, which is the number being collected', () => {
    // Nine comfortable frames to one that missed the 33.3ms budget.
    const frames = Array.from({ length: 1000 }, (_, index) => (index % 10 === 0 ? 40 : 16))
    const report = run(frames)
    expect(report.belowThirtyShare).toBeCloseTo(0.1, 3)
    expect(report.belowSixtyShare).toBeCloseTo(0.1, 3)
  })

  it('ignores the warm-up, because the first frames are loading rather than playing', () => {
    // Without this, the shader and asset spikes at the start of every run drag
    // the figure down and the number describes the boot rather than the game.
    const record = new GloamwoodRunPerformance()
    for (let i = 0; i < GLOAMWOOD_WARMUP_FRAMES; i += 1) record.record(400)
    for (let i = 0; i < 100; i += 1) record.record(16)
    const report = record.report()
    expect(report.frames).toBe(100)
    expect(report.worstFrameMs).toBe(16)
  })

  it('sets a stall aside rather than averaging it in, but says how many', () => {
    // One alt-tab produces a frame seconds long. Averaged in it buries a whole
    // run of good frames; dropped silently it hides that the run was disturbed.
    const report = run([...Array.from({ length: 100 }, () => 16), GLOAMWOOD_STALL_MS + 1])
    expect(report.stalls).toBe(1)
    expect(report.frames).toBe(100)
    expect(report.worstFrameMs).toBe(16)
  })

  it('never reports a percentile faster than the frames it covers', () => {
    // The histogram's bucket edge is rounded up on purpose: a p95 that reads
    // faster than real frames would call a device fine that is not.
    const report = run([...Array.from({ length: 95 }, () => 10), ...Array.from({ length: 5 }, () => 90)])
    expect(report.p95FrameMs).toBeGreaterThanOrEqual(10)
    expect(report.p99FrameMs).toBeGreaterThanOrEqual(90)
    expect(report.worstFrameMs).toBe(90)
  })

  it('answers zero rather than dividing by nothing on an empty run', () => {
    const report = new GloamwoodRunPerformance().report()
    expect(report).toMatchObject({ frames: 0, meanFps: 0, belowThirtyShare: 0, worstFrameMs: 0 })
  })

  it('is shown only when the run is asked what it cost', () => {
    expect(gloamwoodRunPerformanceVisible('?perf=1')).toBe(true)
    expect(gloamwoodRunPerformanceVisible('')).toBe(false)
    expect(gloamwoodRunPerformanceVisible('?perf=0')).toBe(false)
  })
})
