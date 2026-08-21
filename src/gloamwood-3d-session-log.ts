/**
 * A recording of what actually happened in a play session, and what looks wrong.
 *
 * Every runtime defect this project has hit was found by a person watching the
 * screen and then diagnosed by simulation - and one of those simulations was
 * itself wrong, because it left out the collision that keeps the player and the
 * boss apart. A recording removes the guessing from the second half.
 *
 * The diagnostics matter more than the raw events. Four defects so far were the
 * same shape: two systems each internally reasonable with a boundary between
 * them nobody checked. Each one is detectable from a recording without knowing
 * the cause in advance - "nothing attacked for eleven seconds" does not need a
 * theory to be reported.
 *
 * Nothing here participates in any decision. It observes.
 */

export type GloamwoodSessionEvent =
  | { t: number; kind: 'phase'; phase: string }
  | { t: number; kind: 'enemy-state'; who: string; state: string; pattern?: string; distance: number }
  | { t: number; kind: 'attack'; by: 'player' | 'enemy'; who: string; action: string; hit: boolean; distance: number; reason?: string }
  | { t: number; kind: 'damage'; to: 'player' | 'enemy'; amount: number }
  | { t: number; kind: 'death'; who: 'player' | 'enemy'; livesLeft?: number }
  | { t: number; kind: 'mutation'; id: string; phase: string }
  /** A mutation produced a visible, confirmed gameplay result. */
  | { t: number; kind: 'mutation-effect'; id: string; effect: string }
  | { t: number; kind: 'sample'; phase: string; arenaOffset: number; health: number }

export interface GloamwoodSessionFinding {
  /** Machine-readable so a test can assert a specific defect is absent. */
  code: string
  detail: string
  at: number
}

export interface GloamwoodSessionReport {
  seconds: number
  events: number
  counts: Record<string, number>
  /** Hits and misses per attack action, which is where reach errors show up. */
  accuracy: Record<string, { hit: number; miss: number }>
  /** Whether each selected mutation was actually seen paying out in the run. */
  mutationUse: Record<string, { selected: number; confirmed: number; effects: Record<string, number> }>
  findings: GloamwoodSessionFinding[]
}

/** Longest an encounter may go without any enemy attack before it is suspicious. */
export const GLOAMWOOD_SESSION_SILENCE_SECONDS = 8

export function summariseGloamwoodSession(
  events: readonly GloamwoodSessionEvent[],
  arenaPlayerRadius: number,
): GloamwoodSessionReport {
  const counts: Record<string, number> = {}
  const accuracy: Record<string, { hit: number; miss: number }> = {}
  const findings: GloamwoodSessionFinding[] = []
  const mutationUse: GloamwoodSessionReport['mutationUse'] = {}
  const first = events[0]?.t ?? 0
  const last = events[events.length - 1]?.t ?? 0

  let encounterSince: number | null = null
  let lastEnemyAttack = first
  for (const event of events) {
    counts[event.kind] = (counts[event.kind] ?? 0) + 1

    if (event.kind === 'phase') {
      const fighting = event.phase === 'guardian' || event.phase === 'boss'
      encounterSince = fighting ? event.t : null
      if (fighting) lastEnemyAttack = event.t
    }

    if (event.kind === 'attack') {
      const bucket = accuracy[event.action] ?? { hit: 0, miss: 0 }
      bucket[event.hit ? 'hit' : 'miss'] += 1
      accuracy[event.action] = bucket
      if (event.by === 'enemy') {
        // Silence is measured between attempts, not between landed blows: a
        // creature swinging and missing is a balance question, one that never
        // swings is a broken boundary.
        if (encounterSince !== null && event.t - lastEnemyAttack > GLOAMWOOD_SESSION_SILENCE_SECONDS) {
          findings.push({
            code: 'enemy-silent',
            detail: `${(event.t - lastEnemyAttack).toFixed(1)}s with no enemy attack during an encounter`,
            at: event.t,
          })
        }
        lastEnemyAttack = event.t
      }
    }

    if (event.kind === 'sample' && (event.phase === 'guardian' || event.phase === 'boss')
      && event.arenaOffset > arenaPlayerRadius + 0.05) {
      findings.push({
        code: 'player-outside-arena',
        detail: `player ${event.arenaOffset.toFixed(2)} from arena centre, bound is ${arenaPlayerRadius}`,
        at: event.t,
      })
    }

    if (event.kind === 'mutation' && (event.phase === 'guardian' || event.phase === 'boss')) {
      findings.push({ code: 'choice-during-fight', detail: `took ${event.id} during ${event.phase}`, at: event.t })
    }
    if (event.kind === 'mutation') {
      const entry = mutationUse[event.id] ?? { selected: 0, confirmed: 0, effects: {} }
      entry.selected += 1
      mutationUse[event.id] = entry
    }
    if (event.kind === 'mutation-effect') {
      const entry = mutationUse[event.id] ?? { selected: 0, confirmed: 0, effects: {} }
      entry.confirmed += 1
      entry.effects[event.effect] = (entry.effects[event.effect] ?? 0) + 1
      mutationUse[event.id] = entry
    }
  }

  // An encounter that ended without the enemy ever attacking is the strongest
  // signal there is, and the loop above only fires when an attack eventually
  // arrives to compare against.
  if (encounterSince !== null && last - lastEnemyAttack > GLOAMWOOD_SESSION_SILENCE_SECONDS) {
    findings.push({
      code: 'enemy-silent',
      detail: `${(last - lastEnemyAttack).toFixed(1)}s with no enemy attack up to the end of the recording`,
      at: last,
    })
  }

  for (const [action, bucket] of Object.entries(accuracy)) {
    // A reach that cannot connect looks exactly like this and nothing else does.
    if (bucket.hit === 0 && bucket.miss >= 4) {
      findings.push({
        code: 'action-never-connects',
        detail: `${action} attempted ${bucket.miss} times and never landed`,
        at: last,
      })
    }
  }

  return {
    seconds: Number((last - first).toFixed(1)),
    events: events.length,
    counts,
    accuracy,
    mutationUse,
    findings: dedupeFindings(findings),
  }
}

/** One line per distinct problem; a stall reports once, not once per frame. */
function dedupeFindings(findings: readonly GloamwoodSessionFinding[]) {
  const seen = new Map<string, GloamwoodSessionFinding>()
  for (const finding of findings) if (!seen.has(finding.code)) seen.set(finding.code, finding)
  return [...seen.values()]
}

/**
 * Fixed-size recorder. A long session must not grow without bound, and the
 * interesting part of a recording is almost always its end.
 */
export class GloamwoodSessionLog {
  private readonly events: GloamwoodSessionEvent[] = []
  private readonly limit: number

  constructor(limit = 4000) {
    this.limit = limit
  }

  record(event: GloamwoodSessionEvent) {
    this.events.push(event)
    if (this.events.length > this.limit) this.events.splice(0, this.events.length - this.limit)
  }

  all(): readonly GloamwoodSessionEvent[] {
    return this.events
  }

  clear() {
    this.events.length = 0
  }
}
