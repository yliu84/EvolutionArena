import type { CombatStyle } from './combat'
import type { PlayerMovementState } from './player-movement'

export type PlayerAnimationState =
  | 'idle' | 'move' | 'dodge'
  | 'attack-melee' | 'attack-ranged' | 'attack-magic'
  | 'hit' | 'consume' | 'death'

export interface PlayerAnimationInput {
  now: number
  runOver: boolean
  health: number
  movementState: PlayerMovementState
  movementRemainingMs: number
  speed: number
  attackStyle: CombatStyle | null
  attackWindupRemainingMs: number
  attackRecoverRemainingMs: number
  consumeRemainingMs: number
}

export interface PlayerAnimationPose {
  state: PlayerAnimationState
  phase: number
  bob: number
  forwardOffset: number
  forwardScale: number
  sideScale: number
  limbSweep: number
  headDip: number
  alpha: number
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function resolvePlayerAnimationState(input: PlayerAnimationInput): PlayerAnimationState {
  if (input.runOver && input.health <= 0) return 'death'
  if (input.movementState === 'hitstun') return 'hit'
  if (input.consumeRemainingMs > 0) return 'consume'
  if (input.attackStyle) return `attack-${input.attackStyle}`
  if (input.movementState === 'dodge') return 'dodge'
  if (input.speed >= 24) return 'move'
  return 'idle'
}

export function playerAnimationPose(input: PlayerAnimationInput): PlayerAnimationPose {
  const state = resolvePlayerAnimationState(input)
  if (state === 'death') {
    return { state, phase: 1, bob: 15, forwardOffset: -3, forwardScale: 1.18, sideScale: 0.42, limbSweep: -0.35, headDip: 10, alpha: 0.72 }
  }
  if (state === 'hit') {
    const phase = 1 - clamp01(input.movementRemainingMs / 260)
    return { state, phase, bob: Math.sin(phase * Math.PI) * 3, forwardOffset: -7 * (1 - phase), forwardScale: 0.88, sideScale: 1.16, limbSweep: -0.28, headDip: 4, alpha: 1 }
  }
  if (state === 'consume') {
    const phase = 1 - clamp01(input.consumeRemainingMs / 460)
    return { state, phase, bob: Math.sin(phase * Math.PI) * 2, forwardOffset: 3, forwardScale: 0.98, sideScale: 1.04, limbSweep: 0.08, headDip: 7 * Math.sin(phase * Math.PI), alpha: 1 }
  }
  if (state.startsWith('attack-')) {
    const style = state.slice('attack-'.length) as CombatStyle
    const inWindup = input.attackWindupRemainingMs > 0
    const duration = style === 'magic' ? 520 : style === 'melee' ? 170 : 150
    const recovery = style === 'magic' ? 480 : style === 'melee' ? 250 : 210
    const phase = inWindup
      ? 1 - clamp01(input.attackWindupRemainingMs / duration)
      : 1 - clamp01(input.attackRecoverRemainingMs / recovery)
    if (style === 'melee') {
      const strike = inWindup ? phase : 1 - phase
      return { state, phase, bob: -2 * strike, forwardOffset: 13 * strike, forwardScale: 1 + strike * 0.14, sideScale: 1 - strike * 0.1, limbSweep: 0.5 * strike, headDip: 0, alpha: 1 }
    }
    if (style === 'ranged') {
      const recoil = inWindup ? phase * 0.35 : 1 - phase
      return { state, phase, bob: -1, forwardOffset: -5 * recoil, forwardScale: 0.95, sideScale: 1.06, limbSweep: -0.12, headDip: -2, alpha: 1 }
    }
    const charge = inWindup ? phase : 1 - phase
    return { state, phase, bob: -5 * charge, forwardOffset: 0, forwardScale: 1 + charge * 0.05, sideScale: 1 + charge * 0.12, limbSweep: 0.18, headDip: -3, alpha: 1 }
  }
  if (state === 'dodge') {
    const phase = 1 - clamp01(input.movementRemainingMs / 260)
    return { state, phase, bob: -2, forwardOffset: 8, forwardScale: 1.16, sideScale: 0.78, limbSweep: -0.38, headDip: -1, alpha: 0.9 }
  }
  if (state === 'move') {
    const phase = (input.now % 420) / 420
    const stride = Math.sin(phase * Math.PI * 2)
    return { state, phase, bob: Math.abs(stride) * -2.5, forwardOffset: 1.5, forwardScale: 1.04, sideScale: 0.96, limbSweep: stride * 0.3, headDip: stride * 0.8, alpha: 1 }
  }
  const phase = (input.now % 1400) / 1400
  return { state, phase, bob: Math.sin(phase * Math.PI * 2) * 1.1, forwardOffset: 0, forwardScale: 1, sideScale: 1, limbSweep: 0, headDip: 0, alpha: 1 }
}
