import type { GloamwoodEvolutionState } from './gloamwood-3d-evolution'
import type { GloamwoodPreyKind } from './gloamwood-3d-ecology'

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
  if (kind === 'shell') return '岩盾正面减伤很高；绕到侧后再攻击。'
  if (kind === 'swarm') return '群虫数量多但怕范围尾扫；不要站在包围圈中央。'
  if (kind === 'fang') return '裂牙速度快但硬直明显；抓住攻击后的恢复窗口。'
  return '观察轮廓与预警：三类猎物的弱点和进攻节奏都不同。'
}

function bossSafetyHint(pattern: string) {
  if (pattern === 'root-slam') return '根须震击：预警亮起后离开中心内圈。'
  if (pattern === 'thorn-charge') return '荆棘冲锋：横向离开它锁定的冲锋通道。'
  if (pattern === 'spore-ring') return '孢子环爆：贴近安全内圈，或完全退到外圈。'
  return '先观察地面预警，再攻击；Boss每种招式都有固定安全区。'
}

export function deriveGloamwoodOnboardingStep(snapshot: GloamwoodOnboardingSnapshot): GloamwoodOnboardingStep {
  if (snapshot.runPhase === 'victory') {
    return {
      phase: 'complete', step: TOTAL_STEPS, totalSteps: TOTAL_STEPS, eyebrow: '本局完成',
      title: '你已经完成一次进化狩猎', instruction: '查看本局构筑和用时，然后重新开始尝试不同猎食路线。',
      reason: '更换优先猎食的家族，会改变下一局随机进化的候选权重。', progress: '完整循环已掌握', tone: 'complete',
    }
  }
  if (snapshot.runPhase === 'defeat') {
    return {
      phase: 'recover', step: TOTAL_STEPS, totalSteps: TOTAL_STEPS, eyebrow: '失败复盘',
      title: '看清致命攻击，再开始下一局', instruction: '结算会说明失败来源；重开后优先躲开相同预警。',
      reason: '失败不会删除操作知识；Boss招式和安全区保持可学习。', progress: '准备重新狩猎', tone: 'danger',
    }
  }
  if (snapshot.runPhase === 'boss') {
    const step = snapshot.bossPhase >= 2 ? 7 : 6
    return {
      phase: 'boss', step, totalSteps: TOTAL_STEPS, eyebrow: `猎手指引 · ${step}/7`,
      title: '读预警，猎杀荆心守望者', instruction: bossSafetyHint(snapshot.bossPattern),
      reason: '预警、攻击范围和安全区使用同一套权威参数；不要用血量硬换。', progress: `距离终局目标 ${Math.round(snapshot.objectiveDistance)}m`, tone: 'danger',
    }
  }
  if (snapshot.runPhase === 'guardian') {
    return {
      phase: 'guardian', step: 5, totalSteps: TOTAL_STEPS, eyebrow: '猎手指引 · 5/7',
      title: '击破窝点最后防线', instruction: '腐根巢卫正面防御很强；绕到侧后攻击，击破后通往Boss。',
      reason: '体型更大的敌人按身体表面计算攻击距离，不需要钻进模型内部。', progress: `距离守卫 ${Math.round(snapshot.objectiveDistance)}m`, tone: 'combat',
    }
  }
  if (snapshot.runPhase === 'evolution' || snapshot.evolutionPhase === 'choosing' || snapshot.nestPhase === 'cleared') {
    return {
      phase: 'evolution', step: 4, totalSteps: TOTAL_STEPS, eyebrow: '猎手指引 · 4/7',
      title: '根据猎食结果选择随机进化', instruction: '比较三项能力和代价；数字1–3选择，R或“抗拒”可重抽一次。',
      reason: 'Genes只提高对应路线的出现概率，不保证固定进化；这正是每局不同的来源。',
      progress: `Genes · 裂牙 ${snapshot.genes.fang} / 岩盾 ${snapshot.genes.shell} / 群生 ${snapshot.genes.swarm}`, tone: 'guide',
    }
  }
  if (snapshot.kills > 0 || snapshot.attackStarted) {
    return {
      phase: 'hunt', step: 3, totalSteps: TOTAL_STEPS, eyebrow: '猎手指引 · 3/7',
      title: '按弱点猎食，塑造下一次进化', instruction: familyCombatHint(snapshot.targetKind),
      reason: '每次击杀获得Biomass与一种家族Gene；Biomass开启进化，Genes改变候选概率。',
      progress: `窝点击杀 ${snapshot.kills}/11 · 生物质 ${snapshot.biomass}`, tone: 'combat',
    }
  }
  if (snapshot.targetLocked) {
    return {
      phase: 'attack', step: 2, totalSteps: TOTAL_STEPS, eyebrow: '猎手指引 · 2/7',
      title: '锁定目标，发动一键连招', instruction: `最近威胁会自动锁定；${snapshot.controls.lock}可切换。按${snapshot.controls.attack}或右侧“攻击”发动三段普通攻击。`,
      reason: '攻击必须在有效距离内朝向锁定目标；接触角超过8°不会命中。', progress: '目标已锁定', tone: 'combat',
    }
  }
  if (snapshot.nestPhase !== 'dormant') {
    return {
      phase: 'lock', step: 2, totalSteps: TOTAL_STEPS, eyebrow: '猎手指引 · 2/7',
      title: '先锁定威胁，再决定出手顺序', instruction: `按${snapshot.controls.lock}或右侧“锁定”选择敌人；再次按下可切换目标。`,
      reason: '锁定不会自动替你攻击，它只固定你的战斗意图。', progress: '第一波已经出现', tone: 'combat',
    }
  }
  if (snapshot.movedDistance >= 1.25) {
    return {
      phase: 'approach', step: 1, totalSteps: TOTAL_STEPS, eyebrow: '猎手指引 · 1/7',
      title: '沿猎路接近腐根孵育巢', instruction: '继续沿土路前进；进入巢穴范围会自动触发第一波。',
      reason: '先清理猎物获取Biomass和Genes，才能形成本局第一次随机进化。', progress: `距离窝点 ${Math.round(snapshot.objectiveDistance)}m`, tone: 'guide',
    }
  }
  return {
    phase: 'move', step: 1, totalSteps: TOTAL_STEPS, eyebrow: '猎手指引 · 1/7',
    title: '先学会控制身体', instruction: `使用${snapshot.controls.move}、方向键或左侧触控移动；角色会先转身再前进。`,
    reason: '移动、锁定和攻击在键鼠与触控上遵循同一套规则。', progress: '移动一小段开始狩猎', tone: 'guide',
  }
}
