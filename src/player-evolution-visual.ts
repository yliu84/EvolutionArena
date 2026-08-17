import { dominantGene, type EvolutionRecord, type GeneCounts, type GeneFamily, type MutationRanks } from './evolution'

export type EvolutionSilhouetteTier = 'hatchling' | 'adapted' | 'hunter' | 'predator' | 'alpha' | 'apex'

export interface PlayerEvolutionAppearance {
  stage: number
  tier: EvolutionSilhouetteTier
  route: GeneFamily | null
  secondaryRoute: GeneFamily | null
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
  secondaryRouteRank: number
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
  secondaryRoute: GeneFamily | null = null,
): PlayerEvolutionAppearance {
  const stage = Math.max(0, Math.min(6, Math.floor(completedStages)))
  const routeRank = mutationRankForFamily(ranks, route)
  const secondaryRouteRank = mutationRankForFamily(ranks, secondaryRoute)
  const routeEmphasis = Math.min(1, routeRank / 4)
  const secondaryEmphasis = Math.min(0.72, secondaryRouteRank / 4)
  const familyEmphasis = (family: GeneFamily) => route === family
    ? routeEmphasis
    : secondaryRoute === family ? secondaryEmphasis : 0
  const hasFamily = (family: GeneFamily) => familyEmphasis(family) > 0
  const apex = stage >= 6
  const visibleTraits: string[] = [EVOLUTION_STAGE_NAMES[stage]]
  if (stage >= 1) visibleTraits.push('增生前肢')
  if (stage >= 2) visibleTraits.push('延长躯干')
  if (stage >= 3) visibleTraits.push('背脊突起')
  if (stage >= 4) visibleTraits.push('捕食头冠')
  if (stage >= 5) visibleTraits.push('首领体格')
  if (apex) visibleTraits.push('巅峰光脉')
  if (hasFamily('fang')) visibleTraits.push('獠牙利爪')
  if (hasFamily('carapace')) {
    visibleTraits.push('层叠甲片')
    if (stage >= 4) visibleTraits.push('重甲肩盾')
    if (apex) visibleTraits.push('堡垒冠甲')
  }
  if (hasFamily('rift')) {
    visibleTraits.push('裂隙腔室')
    if (stage >= 3) visibleTraits.push('相位触须')
    if (apex) visibleTraits.push('奇点冠环')
  }
  if (hasFamily('wing')) {
    visibleTraits.push('风囊翼膜')
    if (stage >= 3) visibleTraits.push('双层飞翼')
    if (apex) visibleTraits.push('疾风尾翎')
  }
  if (hasFamily('swarm')) {
    visibleTraits.push('共生幼巢')
    if (stage >= 3) visibleTraits.push('伴生幼体')
    if (apex) visibleTraits.push('母巢冠囊')
  }
  if (hasFamily('venom')) {
    visibleTraits.push('腐蚀毒囊')
    if (stage >= 3) visibleTraits.push('分节尾刺')
    if (apex) visibleTraits.push('疫毒针冠')
  }
  if (secondaryRoute && apex) visibleTraits.push('双基因融合终态')

  const fang = familyEmphasis('fang')
  const wing = familyEmphasis('wing')
  const carapace = familyEmphasis('carapace')
  const swarm = familyEmphasis('swarm')
  const venom = familyEmphasis('venom')
  const rift = familyEmphasis('rift')

  return {
    stage,
    tier: STAGE_TIERS[stage],
    route,
    secondaryRoute,
    bodyLength: 34 + stage * 3.1 - 2.5 * carapace + 1.8 * fang,
    bodyWidth: 25 + stage * 2.2 + 7 * carapace - 4 * wing,
    headRadius: 11 + stage * 0.85 - 1.5 * wing,
    limbReach: 19 + stage * 2.1 + 8 * fang + 6 * wing - 3 * carapace,
    limbThickness: 4 + stage * 0.42 + 1.8 * carapace,
    tailLength: 13 + stage * 2.8 + 8 * venom,
    fangLength: fang > 0 ? 3 + stage * 1.45 + 7 * fang : Math.max(2, stage * 0.55),
    dorsalSpikes: Math.max(0, Math.min(
      fang > 0 ? 5
        : carapace > 0 || rift > 0 || venom > 0 ? 2
          : wing > 0 || swarm > 0 ? 1
            : 4,
      Math.floor((stage - 1) / 1.15) + (fang > 0 && routeRank + secondaryRouteRank >= 3 ? 1 : 0),
    )),
    armorPlateCount: carapace > 0 ? Math.min(6, 1 + stage + Math.floor((routeRank + secondaryRouteRank) / 2)) : 0,
    armorBulk: carapace > 0 ? 1 + stage * 0.09 + carapace * 0.38 : 1,
    riftOrbCount: rift > 0 ? Math.min(3, Math.max(1, Math.ceil((stage + routeRank + secondaryRouteRank) / 3))) : 0,
    riftCoreRadius: rift > 0 ? 5 + stage * 0.9 + rift * 3 : 0,
    wingSpan: wing > 0 ? 18 + stage * 4 + wing * 12 : 0,
    wingPairCount: wing > 0 ? (stage >= 3 ? 2 : 1) : 0,
    broodCount: swarm > 0 ? Math.min(5, Math.max(1, Math.ceil((stage + routeRank + secondaryRouteRank) / 2))) : 0,
    broodSacRadius: swarm > 0 ? 5 + stage * 0.65 + swarm * 2.5 : 0,
    venomGlandRadius: venom > 0 ? 5 + stage * 0.75 + venom * 3 : 0,
    venomNeedleLength: venom > 0 ? 8 + stage * 2.2 + venom * 7 : 0,
    routeRank,
    secondaryRouteRank,
    apex,
    visibleTraits,
  }
}
