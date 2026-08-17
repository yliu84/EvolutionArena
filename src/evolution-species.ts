import {
  EVOLUTION_CONFIG,
  GENE_FAMILIES,
  geneLean,
  rankedGeneFamilies,
  type EvolutionRecord,
  type GeneCounts,
  type GeneFamily,
  type MutationRanks,
  type MutationStatState,
} from './evolution'

export type EvolutionSpeciesKind = 'origin' | 'lineage' | 'apex'
export type EvolutionSpeciesCombatStyle = 'melee' | 'ranged' | 'magic'
export type EvolutionRouteId =
  | 'origin'
  | GeneFamily
  | 'fang-wing'
  | 'wing-venom'
  | 'carapace-venom'
  | 'carapace-rift'
  | 'swarm-venom'
  | 'fang-carapace'
  | 'rift-swarm'

export interface SpeciesStatModifiers {
  bulletDamage?: number
  meleeDamageBonus?: number
  rangedDamageBonus?: number
  magicDamageBonus?: number
  playerSpeedMultiplier?: number
  dodgeCooldownMultiplier?: number
  maxHealth?: number
  defenseReduction?: number
  biomassGainMultiplier?: number
  killHeal?: number
  contactRetaliationDamage?: number
  shotCooldownMultiplier?: number
  magicRadiusMultiplier?: number
}

export interface EvolutionSpeciesDefinition {
  id: string
  name: string
  kind: EvolutionSpeciesKind
  routeId: EvolutionRouteId
  families: readonly GeneFamily[]
  bodyPlan: string
  normalAttackProfile: string
  locomotionProfile: string
  passive: string
  tradeoff: string
  visualLanguage: string
  modifiers: Readonly<SpeciesStatModifiers>
}

function species(definition: EvolutionSpeciesDefinition) {
  return definition
}

const ORIGIN_SPECIES = species({
  id: 'moss-hatchling', name: '苔鳞幼蜥', kind: 'origin', routeId: 'origin', families: [],
  bodyPlan: 'hatchling-lizard', normalAttackProfile: '谨慎撕咬', locomotionProfile: '四足幼体',
  passive: '高度可塑：尚未锁定基因方向', tradeoff: '所有能力都处于初生水平',
  visualLanguage: '苔绿幼体、短腿、大头与未成熟珊瑚冠', modifiers: {},
})

const LINEAGE_SPECIES: Record<GeneFamily, EvolutionSpeciesDefinition> = {
  fang: species({
    id: 'scarlet-hunter', name: '赤爪猎龙', kind: 'lineage', routeId: 'fang', families: ['fang'],
    bodyPlan: 'broad-chested-hunter-drake', normalAttackProfile: '扑爪、重咬与斜向尾砸', locomotionProfile: '低重心爆发追猎',
    passive: '连续近战会强化处决压力', tradeoff: '防护与远程控制较弱',
    visualLanguage: '宽胸重髋、缩小头冠、粗壮尾根与分层赤褐鳞甲', modifiers: {},
  }),
  wing: species({
    id: 'gale-skink', name: '风膜疾蜥', kind: 'lineage', routeId: 'wing', families: ['wing'],
    bodyPlan: 'membrane-runner', normalAttackProfile: '掠击连打', locomotionProfile: '高速滑翔与短距跃进',
    passive: '移动与闪避后更快重整攻击', tradeoff: '生命与抗硬直较低',
    visualLanguage: '轻骨架、长肢、双层翼膜和尾部风翎', modifiers: {},
  }),
  carapace: species({
    id: 'ironback-warden', name: '铁背守蜥', kind: 'lineage', routeId: 'carapace', families: ['carapace'],
    bodyPlan: 'armored-quadruped', normalAttackProfile: '重击与反压', locomotionProfile: '低速稳定推进',
    passive: '甲片吸收冲击并提高抗击退', tradeoff: '移动和攻击恢复更慢',
    visualLanguage: '宽体、层叠背甲、粗壮四肢与低重心', modifiers: {},
  }),
  swarm: species({
    id: 'brood-host', name: '共生巢兽', kind: 'lineage', routeId: 'swarm', families: ['swarm'],
    bodyPlan: 'brood-host', normalAttackProfile: '宿主协同攻击', locomotionProfile: '伴生群跟随',
    passive: '击杀与吞噬能维持宿主和伴生体', tradeoff: '单次爆发与正面防护较弱',
    visualLanguage: '腹侧巢囊、环绕幼体和青色共生脉络', modifiers: {},
  }),
  venom: species({
    id: 'plague-stinger', name: '疫尾毒蜥', kind: 'lineage', routeId: 'venom', families: ['venom'],
    bodyPlan: 'venom-stinger', normalAttackProfile: '毒刺与腐蚀覆膜', locomotionProfile: '中距绕行',
    passive: '持续伤害与受击反噬压缩敌人空间', tradeoff: '即时伤害和生命较低',
    visualLanguage: '分节长尾、明亮毒囊和针状尾冠', modifiers: {},
  }),
  rift: species({
    id: 'rift-salamander', name: '裂腔异蜥', kind: 'lineage', routeId: 'rift', families: ['rift'],
    bodyPlan: 'rift-channeler', normalAttackProfile: '脉冲远击', locomotionProfile: '相位侧移',
    passive: '裂隙腔室扩大远程频率与范围', tradeoff: '贴身生存与稳定性较差',
    visualLanguage: '紫色核心、环绕节点与相位触须', modifiers: {},
  }),
}

