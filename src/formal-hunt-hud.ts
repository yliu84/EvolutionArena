import type { GeneFamily } from './evolution'

export interface FormalHuntHudSnapshot {
  health: number
  maxHealth: number
  formName: string
  speciesName: string
  stage: number
  maxStage: number
  evolution: number
  evolutionRequired: number
  dominantFamily: GeneFamily | null
  dominantLabel: string
  objective: string
  objectiveDistance: number
  objectiveBearingDegrees: number
  target: string
  event: string
  attackLabel: string
  clearedNests: number
  requiredNests: number
  bossReady: boolean
  bossActive: boolean
  bossName: string
  bossHealth: number
  bossMaxHealth: number
  bossPhase: 1 | 2
  resistCharges: number
  evolutionPending: boolean
}

export function formalHuntHealthRatio(snapshot: Pick<FormalHuntHudSnapshot, 'health' | 'maxHealth'>) {
  return snapshot.maxHealth <= 0 ? 0 : Math.max(0, Math.min(1, snapshot.health / snapshot.maxHealth))
}

export function formalHuntEvolutionRatio(snapshot: Pick<FormalHuntHudSnapshot, 'evolution' | 'evolutionRequired'>) {
  return snapshot.evolutionRequired <= 0 ? 0 : Math.max(0, Math.min(1, snapshot.evolution / snapshot.evolutionRequired))
}

export function normalizeHudBearing(degrees: number) {
  const normalized = ((degrees + 180) % 360 + 360) % 360 - 180
  return Math.round(normalized * 10) / 10
}

export function formalHuntGateCopy(snapshot: Pick<FormalHuntHudSnapshot, 'bossReady' | 'bossActive' | 'clearedNests' | 'requiredNests' | 'stage' | 'maxStage'>) {
  if (snapshot.bossActive) return '终局猎杀进行中'
  if (snapshot.bossReady) return '古林之心已经苏醒'
  return `终局封印 · 窝点 ${snapshot.clearedNests}/${snapshot.requiredNests} · 进化 ${snapshot.stage}/${snapshot.maxStage}`
}

function setText(root: HTMLElement, selector: string, value: string) {
  const element = root.querySelector<HTMLElement>(selector)
  if (element && element.textContent !== value) element.textContent = value
}

function setProgress(root: HTMLElement, selector: string, ratio: number) {
  const element = root.querySelector<HTMLElement>(selector)
  if (element) element.style.setProperty('--progress', `${Math.round(ratio * 1000) / 10}%`)
}

export function updateFormalHuntHud(snapshot: FormalHuntHudSnapshot, documentRoot: Document = document) {
  const root = documentRoot.querySelector<HTMLElement>('[data-formal-hunt-hud]')
  if (!root) return
  root.dataset.boss = snapshot.bossActive ? 'active' : snapshot.bossReady ? 'ready' : 'locked'
  root.dataset.health = formalHuntHealthRatio(snapshot) <= 0.3 ? 'critical' : 'stable'
  setText(root, '[data-hud-form]', snapshot.formName)
  setText(root, '[data-hud-species]', snapshot.speciesName)
  setText(root, '[data-hud-health]', `${Math.max(0, snapshot.health)} / ${snapshot.maxHealth}`)
  setText(root, '[data-hud-stage]', `进化 ${snapshot.stage}/${snapshot.maxStage}`)
  setText(root, '[data-hud-evolution]', `${snapshot.evolution}/${snapshot.evolutionRequired}`)
  setText(root, '[data-hud-gene]', snapshot.dominantFamily ? `${snapshot.dominantLabel}倾向` : '尚未形成倾向')
  setText(root, '[data-hud-objective]', snapshot.objective)
  setText(root, '[data-hud-distance]', `${Math.max(0, Math.round(snapshot.objectiveDistance))}m`)
  setText(root, '[data-hud-target]', snapshot.target)
  setText(root, '[data-hud-event]', snapshot.event)
  setText(root, '[data-hud-attack]', snapshot.attackLabel)
  setText(root, '[data-hud-gate]', formalHuntGateCopy(snapshot))
  setText(root, '[data-hud-resist]', snapshot.evolutionPending
    ? `抗拒生长 · ${snapshot.resistCharges} 次`
    : `随机进化由猎物决定 · 可抗拒 ${snapshot.resistCharges} 次`)
  setProgress(root, '[data-hud-health-bar]', formalHuntHealthRatio(snapshot))
  setProgress(root, '[data-hud-evolution-bar]', formalHuntEvolutionRatio(snapshot))
  const compass = root.querySelector<HTMLElement>('[data-hud-compass]')
  if (compass) compass.style.setProperty('--bearing', `${normalizeHudBearing(snapshot.objectiveBearingDegrees)}deg`)
  const boss = root.querySelector<HTMLElement>('[data-hud-boss]')
  if (boss) {
    boss.hidden = !snapshot.bossActive
    setText(boss, '[data-hud-boss-name]', `${snapshot.bossName} · 阶段 ${snapshot.bossPhase}`)
    setText(boss, '[data-hud-boss-health]', `${snapshot.bossHealth}/${snapshot.bossMaxHealth}`)
    setProgress(boss, '[data-hud-boss-bar]', snapshot.bossMaxHealth <= 0 ? 0 : snapshot.bossHealth / snapshot.bossMaxHealth)
  }
}
