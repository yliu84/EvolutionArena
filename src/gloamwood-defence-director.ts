import {
  GLOAMWOOD_PREY,
  type GloamwoodNestPrey,
  type GloamwoodNestState,
  type GloamwoodPreyKind,
} from './gloamwood-3d-ecology'
import { GLOAMWOOD_DEFENCE } from './gloamwood-defence-terrain'

/**
 * The altar defence run: twelve waves, four bosses, one thing to protect.
 *
 * Pure, and separate from the map that draws it, because this is where the mode
 * actually lives. The Gloamwood's nest director spawns a ring around the player
 * and waits for them to walk into it; this one pushes creatures out of a portal
 * at one end of a road and sends them at an altar at the other. What the player
 * does in between is the mode.
 *
 * **It reuses the combat authority rather than replacing it.** `stepPrey` takes
 * a `GloamwoodPlayerPresence`, which is only `{ x, z, alive, bodyRadius }` - so
 * a creature marching on the altar is stepped against the *altar* as its
 * presence, and one that has been drawn off is stepped against the player.
 * Telegraph timing, strike windows, slot spreading, elite modifiers and facing
 * commitment all come along unchanged, and there is exactly one place in the
 * project that decides what an attack does.
 */

export interface GloamwoodDefenceWave {
  /** 1-based, and the number the HUD shows. */
  index: number
  kinds: readonly GloamwoodPreyKind[]
  /** Which authored boss body leads this wave, if any. */
  boss?: GloamwoodDefenceBossId
  /** Seconds between each creature stepping through the portal. */
  spacingSeconds: number
}

/**
 * The four bodies, in the order they arrive.
 *
 * These are the only four modelled boss bodies the project has, which is what
 * settled "at most four bosses" - the owner's number and the asset count agreed
 * without either being chosen for the other.
 *
 * Ordered by how well each sits in a forest. The Bladeshell is a river
 * crustacean and reads oddest here, so it comes first, where it matters least;
 * the Warden is the Gloamwood's own boss and the best-looking of them, so it
 * closes the run.
 */
export type GloamwoodDefenceBossId = 'bladeshell' | 'cliff-maw' | 'source-root' | 'thornheart-warden'

export const GLOAMWOOD_DEFENCE_RUN = {
  /**
   * Twelve, from the owner's "a boss every two waves, at most four".
   *
   * It is also what the content supports. A player's body evolves twice - stage
   * 0 to 1 to 2 is all there is - and after that growth comes from the eight
   * mutations, so a run has about ten meaningful choices in it. Twelve waves
   * spends them; eight would leave half the mutation pool unseen.
   */
  waves: 12,
  /** Two ordinary waves, then a boss. Four times. */
  bossEvery: 3,
  /**
   * Altar health.
   *
   * Sized against the cost of one bad breach rather than picked round. The
   * player has 130 health and a Fang hits for 12; two of them loose on the
   * altar through a respawn take roughly 130 off it. 600 therefore survives
   * four or five serious breaches across a whole run - enough that one mistake
   * is not the end, few enough that the fourth one is.
   */
  altarHealth: 600,
  /**
   * How close the player has to be to pull a creature off its march.
   *
   * Generous on purpose. The mode is about holding a line, and a creature that
   * ignored a player standing beside it would make the line meaningless.
   */
  aggroRadius: 9.5,
  /**
   * How much faster a creature walks while it is marching rather than fighting.
   *
   * The road is 48 units and the Carapace walks at 1.48, which is 32 seconds of
   * standing and watching. At x1.9 it is 17, and the Fang arrives in 7.
   *
   * Applied only while marching, so it never touches the combat the families
   * were balanced around: the moment anything is close enough to fight, it
   * moves at exactly the speed it always did.
   */
  marchSpeedMultiplier: 1.9,
  /**
   * What a creature's blow does to the *player* on this map, as a fraction.
   *
   * The owner's brief: "怪的攻击不能太高，否则玩家很快就会死". Measured rather
   * than guessed - a Fang hits for 12 against 130 health, and this mode puts up
   * to ten of them on the field at once while the player is pinned to a line
   * they cannot leave. Standing still through the first wave killed a full-
   * health player, which is the read that produced this number.
   *
   * It scales the blow here rather than editing `GLOAMWOOD_PREY`, because that
   * table is the accepted balance for Goals 2-4 and the whole river valley
   * fights on it.
   *
   * Damage to the *altar* is deliberately not scaled. The altar's 600 was sized
   * against the raw family numbers, and the thing that was dying too fast was
   * the player.
   */
  playerDamageScale: 0.6,
  /** Seconds of quiet between a wave clearing and the next stepping through. */
  intermissionSeconds: 6,
  /**
   * Concurrent creatures on the field.
   *
   * Higher than the Gloamwood's six because a defence map with a long approach
   * has creatures in transit that are not yet fighting anybody. Wants a real
   * frame-rate reading before it goes any higher.
   */
  maximumActive: 10,
} as const

