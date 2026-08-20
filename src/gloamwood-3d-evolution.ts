import { createSeededRandom, hashSeed } from './evolution'
import { t } from './i18n'
import type { GloamwoodGeneBank, GloamwoodPreyKind } from './gloamwood-3d-ecology'

export type GloamwoodEvolutionFamily = GloamwoodPreyKind
export type GloamwoodEvolutionPhase = 'collecting' | 'choosing' | 'selected'

export interface GloamwoodEvolutionModifiers {
  damageMultiplier: number
  moveSpeedMultiplier: number
  maximumHealthBonus: number
  damageReduction: number
  biomassMultiplier: number
  killHeal: number
}

export interface GloamwoodEvolutionCandidate {
  id: string
  family: GloamwoodEvolutionFamily
  familyName: string
  name: string
  statLine: string
  reason: string
  probability: number
  modifiers: GloamwoodEvolutionModifiers
}

export interface GloamwoodEvolutionState {
  phase: GloamwoodEvolutionPhase
  seed: number
  offerIndex: number
  refreshesRemaining: number
  candidates: GloamwoodEvolutionCandidate[]
  selected: GloamwoodEvolutionCandidate | null
}

const FAMILY_KEYS = {
  fang: 'family.fang',
  shell: 'family.shell',
  swarm: 'family.swarm',
} as const

/**
 * Copy lives in the translation table and is resolved when candidates are
 * generated, not here: this module is imported before the launcher picks the
 * locale, so a literal captured at import time would freeze the wrong language.
 */
const CANDIDATE_POOL: readonly Pick<GloamwoodEvolutionCandidate, 'id' | 'family' | 'modifiers'>[] = [
  {
    id: 'fang-serrated-pounce', family: 'fang',
    modifiers: { damageMultiplier: 1.24, moveSpeedMultiplier: 1.04, maximumHealthBonus: 0, damageReduction: 0, biomassMultiplier: 1, killHeal: 0 },
  },
  {
    id: 'fang-execution-jaw', family: 'fang',
    modifiers: { damageMultiplier: 1.32, moveSpeedMultiplier: 0.94, maximumHealthBonus: 0, damageReduction: 0, biomassMultiplier: 1, killHeal: 0 },
  },
  {
    id: 'shell-reactive-plates', family: 'shell',
    modifiers: { damageMultiplier: 1, moveSpeedMultiplier: 0.92, maximumHealthBonus: 30, damageReduction: 0.12, biomassMultiplier: 1, killHeal: 0 },
  },
  {
    id: 'shell-bastion-core', family: 'shell',
    modifiers: { damageMultiplier: 1, moveSpeedMultiplier: 0.88, maximumHealthBonus: 45, damageReduction: 0.08, biomassMultiplier: 1, killHeal: 0 },
  },
  {
    id: 'swarm-symbiotic-brood', family: 'swarm',
    modifiers: { damageMultiplier: 0.94, moveSpeedMultiplier: 1, maximumHealthBonus: 0, damageReduction: 0, biomassMultiplier: 1.18, killHeal: 7 },
  },
  {
    id: 'swarm-hunting-cloud', family: 'swarm',
    modifiers: { damageMultiplier: 1, moveSpeedMultiplier: 1.14, maximumHealthBonus: -10, damageReduction: 0, biomassMultiplier: 1.12, killHeal: 3 },
  },
] as const

export function createGloamwoodEvolutionState(seed: number | string): GloamwoodEvolutionState {
  return {
    phase: 'collecting',
    seed: typeof seed === 'string' ? hashSeed(seed) : seed >>> 0,
    offerIndex: 0,
    refreshesRemaining: 1,
    candidates: [],
    selected: null,
  }
}

/**
 * What growing a stage is worth on its own, before any route is chosen.
 *
 * The route is the specialisation; the stage is the growth. They were the same
 * thing, and the result was that evolving into a bigger animal made you no
 * tougher at all: both Fang candidates carry maximumHealthBonus 0 and
 * damageReduction 0, and one Swarm candidate carries -10 health. A player who
 * took the Fang line was handed a new body that died exactly as fast as the old
 * one, and one Swarm pick left them measurably worse off.
 *
 * Flat armour rather than a percentage, and that is the whole reason it reads.
 * Creature damage in this game is 6, 14 and 12 - a 4% reduction on any of those
 * rounds straight back to the number it started from, so a percentage would be
 * a stat that does nothing. One point off every blow is 17% against the swarm
 * that chips you down in packs, which is where runs are actually lost.
 *
 * It can never make the player immune: a blow still costs at least 1.
 */
export const GLOAMWOOD_EVOLUTION_GROWTH = {
  maximumHealthBonus: 10,
  flatArmour: 1,
} as const

