import type Phaser from 'phaser'
import type { MonsterType } from './monsters'

export const POUNCER_ATLAS = {
  key: 'monster-pouncer-animated',
  path: '/assets/monsters/pouncer/pouncer-animation-atlas-v1.png',
  frameWidth: 313,
  frameHeight: 313,
} as const

export const RAZORWING_ATLAS = {
  key: 'monster-razorwing-animated',
  path: '/assets/monsters/razorwing/razorwing-animation-atlas-v1.png',
  frameWidth: 313,
  frameHeight: 313,
} as const

export const SHELLBACK_ATLAS = {
  key: 'monster-shellback-animated',
  path: '/assets/monsters/shellback/shellback-animation-atlas-v1.png',
  frameWidth: 313,
  frameHeight: 313,
} as const

export const BLOODLEECH_ATLAS = {
  key: 'monster-bloodleech-animated',
  path: '/assets/monsters/bloodleech/bloodleech-animation-atlas-v1.png',
  frameWidth: 313,
  frameHeight: 313,
} as const

export const SPITTER_ATLAS = {
  key: 'monster-spitter-animated',
  path: '/assets/monsters/spitter/spitter-animation-atlas-v1.png',
  frameWidth: 313,
  frameHeight: 313,
} as const

export const RIFTWEAVER_ATLAS = {
  key: 'monster-riftweaver-animated',
  path: '/assets/monsters/riftweaver/riftweaver-animation-atlas-v1.png',
  frameWidth: 313,
  frameHeight: 313,
} as const

export type MonsterAnimationState = 'idle' | 'move' | 'telegraph' | 'attack' | 'recover' | 'hit' | 'death'

type MonsterAnimationDefinition = {
  key: string
  frames: readonly number[]
  frameRate: number
  repeat: number
}

type MonsterAnimationAtlas = {
  key: string
  path: string
  frameWidth: number
  frameHeight: number
}

export const POUNCER_ANIMATIONS: Record<MonsterAnimationState, MonsterAnimationDefinition> = {
  idle: { key: 'pouncer-idle', frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 },
  move: { key: 'pouncer-move', frames: [4, 5, 6, 7], frameRate: 10, repeat: -1 },
  telegraph: { key: 'pouncer-telegraph', frames: [8, 9], frameRate: 7, repeat: -1 },
  attack: { key: 'pouncer-attack', frames: [9, 10, 11], frameRate: 12, repeat: 0 },
  recover: { key: 'pouncer-recover', frames: [11, 3], frameRate: 6, repeat: 0 },
  hit: { key: 'pouncer-hit', frames: [12, 13], frameRate: 14, repeat: 0 },
  death: { key: 'pouncer-death', frames: [14, 15], frameRate: 5, repeat: 0 },
}

export const RAZORWING_ANIMATIONS: Record<MonsterAnimationState, MonsterAnimationDefinition> = {
  idle: { key: 'razorwing-idle', frames: [0, 1, 2, 3], frameRate: 8, repeat: -1 },
  move: { key: 'razorwing-flight', frames: [4, 5, 6, 7], frameRate: 13, repeat: -1 },
  telegraph: { key: 'razorwing-telegraph', frames: [8, 9], frameRate: 9, repeat: -1 },
  attack: { key: 'razorwing-dash', frames: [10, 11], frameRate: 16, repeat: -1 },
  recover: { key: 'razorwing-recover', frames: [9, 4], frameRate: 8, repeat: 0 },
  hit: { key: 'razorwing-hit', frames: [12, 13], frameRate: 15, repeat: 0 },
  death: { key: 'razorwing-death', frames: [14, 15], frameRate: 5, repeat: 0 },
}

export const SHELLBACK_ANIMATIONS: Record<MonsterAnimationState, MonsterAnimationDefinition> = {
  idle: { key: 'shellback-idle', frames: [0, 1, 2, 3], frameRate: 5, repeat: -1 },
  move: { key: 'shellback-walk', frames: [4, 5, 6, 7], frameRate: 7, repeat: -1 },
  telegraph: { key: 'shellback-brace', frames: [8, 9], frameRate: 6, repeat: -1 },
  attack: { key: 'shellback-slam', frames: [10], frameRate: 1, repeat: 0 },
  recover: { key: 'shellback-recover', frames: [11, 3], frameRate: 5, repeat: 0 },
  hit: { key: 'shellback-hit', frames: [12, 13], frameRate: 10, repeat: 0 },
  death: { key: 'shellback-death', frames: [14, 15], frameRate: 4, repeat: 0 },
}

