import { GLOAMWOOD_MUTATION_POOL } from './gloamwood-3d-mutations'

/**
 * The player-facing contract for a mutation. This is deliberately separate
 * from numeric effects: a rule that cannot identify its body cue, trigger and
 * reaction is not ready to ship as a body-based evolution.
 */
export interface GloamwoodMutationExpression {
  silhouette: 'rending-claws' | 'carapace' | 'spined-tail' | 'feeding-core' | 'spore-sacs' | 'moult-casing' | 'predator-crest' | 'metabolic-veins'
  trigger: 'front-hit' | 'incoming-hit' | 'tail-swipe' | 'kill' | 'nearby-enemy' | 'fatal-hit' | 'low-health-hit' | 'biomass-gain'
  reaction: 'double-slash' | 'armour-shards' | 'suppression-ring' | 'feeding-pulse' | 'slow-gait' | 'moult-burst' | 'execution-flash' | 'metabolic-pulse'
}

export const GLOAMWOOD_MUTATION_EXPRESSIONS: Readonly<Record<string, GloamwoodMutationExpression>> = {
  'fang-killer-instinct': { silhouette: 'predator-crest', trigger: 'low-health-hit', reaction: 'execution-flash' },
  'fang-thin-hide': { silhouette: 'rending-claws', trigger: 'front-hit', reaction: 'double-slash' },
  'shell-quake': { silhouette: 'spined-tail', trigger: 'tail-swipe', reaction: 'suppression-ring' },
  'shell-symbiosis': { silhouette: 'carapace', trigger: 'incoming-hit', reaction: 'armour-shards' },
  'swarm-moult': { silhouette: 'moult-casing', trigger: 'fatal-hit', reaction: 'moult-burst' },
  'swarm-sporehaze': { silhouette: 'spore-sacs', trigger: 'nearby-enemy', reaction: 'slow-gait' },
  'neutral-starving-metabolism': { silhouette: 'metabolic-veins', trigger: 'biomass-gain', reaction: 'metabolic-pulse' },
  'neutral-gluttony': { silhouette: 'feeding-core', trigger: 'kill', reaction: 'feeding-pulse' },
}

export function gloamwoodMutationExpression(id: string) {
  return GLOAMWOOD_MUTATION_EXPRESSIONS[id]
}

/** Every offer must have an observable body-combat contract before it ships. */
export function gloamwoodMutationExpressionCoverage() {
  return GLOAMWOOD_MUTATION_POOL.every((mutation) => Boolean(gloamwoodMutationExpression(mutation.id)))
}