export function openGloamwoodEvolutionOffer(
  state: GloamwoodEvolutionState,
  genes: GloamwoodGeneBank,
  recentHunts: readonly GloamwoodPreyKind[],
): GloamwoodEvolutionState {
  if (state.phase === 'selected') return state
  return {
    ...state,
    phase: 'choosing',
    candidates: generateGloamwoodEvolutionCandidates(state.seed, state.offerIndex, genes, recentHunts),
  }
}

/**
 * Open the next offer for a run that grants more than one.
 *
 * `openGloamwoodEvolutionOffer` refuses once something has been selected,
 * which is right for a run with a single evolution in it and wrong for a road
 * with three tiers. The selection is kept - it is what the player already
 * became - and the candidates are drawn fresh from the genes they have banked
 * since.
 */
export function openGloamwoodNextEvolutionOffer(
  state: GloamwoodEvolutionState,
  genes: GloamwoodGeneBank,
  recentHunts: readonly GloamwoodPreyKind[],
): GloamwoodEvolutionState {
  if (state.phase === 'choosing') return state
  const offerIndex = state.offerIndex + 1
  return {
    ...state,
    phase: 'choosing',
    offerIndex,
    candidates: generateGloamwoodEvolutionCandidates(state.seed, offerIndex, genes, recentHunts),
  }
}

export function refreshGloamwoodEvolutionOffer(
  state: GloamwoodEvolutionState,
  genes: GloamwoodGeneBank,
  recentHunts: readonly GloamwoodPreyKind[],
): GloamwoodEvolutionState {
  if (state.phase !== 'choosing' || state.refreshesRemaining <= 0) return state
  const offerIndex = state.offerIndex + 1
  return {
    ...state,
    offerIndex,
    refreshesRemaining: state.refreshesRemaining - 1,
    candidates: generateGloamwoodEvolutionCandidates(state.seed, offerIndex, genes, recentHunts),
  }
}

export function selectGloamwoodEvolutionCandidate(
  state: GloamwoodEvolutionState,
  candidateId: string,
): GloamwoodEvolutionState {
  if (state.phase !== 'choosing') return state
  const selected = state.candidates.find((candidate) => candidate.id === candidateId) ?? null
  return selected ? { ...state, phase: 'selected', selected } : state
}

export function generateGloamwoodEvolutionCandidates(
  seed: number,
  offerIndex: number,
  genes: GloamwoodGeneBank,
  recentHunts: readonly GloamwoodPreyKind[],
): GloamwoodEvolutionCandidate[] {
  const random = createSeededRandom((seed ^ Math.imul(offerIndex + 1, 0x9e3779b9)) >>> 0)
  const recent = recentHunts.slice(-6).reduce<GloamwoodGeneBank>((counts, family) => {
    counts[family] += 1
    return counts
  }, { fang: 0, shell: 0, swarm: 0 })
  const totalGenes = Math.max(1, genes.fang + genes.shell + genes.swarm)
  const totalRecent = Math.max(1, recent.fang + recent.shell + recent.swarm)
  const familyWeights = (['fang', 'shell', 'swarm'] as const).reduce<Record<GloamwoodEvolutionFamily, number>>((weights, family) => {
    weights[family] = 1 + genes[family] / totalGenes * 4 + recent[family] / totalRecent * 3
    return weights
  }, { fang: 1, shell: 1, swarm: 1 })
  const familyTotal = familyWeights.fang + familyWeights.shell + familyWeights.swarm
  const remaining = [...CANDIDATE_POOL]
  const selected: typeof remaining = []
  const selectedFamilies: GloamwoodEvolutionFamily[] = []

  while (remaining.length > 0 && selected.length < 3) {
    const weights = remaining.map((candidate) => {
      const diversity = selectedFamilies.includes(candidate.family) ? 0.26 : 1
      return familyWeights[candidate.family] * diversity
    })
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let roll = random() * total
    let index = weights.length - 1
    for (let candidateIndex = 0; candidateIndex < weights.length; candidateIndex += 1) {
      roll -= weights[candidateIndex]
      if (roll <= 0) {
        index = candidateIndex
        break
      }
    }
    const [candidate] = remaining.splice(index, 1)
    selected.push(candidate)
    selectedFamilies.push(candidate.family)
  }

  return selected.map((candidate) => {
    const geneCount = genes[candidate.family]
    const recentCount = recent[candidate.family]
    const probability = Math.round(familyWeights[candidate.family] / familyTotal * 100)
    const family = t(FAMILY_KEYS[candidate.family])
    const reason = recentCount > 0
      ? t('evo.reason.recent', { recent: recentCount, family, genes: geneCount })
      : t('evo.reason.none', { genes: geneCount, family })
    return {
      ...candidate,
      familyName: family,
      name: t(`evo.${candidate.id}.name` as never),
      statLine: t(`evo.${candidate.id}.stat` as never),
      probability,
      reason,
    }
  })
}
