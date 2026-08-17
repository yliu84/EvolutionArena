import {
  EVOLUTION_CONFIG,
  MUTATIONS,
  applyMutationEffect,
  createSeededRandom,
  emptyGenes,
  evolutionRequirementForStage,
  resistEvolutionProgress,
  resolveHuntEvolution,
  type EvolutionRecord,
  type GeneCounts,
  type GeneFamily,
  type MutationRanks,
  type MutationStatState,
} from './evolution'
import {
  collectSoulOrb,
  type EliteOrbBuff,
  type SoulOrbDrop,
  type SoulOrbTier,
} from './soul-orbs'
import {
  applySpeciesMechanics,
  resolveEvolutionSpecies,
  type EvolutionSpeciesDefinition,
} from './evolution-species'

export const V4_BASE_MUTATION_STATS: MutationStatState = {
  bulletDamage: 1,
  meleeDamageBonus: 1,
  rangedDamageBonus: 0,
  magicDamageBonus: 0,
  playerSpeed: 330,
  dodgeCooldownMultiplier: 1,
  maxHealth: 90,
  health: 90,
  defenseReduction: 0,
  biomassGainMultiplier: 1,
  killHeal: 0,
  contactRetaliationDamage: 0,
  shotCooldown: 520,
  magicRadius: 112,
}

export const V4_BOSS_REQUIRED_NESTS = 5
export const V4_BOSS_REQUIRED_STAGE = 6

export function canChallengeV4Boss(clearedNests: number, evolutionStage: number) {
  return clearedNests >= V4_BOSS_REQUIRED_NESTS && evolutionStage >= V4_BOSS_REQUIRED_STAGE
}

const V4_ROUTE_SECONDARY: Record<GeneFamily, GeneFamily> = {
  fang: 'wing',
  wing: 'venom',
  carapace: 'venom',
  swarm: 'venom',
  venom: 'wing',
  rift: 'swarm',
}

export function createV4RouteAcceptanceState(
  family: GeneFamily,
  stats: MutationStatState = V4_BASE_MUTATION_STATS,
  requestedStage = V4_BOSS_REQUIRED_STAGE,
  requestedSecondary?: GeneFamily,
) {
  const secondary = requestedSecondary ?? V4_ROUTE_SECONDARY[family]
  const primaryMutations = MUTATIONS.filter((mutation) => mutation.family === family)
  const secondaryMutations = MUTATIONS.filter((mutation) => mutation.family === secondary)
  const fullSequence = (requestedSecondary
    ? [primaryMutations[0], secondaryMutations[0], primaryMutations[1], secondaryMutations[1], primaryMutations[0], secondaryMutations[0]]
    : [primaryMutations[0], primaryMutations[1], primaryMutations[0], primaryMutations[1], secondaryMutations[0], secondaryMutations[1]])
    .filter((mutation): mutation is (typeof MUTATIONS)[number] => Boolean(mutation))
  const sequence = fullSequence.slice(0, Math.max(0, Math.min(fullSequence.length, Math.floor(requestedStage))))
  let routeStats = { ...stats }
  const mutationRanks: MutationRanks = {}
  const evolutionChain: EvolutionRecord[] = []
  sequence.forEach((mutation, index) => {
    mutationRanks[mutation.id] = (mutationRanks[mutation.id] ?? 0) + 1
    routeStats = applyMutationEffect(routeStats, mutation.effect)
    evolutionChain.push({
      stage: index + 1,
      mutationId: mutation.id,
      family: mutation.family,
      name: mutation.name,
      kind: mutation.family === family ? 'dominant' : 'combo',
      reason: mutation.family === family ? `${family}路线验收` : `${family}+${secondary}融合验收`,
      comboName: null,
      kills: (index + 1) * 8,
    })
  })
  const genes = requestedSecondary
    ? { ...emptyGenes(), [family]: 8, [secondary]: 8 }
    : { ...emptyGenes(), [family]: 12, [secondary]: 4 }
  const recentHunts = requestedSecondary
    ? [family, secondary, family, secondary]
    : [family, family, secondary, family]
  const resolvedSpecies = resolveEvolutionSpecies(sequence.length, genes, recentHunts, mutationRanks, evolutionChain)
  if (sequence.length >= V4_BOSS_REQUIRED_STAGE) routeStats = applySpeciesMechanics(routeStats, resolvedSpecies.definition)
  const state = createV4LiveEvolutionState(routeStats)
  return {
    ...state,
    evolutionStage: sequence.length,
    genes,
    recentHunts,
    recentAppliedFamilies: evolutionChain.map((entry) => entry.family).slice(-4),
    mutationRanks,
    evolutionChain,
    stats: routeStats,
    apexSpeciesId: sequence.length >= V4_BOSS_REQUIRED_STAGE ? resolvedSpecies.definition.id : null,
    lastMessage: `${requestedSecondary ? `${family}+${secondary}` : family}${sequence.length}阶段路线验收`,
  }
}