const PURE_APEX_SPECIES: Record<GeneFamily, EvolutionSpeciesDefinition> = {
  fang: species({
    id: 'bloodfang-tyrant', name: '血牙暴君', kind: 'apex', routeId: 'fang', families: ['fang'],
    bodyPlan: 'apex-predator', normalAttackProfile: '处决三连', locomotionProfile: '短程爆发追猎',
    passive: '近战与所有普通攻击伤害达到路线峰值', tradeoff: '体重增长使移动略慢',
    visualLanguage: '巨颚、镰爪与猩红背冠', modifiers: { bulletDamage: 1, meleeDamageBonus: 2, playerSpeedMultiplier: 0.94 },
  }),
  wing: species({
    id: 'tempest-sovereign', name: '风暴天翔兽', kind: 'apex', routeId: 'wing', families: ['wing'],
    bodyPlan: 'apex-sky-hunter', normalAttackProfile: '高速掠击', locomotionProfile: '双翼高速滑翔',
    passive: '移动与闪避恢复达到路线峰值', tradeoff: '最大生命降低',
    visualLanguage: '巨幅双翼、轻型胸骨和流线尾翎', modifiers: { playerSpeedMultiplier: 1.15, dodgeCooldownMultiplier: 0.75, maxHealth: -20 },
  }),
  carapace: species({
    id: 'adamant-bastion', name: '不动天甲兽', kind: 'apex', routeId: 'carapace', families: ['carapace'],
    bodyPlan: 'apex-fortress', normalAttackProfile: '震地重击', locomotionProfile: '堡垒推进',
    passive: '生命、减伤和抗压达到路线峰值', tradeoff: '移动和远程攻击节奏降低',
    visualLanguage: '堡垒冠甲、重肩盾和岩层腹甲', modifiers: { maxHealth: 50, defenseReduction: 0.12, playerSpeedMultiplier: 0.78, shotCooldownMultiplier: 1.12 },
  }),
  swarm: species({
    id: 'brood-empress', name: '万巢母皇', kind: 'apex', routeId: 'swarm', families: ['swarm'],
    bodyPlan: 'apex-broodmother', normalAttackProfile: '母巢协同围猎', locomotionProfile: '宿主与幼群同步迁移',
    passive: '生物质收益和击杀恢复达到路线峰值', tradeoff: '自身直接伤害降低',
    visualLanguage: '母巢冠囊、五体伴生群和脉动腹腔', modifiers: { bulletDamage: -1, biomassGainMultiplier: 1.25, killHeal: 8 },
  }),
  venom: species({
    id: 'venom-archon', name: '万毒疫主', kind: 'apex', routeId: 'venom', families: ['venom'],
    bodyPlan: 'apex-plague-stinger', normalAttackProfile: '疫毒连射与反噬', locomotionProfile: '毒区边缘绕行',
    passive: '远程毒压和接触反伤达到路线峰值', tradeoff: '最大生命降低',
    visualLanguage: '多腔毒囊、超长尾针和疫绿色雾脉', modifiers: { rangedDamageBonus: 2, contactRetaliationDamage: 3, shotCooldownMultiplier: 0.92, maxHealth: -15 },
  }),
  rift: species({
    id: 'singularity-beast', name: '奇点裂界兽', kind: 'apex', routeId: 'rift', families: ['rift'],
    bodyPlan: 'apex-rift-channeler', normalAttackProfile: '奇点脉冲', locomotionProfile: '连续相位滑移',
    passive: '魔法范围、伤害与远程频率达到路线峰值', tradeoff: '防护降低',
    visualLanguage: '奇点冠环、三重轨道核心和裂界光脉', modifiers: { magicDamageBonus: 3, magicRadiusMultiplier: 1.35, shotCooldownMultiplier: 0.8, defenseReduction: -0.04 },
  }),
}

