import type { GloamwoodEvolutionState } from './gloamwood-3d-evolution'
import type { GloamwoodPreyKind } from './gloamwood-3d-ecology'
import { t } from './i18n'

export type GloamwoodOnboardingPhase =
  | 'move'
  | 'approach'
  | 'lock'
  | 'attack'
  | 'hunt'
  | 'evolution'
  | 'guardian'
  | 'boss'
  | 'complete'
  | 'recover'

export interface GloamwoodOnboardingSnapshot {
  runPhase: 'hunt' | 'evolution' | 'guardian' | 'boss' | 'victory' | 'defeat'
  movedDistance: number
  nestPhase: string
  targetLocked: boolean
  targetKind: GloamwoodPreyKind | null
  attackStarted: boolean
  kills: number
  biomass: number
  genes: { fang: number; shell: number; swarm: number }
  evolutionPhase: GloamwoodEvolutionState['phase']
  objectiveDistance: number
  bossPattern: string
  bossPhase: number
  controls: { move: string; lock: string; attack: string }
}

export interface GloamwoodOnboardingStep {
  phase: GloamwoodOnboardingPhase
  step: number
  totalSteps: number
  eyebrow: string
  title: string
  instruction: string
  reason: string
  progress: string
  tone: 'guide' | 'combat' | 'danger' | 'complete'
}

const TOTAL_STEPS = 7

function familyCombatHint(kind: GloamwoodPreyKind | null) {
  if (kind === 'shell') return t('hint.family.shell')
  if (kind === 'swarm') return t('hint.family.swarm')
  if (kind === 'fang') return t('hint.family.fang')
  return t('hint.family.unknown')
}

function bossSafetyHint(pattern: string) {
  if (pattern === 'root-slam') return t('hint.boss.root-slam')
  if (pattern === 'thorn-charge') return t('hint.boss.thorn-charge')
  if (pattern === 'spore-ring') return t('hint.boss.spore-ring')
  return t('hint.boss.unknown')
}

function guideEyebrow(step: number) {
  return t('guide.eyebrow', { step, total: TOTAL_STEPS })
}

export function deriveGloamwoodOnboardingStep(snapshot: GloamwoodOnboardingSnapshot): GloamwoodOnboardingStep {
  if (snapshot.runPhase === 'victory') {
    return {
      phase: 'complete', step: TOTAL_STEPS, totalSteps: TOTAL_STEPS, eyebrow: t('guide.complete.eyebrow'),
      title: t('guide.complete.title'), instruction: t('guide.complete.instruction'),
      reason: t('guide.complete.reason'), progress: t('guide.complete.progress'), tone: 'complete',
    }
  }
  if (snapshot.runPhase === 'defeat') {
    return {
      phase: 'recover', step: TOTAL_STEPS, totalSteps: TOTAL_STEPS, eyebrow: t('guide.recover.eyebrow'),
      title: t('guide.recover.title'), instruction: t('guide.recover.instruction'),
      reason: t('guide.recover.reason'), progress: t('guide.recover.progress'), tone: 'danger',
    }
  }
  if (snapshot.runPhase === 'boss') {
    const step = snapshot.bossPhase >= 2 ? 7 : 6
    return {
      phase: 'boss', step, totalSteps: TOTAL_STEPS, eyebrow: guideEyebrow(step),
      title: t('guide.boss.title'), instruction: bossSafetyHint(snapshot.bossPattern),
      reason: t('guide.boss.reason'), progress: t('guide.boss.progress', { distance: Math.round(snapshot.objectiveDistance) }), tone: 'danger',
    }
  }
  if (snapshot.runPhase === 'guardian') {
    return {
      phase: 'guardian', step: 5, totalSteps: TOTAL_STEPS, eyebrow: guideEyebrow(5),
      title: t('guide.guardian.title'), instruction: t('guide.guardian.instruction'),
      reason: t('guide.guardian.reason'), progress: t('guide.guardian.progress', { distance: Math.round(snapshot.objectiveDistance) }), tone: 'combat',
    }
  }
  if (snapshot.runPhase === 'evolution' || snapshot.evolutionPhase === 'choosing' || snapshot.nestPhase === 'cleared') {
    return {
      phase: 'evolution', step: 4, totalSteps: TOTAL_STEPS, eyebrow: guideEyebrow(4),
      title: t('guide.evolution.title'), instruction: t('guide.evolution.instruction'),
      reason: t('guide.evolution.reason'),
      progress: t('guide.evolution.progress', { fang: snapshot.genes.fang, shell: snapshot.genes.shell, swarm: snapshot.genes.swarm }), tone: 'guide',
    }
  }
  if (snapshot.kills > 0 || snapshot.attackStarted) {
    return {
      phase: 'hunt', step: 3, totalSteps: TOTAL_STEPS, eyebrow: guideEyebrow(3),
      title: t('guide.hunt.title'), instruction: familyCombatHint(snapshot.targetKind),
      reason: t('guide.hunt.reason'),
      progress: t('guide.hunt.progress', { kills: snapshot.kills, biomass: snapshot.biomass }), tone: 'combat',
    }
  }
  if (snapshot.targetLocked) {
    return {
      phase: 'attack', step: 2, totalSteps: TOTAL_STEPS, eyebrow: guideEyebrow(2),
      title: t('guide.attack.title'), instruction: t('guide.attack.instruction', { lock: snapshot.controls.lock, attack: snapshot.controls.attack }),
      reason: t('guide.attack.reason'), progress: t('guide.attack.progress'), tone: 'combat',
    }
  }
  if (snapshot.nestPhase !== 'dormant') {
    return {
      phase: 'lock', step: 2, totalSteps: TOTAL_STEPS, eyebrow: guideEyebrow(2),
      title: t('guide.lock.title'), instruction: t('guide.lock.instruction', { lock: snapshot.controls.lock }),
      reason: t('guide.lock.reason'), progress: t('guide.lock.progress'), tone: 'combat',
    }
  }
  if (snapshot.movedDistance >= 1.25) {
    return {
      phase: 'approach', step: 1, totalSteps: TOTAL_STEPS, eyebrow: guideEyebrow(1),
      title: t('guide.approach.title'), instruction: t('guide.approach.instruction'),
      reason: t('guide.approach.reason'), progress: t('guide.approach.progress', { distance: Math.round(snapshot.objectiveDistance) }), tone: 'guide',
    }
  }
  return {
    phase: 'move', step: 1, totalSteps: TOTAL_STEPS, eyebrow: guideEyebrow(1),
    title: t('guide.move.title'), instruction: t('guide.move.instruction', { move: snapshot.controls.move }),
    reason: t('guide.move.reason'), progress: t('guide.move.progress'), tone: 'guide',
  }
}
