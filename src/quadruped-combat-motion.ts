export interface QuadrupedPounceFrame {
  progress: number
  forwardOffset: number
  liftOffset: number
}

export type QuadrupedCombatAction = 'Bite' | 'Claw' | 'Pounce' | 'TailSwipe'

export interface QuadrupedAttackMotionFrame {
  progress: number
  forwardOffset: number
  liftOffset: number
  pitchRadians: number
  yawRadians: number
  forwardScale: number
  verticalScale: number
  widthScale: number
  impactStrength: number
}

export interface JuvenileLeapBiteMotionFrame extends QuadrupedAttackMotionFrame {
  phase: 'ready' | 'crouch' | 'launch' | 'land' | 'recover'
  airborneStrength: number
  landingStrength: number
}

export interface JuvenileSpinTailSwipeMotionFrame extends QuadrupedAttackMotionFrame {
  phase: 'ready' | 'coil' | 'strike' | 'follow-through'
  spinProgress: number
}

const NEUTRAL_ATTACK_FRAME: Omit<QuadrupedAttackMotionFrame, 'progress'> = {
  forwardOffset: 0,
  liftOffset: 0,
  pitchRadians: 0,
  yawRadians: 0,
  forwardScale: 1,
  verticalScale: 1,
  widthScale: 1,
  impactStrength: 0,
}

/**
 * A root-only combat envelope layered over authored quadruped clips. It never
 * edits leg bones or gameplay authority: the GLB keeps foot volume and the
 * combat system keeps contact timing, range, and damage.
 */
export function quadrupedAttackMotionFrame(
  action: QuadrupedCombatAction,
  elapsedSeconds: number,
  durationSeconds: number,
  contactSeconds: number,
): QuadrupedAttackMotionFrame {
  const duration = Math.max(0.001, durationSeconds)
  const progress = clamp01(elapsedSeconds / duration)
  if (progress <= 0 || progress >= 1) return { progress, ...NEUTRAL_ATTACK_FRAME }

  const contactProgress = clamp01(contactSeconds / duration)
  const windupPeak = Math.max(0.06, contactProgress * 0.52)
  const windup = trianglePulse(progress, windupPeak, Math.max(0.08, contactProgress * 0.54))
  const strike = asymmetricPulse(progress, contactProgress, Math.max(0.035, contactProgress * 0.24), Math.max(0.1, (1 - contactProgress) * 0.72))
  const impactStrength = trianglePulse(progress, contactProgress, 0.055)

  if (action === 'Claw') {
    return {
      progress,
      forwardOffset: -0.12 * windup + 0.38 * strike,
      liftOffset: 0.2 * windup + 0.1 * strike,
      pitchRadians: 0.2 * windup + 0.055 * strike,
      yawRadians: -0.035 * windup + 0.06 * strike,
      forwardScale: 1 + 0.055 * strike,
      verticalScale: 1 + 0.06 * windup - 0.025 * strike,
      widthScale: 1 - 0.035 * windup + 0.055 * strike,
      impactStrength,
    }
  }

  if (action === 'Pounce') {
    return {
      progress,
      forwardOffset: -0.16 * windup + 0.98 * strike,
      liftOffset: 0.18 * windup + 0.13 * strike,
      pitchRadians: 0.17 * windup - 0.075 * strike,
      yawRadians: 0,
      forwardScale: 1 - 0.055 * windup + 0.08 * strike,
      verticalScale: 1 - 0.075 * windup + 0.045 * strike,
      widthScale: 1 + 0.075 * windup - 0.025 * strike,
      impactStrength,
    }
  }

  if (action === 'TailSwipe') {
    return {
      progress,
      forwardOffset: -0.05 * windup + 0.13 * strike,
      liftOffset: -0.065 * windup + 0.035 * strike,
      pitchRadians: -0.055 * windup + 0.04 * strike,
      yawRadians: -0.27 * windup + 0.38 * strike,
      forwardScale: 1 - 0.04 * windup + 0.035 * strike,
      verticalScale: 1 - 0.075 * windup + 0.025 * strike,
      widthScale: 1 + 0.08 * windup + 0.04 * strike,
      impactStrength,
    }
  }

  return {
    progress,
    forwardOffset: -0.07 * windup + 0.25 * strike,
    liftOffset: 0.045 * strike,
    pitchRadians: -0.04 * windup + 0.055 * strike,
    yawRadians: 0,
    forwardScale: 1 + 0.045 * strike,
    verticalScale: 1 - 0.035 * strike,
    widthScale: 1 + 0.035 * strike,
    impactStrength,
  }
}

export function quadrupedPounceFrame(
  elapsedSeconds: number,
  durationSeconds: number,
  visualTravel: number,
  maximumLift = 0.08,
): QuadrupedPounceFrame {
  const progress = Math.max(0, Math.min(1, elapsedSeconds / Math.max(0.001, durationSeconds)))
  const arc = Math.sin(progress * Math.PI)
  return {
    progress,
    forwardOffset: arc * visualTravel,
    liftOffset: arc * maximumLift,
  }
}

/**
 * Root-only juvenile leap bite. The stable Bite clip owns the jaw/head while
 * this curve supplies weight without rotating or scaling the short forelegs.
 */