const HYBRID_APEX_SPECIES: Record<Exclude<EvolutionRouteId, 'origin' | GeneFamily>, EvolutionSpeciesDefinition> = {
  'fang-wing': species({
    id: 'gale-reaper', name: '疾风猎杀者', kind: 'apex', routeId: 'fang-wing', families: ['fang', 'wing'],
    bodyPlan: 'aerial-blade-predator', normalAttackProfile: '掠入撕裂后撤', locomotionProfile: '爆发滑翔追猎',
    passive: '近战与机动同时强化', tradeoff: '最大生命略低',
    visualLanguage: '镰爪、窄翼与刀锋尾翎', modifiers: { meleeDamageBonus: 2, playerSpeedMultiplier: 1.12, dodgeCooldownMultiplier: 0.85, maxHealth: -10 },
  }),
  'wing-venom': species({
    id: 'plague-wyvern', name: '瘟疫飞龙', kind: 'apex', routeId: 'wing-venom', families: ['wing', 'venom'],
    bodyPlan: 'plague-wyvern', normalAttackProfile: '飞掠布毒', locomotionProfile: '毒云滑翔',
    passive: '高速远程压制毒区', tradeoff: '最大生命明显降低',
    visualLanguage: '半透明毒翼、尾针和雾化翼痕', modifiers: { rangedDamageBonus: 2, playerSpeedMultiplier: 1.1, shotCooldownMultiplier: 0.88, maxHealth: -15 },
  }),
  'carapace-venom': species({
    id: 'corrosion-fortress', name: '腐蚀堡垒', kind: 'apex', routeId: 'carapace-venom', families: ['carapace', 'venom'],
    bodyPlan: 'corrosive-fortress', normalAttackProfile: '腐蚀反压', locomotionProfile: '毒甲推进',
    passive: '厚甲承伤并以毒血反噬', tradeoff: '移动缓慢',
    visualLanguage: '渗毒甲缝、重盾背甲和酸液腹腔', modifiers: { maxHealth: 30, defenseReduction: 0.08, contactRetaliationDamage: 3, playerSpeedMultiplier: 0.85 },
  }),
  'carapace-rift': species({
    id: 'void-carapace', name: '虚空重甲', kind: 'apex', routeId: 'carapace-rift', families: ['carapace', 'rift'],
    bodyPlan: 'void-fortress', normalAttackProfile: '护甲脉冲', locomotionProfile: '短距相位推进',
    passive: '承伤能力与范围脉冲并存', tradeoff: '基础移动降低',
    visualLanguage: '裂缝甲片、紫色核心和环形护盾节点', modifiers: { maxHealth: 25, defenseReduction: 0.06, magicDamageBonus: 2, magicRadiusMultiplier: 1.2, playerSpeedMultiplier: 0.88 },
  }),
  'swarm-venom': species({
    id: 'plague-broodmother', name: '疫群母体', kind: 'apex', routeId: 'swarm-venom', families: ['swarm', 'venom'],
    bodyPlan: 'plague-broodmother', normalAttackProfile: '疫群扩散', locomotionProfile: '伴生群包围迁移',
    passive: '击杀恢复、资源效率与毒压协同', tradeoff: '缺乏瞬间爆发',
    visualLanguage: '毒囊幼体、母巢腹腔和扩散孢雾', modifiers: { rangedDamageBonus: 1, biomassGainMultiplier: 1.15, killHeal: 5, contactRetaliationDamage: 2 },
  }),
  'fang-carapace': species({
    id: 'armored-tyrant', name: '装甲暴君', kind: 'apex', routeId: 'fang-carapace', families: ['fang', 'carapace'],
    bodyPlan: 'armored-apex-predator', normalAttackProfile: '不可阻挡重连击', locomotionProfile: '装甲冲锋',
    passive: '近战爆发与正面承伤协同', tradeoff: '转向和移动更慢',
    visualLanguage: '重型镰爪、肩盾与犄角头甲', modifiers: { meleeDamageBonus: 2, maxHealth: 35, defenseReduction: 0.07, playerSpeedMultiplier: 0.82 },
  }),
  'rift-swarm': species({
    id: 'rift-hatcher', name: '异界孵化者', kind: 'apex', routeId: 'rift-swarm', families: ['rift', 'swarm'],
    bodyPlan: 'rift-brood-host', normalAttackProfile: '裂隙孵化脉冲', locomotionProfile: '群体相位迁移',
    passive: '魔法范围、资源循环与击杀恢复协同', tradeoff: '直接防护降低',
    visualLanguage: '传送巢囊、轨道幼体和异界触须', modifiers: { magicDamageBonus: 2, magicRadiusMultiplier: 1.18, biomassGainMultiplier: 1.15, killHeal: 4, defenseReduction: -0.03 },
  }),
}

