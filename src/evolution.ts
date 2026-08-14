export type GeneFamily = 'fang' | 'wing' | 'carapace' | 'swarm' | 'venom' | 'rift'

export type MutationEffect =
  | 'all-damage' | 'melee-damage'
  | 'move-speed' | 'dodge-cooldown'
  | 'maximum-health' | 'damage-reduction'
  | 'biomass-gain' | 'kill-heal'
  | 'ranged-damage' | 'contact-retaliation'
  | 'ranged-cooldown' | 'magic-focus'

export type MutationId =
  | 'serrated-claws' | 'execution-fangs'
  | 'swift-nerves' | 'wind-sacs'
  | 'reactive-shell' | 'mirror-carapace'
  | 'symbiotic-brood' | 'devouring-colony'
  | 'toxin-coating' | 'toxic-blood'
  | 'pulse-gland' | 'rift-chamber'

export type EvolutionKind = 'dominant' | 'combo' | 'wild'

export interface MutationDefinition {
  id: MutationId
  family: GeneFamily
  eyebrow: string
  name: string
  description: string
  stat: string
  effect: MutationEffect
  baseWeight: number
  maxRank: number
}

export interface MutationCandidate extends MutationDefinition {
  isGeneFavored: boolean
  isRecentFavored: boolean
}

export interface MutationStatState {
  bulletDamage: number
  meleeDamageBonus: number
  rangedDamageBonus: number
  magicDamageBonus: number
  playerSpeed: number
  dodgeCooldownMultiplier: number
  maxHealth: number
  health: number
  defenseReduction: number
  biomassGainMultiplier: number
  killHeal: number
  contactRetaliationDamage: number
  shotCooldown: number
  magicRadius: number
}

export interface ComboForm {
  families: readonly [GeneFamily, GeneFamily]
  name: string
  description: string
}

export interface HuntEvolutionResult {
  mutation: MutationDefinition
  family: GeneFamily
  kind: EvolutionKind
  reason: string
  lean: GeneCounts
  dominantFamily: GeneFamily | null
  secondaryFamily: GeneFamily | null
  comboName: string | null
  previewPercent: number
}

export interface EvolutionRecord {
  stage: number
  mutationId: MutationId
  family: GeneFamily
  name: string
  kind: EvolutionKind
  reason: string
  comboName: string | null
  kills: number
}

export const GENE_FAMILIES: readonly GeneFamily[] = ['fang', 'wing', 'carapace', 'swarm', 'venom', 'rift']
export const GENE_LABELS: Record<GeneFamily, string> = {
  fang: '獠牙', wing: '翼族', carapace: '甲壳', swarm: '虫群', venom: '毒液', rift: '裂隙',
}
export const GENE_COLORS: Record<GeneFamily, number> = {
  fang: 0xffc857, wing: 0x79f2a1, carapace: 0x65a9ff, swarm: 0x74e8d1, venom: 0xa7ef62, rift: 0xc887ff,
}

export const EVOLUTION_CONFIG = {
  maxStages: 6,
  requirements: [60, 80, 90, 100, 110, 120] as const,
  visualScales: [1, 1.07, 1.15, 1.24, 1.34, 1.45, 1.58] as const,
  collisionScaleCap: 1.2,
  baseCollisionRadius: 22,
  recentWeight: 0.6,
  cumulativeWeight: 0.4,
  comboRatio: 0.72,
  wildChance: 0.12,
  sameFamilyRepeatLimit: 2,
  diminishingStreak: 4,
  diminishingMultiplier: 0.55,
  previewProgress: 0.8,
  resistProgressKeep: 0.7,
  resistCharges: 1,
  pendingMs: 2200,
} as const

export const MAX_EVOLUTION_STAGES = EVOLUTION_CONFIG.maxStages
export const EVOLUTION_REQUIREMENTS = EVOLUTION_CONFIG.requirements
export const EVOLUTION_STAGE_SCALES = EVOLUTION_CONFIG.visualScales
export const RECENT_HUNT_LIMIT = 6

