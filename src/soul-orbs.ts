import { whiteOrbValue } from './difficulty'
import {
  COMBO_FORMS,
  GENE_FAMILIES,
  GENE_LABELS,
  comboFormFor,
  dominantGene,
  geneLean,
  rankedGeneFamilies,
  recordRecentHunt,
  type GeneCounts,
  type GeneFamily,
} from './evolution'
import { ELITE_AFFIXES, type EliteAffixId } from './elite-affixes'
import type { BiomeId } from './world'

export type SoulOrbTier = 'common' | 'elite' | 'boss'

export interface SoulOrbVisual {
  texture: string
  size: number
  fill: number
  stroke: number
  core: number
  displayScale: number
}

export interface SoulOrbTierConfig {
  biomass: number
  geneWeight: number
  recentHuntRepeats: number
  visual: SoulOrbVisual
}

export interface SoulOrbDrop {
  tier: SoulOrbTier
  biomass: number
  gene: GeneFamily
  eliteAffix: EliteAffixId | null
  texture: string
  displayScale: number
  color: number
}

export interface EliteOrbBuff {
  affix: EliteAffixId
  name: string
  hint: string
  expiresAt: number
}

export interface EliteOrbBuffModifiers {
  damageMultiplier: number
  speedMultiplier: number
  defenseBonus: number
  lifestealRatio: number
  biomassGainBonus: number
  contactRetaliation: number
}

export interface SoulOrbCollectState {
  genes: GeneCounts
  recentHunts: readonly GeneFamily[]
  biomassGainMultiplier: number
  now: number
  activeBuff: EliteOrbBuff | null
  consumedGoldOrb: boolean
}

export interface SoulOrbCollectResult {
  genes: GeneCounts
  recentHunts: GeneFamily[]
  biomassGranted: number
  buff: EliteOrbBuff | null
  consumedGoldOrb: boolean
  goldOrbSummary: string | null
  message: string
}

export const SOUL_ORB_CONFIG = {
  common: {
    biomass: 20,
    geneWeight: 1,
    recentHuntRepeats: 1,
    visual: {
      texture: 'soul-orb-common',
      size: 16,
      fill: 0xf4f7ff,
      stroke: 0xffffff,
      core: 0xd7e4ff,
      displayScale: 1,
    },
  },
  elite: {
    biomass: 50,
    geneWeight: 2,
    recentHuntRepeats: 2,
    visual: {
      texture: 'soul-orb-elite',
      size: 22,
      fill: 0xff3b3b,
      stroke: 0xffb4b4,
      core: 0xffecec,
      displayScale: 1.38,
    },
  },
  boss: {
    biomass: 80,
    geneWeight: 3,
    recentHuntRepeats: 2,
    visual: {
      texture: 'soul-orb-boss',
      size: 30,
      fill: 0xffd24a,
      stroke: 0xfff4c4,
      core: 0xfff8e0,
      displayScale: 1.72,
    },
  },
  fragmentBiomass: 5,
  comboSecondaryWeight: 2,
  comboSecondaryRepeats: 2,
  fallbackBossGene: 'rift' as const,
  fallbackBossSecondary: 'swarm' as const,
  buffDurationMs: 8000,
  goldSettleDelayMs: 720,
} as const satisfies {
  common: SoulOrbTierConfig
  elite: SoulOrbTierConfig
  boss: SoulOrbTierConfig
  fragmentBiomass: number
  comboSecondaryWeight: number
  comboSecondaryRepeats: number
  fallbackBossGene: GeneFamily
  fallbackBossSecondary: GeneFamily
  buffDurationMs: number
  goldSettleDelayMs: number
}

export const IDLE_ORB_BUFF_MODIFIERS: EliteOrbBuffModifiers = {
  damageMultiplier: 1,
  speedMultiplier: 1,
  defenseBonus: 0,
  lifestealRatio: 0,
  biomassGainBonus: 0,
  contactRetaliation: 0,
}

