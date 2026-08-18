import { createSeededRandom, hashSeed } from './evolution'
import { t } from './i18n'
import type { GloamwoodGeneBank, GloamwoodPreyKind } from './gloamwood-3d-ecology'

export type GloamwoodMutationFamily = GloamwoodPreyKind | 'neutral'

/**
 * A mutation is declarative data, never behaviour.
 *
 * Every field here is read by the runtime's existing authority - the single
 * damage path, the single range path, the movement owner - rather than being
 * applied by whatever code happens to be nearby. Three separate damage lookups
 * keyed on three different things is a mistake this project has already paid
 * for once; mutations are the easiest place to make it again.
 */
export interface GloamwoodMutationEffects {
  damageMultiplier?: number
  moveSpeedMultiplier?: number
  maximumHealthBonus?: number
  biomassMultiplier?: number
  /** Damage multiplier against targets under `executeBelow` of their health. */
  executeBelow?: number
  executeMultiplier?: number
  /** Damage multiplier against targets still at full health. */
  healthyTargetMultiplier?: number
  /** Extra knockback on the chain's final step only. */
  finisherKnockback?: number
  /** Share of incoming damage redirected to the nearest living enemy. */
  reflectFraction?: number
  /** Cancels kill healing outright, whatever granted it. */
  suppressKillHeal?: boolean
  /** Revive once per run at this share of maximum health. */
  reviveFraction?: number
  /** Prey inside this radius of the player move at `slowAuraFactor` speed. */
  slowAuraRadius?: number
  slowAuraFactor?: number
  /** Maximum health shed every `healthDecayIntervalSeconds`. */
  healthDecayPerInterval?: number
  healthDecayIntervalSeconds?: number
  /** Kills that buy one extra mutation offer. */
  bonusOfferEveryKills?: number
  /** Maximum health paid each time any mutation is taken. */
  maximumHealthCostPerMutation?: number
}

export interface GloamwoodMutation {
  id: string
  family: GloamwoodMutationFamily
  effects: GloamwoodMutationEffects
}

export interface GloamwoodMutationOffer {
  id: string
  family: GloamwoodMutationFamily
  name: string
  /** What it changes, in the player's language. Never a raw percentage alone. */
  rule: string
  /** What it costs. A choice without one is not a choice. */
  cost: string
  effects: GloamwoodMutationEffects
}

export interface GloamwoodMutationState {
  seed: number
  offerIndex: number
  /** Ids already taken this run; they never appear again. */
  taken: string[]
  candidates: GloamwoodMutationOffer[]
  offering: boolean
}

/**
 * Biomass between offers.
 *
 * A full run yields 76 biomass from prey (16 + 22 + 38 across the three waves),
 * so 14 gives five offers spread over the run rather than a lump at the end.
 */
export const GLOAMWOOD_MUTATION_BIOMASS_STEP = 14

/**
 * The first batch. Each entry changes a rule the player can act on and charges
 * for it; "damage -6%" is exactly the kind of entry this pool must not contain,
 * because nobody plays differently for it.
 */
export const GLOAMWOOD_MUTATION_POOL: readonly GloamwoodMutation[] = [
  // Fang: pressure.
  { id: 'fang-killer-instinct', family: 'fang', effects: { executeBelow: 0.4, executeMultiplier: 1.5, healthyTargetMultiplier: 0.85 } },
  { id: 'fang-thin-hide', family: 'fang', effects: { damageMultiplier: 1.35, maximumHealthBonus: -40 } },
  // Shell: absorbing and controlling.
  { id: 'shell-quake', family: 'shell', effects: { finisherKnockback: 2.4, moveSpeedMultiplier: 0.9 } },
  { id: 'shell-symbiosis', family: 'shell', effects: { reflectFraction: 0.3, suppressKillHeal: true } },
  // Swarm: mobility and staying alive.
  { id: 'swarm-moult', family: 'swarm', effects: { reviveFraction: 0.3 } },
    // Sporehaze replaces a first pass called Glowtrap, which widened the nest's
  // wake radius. Every prey in this game closes unconditionally, so pulling more
  // of them in could only raise the death rate - and once the larger map splits
  // aggressive from passive creatures, a lure would have to pull only the
  // passive ones to be a tool instead of a trap. That distinction does not exist
  // yet, so the entry became defensive rather than waiting on it.
  { id: 'swarm-sporehaze', family: 'swarm', effects: { slowAuraRadius: 4.2, slowAuraFactor: 0.6, biomassMultiplier: 0.75 } },
  // Neutral: the expensive ones.
  { id: 'neutral-starving-metabolism', family: 'neutral', effects: { biomassMultiplier: 2, healthDecayPerInterval: 5, healthDecayIntervalSeconds: 30 } },
  { id: 'neutral-gluttony', family: 'neutral', effects: { bonusOfferEveryKills: 3, maximumHealthCostPerMutation: 8 } },
]