export const COMBO_FORMS: readonly ComboForm[] = [
  { families: ['fang', 'wing'], name: '疾风猎杀者', description: '利爪与翼膜合流，贴身撕裂后迅速拉开。' },
  { families: ['wing', 'venom'], name: '瘟疫飞龙', description: '带毒的翼膜把猎场变成疫区。' },
  { families: ['carapace', 'venom'], name: '腐蚀堡垒', description: '厚甲渗出毒液，靠近就会被反噬。' },
  { families: ['carapace', 'rift'], name: '虚空重甲', description: '甲壳裂开能量环，把冲击转成脉冲。' },
  { families: ['swarm', 'venom'], name: '疫群母体', description: '伴生幼体携带毒囊，击杀会扩散。' },
  { families: ['fang', 'carapace'], name: '装甲暴君', description: '重型前肢砸穿防线，自己几乎不被推动。' },
  { families: ['rift', 'swarm'], name: '异界孵化者', description: '裂隙中不断涌出共生组织。' },
]

export function evolutionRequirementForStage(
  completedStages: number,
  requirements: readonly number[] = EVOLUTION_CONFIG.requirements,
) {
  if (requirements.length === 0) return 60
  return requirements[Math.min(requirements.length - 1, Math.max(0, completedStages))]
}

export function evolutionScaleForStage(
  completedStages: number,
  scales: readonly number[] = EVOLUTION_CONFIG.visualScales,
) {
  if (scales.length === 0) return 1
  return scales[Math.min(scales.length - 1, Math.max(0, completedStages))]
}

export function evolutionCollisionScale(
  visualScale: number,
  cap = EVOLUTION_CONFIG.collisionScaleCap,
  maxVisual = EVOLUTION_CONFIG.visualScales[EVOLUTION_CONFIG.visualScales.length - 1],
) {
  const visualGain = Math.max(0, visualScale - 1)
  const maxGain = Math.max(0.001, maxVisual - 1)
  return Math.min(cap, 1 + visualGain / maxGain * (cap - 1))
}

export const MUTATIONS: readonly MutationDefinition[] = [
  {
    id: 'serrated-claws', family: 'fang', eyebrow: '獠牙基因', name: '锯齿利爪', effect: 'all-damage',
    description: '生长带锯齿的前肢，所有攻击造成更多伤害。', stat: '全部伤害 +1', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'execution-fangs', family: 'fang', eyebrow: '獠牙基因', name: '处决獠牙', effect: 'melee-damage',
    description: '巨型颚牙强化贴身猎杀，近战伤害进一步提高。', stat: '近战伤害 +1', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'swift-nerves', family: 'wing', eyebrow: '翼族基因', name: '迅捷神经', effect: 'move-speed',
    description: '轻化身体并延伸翼膜，移动和转向更加敏捷。', stat: '移动速度 +12%', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'wind-sacs', family: 'wing', eyebrow: '翼族基因', name: '风囊翼膜', effect: 'dodge-cooldown',
    description: '翼膜储存气流，使闪避更频繁。', stat: '闪避冷却 −15%', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'reactive-shell', family: 'carapace', eyebrow: '甲壳基因', name: '反应甲壳', effect: 'maximum-health',
    description: '增厚背甲并立即修复创伤，提高生存上限。', stat: '生命上限 +25', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'mirror-carapace', family: 'carapace', eyebrow: '甲壳基因', name: '镜面甲片', effect: 'damage-reduction',
    description: '层叠甲片偏转冲击，降低受到的伤害。', stat: '伤害减免 +5%', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'symbiotic-brood', family: 'swarm', eyebrow: '虫群基因', name: '共生幼巢', effect: 'biomass-gain',
    description: '伴生幼体协助分解猎物，获得更多生物质。', stat: '生物质获取 +15%', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'devouring-colony', family: 'swarm', eyebrow: '虫群基因', name: '吞噬菌群', effect: 'kill-heal',
    description: '菌群在击杀后回收组织，为宿主修复生命。', stat: '击杀恢复 4 生命', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'toxin-coating', family: 'venom', eyebrow: '毒液基因', name: '毒素覆膜', effect: 'ranged-damage',
    description: '弹体覆盖腐蚀毒液，强化远程猎杀能力。', stat: '远程伤害 +1', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'toxic-blood', family: 'venom', eyebrow: '毒液基因', name: '腐蚀血液', effect: 'contact-retaliation',
    description: '受到近身攻击时喷出毒血，反伤攻击者。', stat: '受击反伤 +1', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'pulse-gland', family: 'rift', eyebrow: '裂隙基因', name: '脉冲腺体', effect: 'ranged-cooldown',
    description: '裂隙能量缩短骨刺蓄积时间，提高射击频率。', stat: '远程冷却 −12%', baseWeight: 1, maxRank: 2,
  },
  {
    id: 'rift-chamber', family: 'rift', eyebrow: '裂隙基因', name: '裂隙腔室', effect: 'magic-focus',
    description: '体内形成不稳定腔室，扩大魔法范围并提高伤害。', stat: '魔法范围 +18% · 伤害 +1', baseWeight: 1, maxRank: 2,
  },
] as const