export const EVOLUTION_SPECIES_CATALOG: readonly EvolutionSpeciesDefinition[] = [
  ORIGIN_SPECIES,
  ...GENE_FAMILIES.map((family) => LINEAGE_SPECIES[family]),
  ...GENE_FAMILIES.map((family) => PURE_APEX_SPECIES[family]),
  ...Object.values(HYBRID_APEX_SPECIES),
] as const

export const EVOLUTION_APEX_SPECIES = EVOLUTION_SPECIES_CATALOG.filter((entry) => entry.kind === 'apex')

export interface ResolvedEvolutionSpecies {
  definition: EvolutionSpeciesDefinition
  formId: string
  formName: string
  primaryFamily: GeneFamily | null
  secondaryFamily: GeneFamily | null
  routeId: EvolutionRouteId
  endpoint: boolean
}

export function hybridRouteId(left: GeneFamily, right: GeneFamily): EvolutionRouteId | null {
  const match = Object.values(HYBRID_APEX_SPECIES).find((entry) => (
    entry.families.includes(left) && entry.families.includes(right)
  ))
  return match?.routeId ?? null
}

export function resolveEvolutionSpecies(
  completedStages: number,
  genes: GeneCounts,
  recentHunts: readonly GeneFamily[] = [],
  _ranks: MutationRanks = {},
  chain: readonly EvolutionRecord[] = [],
  lockedApexSpeciesId: string | null = null,
): ResolvedEvolutionSpecies {
  const stage = Math.max(0, Math.floor(completedStages))
  if (stage === 0) return { definition: ORIGIN_SPECIES, formId: ORIGIN_SPECIES.id, formName: ORIGIN_SPECIES.name, primaryFamily: null, secondaryFamily: null, routeId: 'origin', endpoint: false }
  const locked = stage >= EVOLUTION_CONFIG.maxStages && lockedApexSpeciesId
    ? EVOLUTION_APEX_SPECIES.find((entry) => entry.id === lockedApexSpeciesId)
    : null
  if (locked) {
    return {
      definition: locked,
      formId: locked.id,
      formName: locked.name,
      primaryFamily: locked.families[0] ?? null,
      secondaryFamily: locked.families[1] ?? null,
      routeId: locked.routeId,
      endpoint: true,
    }
  }

  const lean = geneLean(genes, recentHunts)
  const ranked = rankedGeneFamilies(lean)
  const primaryFamily = lean[ranked[0]] > 0 ? ranked[0] : chain.at(-1)?.family ?? null
  if (!primaryFamily) return { definition: ORIGIN_SPECIES, formId: ORIGIN_SPECIES.id, formName: ORIGIN_SPECIES.name, primaryFamily: null, secondaryFamily: null, routeId: 'origin', endpoint: false }
  const runnerUp = ranked.find((family) => family !== primaryFamily && lean[family] > 0) ?? null
  const candidateHybrid = runnerUp && lean[runnerUp] >= lean[primaryFamily] * EVOLUTION_CONFIG.comboRatio
    ? hybridRouteId(primaryFamily, runnerUp)
    : null
  const secondaryFamily = candidateHybrid ? runnerUp : null

  if (stage < EVOLUTION_CONFIG.maxStages) {
    const definition = LINEAGE_SPECIES[primaryFamily]
    const firstFangForm = primaryFamily === 'fang' && !secondaryFamily && stage === 1
    return {
      definition,
      formId: firstFangForm ? 'scarlet-gecko' : definition.id,
      formName: firstFangForm ? '赤冠壁蜥' : definition.name,
      primaryFamily,
      secondaryFamily,
      routeId: primaryFamily,
      endpoint: false,
    }
  }

  const definition = candidateHybrid
    ? HYBRID_APEX_SPECIES[candidateHybrid as keyof typeof HYBRID_APEX_SPECIES]
    : PURE_APEX_SPECIES[primaryFamily]
  return {
    definition,
    formId: definition.id,
    formName: definition.name,
    primaryFamily,
    secondaryFamily,
    routeId: definition.routeId,
    endpoint: true,
  }
}

