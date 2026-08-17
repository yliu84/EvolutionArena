import { createSeededRandom, hashSeed } from './evolution'
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
  description: string
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

const FAMILY_NAMES: Record<GloamwoodEvolutionFamily, string> = {
  fang: '裂牙',
  shell: '岩盾',
  swarm: '群生',
}

const CANDIDATE_POOL: readonly Omit<GloamwoodEvolutionCandidate, 'reason' | 'probability'>[] = [
  {
    id: 'fang-serrated-pounce', family: 'fang', familyName: FAMILY_NAMES.fang, name: '锯齿扑爪',
    description: '前肢长出锯齿骨刃，跃扑和整套普通攻击更具处决力。',
    statLine: '普通攻击 +24% · 移速 +4%',
    modifiers: { damageMultiplier: 1.24, moveSpeedMultiplier: 1.04, maximumHealthBonus: 0, damageReduction: 0, biomassMultiplier: 1, killHeal: 0 },
  },
  {
    id: 'fang-execution-jaw', family: 'fang', familyName: FAMILY_NAMES.fang, name: '处决颚肌',
    description: '强化颚部与肩带，以较低机动换取最重的近战爆发。',
    statLine: '普通攻击 +32% · 移速 −6%',
    modifiers: { damageMultiplier: 1.32, moveSpeedMultiplier: 0.94, maximumHealthBonus: 0, damageReduction: 0, biomassMultiplier: 1, killHeal: 0 },
  },
  {
    id: 'shell-reactive-plates', family: 'shell', familyName: FAMILY_NAMES.shell, name: '反应甲片',
    description: '肩背甲片在受击时分散冲力，正面推进更稳定。',
    statLine: '生命 +30 · 减伤 12% · 移速 −8%',
    modifiers: { damageMultiplier: 1, moveSpeedMultiplier: 0.92, maximumHealthBonus: 30, damageReduction: 0.12, biomassMultiplier: 1, killHeal: 0 },
  },
  {
    id: 'shell-bastion-core', family: 'shell', familyName: FAMILY_NAMES.shell, name: '堡垒核心',
    description: '骨盆与胸腔进一步增厚，牺牲追击速度换取最大容错。',
    statLine: '生命 +45 · 减伤 8% · 移速 −12%',
    modifiers: { damageMultiplier: 1, moveSpeedMultiplier: 0.88, maximumHealthBonus: 45, damageReduction: 0.08, biomassMultiplier: 1, killHeal: 0 },
  },
  {
    id: 'swarm-symbiotic-brood', family: 'swarm', familyName: FAMILY_NAMES.swarm, name: '共生幼巢',
    description: '伴生幼体回收倒下猎物，在连续战斗中维持宿主。',
    statLine: '击杀恢复 7 · 生物质 +18% · 伤害 −6%',
    modifiers: { damageMultiplier: 0.94, moveSpeedMultiplier: 1, maximumHealthBonus: 0, damageReduction: 0, biomassMultiplier: 1.18, killHeal: 7 },
  },
  {
    id: 'swarm-hunting-cloud', family: 'swarm', familyName: FAMILY_NAMES.swarm, name: '猎行菌群',
    description: '轻化身体并让菌群协助分解，形成高机动成长路线。',
    statLine: '移速 +14% · 生物质 +12% · 生命 −10',
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
    const reason = recentCount > 0
      ? `最近吞噬 ${recentCount} 只${candidate.familyName}猎物，累计 ${geneCount} 份基因，提高了这条路线的出现权重。`
      : `累计 ${geneCount} 份${candidate.familyName}基因；本次仍可能发生低权重异变。`
    return { ...candidate, probability, reason }
  })
}