export const ELITE_ORB_BUFF_EFFECTS: Record<EliteAffixId, EliteOrbBuffModifiers> = {
  berserker: {
    ...IDLE_ORB_BUFF_MODIFIERS,
    damageMultiplier: 1.25,
    speedMultiplier: 1.22,
  },
  siphon: {
    ...IDLE_ORB_BUFF_MODIFIERS,
    lifestealRatio: 0.35,
  },
  brood: {
    ...IDLE_ORB_BUFF_MODIFIERS,
    biomassGainBonus: 0.5,
  },
  barrier: {
    ...IDLE_ORB_BUFF_MODIFIERS,
    defenseBonus: 0.18,
  },
  volatile: {
    ...IDLE_ORB_BUFF_MODIFIERS,
    contactRetaliation: 4,
  },
}

export const ELITE_ORB_BUFF_HINTS: Record<EliteAffixId, string> = {
  berserker: '狂暴余韵：伤害与移速提高',
  siphon: '吸血余韵：攻击会回收生命',
  brood: '分裂余韵：接下来吸收的魂球提供更多生物质',
  barrier: '护盾余韵：受到的伤害降低',
  volatile: '毒爆余韵：近身受击会喷出毒血',
}

export const DERIVED_STAT_LABELS: Record<GeneFamily, string> = {
  fang: '力量',
  wing: '敏捷',
  carapace: '精神',
  swarm: '虫群',
  venom: '毒素',
  rift: '魔法',
}

export function soulOrbTierFor(input: { elite?: boolean; fragment?: boolean; isBoss?: boolean }): SoulOrbTier {
  if (input.isBoss) return 'boss'
  if (input.elite && !input.fragment) return 'elite'
  return 'common'
}

export function soulOrbTierConfig(tier: SoulOrbTier): SoulOrbTierConfig {
  return SOUL_ORB_CONFIG[tier]
}

export function soulOrbDropFor(input: {
  gene: GeneFamily
  elite?: boolean
  fragment?: boolean
  isBoss?: boolean
  eliteAffix?: EliteAffixId | null
  biome?: BiomeId
  stage?: number
}): SoulOrbDrop {
  const tier = soulOrbTierFor(input)
  const config = soulOrbTierConfig(tier)
  const baseBiomass = input.fragment && tier === 'common' ? SOUL_ORB_CONFIG.fragmentBiomass : config.biomass
  const biomass = tier === 'common' && input.biome
    ? whiteOrbValue(input.biome, input.stage ?? 0, baseBiomass)
    : baseBiomass
  return {
    tier,
    biomass,
    gene: input.gene,
    eliteAffix: tier === 'elite' ? input.eliteAffix ?? null : null,
    texture: config.visual.texture,
    displayScale: config.visual.displayScale,
    color: config.visual.fill,
  }
}

export function bossSoulOrbDrop(gene: GeneFamily = SOUL_ORB_CONFIG.fallbackBossGene): SoulOrbDrop {
  return soulOrbDropFor({ gene, isBoss: true })
}

export function createEliteOrbBuff(affix: EliteAffixId, now: number, durationMs = SOUL_ORB_CONFIG.buffDurationMs): EliteOrbBuff {
  return {
    affix,
    name: ELITE_AFFIXES[affix].name,
    hint: ELITE_ORB_BUFF_HINTS[affix],
    expiresAt: now + durationMs,
  }
}

export function eliteOrbBuffModifiers(buff: EliteOrbBuff | null, now: number): EliteOrbBuffModifiers {
  if (!buff || now >= buff.expiresAt) return IDLE_ORB_BUFF_MODIFIERS
  return ELITE_ORB_BUFF_EFFECTS[buff.affix]
}

export function eliteOrbBuffRemainingMs(buff: EliteOrbBuff | null, now: number) {
  if (!buff) return 0
  return Math.max(0, buff.expiresAt - now)
}