/** Ramp of ordinary waves. Bosses are inserted on top of these by the table. */
const ORDINARY: readonly (readonly GloamwoodPreyKind[])[] = [
  ['fang', 'fang', 'fang'],
  ['fang', 'fang', 'swarm', 'swarm', 'swarm', 'swarm'],
  ['shell', 'shell', 'swarm', 'swarm', 'swarm', 'swarm'],
  ['fang', 'fang', 'fang', 'fang', 'swarm', 'swarm', 'swarm'],
  ['shell', 'shell', 'shell', 'fang', 'fang', 'fang'],
  ['fang', 'fang', 'fang', 'fang', 'shell', 'shell', 'swarm', 'swarm', 'swarm', 'swarm'],
  ['swarm', 'swarm', 'swarm', 'swarm', 'swarm', 'swarm', 'fang', 'fang', 'fang'],
  ['fang', 'fang', 'fang', 'fang', 'fang', 'shell', 'shell', 'shell', 'swarm', 'swarm'],
]

const BOSS_ORDER: readonly GloamwoodDefenceBossId[] = [
  'bladeshell',
  'cliff-maw',
  'source-root',
  'thornheart-warden',
]

/** The whole run, built once so the table and the rules cannot disagree. */
export const GLOAMWOOD_DEFENCE_WAVES: readonly GloamwoodDefenceWave[] = (() => {
  const waves: GloamwoodDefenceWave[] = []
  let ordinaryIndex = 0
  let bossIndex = 0
  for (let index = 1; index <= GLOAMWOOD_DEFENCE_RUN.waves; index += 1) {
    const isBoss = index % GLOAMWOOD_DEFENCE_RUN.bossEvery === 0
    if (isBoss) {
      // A boss walks in with an escort, so the player cannot simply ignore
      // everything else and duel it.
      const escort = ORDINARY[Math.min(ordinaryIndex, ORDINARY.length - 1)].slice(0, 2 + bossIndex)
      waves.push({
        index,
        kinds: escort,
        boss: BOSS_ORDER[Math.min(bossIndex, BOSS_ORDER.length - 1)],
        spacingSeconds: 1.6,
      })
      bossIndex += 1
      continue
    }
    waves.push({
      index,
      kinds: ORDINARY[Math.min(ordinaryIndex, ORDINARY.length - 1)],
      // Later waves come through faster as well as bigger, so pressure rises
      // without the count alone having to carry it.
      spacingSeconds: Math.max(0.55, 1.5 - ordinaryIndex * 0.12),
    })
    ordinaryIndex += 1
  }
  return waves
})()

export type GloamwoodDefencePhase = 'ready' | 'spawning' | 'holding' | 'intermission' | 'won' | 'lost'

export interface GloamwoodDefenceState {
  phase: GloamwoodDefencePhase
  /** 1-based; 0 before the first wave steps through. */
  wave: number
  phaseElapsed: number
  /** How many of the current wave's creatures have come through the portal. */
  released: number
  altarHealth: number
  altarMaxHealth: number
  /** Creatures that reached the altar and are hitting it, by id. */
  breached: readonly string[]
  spawnSequence: number
}

export type GloamwoodDefenceEvent =
  | { type: 'wave-started'; wave: number; boss?: GloamwoodDefenceBossId }
  | { type: 'wave-cleared'; wave: number }
  | { type: 'altar-damaged'; damage: number; remaining: number }
  | { type: 'altar-breached'; preyId: string }
  | { type: 'run-won' }
  | { type: 'run-lost' }

