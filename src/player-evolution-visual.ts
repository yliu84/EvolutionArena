import { dominantGene, type EvolutionRecord, type GeneCounts, type GeneFamily, type MutationRanks } from './evolution'

export type EvolutionSilhouetteTier = 'hatchling' | 'adapted' | 'hunter' | 'predator' | 'alpha' | 'apex'

export interface PlayerEvolutionAppearance {
  stage: number
  tier: EvolutionSilhouetteTier
  route: GeneFamily | null
  bodyLength: number
  bodyWidth: number
  headRadius: number
  limbReach: number
  limbThickness: number
  tailLength: number
  fangLength: number
  dorsalSpikes: number
  armorPlateCount: number
  armorBulk: number
  riftOrbCount: number
  riftCoreRadius: number
  wingSpan: number
  wingPairCount: number
  broodCount: number
  broodSacRadius: number
  venomGlandRadius: number
  venomNeedleLength: number
  routeRank: number
  apex: boolean
  visibleTraits: readonly string[]
}

export function evolutionVisualFamily(
  chain: readonly EvolutionRecord[],
  genes: GeneCounts,
  recentHunts: readonly GeneFamily[],
): GeneFamily | null {
  return chain.at(-1)?.family ?? dominantGene(genes, recentHunts)
}

const STAGE_TIERS: readonly EvolutionSilhouetteTier[] = [
  'hatchling', 'adapted', 'hunter', 'hunter', 'predator', 'alpha', 'apex',
]

const FAMILY_MUTATIONS: Record<GeneFamily, readonly (keyof MutationRanks)[]> = {
  fang: ['serrated-claws', 'execution-fangs'],
  wing: ['swift-nerves', 'wind-sacs'],
  carapace: ['reactive-shell', 'mirror-carapace'],
  swarm: ['symbiotic-brood', 'devouring-colony'],
  venom: ['toxin-coating', 'toxic-blood'],
  rift: ['pulse-gland', 'rift-chamber'],
}

export const EVOLUTION_STAGE_NAMES = [
  '初生体', '适应体', '猎行体', '狩猎体', '捕食体', '首领体', '巅峰体',
] as const

export function mutationRankForFamily(ranks: MutationRanks, family: GeneFamily | null) {
  if (!family) return 0
  return FAMILY_MUTATIONS[family].reduce((sum, id) => sum + (ranks[id] ?? 0), 0)
}

export function playerEvolutionAppearance(
  completedStages: number,
  route: GeneFamily | null,
  ranks: MutationRanks,
): PlayerEvolutionAppearance {
  const stage = Math.max(0, Math.min(6, Math.floor(completedStages)))
  const routeRank = mutationRankForFamily(ranks, route)
  const routeEmphasis = Math.min(1, routeRank / 4)
  const apex = stage >= 6
  const visibleTraits: string[] = [EVOLUTION_STAGE_NAMES[stage]]
  if (stage >= 1) visibleTraits.push('增生前肢')
  if (stage >= 2) visibleTraits.push('延长躯干')
  if (stage >= 3) visibleTraits.push('背脊突起')
  if (stage >= 4) visibleTraits.push('捕食头冠')
  if (stage >= 5) visibleTraits.push('首领体格')
  if (apex) visibleTraits.push('巅峰光脉')
  if (route === 'fang' && routeRank > 0) visibleTraits.push('獠牙利爪')
  if (route === 'carapace' && routeRank > 0) {
    visibleTraits.push('层叠甲片')
    if (stage >= 4) visibleTraits.push('重甲肩盾')
    if (apex) visibleTraits.push('堡垒冠甲')
  }
  if (route === 'rift' && routeRank > 0) {
    visibleTraits.push('裂隙腔室')
    if (stage >= 3) visibleTraits.push('相位触须')
    if (apex) visibleTraits.push('奇点冠环')
  }
  if (route === 'wing' && routeRank > 0) {
    visibleTraits.push('风囊翼膜')
    if (stage >= 3) visibleTraits.push('双层飞翼')
    if (apex) visibleTraits.push('疾风尾翎')
  }
  if (route === 'swarm' && routeRank > 0) {
    visibleTraits.push('共生幼巢')
    if (stage >= 3) visibleTraits.push('伴生幼体')
    if (apex) visibleTraits.push('母巢冠囊')
  }
  if (route === 'venom' && routeRank > 0) {
    visibleTraits.push('腐蚀毒囊')
    if (stage >= 3) visibleTraits.push('分节尾刺')
    if (apex) visibleTraits.push('疫毒针冠')
  }

  return {
    stage,
    tier: STAGE_TIERS[stage],
    route,
    bodyLength: 34 + stage * 3.1 - (route === 'carapace' ? 2.5 * routeEmphasis : 0),
    bodyWidth: 25 + stage * 2.2 + (route === 'carapace' ? 7 * routeEmphasis : 0) - (route === 'wing' ? 4 * routeEmphasis : 0),
    headRadius: 11 + stage * 0.85 - (route === 'wing' ? 1.5 * routeEmphasis : 0),
    limbReach: 19 + stage * 2.1 + (route === 'fang' ? 8 * routeEmphasis : 0) + (route === 'wing' ? 6 * routeEmphasis : 0) - (route === 'carapace' ? 3 * routeEmphasis : 0),
    limbThickness: 4 + stage * 0.42 + (route === 'carapace' ? 1.8 * routeEmphasis : 0),
    tailLength: 13 + stage * 2.8 + (route === 'venom' ? 8 * routeEmphasis : 0),
    fangLength: route === 'fang' ? 3 + stage * 1.45 + 7 * routeEmphasis : Math.max(2, stage * 0.55),
    dorsalSpikes: Math.max(0, Math.min(
      route === 'fang' ? 5
        : route === 'carapace' || route === 'rift' || route === 'venom' ? 2
          : route === 'wing' || route === 'swarm' ? 1
            : 4,
      Math.floor((stage - 1) / 1.15) + (route === 'fang' && routeRank >= 3 ? 1 : 0),
    )),
    armorPlateCount: route === 'carapace' ? Math.min(6, 1 + stage + Math.floor(routeRank / 2)) : 0,
    armorBulk: route === 'carapace' ? 1 + stage * 0.09 + routeEmphasis * 0.38 : 1,
    riftOrbCount: route === 'rift' ? Math.min(3, Math.max(1, Math.ceil((stage + routeRank) / 3))) : 0,
    riftCoreRadius: route === 'rift' ? 5 + stage * 0.9 + routeEmphasis * 3 : 0,
    wingSpan: route === 'wing' ? 18 + stage * 4 + routeEmphasis * 12 : 0,
    wingPairCount: route === 'wing' ? (stage >= 3 ? 2 : 1) : 0,
    broodCount: route === 'swarm' ? Math.min(5, Math.max(1, Math.ceil((stage + routeRank) / 2))) : 0,
    broodSacRadius: route === 'swarm' ? 5 + stage * 0.65 + routeEmphasis * 2.5 : 0,
    venomGlandRadius: route === 'venom' ? 5 + stage * 0.75 + routeEmphasis * 3 : 0,
    venomNeedleLength: route === 'venom' ? 8 + stage * 2.2 + routeEmphasis * 7 : 0,
    routeRank,
    apex,
    visibleTraits,
  }
}