export function applySpeciesMechanics(
  state: MutationStatState,
  definition: EvolutionSpeciesDefinition,
): MutationStatState {
  const modifier = definition.modifiers
  const next = { ...state }
  next.bulletDamage = Math.max(1, next.bulletDamage + (modifier.bulletDamage ?? 0))
  next.meleeDamageBonus += modifier.meleeDamageBonus ?? 0
  next.rangedDamageBonus += modifier.rangedDamageBonus ?? 0
  next.magicDamageBonus += modifier.magicDamageBonus ?? 0
  next.playerSpeed = Math.max(180, Math.round(next.playerSpeed * (modifier.playerSpeedMultiplier ?? 1)))
  next.dodgeCooldownMultiplier = Math.max(0.45, Math.round(next.dodgeCooldownMultiplier * (modifier.dodgeCooldownMultiplier ?? 1) * 100) / 100)
  const healthDelta = modifier.maxHealth ?? 0
  next.maxHealth = Math.max(50, next.maxHealth + healthDelta)
  next.health = healthDelta >= 0
    ? Math.min(next.maxHealth, next.health + healthDelta)
    : Math.min(next.maxHealth, next.health)
  next.defenseReduction = Math.max(0, Math.min(0.45, next.defenseReduction + (modifier.defenseReduction ?? 0)))
  next.biomassGainMultiplier = Math.round(next.biomassGainMultiplier * (modifier.biomassGainMultiplier ?? 1) * 100) / 100
  next.killHeal += modifier.killHeal ?? 0
  next.contactRetaliationDamage += modifier.contactRetaliationDamage ?? 0
  next.shotCooldown = Math.max(300, Math.round(next.shotCooldown * (modifier.shotCooldownMultiplier ?? 1)))
  next.magicRadius = Math.round(next.magicRadius * (modifier.magicRadiusMultiplier ?? 1))
  return next
}

export function speciesDebugContract(resolved: ResolvedEvolutionSpecies) {
  const { definition } = resolved
  return {
    id: definition.id,
    name: definition.name,
    formId: resolved.formId,
    formName: resolved.formName,
    kind: definition.kind,
    routeId: resolved.routeId,
    families: [...definition.families],
    endpoint: resolved.endpoint,
    bodyPlan: definition.bodyPlan,
    normalAttackProfile: definition.normalAttackProfile,
    combatStyle: combatStyleForSpecies(definition),
    locomotionProfile: definition.locomotionProfile,
    passive: definition.passive,
    tradeoff: definition.tradeoff,
    visualLanguage: definition.visualLanguage,
    modifiers: { ...definition.modifiers },
  }
}

export function combatStyleForSpecies(definition: EvolutionSpeciesDefinition): EvolutionSpeciesCombatStyle {
  if (definition.routeId === 'rift' || definition.routeId === 'carapace-rift' || definition.routeId === 'rift-swarm') return 'magic'
  if (definition.routeId === 'venom' || definition.routeId === 'swarm' || definition.routeId === 'wing-venom' || definition.routeId === 'swarm-venom') return 'ranged'
  return 'melee'
}

export function resolveAcceptanceSpecies(
  completedStages: number,
  primary: GeneFamily,
  secondary?: GeneFamily,
) {
  const genes = secondary
    ? { fang: 0, wing: 0, carapace: 0, swarm: 0, venom: 0, rift: 0, [primary]: 8, [secondary]: 8 }
    : { fang: 0, wing: 0, carapace: 0, swarm: 0, venom: 0, rift: 0, [primary]: 12 }
  const recent = secondary ? [primary, secondary, primary, secondary] : [primary, primary, primary]
  return resolveEvolutionSpecies(completedStages, genes, recent)
}

export function quality3DAssetStageForSpecies(resolved: ResolvedEvolutionSpecies, completedStages: number): 0 | 1 | 2 | null {
  if (completedStages <= 0) return 0
  if (resolved.primaryFamily !== 'fang' || resolved.secondaryFamily) return null
  if (completedStages === 1) return 1
  if (completedStages === 2) return 2
  return null
}