export interface V4LiveEvolutionState {
  evolution: number
  evolutionStage: number
  pendingEvolutionAt: number
  resistCharges: number
  genes: GeneCounts
  recentHunts: GeneFamily[]
  mutationRanks: MutationRanks
  recentAppliedFamilies: GeneFamily[]
  evolutionChain: EvolutionRecord[]
  apexSpeciesId: string | null
  stats: MutationStatState
  eliteOrbBuff: EliteOrbBuff | null
  consumedGoldOrb: boolean
  goldOrbSummary: string | null
  collectedOrbs: Record<SoulOrbTier, number>
  lastMessage: string
}

export interface V4EvolutionResolution {
  state: V4LiveEvolutionState
  evolved: EvolutionRecord | null
}

export function createV4LiveEvolutionState(
  stats: MutationStatState = V4_BASE_MUTATION_STATS,
): V4LiveEvolutionState {
  return {
    evolution: 0,
    evolutionStage: 0,
    pendingEvolutionAt: 0,
    resistCharges: EVOLUTION_CONFIG.resistCharges,
    genes: emptyGenes(),
    recentHunts: [],
    mutationRanks: {},
    recentAppliedFamilies: [],
    evolutionChain: [],
    apexSpeciesId: null,
    stats: { ...stats },
    eliteOrbBuff: null,
    consumedGoldOrb: false,
    goldOrbSummary: null,
    collectedOrbs: { common: 0, elite: 0, boss: 0 },
    lastMessage: '',
  }
}

export function addV4EvolutionProgress(
  state: V4LiveEvolutionState,
  amount: number,
  now: number,
): V4LiveEvolutionState {
  const required = evolutionRequirementForStage(state.evolutionStage)
  const evolution = Math.min(required, state.evolution + Math.max(0, amount))
  return {
    ...state,
    evolution,
    pendingEvolutionAt: evolution >= required && state.pendingEvolutionAt === 0
      ? now + EVOLUTION_CONFIG.pendingMs
      : state.pendingEvolutionAt,
  }
}

export function collectV4SoulOrb(
  state: V4LiveEvolutionState,
  drop: SoulOrbDrop,
  now: number,
): V4LiveEvolutionState {
  const collected = collectSoulOrb({
    genes: state.genes,
    recentHunts: state.recentHunts,
    biomassGainMultiplier: state.stats.biomassGainMultiplier,
    now,
    activeBuff: state.eliteOrbBuff,
    consumedGoldOrb: state.consumedGoldOrb,
  }, drop)
  const next = addV4EvolutionProgress({
    ...state,
    genes: collected.genes,
    recentHunts: collected.recentHunts,
    eliteOrbBuff: collected.buff,
    consumedGoldOrb: collected.consumedGoldOrb,
    goldOrbSummary: collected.goldOrbSummary ?? state.goldOrbSummary,
    collectedOrbs: {
      ...state.collectedOrbs,
      [drop.tier]: state.collectedOrbs[drop.tier] + 1,
    },
    lastMessage: collected.message,
  }, collected.biomassGranted, now)
  return next
}