export function derivedStatsFromGenes(genes: GeneCounts): Record<GeneFamily, number> {
  return { ...genes }
}

export function formatDerivedStats(genes: GeneCounts) {
  return GENE_FAMILIES
    .map((family) => `${DERIVED_STAT_LABELS[family]} ${genes[family]}`)
    .join(' · ')
}

export function comboPartnerFor(family: GeneFamily): GeneFamily | null {
  const form = COMBO_FORMS.find((candidate) => candidate.families.includes(family))
  if (!form) return null
  return form.families[0] === family ? form.families[1] : form.families[0]
}

export function goldOrbTendencies(
  genes: GeneCounts,
  recentHunts: readonly GeneFamily[],
  fallbackGene: GeneFamily = SOUL_ORB_CONFIG.fallbackBossGene,
) {
  const lean = geneLean(genes, recentHunts)
  const ranked = rankedGeneFamilies(lean)
  const leader = dominantGene(genes, recentHunts)
  const primary = leader ?? fallbackGene
  const secondary = leader
    ? ranked.find((family) => family !== primary && lean[family] > 0) ?? comboPartnerFor(primary)
    : SOUL_ORB_CONFIG.fallbackBossSecondary
  const combo = comboFormFor(primary, secondary)
  return { primary, secondary, comboName: combo?.name ?? null }
}

function recordRepeats(
  recentHunts: readonly GeneFamily[],
  family: GeneFamily,
  repeats: number,
): GeneFamily[] {
  let next = [...recentHunts]
  for (let index = 0; index < repeats; index += 1) {
    next = recordRecentHunt(next, family)
  }
  return next
}

export function collectSoulOrb(state: SoulOrbCollectState, drop: SoulOrbDrop): SoulOrbCollectResult {
  const genes = { ...state.genes }
  let recentHunts = [...state.recentHunts]
  const incomingBuff = eliteOrbBuffRemainingMs(state.activeBuff, state.now) > 0 ? state.activeBuff : null
  const incomingMods = eliteOrbBuffModifiers(incomingBuff, state.now)
  const biomassGranted = Math.round(
    drop.biomass * state.biomassGainMultiplier * (1 + incomingMods.biomassGainBonus),
  )
  let buff = incomingBuff
  let consumedGoldOrb = state.consumedGoldOrb
  let goldOrbSummary: string | null = null
  let message: string

  if (drop.tier === 'boss') {
    const tendency = goldOrbTendencies(genes, recentHunts, drop.gene)
    genes[tendency.primary] += SOUL_ORB_CONFIG.boss.geneWeight
    recentHunts = recordRepeats(recentHunts, tendency.primary, SOUL_ORB_CONFIG.boss.recentHuntRepeats)
    if (tendency.secondary) {
      genes[tendency.secondary] += SOUL_ORB_CONFIG.comboSecondaryWeight
      recentHunts = recordRepeats(recentHunts, tendency.secondary, SOUL_ORB_CONFIG.comboSecondaryRepeats)
    }
    consumedGoldOrb = true
    goldOrbSummary = tendency.comboName
      ? `吞噬金色魂球，身体被推向「${tendency.comboName}」终态`
      : `吞噬金色魂球，${GENE_LABELS[tendency.primary]}终态倾向被一次性推高`
    message = goldOrbSummary
  } else {
    const config = soulOrbTierConfig(drop.tier)
    genes[drop.gene] += config.geneWeight
    recentHunts = recordRepeats(recentHunts, drop.gene, config.recentHuntRepeats)
    if (drop.tier === 'elite' && drop.eliteAffix) {
      buff = createEliteOrbBuff(drop.eliteAffix, state.now)
      message = `红色魂球 · ${buff.hint}`
    } else {
      message = `白色魂球 · ${GENE_LABELS[drop.gene]}基因`
    }
  }

  return {
    genes,
    recentHunts,
    biomassGranted,
    buff,
    consumedGoldOrb,
    goldOrbSummary,
    message,
  }
}
