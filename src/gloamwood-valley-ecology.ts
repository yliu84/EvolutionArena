import type { GloamwoodPreyKind } from './gloamwood-3d-ecology'
import { hashSeed } from './evolution'
import type { GloamwoodValleyRegionId } from './gloamwood-valley-terrain'

/** A run-level ecology seed is independent from map layout and evolution. */
export const GLOAMWOOD_ECOLOGY_SEED_PARAM = 'ecologySeed'

export type GloamwoodValleyEcologyId = 'balanced' | 'fang-migration' | 'shell-guard' | 'swarm-bloom'

export interface GloamwoodValleyEcology {
  id: GloamwoodValleyEcologyId
  labelKey: `ecology.${GloamwoodValleyEcologyId}`
  packs: Partial<Record<GloamwoodValleyRegionId, readonly (readonly GloamwoodPreyKind[])[]>>
}

/**
 * Encounter decks change who travels together, never creature health, damage,
 * map geometry or the number of fights. Every deck keeps mixed packs and every
 * run still contains Fang, Shell and Swarm prey across the whole valley.
 */
export const GLOAMWOOD_VALLEY_ECOLOGIES: readonly GloamwoodValleyEcology[] = [
  { id: 'balanced', labelKey: 'ecology.balanced', packs: {} },
  {
    id: 'fang-migration', labelKey: 'ecology.fang-migration',
    packs: {
      shallows: [
        ['fang', 'fang', 'swarm'],
        ['fang', 'shell', 'swarm'],
        ['shell', 'swarm', 'swarm'],
      ],
      gorge: [
        ['fang', 'fang', 'shell', 'swarm'],
        ['fang', 'shell', 'swarm', 'swarm'],
        ['shell', 'fang', 'fang', 'swarm'],
      ],
      headwater: [
        ['fang', 'fang', 'shell', 'swarm'],
        ['fang', 'fang', 'fang', 'swarm'],
        ['shell', 'fang', 'swarm', 'swarm'],
      ],
    },
  },
  {
    id: 'shell-guard', labelKey: 'ecology.shell-guard',
    packs: {
      shallows: [
        ['shell', 'fang', 'swarm'],
        ['shell', 'shell', 'swarm'],
        ['fang', 'swarm', 'swarm'],
      ],
      gorge: [
        ['shell', 'shell', 'fang', 'swarm'],
        ['shell', 'fang', 'swarm', 'swarm'],
        ['shell', 'shell', 'swarm', 'fang'],
      ],
      headwater: [
        ['shell', 'shell', 'fang', 'swarm'],
        ['shell', 'fang', 'shell', 'swarm'],
        ['fang', 'shell', 'swarm', 'swarm'],
      ],
    },
  },
  {
    id: 'swarm-bloom', labelKey: 'ecology.swarm-bloom',
    packs: {
      shallows: [
        ['fang', 'swarm', 'swarm'],
        ['shell', 'swarm', 'swarm'],
        ['fang', 'shell', 'swarm'],
      ],
      gorge: [
        ['fang', 'swarm', 'swarm', 'shell'],
        ['shell', 'swarm', 'swarm', 'fang'],
        ['fang', 'shell', 'swarm', 'swarm'],
      ],
      headwater: [
        ['shell', 'fang', 'swarm', 'swarm'],
        ['fang', 'swarm', 'swarm', 'fang'],
        ['shell', 'fang', 'swarm', 'swarm'],
      ],
    },
  },
] as const

export function resolveGloamwoodEcologyRunSeed(
  requestedSeed: string | null | undefined,
  nextEntropy: () => string,
) {
  const explicit = requestedSeed?.trim()
  return explicit ? `ecology-seed:${explicit}` : `ecology-run:${nextEntropy()}`
}

export function resolveGloamwoodValleyEcology(runSeed: string): GloamwoodValleyEcology {
  // Retains the historical default for pure unit tests and old direct callers.
  if (runSeed === 'valley-run') return GLOAMWOOD_VALLEY_ECOLOGIES[0]
  const candidates = GLOAMWOOD_VALLEY_ECOLOGIES.slice(1)
  return candidates[hashSeed(`${runSeed}:valley-ecology`) % candidates.length]
}

export function gloamwoodValleyEcologyPacks(
  ecology: GloamwoodValleyEcology,
  region: GloamwoodValleyRegionId,
  fallback: readonly (readonly GloamwoodPreyKind[])[],
) {
  return ecology.packs[region] ?? fallback
}