export type GeneCounts = Record<GeneFamily, number>
export type MutationRanks = Partial<Record<MutationId, number>>

export function emptyGenes(): GeneCounts {
  return { fang: 0, wing: 0, carapace: 0, swarm: 0, venom: 0, rift: 0 }
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0 || 0x9e3779b9
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ value >>> 15, value | 1)
    value ^= value + Math.imul(value ^ value >>> 7, value | 61)
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }
}

export function recentGeneCounts(recentHunts: readonly GeneFamily[]): GeneCounts {
  const counts = emptyGenes()
  for (const family of recentHunts.slice(-RECENT_HUNT_LIMIT)) counts[family] += 1
  return counts
}

export function recordRecentHunt(
  recentHunts: readonly GeneFamily[],
  family: GeneFamily,
  limit = RECENT_HUNT_LIMIT,
): GeneFamily[] {
  return [...recentHunts, family].slice(-limit)
}

export function totalGenes(genes: GeneCounts) {
  return GENE_FAMILIES.reduce((sum, family) => sum + genes[family], 0)
}

export function geneLean(genes: GeneCounts, recentHunts: readonly GeneFamily[] = []): GeneCounts {
  const recent = recentGeneCounts(recentHunts)
  const geneTotal = totalGenes(genes)
  const recentTotal = totalGenes(recent)
  const lean = emptyGenes()
  for (const family of GENE_FAMILIES) {
    const cumulative = geneTotal > 0 ? genes[family] / geneTotal : 0
    const recency = recentTotal > 0 ? recent[family] / recentTotal : 0
    lean[family] = EVOLUTION_CONFIG.cumulativeWeight * cumulative + EVOLUTION_CONFIG.recentWeight * recency
  }

  const streak = recentHunts.slice(-EVOLUTION_CONFIG.diminishingStreak)
  if (streak.length >= EVOLUTION_CONFIG.diminishingStreak && streak.every((family) => family === streak[0])) {
    lean[streak[0]] *= EVOLUTION_CONFIG.diminishingMultiplier
  }

  const leanTotal = totalGenes(lean)
  if (leanTotal <= 0) return lean
  for (const family of GENE_FAMILIES) lean[family] /= leanTotal
  return lean
}

export function rankedGeneFamilies(lean: GeneCounts): GeneFamily[] {
  return [...GENE_FAMILIES].sort((left, right) => {
    const delta = lean[right] - lean[left]
    if (Math.abs(delta) > 0.000001) return delta
    return GENE_FAMILIES.indexOf(left) - GENE_FAMILIES.indexOf(right)
  })
}

export function dominantGene(genes: GeneCounts, recentHunts: readonly GeneFamily[] = []): GeneFamily | null {
  const lean = geneLean(genes, recentHunts)
  const [leader] = rankedGeneFamilies(lean)
  return lean[leader] > 0 ? leader : null
}

export function comboFormFor(primary: GeneFamily | null, secondary: GeneFamily | null): ComboForm | null {
  if (!primary || !secondary || primary === secondary) return null
  return COMBO_FORMS.find((form) => {
    const [left, right] = form.families
    return (left === primary && right === secondary) || (left === secondary && right === primary)
  }) ?? null
}

export function currentFormName(
  ranks: MutationRanks,
  genes: GeneCounts,
  recentHunts: readonly GeneFamily[] = [],
) {
  const lean = geneLean(genes, recentHunts)
  const [primary, secondary] = rankedGeneFamilies(lean)
  const combo = lean[primary] > 0 && lean[secondary] >= lean[primary] * EVOLUTION_CONFIG.comboRatio
    ? comboFormFor(primary, secondary)
    : null
  const grown = GENE_FAMILIES.reduce((sum, family) => sum + familyRank(ranks, family), 0)
  if (combo) return grown >= EVOLUTION_CONFIG.maxStages ? `${combo.name}·终态` : combo.name
  if (lean[primary] > 0) {
    return grown >= EVOLUTION_CONFIG.maxStages
      ? `${GENE_LABELS[primary]}终极体`
      : `${GENE_LABELS[primary]}捕食者`
  }
  return '原始形态'
}