export function createGloamwoodDefenceState(): GloamwoodDefenceState {
  return {
    phase: 'ready',
    wave: 0,
    phaseElapsed: 0,
    released: 0,
    altarHealth: GLOAMWOOD_DEFENCE_RUN.altarHealth,
    altarMaxHealth: GLOAMWOOD_DEFENCE_RUN.altarHealth,
    breached: [],
    spawnSequence: 0,
  }
}

export function gloamwoodDefenceWave(index: number) {
  return GLOAMWOOD_DEFENCE_WAVES.find((wave) => wave.index === index)
}

/**
 * What a creature should be walking at, and how fast.
 *
 * The whole targeting rule, in one place: fight the player if they are close
 * enough to be a threat, otherwise walk at the altar. Returning the presence
 * rather than a flag is what lets `stepPrey` be reused untouched.
 */
export function gloamwoodDefenceTarget(
  prey: Pick<GloamwoodNestPrey, 'x' | 'z'>,
  player: { x: number; z: number; alive: boolean; bodyRadius?: number },
) {
  const { altar } = GLOAMWOOD_DEFENCE
  const toPlayer = Math.hypot(player.x - prey.x, player.z - prey.z)
  if (player.alive && toPlayer <= GLOAMWOOD_DEFENCE_RUN.aggroRadius) {
    return { presence: player, marching: false as const }
  }
  return {
    presence: { x: altar.x, z: altar.z, alive: true, bodyRadius: altar.radius },
    marching: true as const,
  }
}

/**
 * Speed multiplier for a creature this frame.
 *
 * Only while marching, and only while it is still a walk rather than a fight -
 * a creature that has arrived at the altar is attacking it, and boosting that
 * would quietly rebalance the one number the mode is lost by.
 */
export function gloamwoodDefenceSpeedMultiplier(
  prey: Pick<GloamwoodNestPrey, 'x' | 'z'>,
  marching: boolean,
) {
  if (!marching) return 1
  const { altar } = GLOAMWOOD_DEFENCE
  const toAltar = Math.hypot(altar.x - prey.x, altar.z - prey.z)
  return toAltar > altar.radius + 4 ? GLOAMWOOD_DEFENCE_RUN.marchSpeedMultiplier : 1
}

/** Where a creature steps through, spread across the portal's mouth. */
export function gloamwoodDefenceSpawnPoint(sequence: number) {
  const { portal, road } = GLOAMWOOD_DEFENCE
  // Across the throat rather than all on the spine, so a wave does not arrive
  // as a single file even before the flare spreads it.
  const lane = ((sequence % 5) - 2) / 2
  return { x: portal.x + lane * (road.halfWidth * 0.72), z: portal.z }
}

export function createGloamwoodDefencePrey(
  kind: GloamwoodPreyKind,
  sequence: number,
  bodyRadius?: number,
): GloamwoodNestPrey {
  const spec = GLOAMWOOD_PREY[kind]
  const at = gloamwoodDefenceSpawnPoint(sequence)
  return {
    id: `defence-${sequence}`,
    kind,
    phase: 'chase',
    phaseElapsed: 0,
    health: spec.maxHealth,
    maxHealth: spec.maxHealth,
    x: at.x,
    z: at.z,
    // Facing down the road. The altar is at +Z and the runtime's zero is +X.
    facingRadians: -Math.PI / 2,
    attackResolved: false,
    slot: sequence % 6,
    bodyRadius,
  }
}

/**
 * One frame of the director: release, watch, and judge the run.
 *
 * Deliberately does not step the creatures. That is `stepPrey`'s job and it
 * already exists; mixing the two would give the mode a second combat authority,
 * which is the defect this project has spent the most time on.
 */
