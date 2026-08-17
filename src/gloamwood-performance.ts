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
