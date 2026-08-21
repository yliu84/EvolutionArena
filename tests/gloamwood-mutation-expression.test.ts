import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_MUTATION_POOL } from '../src/gloamwood-3d-mutations'
import {
  GLOAMWOOD_MUTATION_EXPRESSIONS,
  gloamwoodMutationExpression,
  gloamwoodMutationExpressionCoverage,
} from '../src/gloamwood-mutation-expression'

describe('Goal 7 body-combat mutation expressions', () => {
  it('gives every offered mutation a silhouette, event trigger and reaction', () => {
    expect(gloamwoodMutationExpressionCoverage()).toBe(true)
    for (const mutation of GLOAMWOOD_MUTATION_POOL) {
      const expression = gloamwoodMutationExpression(mutation.id)
      expect(expression, mutation.id).toBeDefined()
      expect(expression?.silhouette, mutation.id).toBeTruthy()
      expect(expression?.trigger, mutation.id).toBeTruthy()
      expect(expression?.reaction, mutation.id).toBeTruthy()
    }
  })

  it('locks the five player-facing body-combat pillars before implementation', () => {
    expect(GLOAMWOOD_MUTATION_EXPRESSIONS['fang-thin-hide']).toMatchObject({ silhouette: 'rending-claws', reaction: 'double-slash' })
    expect(GLOAMWOOD_MUTATION_EXPRESSIONS['shell-symbiosis']).toMatchObject({ silhouette: 'carapace', reaction: 'armour-shards' })
    expect(GLOAMWOOD_MUTATION_EXPRESSIONS['shell-quake']).toMatchObject({ silhouette: 'spined-tail', reaction: 'suppression-ring' })
    expect(GLOAMWOOD_MUTATION_EXPRESSIONS['neutral-gluttony']).toMatchObject({ silhouette: 'feeding-core', reaction: 'feeding-pulse' })
    expect(GLOAMWOOD_MUTATION_EXPRESSIONS['swarm-sporehaze']).toMatchObject({ silhouette: 'spore-sacs', reaction: 'slow-gait' })
  })
})