export function juvenileLeapBiteMotionFrame(
  elapsedSeconds: number,
  durationSeconds: number,
): JuvenileLeapBiteMotionFrame {
  const duration = Math.max(0.001, durationSeconds)
  const progress = clamp01(elapsedSeconds / duration)
  const crouchEnd = 0.22
  const contact = 0.478
  const landing = 0.68
  if (progress <= 0 || progress >= 1) {
    return { progress, phase: 'ready', airborneStrength: 0, landingStrength: 0, ...NEUTRAL_ATTACK_FRAME }
  }

  if (progress < crouchEnd) {
    const t = smoothstep(progress / crouchEnd)
    return {
      progress,
      phase: 'crouch',
      forwardOffset: -0.1 * t,
      // Keep the feet on the terrain. Weight comes from the backward load,
      // pitch, shadow, and landing feedback rather than sinking the whole rig.
      liftOffset: 0,
      pitchRadians: 0.14 * t,
      yawRadians: 0,
      forwardScale: 1,
      verticalScale: 1,
      widthScale: 1,
      impactStrength: 0,
      airborneStrength: 0,
      landingStrength: 0,
    }
  }

  if (progress < contact) {
    const t = (progress - crouchEnd) / (contact - crouchEnd)
    const travel = easeOutCubic(t)
    const airArc = Math.sin(t * Math.PI * 0.74)
    return {
      progress,
      phase: 'launch',
      forwardOffset: -0.1 + 0.88 * travel,
      liftOffset: 0.3 * airArc,
      pitchRadians: 0.14 - 0.29 * smoothstep(t),
      yawRadians: 0,
      forwardScale: 1,
      verticalScale: 1,
      widthScale: 1,
      impactStrength: trianglePulse(progress, contact, 0.055),
      airborneStrength: Math.sin(t * Math.PI),
      landingStrength: 0,
    }
  }

  if (progress < landing) {
    const t = (progress - contact) / (landing - contact)
    const drop = smoothstep(t)
    return {
      progress,
      phase: 'land',
      forwardOffset: 0.78 - 0.5 * smoothstep(t),
      liftOffset: 0.19 * (1 - drop),
      pitchRadians: -0.15 + 0.23 * smoothstep(t),
      yawRadians: 0,
      forwardScale: 1,
      verticalScale: 1,
      widthScale: 1,
      impactStrength: trianglePulse(progress, contact, 0.055),
      airborneStrength: 1 - smoothstep(t),
      landingStrength: smoothstep(t),
    }
  }

  const t = (progress - landing) / (1 - landing)
  const settle = 1 - easeOutCubic(t)
  return {
    progress,
    phase: 'recover',
    forwardOffset: 0.28 * settle,
    liftOffset: 0,
    pitchRadians: 0.08 * settle,
    yawRadians: 0,
    forwardScale: 1,
    verticalScale: 1,
    widthScale: 1,
    impactStrength: 0,
    airborneStrength: 0,
    landingStrength: settle,
  }
}

/**
 * A full-body juvenile tail spin. The parent still owns authoritative facing,
 * target lock, range, and contact; this local root completes one visual turn
 * so the tail visibly crosses the locked target at the contact frame.
 */
export function juvenileSpinTailSwipeMotionFrame(
  elapsedSeconds: number,
  durationSeconds: number,
  contactSeconds: number,
): JuvenileSpinTailSwipeMotionFrame {
  const duration = Math.max(0.001, durationSeconds)
  const progress = clamp01(elapsedSeconds / duration)
  if (progress <= 0 || progress >= 1) {
    return { progress, phase: 'ready', spinProgress: progress >= 1 ? 1 : 0, ...NEUTRAL_ATTACK_FRAME }
  }

  const contact = clamp01(contactSeconds / duration)
  const coilEnd = Math.max(0.1, contact * 0.38)
  const followThroughEnd = Math.min(0.9, Math.max(contact + 0.18, 0.82))
  const coilRadians = -Math.PI * 0.14

  if (progress < coilEnd) {
    const t = smoothstep(progress / coilEnd)
    return {
      progress,
      phase: 'coil',
      spinProgress: 0,
      forwardOffset: -0.08 * t,
      liftOffset: 0,
      pitchRadians: -0.07 * t,
      yawRadians: coilRadians * t,
      forwardScale: 1,
      verticalScale: 1,
      widthScale: 1,
      impactStrength: 0,
    }
  }

  if (progress < contact) {
    const t = smoothstep((progress - coilEnd) / Math.max(0.001, contact - coilEnd))
    const yaw = coilRadians + (Math.PI - coilRadians) * t
    return {
      progress,
      phase: 'strike',
      spinProgress: yaw / (Math.PI * 2),
      forwardOffset: -0.08 + 0.16 * t,
      liftOffset: 0.025 * t,
      pitchRadians: -0.07 + 0.1 * t,
      yawRadians: yaw,
      forwardScale: 1,
      verticalScale: 1,
      widthScale: 1,
      impactStrength: trianglePulse(progress, contact, 0.055),
    }
  }

  const t = smoothstep((progress - contact) / Math.max(0.001, followThroughEnd - contact))
  const yaw = Math.PI + Math.PI * t
  return {
    progress,
    phase: 'follow-through',
    spinProgress: yaw / (Math.PI * 2),
    forwardOffset: 0.08 * (1 - t),
    liftOffset: 0.025 * (1 - t),
    pitchRadians: 0.03 * (1 - t),
    yawRadians: yaw,
    forwardScale: 1,
    verticalScale: 1,
    widthScale: 1,
    impactStrength: trianglePulse(progress, contact, 0.055),
  }
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function trianglePulse(progress: number, center: number, halfWidth: number) {
  return clamp01(1 - Math.abs(progress - center) / Math.max(0.001, halfWidth))
}

function asymmetricPulse(progress: number, center: number, riseWidth: number, fallWidth: number) {
  const width = progress <= center ? riseWidth : fallWidth
  const linear = clamp01(1 - Math.abs(progress - center) / Math.max(0.001, width))
  return linear * linear * (3 - 2 * linear)
}

function smoothstep(value: number) {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

function easeOutCubic(value: number) {
  const t = clamp01(value)
  return 1 - Math.pow(1 - t, 3)
}
