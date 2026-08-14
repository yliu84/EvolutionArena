import { eventHazardDamageForStage, STAGE_THREAT_CONFIG } from './difficulty'
import type { GeneFamily } from './evolution'
import type { BiomeId } from './world'

export type SigilId = 'thorn-sigil' | 'mire-sigil' | 'ember-sigil'
export type RewardSiteState = 'sealed' | 'ready' | 'opened'
export type EventOutcomeId = 'restorative-sap' | 'ancient-biomass' | 'echo-gene'

export interface RewardSiteDefinition {
  id: string
  biome: BiomeId
  name: string
  x: number
  y: number
  guardEncounterId: string
  sigil: SigilId
  sigilName: string
}

export interface WorldEventDefinition {
  id: string
  biome: BiomeId
  name: string
  x: number
  y: number
  gene: GeneFamily
}

export interface EventOutcome {
  id: EventOutcomeId
  name: string
  health: number
  evolution: number
  genes: number
}

export const REWARD_SITES: readonly RewardSiteDefinition[] = [
  {
    id: 'thorn-cache', biome: 'gloamwood', name: '荆棘秘藏', x: 1530, y: 2340,
    guardEncounterId: 'gloamwood-5', sigil: 'thorn-sigil', sigilName: '荆棘印记',
  },
  {
    id: 'mire-reliquary', biome: 'rotfen', name: '泥沼遗匣', x: 3000, y: 970,
    guardEncounterId: 'rotfen-6', sigil: 'mire-sigil', sigilName: '泥沼印记',
  },
  {
    id: 'ember-vault', biome: 'ashen-ruins', name: '余烬秘库', x: 4450, y: 2560,
    guardEncounterId: 'ashen-ruins-5', sigil: 'ember-sigil', sigilName: '余烬印记',
  },
] as const

export const WORLD_EVENTS: readonly WorldEventDefinition[] = [
  { id: 'whispering-spores', biome: 'gloamwood', name: '低语孢群', x: 1160, y: 720, gene: 'wing' },
  { id: 'drowned-memory', biome: 'rotfen', name: '溺亡记忆', x: 2320, y: 2460, gene: 'carapace' },
  { id: 'storm-scar', biome: 'ashen-ruins', name: '雷暴伤痕', x: 4000, y: 2140, gene: 'rift' },
] as const

export const EVENT_OUTCOMES: readonly EventOutcome[] = [
  { id: 'restorative-sap', name: '再生树液', health: 35, evolution: 10, genes: 0 },
  { id: 'ancient-biomass', name: '远古生物质', health: 0, evolution: 30, genes: 0 },
  { id: 'echo-gene', name: '回响基因', health: 0, evolution: 10, genes: 2 },
] as const

export function selectEventOutcome(random: () => number): EventOutcome {
  const index = Math.min(EVENT_OUTCOMES.length - 1, Math.floor(random() * EVENT_OUTCOMES.length))
  return EVENT_OUTCOMES[index]
}

export function applyEventHazard(
  outcome: EventOutcome,
  stage: number,
  hazardDamage = eventHazardDamageForStage(stage),
): EventOutcome {
  if (hazardDamage <= 0) return outcome
  return {
    ...outcome,
    name: `${outcome.name}·险变`,
    health: outcome.health - hazardDamage,
  }
}

export function isLairUnlocked(
  sigils: ReadonlySet<SigilId>,
  sites: readonly RewardSiteDefinition[] = REWARD_SITES,
): boolean {
  return sites.every((site) => sigils.has(site.sigil))
}

export function canChallengeBoss(
  sigils: ReadonlySet<SigilId>,
  evolutionStage: number,
  sites: readonly RewardSiteDefinition[] = REWARD_SITES,
  requiredStage = STAGE_THREAT_CONFIG.requiredBossStage,
): boolean {
  return evolutionStage >= requiredStage && isLairUnlocked(sigils, sites)
}

export function rewardSiteForGuard(
  encounterId: string,
  sites: readonly RewardSiteDefinition[] = REWARD_SITES,
): RewardSiteDefinition | undefined {
  return sites.find((site) => site.guardEncounterId === encounterId)
}
