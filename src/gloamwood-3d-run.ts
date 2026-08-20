export const GLOAMWOOD_RUN_PACING = {
  targetMinimumSeconds: 8 * 60,
  targetMaximumSeconds: 13 * 60,
} as const

export type GloamwoodRunPace = 'debug' | 'fast' | 'target' | 'slow'

export interface GloamwoodRunPaceResult {
  pace: GloamwoodRunPace
  label: string
  detail: string
}

/**
 * Whether the pacing readout is for this audience.
 *
 * It is a development instrument, not player copy: "this run does not count
 * toward the 8-13 minute acceptance" is a note to the producer about a gate,
 * and a tester who reads it learns nothing about the game. Goal 5 needs three
 * English-speaking testers with no instructions, and they were being shown an
 * untranslated internal acceptance note on the death screen.
 *
 * Asked for by URL rather than gated on DEV, because the producer reviews the
 * deployed build too - a switch that only exists in dev silently does nothing
 * where the review actually happens.
 */
export function gloamwoodRunPaceVisible(search: string) {
  return new URLSearchParams(search).get('pace') === '1'
}

export function classifyGloamwoodRunPace(elapsedSeconds: number, debugSkip = false): GloamwoodRunPaceResult {
  if (debugSkip) {
    return { pace: 'debug', label: '调试局', detail: '使用了跳关入口，本局不计入 8–13 分钟节奏验收' }
  }
  const elapsed = Math.max(0, elapsedSeconds)
  if (elapsed < GLOAMWOOD_RUN_PACING.targetMinimumSeconds) {
    return { pace: 'fast', label: '节奏偏快', detail: '完整自然局目标为 8–13 分钟，需要增加有效决策或遭遇时间' }
  }
  if (elapsed > GLOAMWOOD_RUN_PACING.targetMaximumSeconds) {
    return { pace: 'slow', label: '节奏偏慢', detail: '完整自然局目标为 8–13 分钟，需要减少重复或等待时间' }
  }
  return { pace: 'target', label: '目标节奏', detail: '完整自然局已落入 8–13 分钟目标区间' }
}
