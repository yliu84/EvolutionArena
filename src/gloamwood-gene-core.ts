import type { GloamwoodPreyKind } from './gloamwood-3d-ecology'

/**
 * A visible reward for the optional fights which cost more than a normal prey.
 *
 * Genes are still the only build-shaping currency: cores do not heal, add a
 * new button, or grant a fixed mutation.  They simply add extra weight to the
 * family the player deliberately chose to hunt.
 */
export const GLOAMWOOD_GENE_CORE = {
  eliteBonus: 1,
  bossBonus: 2,
  /** Collected by walking over it, just outside a normal attack's stand-off. */
  reach: 1.35,
  /** The core must appear before standing inside its pickup radius can claim it. */
  eliteClaimDelaySeconds: 0.3,
  bossClaimDelaySeconds: 1.15,
} as const

export type GloamwoodGeneCoreSource = 'elite' | 'boss'

export interface GloamwoodGeneCore {
  id: string
  kind: GloamwoodPreyKind
  source: GloamwoodGeneCoreSource
  bonus: number
  x: number
  z: number
  age: number
  claimDelaySeconds: number
  /** A regional Boss defers its existing mutation milestone until claimed. */
  milestone?: string
}

export function createGloamwoodGeneCore(
  id: string,
  source: GloamwoodGeneCoreSource,
  kind: GloamwoodPreyKind,
  x: number,
  z: number,
  milestone?: string,
): GloamwoodGeneCore {
  return {
    id,
    source,
    kind,
    bonus: source === 'boss' ? GLOAMWOOD_GENE_CORE.bossBonus : GLOAMWOOD_GENE_CORE.eliteBonus,
    x,
    z,
    age: 0,
    claimDelaySeconds: source === 'boss'
      ? GLOAMWOOD_GENE_CORE.bossClaimDelaySeconds
      : GLOAMWOOD_GENE_CORE.eliteClaimDelaySeconds,
    milestone,
  }
}

export interface GloamwoodGeneCoreFrame {
  cores: GloamwoodGeneCore[]
  collected: GloamwoodGeneCore[]
}

/**
 * Cores never expire. An Elite detour must stay worth making if the player
 * steps away to survive its final affix, and a Boss reward must not vanish
 * while its death feedback is still playing.
 */
export function stepGloamwoodGeneCores(
  cores: readonly GloamwoodGeneCore[],
  deltaSeconds: number,
  player: { x: number; z: number; bodyRadius: number },
): GloamwoodGeneCoreFrame {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const kept: GloamwoodGeneCore[] = []
  const collected: GloamwoodGeneCore[] = []
  for (const core of cores) {
    const aged = { ...core, age: core.age + delta }
    if (
      aged.age >= aged.claimDelaySeconds
      && Math.hypot(aged.x - player.x, aged.z - player.z) <= player.bodyRadius + GLOAMWOOD_GENE_CORE.reach
    ) {
      collected.push(aged)
    } else {
      kept.push(aged)
    }
  }
  return { cores: kept, collected }
}
