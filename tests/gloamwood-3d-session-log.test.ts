import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_SESSION_SILENCE_SECONDS,
  GloamwoodSessionLog,
  summariseGloamwoodSession,
  type GloamwoodSessionEvent,
} from '../src/gloamwood-3d-session-log'

const ARENA = 7.6

describe('Recording a session', () => {
  it('keeps the end of a long run rather than growing without bound', () => {
    const log = new GloamwoodSessionLog(10)
    for (let index = 0; index < 40; index += 1) log.record({ t: index, kind: 'phase', phase: `p${index}` })
    expect(log.all()).toHaveLength(10)
    // The interesting part of a recording is almost always its end.
    expect((log.all()[9] as { phase: string }).phase).toBe('p39')
  })
})

describe('Reading a recording back', () => {
  it('reports an encounter that went quiet', () => {
    // The boss stalling on its own preferred range, the guardian unable to reach
    // its slot, and the player walking out of the arena all looked like this.
    const events: GloamwoodSessionEvent[] = [
      { t: 0, kind: 'phase', phase: 'boss' },
      { t: 1, kind: 'attack', by: 'enemy', who: 'boss', action: 'root-slam', hit: true, distance: 3.5 },
      { t: 2 + GLOAMWOOD_SESSION_SILENCE_SECONDS + 5, kind: 'attack', by: 'enemy', who: 'boss', action: 'root-slam', hit: true, distance: 3.5 },
    ]
    const report = summariseGloamwoodSession(events, ARENA)
    expect(report.findings.map((finding) => finding.code)).toContain('enemy-silent')
  })

  it('reports silence that runs to the end, where there is no next attack to compare', () => {
    const events: GloamwoodSessionEvent[] = [
      { t: 0, kind: 'phase', phase: 'boss' },
      { t: 1, kind: 'attack', by: 'enemy', who: 'boss', action: 'root-slam', hit: true, distance: 3.5 },
      { t: 40, kind: 'sample', phase: 'boss', arenaOffset: 3, health: 80 },
    ]
    expect(summariseGloamwoodSession(events, ARENA).findings.map((f) => f.code)).toContain('enemy-silent')
  })

  it('reports an action that never once connects', () => {
    // root-slam resolved inside 3.35 against a collision floor of 3.43, so it
    // could not land on anything. From a recording that is unmistakable without
    // knowing the cause.
    const events: GloamwoodSessionEvent[] = Array.from({ length: 6 }, (_, index) => ({
      t: index, kind: 'attack', by: 'enemy', who: 'boss', action: 'root-slam', hit: false, distance: 3.5,
    }))
    const report = summariseGloamwoodSession(events, ARENA)
    expect(report.findings.map((finding) => finding.code)).toContain('action-never-connects')
    expect(report.accuracy['root-slam']).toEqual({ hit: 0, miss: 6 })
  })

  it('does not cry wolf over an action that merely misses sometimes', () => {
    const events: GloamwoodSessionEvent[] = [
      { t: 0, kind: 'attack', by: 'player', who: 'fang', action: 'Bite', hit: false, distance: 3.9, reason: 'out-of-range' },
      { t: 1, kind: 'attack', by: 'player', who: 'fang', action: 'Bite', hit: true, distance: 2.4 },
    ]
    expect(summariseGloamwoodSession(events, ARENA).findings).toHaveLength(0)
  })

  it('reports the player leaving the range the boss can cover', () => {
    const events: GloamwoodSessionEvent[] = [
      { t: 0, kind: 'phase', phase: 'boss' },
      { t: 5, kind: 'sample', phase: 'boss', arenaOffset: 11.2, health: 90 },
    ]
    expect(summariseGloamwoodSession(events, ARENA).findings.map((f) => f.code)).toContain('player-outside-arena')
  })

  it('reports a choice offered inside a fight', () => {
    const events: GloamwoodSessionEvent[] = [{ t: 3, kind: 'mutation', id: 'fang-thin-hide', phase: 'boss' }]
    expect(summariseGloamwoodSession(events, ARENA).findings.map((f) => f.code)).toContain('choice-during-fight')
  })

  it('reports each distinct problem once, not once per frame', () => {
    const events: GloamwoodSessionEvent[] = [
      { t: 0, kind: 'phase', phase: 'boss' },
      ...Array.from({ length: 30 }, (_, index) => ({
        t: index, kind: 'sample' as const, phase: 'boss', arenaOffset: 12, health: 90,
      })),
    ]
    const outside = summariseGloamwoodSession(events, ARENA).findings.filter((f) => f.code === 'player-outside-arena')
    expect(outside).toHaveLength(1)
  })

  it('says nothing about a clean run', () => {
    const events: GloamwoodSessionEvent[] = [
      { t: 0, kind: 'phase', phase: 'boss' },
      { t: 1, kind: 'attack', by: 'enemy', who: 'boss', action: 'root-slam', hit: true, distance: 3.5 },
      { t: 3, kind: 'attack', by: 'player', who: 'boss', action: 'Bite', hit: true, distance: 2.4 },
      { t: 4, kind: 'sample', phase: 'boss', arenaOffset: 4.2, health: 70 },
      { t: 5, kind: 'attack', by: 'enemy', who: 'boss', action: 'thorn-charge', hit: true, distance: 4.1 },
    ]
    expect(summariseGloamwoodSession(events, ARENA).findings).toEqual([])
  })
})

describe('Runtime wiring', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('records at the sites that already decide, rather than deciding anything', () => {
    expect(source).toContain('sessionReport: () =>')
    expect(source).toContain('sessionDump: () =>')
    // Player contact, prey contact and boss contact all report their outcome.
    expect((source.match(/kind: 'attack'/g) ?? []).length).toBeGreaterThanOrEqual(3)
    expect(source).toContain("kind: 'death', who: 'player'")
  })
})