export const BLOODLEECH_ANIMATIONS: Record<MonsterAnimationState, MonsterAnimationDefinition> = {
  idle: { key: 'bloodleech-idle', frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 },
  move: { key: 'bloodleech-inch', frames: [4, 5, 6, 7], frameRate: 9, repeat: -1 },
  telegraph: { key: 'bloodleech-open-maw', frames: [8, 9], frameRate: 7, repeat: -1 },
  attack: { key: 'bloodleech-drain', frames: [9, 10], frameRate: 12, repeat: 0 },
  recover: { key: 'bloodleech-fed-recover', frames: [11, 3], frameRate: 6, repeat: 0 },
  hit: { key: 'bloodleech-hit', frames: [12, 13], frameRate: 12, repeat: 0 },
  death: { key: 'bloodleech-rupture', frames: [14, 15], frameRate: 5, repeat: 0 },
}

export const SPITTER_ANIMATIONS: Record<MonsterAnimationState, MonsterAnimationDefinition> = {
  idle: { key: 'spitter-idle', frames: [0, 1, 2, 3], frameRate: 7, repeat: -1 },
  move: { key: 'spitter-skitter', frames: [4, 5, 6, 7], frameRate: 10, repeat: -1 },
  telegraph: { key: 'spitter-charge', frames: [8, 9], frameRate: 7, repeat: -1 },
  attack: { key: 'spitter-discharge', frames: [10], frameRate: 1, repeat: 0 },
  recover: { key: 'spitter-vent', frames: [11, 3], frameRate: 6, repeat: 0 },
  hit: { key: 'spitter-hit', frames: [12, 13], frameRate: 13, repeat: 0 },
  death: { key: 'spitter-overload', frames: [14, 15], frameRate: 5, repeat: 0 },
}

export const RIFTWEAVER_ANIMATIONS: Record<MonsterAnimationState, MonsterAnimationDefinition> = {
  idle: { key: 'riftweaver-idle', frames: [0, 1, 2, 3], frameRate: 7, repeat: -1 },
  move: { key: 'riftweaver-float', frames: [4, 5, 6, 7], frameRate: 9, repeat: -1 },
  telegraph: { key: 'riftweaver-charge', frames: [8, 9], frameRate: 7, repeat: -1 },
  attack: { key: 'riftweaver-fan', frames: [10], frameRate: 1, repeat: 0 },
  recover: { key: 'riftweaver-close', frames: [11, 3], frameRate: 6, repeat: 0 },
  hit: { key: 'riftweaver-hit', frames: [12, 13], frameRate: 12, repeat: 0 },
  death: { key: 'riftweaver-fracture', frames: [14, 15], frameRate: 5, repeat: 0 },
}

export const MONSTER_ANIMATION_ATLASES = {
  pouncer: POUNCER_ATLAS,
  razorwing: RAZORWING_ATLAS,
  shellback: SHELLBACK_ATLAS,
  bloodleech: BLOODLEECH_ATLAS,
  spitter: SPITTER_ATLAS,
  riftweaver: RIFTWEAVER_ATLAS,
} as const satisfies Partial<Record<MonsterType, MonsterAnimationAtlas>>

export const MONSTER_ANIMATION_SETS = {
  pouncer: POUNCER_ANIMATIONS,
  razorwing: RAZORWING_ANIMATIONS,
  shellback: SHELLBACK_ANIMATIONS,
  bloodleech: BLOODLEECH_ANIMATIONS,
  spitter: SPITTER_ANIMATIONS,
  riftweaver: RIFTWEAVER_ANIMATIONS,
} as const satisfies Partial<Record<MonsterType, Record<MonsterAnimationState, MonsterAnimationDefinition>>>

export function monsterUsesAtlas(type: MonsterType) {
  return type in MONSTER_ANIMATION_ATLASES
}

export function monsterTexture(type: MonsterType, fallback: string) {
  return MONSTER_ANIMATION_ATLASES[type as keyof typeof MONSTER_ANIMATION_ATLASES]?.key ?? fallback
}

export function monsterAnimationForAiState(
  aiState: string,
  speed: number,
  hitAnimationActive = false,
): MonsterAnimationState {
  if (hitAnimationActive) return 'hit'
  if (aiState === 'telegraph') return 'telegraph'
  if (aiState === 'attack') return 'attack'
  if (aiState === 'brace') return 'attack'
  if (aiState === 'recover') return 'recover'
  return speed > 18 ? 'move' : 'idle'
}

export const pouncerAnimationForAiState = monsterAnimationForAiState

export function monsterAnimationKey(type: MonsterType, state: MonsterAnimationState) {
  return MONSTER_ANIMATION_SETS[type as keyof typeof MONSTER_ANIMATION_SETS]?.[state].key
}

export function createMonsterAnimations(scene: Phaser.Scene) {
  for (const [type, definitions] of Object.entries(MONSTER_ANIMATION_SETS)) {
    const atlas = MONSTER_ANIMATION_ATLASES[type as keyof typeof MONSTER_ANIMATION_ATLASES]
    for (const definition of Object.values(definitions)) {
      if (scene.anims.exists(definition.key)) continue
      scene.anims.create({
        key: definition.key,
        frames: definition.frames.map((frame) => ({ key: atlas.key, frame })),
        frameRate: definition.frameRate,
        repeat: definition.repeat,
      })
    }
  }
}