export function grantV4NestReward(
  state: V4LiveEvolutionState,
  reward: { family: GeneFamily; genes: number; evolution: number },
  now: number,
): V4LiveEvolutionState {
  return addV4EvolutionProgress({
    ...state,
    genes: {
      ...state.genes,
      [reward.family]: state.genes[reward.family] + Math.max(0, reward.genes),
    },
    lastMessage: `${reward.family}窝点基因 +${Math.max(0, reward.genes)}`,
  }, reward.evolution, now)
}

export function resistV4Evolution(state: V4LiveEvolutionState): V4LiveEvolutionState {
  if (state.pendingEvolutionAt === 0 || state.resistCharges <= 0) return state
  const required = evolutionRequirementForStage(state.evolutionStage)
  return {
    ...state,
    evolution: resistEvolutionProgress(state.evolution, required),
    pendingEvolutionAt: 0,
    resistCharges: state.resistCharges - 1,
    lastMessage: '生长被压下 · 继续猎杀以改写倾向',
  }
}

export function resolveV4Evolution(
  state: V4LiveEvolutionState,
  now: number,
  kills: number,
  random: () => number = createSeededRandom(1),
): V4EvolutionResolution {
  if (state.pendingEvolutionAt === 0 || now < state.pendingEvolutionAt) return { state, evolved: null }
  const resolved = resolveHuntEvolution(
    MUTATIONS,
    state.genes,
    state.mutationRanks,
    state.recentHunts,
    random,
    state.recentAppliedFamilies,
  )
  if (!resolved) {
    return {
      state: {
        ...state,
        evolution: 0,
        evolutionStage: state.evolutionStage >= EVOLUTION_CONFIG.maxStages
          ? state.evolutionStage + 1
          : state.evolutionStage,
        pendingEvolutionAt: 0,
        lastMessage: state.evolutionStage >= EVOLUTION_CONFIG.maxStages
          ? '过载生长 · 猎场威胁上升'
          : '身体尚未形成可用突变',
      },
      evolved: null,
    }
  }

  const record: EvolutionRecord = {
    stage: state.evolutionStage + 1,
    mutationId: resolved.mutation.id,
    family: resolved.family,
    name: resolved.mutation.name,
    kind: resolved.kind,
    reason: resolved.reason,
    comboName: resolved.comboName,
    kills,
  }
  const mutationRanks = {
    ...state.mutationRanks,
    [resolved.mutation.id]: (state.mutationRanks[resolved.mutation.id] ?? 0) + 1,
  }
  const evolutionStage = state.evolutionStage + 1
  const evolutionChain = [...state.evolutionChain, record]
  const mutationStats = applyMutationEffect(state.stats, resolved.mutation.effect)
  const species = resolveEvolutionSpecies(evolutionStage, state.genes, state.recentHunts, mutationRanks, evolutionChain)
  const reachesApex = evolutionStage === EVOLUTION_CONFIG.maxStages && state.apexSpeciesId === null
  return {
    state: {
      ...state,
      evolution: 0,
      evolutionStage,
      pendingEvolutionAt: 0,
      mutationRanks,
      recentAppliedFamilies: [...state.recentAppliedFamilies, resolved.family].slice(-4),
      evolutionChain,
      apexSpeciesId: reachesApex ? species.definition.id : state.apexSpeciesId,
      stats: reachesApex ? applySpeciesMechanics(mutationStats, species.definition) : mutationStats,
      lastMessage: `${resolved.mutation.name} · ${resolved.reason}`,
    },
    evolved: record,
  }
}

export function currentV4EvolutionSpecies(state: V4LiveEvolutionState): EvolutionSpeciesDefinition {
  return resolveEvolutionSpecies(
    state.evolutionStage,
    state.genes,
    state.recentHunts,
    state.mutationRanks,
    state.evolutionChain,
    state.apexSpeciesId,
  ).definition
}