export function familyRank(ranks: MutationRanks, family: GeneFamily, pool: readonly MutationDefinition[] = MUTATIONS) {
  return pool
    .filter((mutation) => mutation.family === family)
    .reduce((sum, mutation) => sum + (ranks[mutation.id] ?? 0), 0)
}

export function leanReason(lean: GeneCounts, recentHunts: readonly GeneFamily[]) {
  const recent = recentGeneCounts(recentHunts)
  const [leader] = rankedGeneFamilies(lean)
  const recentCount = recent[leader]
  const percent = Math.round(lean[leader] * 100)
  if (recentCount <= 0 && lean[leader] <= 0) return '还没有明显猎杀倾向，身体保持可塑。'
  if (recentCount > 0) {
    return `因为你最近猎杀了${recentCount}只${GENE_LABELS[leader]}生物，${GENE_LABELS[leader]}基因出现概率提高${Math.max(percent, 1)}%。`
  }
  return `本局累计${GENE_LABELS[leader]}基因占优，身体正在向${GENE_LABELS[leader]}倾斜。`
}

export function isEvolutionPreviewReady(progress: number, required: number) {
  if (required <= 0) return false
  return progress / required >= EVOLUTION_CONFIG.previewProgress
}

function eligibleMutations(
  pool: readonly MutationDefinition[],
  ranks: MutationRanks,
  family?: GeneFamily,
) {
  return pool.filter((mutation) => (
    (family === undefined || mutation.family === family)
    && (ranks[mutation.id] ?? 0) < mutation.maxRank
  ))
}

function pickMutation(
  candidates: readonly MutationDefinition[],
  ranks: MutationRanks,
  random: () => number,
) {
  if (candidates.length === 0) return undefined
  const sorted = [...candidates].sort((left, right) => {
    const rankDelta = (ranks[left.id] ?? 0) - (ranks[right.id] ?? 0)
    if (rankDelta !== 0) return rankDelta
    return left.baseWeight === right.baseWeight
      ? left.id.localeCompare(right.id)
      : right.baseWeight - left.baseWeight
  })
  if (sorted.length === 1 || random() < 0.62) return sorted[0]
  return sorted[Math.min(sorted.length - 1, Math.floor(random() * sorted.length))]
}

export function resolveHuntEvolution(
  pool: readonly MutationDefinition[],
  genes: GeneCounts,
  ranks: MutationRanks,
  recentHunts: readonly GeneFamily[],
  random: () => number,
  recentAppliedFamilies: readonly GeneFamily[] = [],
): HuntEvolutionResult | null {
  const eligible = eligibleMutations(pool, ranks)
  if (eligible.length === 0) return null

  const lean = geneLean(genes, recentHunts)
  const ranked = rankedGeneFamilies(lean)
  const dominantFamily = lean[ranked[0]] > 0 ? ranked[0] : null
  const secondaryFamily = ranked.slice(1).find((family) => lean[family] > 0) ?? null
  const comboReady = Boolean(
    dominantFamily
    && secondaryFamily
    && lean[secondaryFamily] >= lean[dominantFamily] * EVOLUTION_CONFIG.comboRatio,
  )
  const repeatStreak = recentAppliedFamilies.slice(-EVOLUTION_CONFIG.sameFamilyRepeatLimit)
  const forceWild = Boolean(
    dominantFamily
    && repeatStreak.length >= EVOLUTION_CONFIG.sameFamilyRepeatLimit
    && repeatStreak.every((family) => family === dominantFamily),
  )
  const rollWild = random() >= 1 - EVOLUTION_CONFIG.wildChance

  let kind: EvolutionKind = 'dominant'
  let familyPool: MutationDefinition[] = []
  if ((forceWild || rollWild) && dominantFamily) {
    familyPool = eligible.filter((mutation) => mutation.family !== dominantFamily)
    if (familyPool.length > 0) kind = 'wild'
  }
  if (familyPool.length === 0 && comboReady && secondaryFamily) {
    familyPool = eligibleMutations(pool, ranks, secondaryFamily)
    if (familyPool.length > 0) kind = 'combo'
  }
  if (familyPool.length === 0 && dominantFamily) {
    familyPool = eligibleMutations(pool, ranks, dominantFamily)
    kind = 'dominant'
  }
  if (familyPool.length === 0) familyPool = eligible

  const mutation = pickMutation(familyPool, ranks, random)
  if (!mutation) return null

  const combo = kind === 'combo' ? comboFormFor(dominantFamily, secondaryFamily) : comboFormFor(mutation.family, secondaryFamily)
  const previewPercent = Math.round((lean[mutation.family] || lean[ranked[0]] || 0) * 100)
  const reason = kind === 'wild'
    ? `猎杀路径过于单一，身体突发${GENE_LABELS[mutation.family]}异变。`
    : kind === 'combo' && combo
      ? `两类基因接近，身体开始融合成「${combo.name}」。`
      : leanReason(lean, recentHunts)

  return {
    mutation,
    family: mutation.family,
    kind,
    reason,
    lean,
    dominantFamily,
    secondaryFamily,
    comboName: combo?.name ?? null,
    previewPercent,
  }
}