export function stepGloamwoodDefence(
  state: GloamwoodDefenceState,
  deltaSeconds: number,
  field: { alive: number; total: number },
): { state: GloamwoodDefenceState; events: GloamwoodDefenceEvent[]; release: GloamwoodPreyKind[] } {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const events: GloamwoodDefenceEvent[] = []
  const release: GloamwoodPreyKind[] = []
  if (state.phase === 'won' || state.phase === 'lost') return { state, events, release }

  let next = { ...state, phaseElapsed: state.phaseElapsed + delta }

  if (next.phase === 'ready') {
    next = { ...next, phase: 'spawning', wave: 1, phaseElapsed: 0, released: 0 }
    const wave = gloamwoodDefenceWave(1)
    events.push({ type: 'wave-started', wave: 1, boss: wave?.boss })
    return { state: next, events, release }
  }

  if (next.phase === 'intermission') {
    if (next.phaseElapsed < GLOAMWOOD_DEFENCE_RUN.intermissionSeconds) return { state: next, events, release }
    const wave = next.wave + 1
    next = { ...next, phase: 'spawning', wave, phaseElapsed: 0, released: 0 }
    events.push({ type: 'wave-started', wave, boss: gloamwoodDefenceWave(wave)?.boss })
    return { state: next, events, release }
  }

  if (next.phase === 'spawning') {
    const wave = gloamwoodDefenceWave(next.wave)
    if (!wave) return { state: { ...next, phase: 'holding' }, events, release }
    // Release on the clock, capped by how many are already out. The cap is what
    // keeps a late wave from putting thirty bodies on one road.
    const due = Math.min(
      wave.kinds.length,
      Math.floor(next.phaseElapsed / wave.spacingSeconds) + 1,
    )
    let released = next.released
    while (released < due && field.alive + release.length < GLOAMWOOD_DEFENCE_RUN.maximumActive) {
      release.push(wave.kinds[released])
      released += 1
    }
    next = { ...next, released, spawnSequence: next.spawnSequence + release.length }
    if (released >= wave.kinds.length) next = { ...next, phase: 'holding', phaseElapsed: 0 }
    return { state: next, events, release }
  }

  // holding: the wave is out, and the run advances when the field is clear.
  if (field.alive > 0) return { state: next, events, release }
  events.push({ type: 'wave-cleared', wave: next.wave })
  if (next.wave >= GLOAMWOOD_DEFENCE_RUN.waves) {
    events.push({ type: 'run-won' })
    return { state: { ...next, phase: 'won', phaseElapsed: 0 }, events, release }
  }
  return { state: { ...next, phase: 'intermission', phaseElapsed: 0 }, events, release }
}

/**
 * Apply a blow that landed on the altar rather than on the player.
 *
 * The one place the run can be lost. Kept apart from the director step so the
 * order of "creature attacked" and "wave advanced" inside a frame cannot change
 * whether a run ended.
 */
export function damageGloamwoodDefenceAltar(
  state: GloamwoodDefenceState,
  damage: number,
): { state: GloamwoodDefenceState; events: GloamwoodDefenceEvent[] } {
  if (state.phase === 'won' || state.phase === 'lost') return { state, events: [] }
  const applied = Math.max(0, Math.round(damage))
  if (applied === 0) return { state, events: [] }
  const altarHealth = Math.max(0, state.altarHealth - applied)
  const events: GloamwoodDefenceEvent[] = [
    { type: 'altar-damaged', damage: applied, remaining: altarHealth },
  ]
  if (altarHealth === 0) {
    events.push({ type: 'run-lost' })
    return { state: { ...state, altarHealth, phase: 'lost', phaseElapsed: 0 }, events }
  }
  return { state: { ...state, altarHealth }, events }
}

/** Progress for the HUD: which wave, and how much of the run is behind you. */
export function gloamwoodDefenceProgress(state: GloamwoodDefenceState) {
  return {
    wave: state.wave,
    waves: GLOAMWOOD_DEFENCE_RUN.waves,
    boss: gloamwoodDefenceWave(state.wave)?.boss,
    altarFraction: state.altarMaxHealth > 0 ? state.altarHealth / state.altarMaxHealth : 0,
  }
}

/** Convenience for tests and review: the whole run's shape at a glance. */
export function summariseGloamwoodDefenceRun() {
  return GLOAMWOOD_DEFENCE_WAVES.map((wave) => ({
    wave: wave.index,
    boss: wave.boss ?? null,
    count: wave.kinds.length + (wave.boss ? 1 : 0),
  }))
}

export function gloamwoodDefenceStateFrom(nest: GloamwoodNestState) {
  // The container the runtime already carries genes, biomass and kills in. The
  // director keeps its own state beside it rather than inside it, because those
  // three belong to the run and this belongs to the mode.
  return nest.prey.filter((prey) => prey.phase !== 'dead').length
}
