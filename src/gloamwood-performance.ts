export interface GloamwoodPerformanceSnapshot {
  fps: number
  averageFrameMs: number
  p95FrameMs: number
  sampleCount: number
}

export interface GloamwoodPerformanceReadoutResources {
  drawCalls: number
  triangles: number
  heapMegabytes: number | null
  width: number
  height: number
  pixelRatio: number
}

const MAX_FRAME_SAMPLES = 180

export class GloamwoodPerformanceSampler {
  private readonly samples: number[] = []

  record(frameMilliseconds: number) {
    if (!Number.isFinite(frameMilliseconds) || frameMilliseconds <= 0) return
    this.samples.push(Math.min(1000, frameMilliseconds))
    if (this.samples.length > MAX_FRAME_SAMPLES) this.samples.shift()
  }

  snapshot(): GloamwoodPerformanceSnapshot {
    if (this.samples.length === 0) {
      return { fps: 0, averageFrameMs: 0, p95FrameMs: 0, sampleCount: 0 }
    }
    const averageFrameMs = this.samples.reduce((total, value) => total + value, 0) / this.samples.length
    const ordered = [...this.samples].sort((a, b) => a - b)
    const p95Index = Math.min(ordered.length - 1, Math.ceil(ordered.length * 0.95) - 1)
    return {
      fps: roundPerformanceValue(1000 / averageFrameMs),
      averageFrameMs: roundPerformanceValue(averageFrameMs),
      p95FrameMs: roundPerformanceValue(ordered[p95Index]),
      sampleCount: this.samples.length,
    }
  }
}

export function readJavaScriptHeapMegabytes(performanceApi: Performance = performance) {
  const memory = (performanceApi as Performance & { memory?: { usedJSHeapSize?: number } }).memory
  const bytes = memory?.usedJSHeapSize
  return Number.isFinite(bytes) ? roundPerformanceValue((bytes ?? 0) / 1024 / 1024) : null
}

export function formatGloamwoodPerformanceReadout(
  snapshot: GloamwoodPerformanceSnapshot,
  resources: GloamwoodPerformanceReadoutResources,
) {
  const heap = resources.heapMegabytes === null ? '内存未公开' : `${resources.heapMegabytes.toFixed(1)} MB`
  return [
    'PERF',
    `${snapshot.fps.toFixed(1)} FPS`,
    `P95 ${snapshot.p95FrameMs.toFixed(1)} ms`,
    `${resources.width}×${resources.height} @${resources.pixelRatio.toFixed(2)}`,
    `${resources.drawCalls} calls`,
    `${Math.round(resources.triangles / 1000)}k tris`,
    heap,
  ].join(' · ')
}

function roundPerformanceValue(value: number) {
  return Math.round(value * 10) / 10
}


/**
 * What a whole run cost, as opposed to what the last three seconds cost.
 *
 * `GloamwoodPerformanceSampler` above keeps a rolling 180-frame window, which
 * is right for a live read-out and useless for the question Goal 5 actually
 * asks: did *this device* hold 30 FPS *for a run*. A window that forgets
 * everything older than three seconds cannot answer that, and neither can a
 * developer machine, which is why the requirement is still uncollected.
 *
 * Kept as a histogram rather than an array of every frame. A twenty-minute run
 * is about 72,000 frames; the histogram answers the same percentile questions
 * in constant memory and never has to be sorted.
 */
export const GLOAMWOOD_FRAME_BUDGET_30 = 1000 / 30
export const GLOAMWOOD_FRAME_BUDGET_60 = 1000 / 60

/**
 * Frames slower than this are not gameplay.
 *
 * A backgrounded tab, an alt-tab, or a breakpoint produces a single frame
 * seconds long. Averaged in, one of those buries a whole run's worth of good
 * frames. They are counted separately rather than dropped silently, because a
 * run full of them is itself worth knowing about.
 */
export const GLOAMWOOD_STALL_MS = 500

/** Frames to ignore at the start, while the first assets and shaders land. */
export const GLOAMWOOD_WARMUP_FRAMES = 120

const BUCKET_MS = 0.5
const BUCKETS = 512

export interface GloamwoodRunPerformanceReport {
  frames: number
  seconds: number
  meanFps: number
  p50FrameMs: number
  p95FrameMs: number
  p99FrameMs: number
  worstFrameMs: number
  /** Share of frames that missed 30 FPS. The Goal 5 number. */
  belowThirtyShare: number
  belowSixtyShare: number
  /** Frames long enough to be something other than rendering. */
  stalls: number
}

export class GloamwoodRunPerformance {
  private readonly buckets = new Uint32Array(BUCKETS + 1)
  private frames = 0
  private totalMs = 0
  private worstMs = 0
  private below30 = 0
  private below60 = 0
  private stalls = 0
  private warmup = 0

  record(frameMilliseconds: number) {
    if (!Number.isFinite(frameMilliseconds) || frameMilliseconds <= 0) return
    if (this.warmup < GLOAMWOOD_WARMUP_FRAMES) {
      this.warmup += 1
      return
    }
    if (frameMilliseconds > GLOAMWOOD_STALL_MS) {
      this.stalls += 1
      return
    }
    this.frames += 1
    this.totalMs += frameMilliseconds
    if (frameMilliseconds > this.worstMs) this.worstMs = frameMilliseconds
    if (frameMilliseconds > GLOAMWOOD_FRAME_BUDGET_30) this.below30 += 1
    if (frameMilliseconds > GLOAMWOOD_FRAME_BUDGET_60) this.below60 += 1
    this.buckets[Math.min(BUCKETS, Math.floor(frameMilliseconds / BUCKET_MS))] += 1
  }

  private percentile(fraction: number) {
    if (this.frames === 0) return 0
    const target = Math.ceil(this.frames * fraction)
    let seen = 0
    for (let index = 0; index < this.buckets.length; index += 1) {
      seen += this.buckets[index]
      // The bucket's upper edge, so a percentile is never reported faster than
      // any frame it is meant to cover.
      if (seen >= target) return roundPerformanceValue((index + 1) * BUCKET_MS)
    }
    return roundPerformanceValue(this.worstMs)
  }

  report(): GloamwoodRunPerformanceReport {
    const seconds = this.totalMs / 1000
    return {
      frames: this.frames,
      seconds: roundPerformanceValue(seconds),
      meanFps: this.frames === 0 ? 0 : roundPerformanceValue(this.frames / Math.max(1e-6, seconds)),
      p50FrameMs: this.percentile(0.5),
      p95FrameMs: this.percentile(0.95),
      p99FrameMs: this.percentile(0.99),
      worstFrameMs: roundPerformanceValue(this.worstMs),
      belowThirtyShare: this.frames === 0 ? 0 : this.below30 / this.frames,
      belowSixtyShare: this.frames === 0 ? 0 : this.below60 / this.frames,
      stalls: this.stalls,
    }
  }
}

/** Whether the run is asked to show what it cost. */
export function gloamwoodRunPerformanceVisible(search: string) {
  return new URLSearchParams(search).get('perf') === '1'
}