export function applyMutationEffect(state: MutationStatState, effect: MutationEffect): MutationStatState {
  const next = { ...state }
  if (effect === 'all-damage') next.bulletDamage += 1
  if (effect === 'melee-damage') next.meleeDamageBonus += 1
  if (effect === 'move-speed') next.playerSpeed = Math.round(next.playerSpeed * 1.12)
  if (effect === 'dodge-cooldown') next.dodgeCooldownMultiplier = Math.round(next.dodgeCooldownMultiplier * 85) / 100
  if (effect === 'maximum-health') {
    next.maxHealth += 25
    next.health = Math.min(next.maxHealth, next.health + 25)
  }
  if (effect === 'damage-reduction') next.defenseReduction = Math.min(0.45, next.defenseReduction + 0.05)
  if (effect === 'biomass-gain') next.biomassGainMultiplier = Math.round(next.biomassGainMultiplier * 115) / 100
  if (effect === 'kill-heal') next.killHeal += 4
  if (effect === 'ranged-damage') next.rangedDamageBonus += 1
  if (effect === 'contact-retaliation') next.contactRetaliationDamage += 1
  if (effect === 'ranged-cooldown') next.shotCooldown = Math.max(360, Math.round(next.shotCooldown * 0.88))
  if (effect === 'magic-focus') {
    next.magicRadius = Math.round(next.magicRadius * 1.18)
    next.magicDamageBonus += 1
  }
  return next
}

export function resistEvolutionProgress(current: number, required: number) {
  return Math.round(required * EVOLUTION_CONFIG.resistProgressKeep * Math.min(1, current / Math.max(1, required)))
}

function candidateWeight(mutation: MutationDefinition, genes: GeneCounts, recent: GeneCounts) {
  const lean = geneLean(genes, GENE_FAMILIES.flatMap((family) => Array.from({ length: recent[family] }, () => family)))
  return mutation.baseWeight * (1 + lean[mutation.family] * 4)
}

function weightedIndex(
  candidates: readonly MutationDefinition[],
  genes: GeneCounts,
  recent: GeneCounts,
  random: () => number,
) {
  const weights = candidates.map((mutation) => candidateWeight(mutation, genes, recent))
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0)
  const roll = total > 0 ? random() * total : random() * candidates.length
  let cursor = 0
  for (let index = 0; index < candidates.length; index += 1) {
    cursor += total > 0 ? Math.max(0, weights[index]) : 1
    if (roll < cursor) return index
  }
  return candidates.length - 1
}

export function selectMutationCandidates(
  pool: readonly MutationDefinition[],
  genes: GeneCounts,
  ranks: MutationRanks,
  count: number,
  random: () => number,
  recentHunts: readonly GeneFamily[] = [],
): MutationCandidate[] {
  const recent = recentGeneCounts(recentHunts)
  const eligible = eligibleMutations(pool, ranks)
  const remaining = [...eligible]
  const selected: MutationDefinition[] = []
  const favoredFamily = dominantGene(genes, recentHunts)

  if (favoredFamily && count > 0) {
    const familyPool = remaining.filter((mutation) => mutation.family === favoredFamily)
    if (familyPool.length > 0) {
      const familyChoice = familyPool[weightedIndex(familyPool, genes, recent, random)]
      selected.push(familyChoice)
      remaining.splice(remaining.findIndex((mutation) => mutation.id === familyChoice.id), 1)
    }
  }

  while (remaining.length > 0 && selected.length < count) {
    const selectedIndex = weightedIndex(remaining, genes, recent, random)
    selected.push(remaining.splice(selectedIndex, 1)[0])
  }

  return selected.map((mutation) => ({
    ...mutation,
    isGeneFavored: genes[mutation.family] > 0,
    isRecentFavored: recent[mutation.family] > 0,
  }))
}

export function hashSeed(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