export function createGloamwoodMutationState(seed: number | string): GloamwoodMutationState {
  return {
    seed: typeof seed === 'string' ? hashSeed(seed) : seed >>> 0,
    offerIndex: 0,
    taken: [],
    candidates: [],
    offering: false,
  }
}

/**
 * How many offers a run has earned by this much biomass.
 *
 * Bonus offers bought by Gluttony are added by the caller, which owns the kill
 * count; this function stays a pure function of biomass so the pacing can be
 * reasoned about on its own.
 */
export function gloamwoodMutationOffersEarned(biomass: number) {
  return Math.max(0, Math.floor(biomass / GLOAMWOOD_MUTATION_BIOMASS_STEP))
}

/**
 * Draw three, weighted by the genes banked so far.
 *
 * Genes weight and never guarantee - the same rule the form evolution already
 * teaches and has a test for. A low-weight mutation must stay reachable or
 * every run with the same diet plays out identically, which is the variance
 * this whole layer exists to create.
 */
export function generateGloamwoodMutationOffers(
  seed: number,
  offerIndex: number,
  genes: GloamwoodGeneBank,
  taken: readonly string[],
  pool: readonly GloamwoodMutation[] = GLOAMWOOD_MUTATION_POOL,
): GloamwoodMutationOffer[] {
  const random = createSeededRandom((seed ^ Math.imul(offerIndex + 1, 0x85ebca6b)) >>> 0)
  const totalGenes = Math.max(1, genes.fang + genes.shell + genes.swarm)
  const familyWeight = (family: GloamwoodMutationFamily) =>
    family === 'neutral' ? 1.6 : 1 + genes[family] / totalGenes * 4

  const remaining = pool.filter((mutation) => !taken.includes(mutation.id))
  const drawn: GloamwoodMutation[] = []
  const drawnFamilies: GloamwoodMutationFamily[] = []

  while (remaining.length > 0 && drawn.length < 3) {
    const weights = remaining.map((mutation) => {
      const diversity = drawnFamilies.includes(mutation.family) ? 0.26 : 1
      return familyWeight(mutation.family) * diversity
    })
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let roll = random() * total
    let index = weights.length - 1
    for (let candidate = 0; candidate < weights.length; candidate += 1) {
      roll -= weights[candidate]
      if (roll <= 0) {
        index = candidate
        break
      }
    }
    const [mutation] = remaining.splice(index, 1)
    drawn.push(mutation)
    drawnFamilies.push(mutation.family)
  }

  return drawn.map((mutation) => ({
    id: mutation.id,
    family: mutation.family,
    name: t(`mutation.${mutation.id}.name` as never),
    rule: t(`mutation.${mutation.id}.rule` as never),
    cost: t(`mutation.${mutation.id}.cost` as never),
    effects: mutation.effects,
  }))
}

export function openGloamwoodMutationOffer(
  state: GloamwoodMutationState,
  genes: GloamwoodGeneBank,
): GloamwoodMutationState {
  const candidates = generateGloamwoodMutationOffers(state.seed, state.offerIndex, genes, state.taken)
  if (candidates.length === 0) return { ...state, offering: false, candidates: [] }
  return { ...state, offering: true, candidates }
}

export function selectGloamwoodMutation(
  state: GloamwoodMutationState,
  id: string,
): GloamwoodMutationState {
  if (!state.candidates.some((candidate) => candidate.id === id)) return state
  return {
    ...state,
    offering: false,
    candidates: [],
    taken: [...state.taken, id],
    offerIndex: state.offerIndex + 1,
  }
}

/**
 * Fold every taken mutation into one set of effects.
 *
 * Multipliers compound and bonuses add, so two health costs are twice as
 * expensive rather than the larger of the two - stacking has to bite or the
 * high-risk entries are free after the first.
 */
export function accumulateGloamwoodMutationEffects(
  taken: readonly string[],
  pool: readonly GloamwoodMutation[] = GLOAMWOOD_MUTATION_POOL,
): GloamwoodMutationEffects {
  const effects: GloamwoodMutationEffects = {}
  for (const id of taken) {
    const mutation = pool.find((entry) => entry.id === id)
    if (!mutation) continue
    for (const [key, value] of Object.entries(mutation.effects) as [keyof GloamwoodMutationEffects, never][]) {
      const current = effects[key]
      if (typeof value === 'boolean') {
        Object.assign(effects, { [key]: (current as boolean | undefined) === true || value })
      } else if (key.endsWith('Multiplier')) {
        Object.assign(effects, { [key]: ((current as number | undefined) ?? 1) * value })
      } else {
        Object.assign(effects, { [key]: ((current as number | undefined) ?? 0) + value })
      }
    }
  }
  // A cost paid per mutation is paid for every mutation held, including itself.
  if (effects.maximumHealthCostPerMutation) {
    effects.maximumHealthBonus = (effects.maximumHealthBonus ?? 0) - effects.maximumHealthCostPerMutation * taken.length
  }
  return effects
}
