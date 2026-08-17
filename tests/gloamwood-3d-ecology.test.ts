import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_NEST_GUARDIAN,
  awakenGloamwoodNestGuardian,
  clampGloamwoodPreyToArena,
  GLOAMWOOD_NEST,
  GLOAMWOOD_COMBAT_SPACING,
  GLOAMWOOD_PREY,
  GLOAMWOOD_PREY_BODY_RADII,
  createGloamwoodNestState,
  damageGloamwoodNestPrey,
  inspectGloamwoodPlayerPreyClearance,
  inspectGloamwoodPlayerPreyActionClearance,
  inspectGloamwoodPreyPairClearance,
  gloamwoodCombatSlotPosition,
  gloamwoodPreyBodyRadius,
  gloamwoodPreyStopDistance,
  resolveGloamwoodPlayerPreyCollision,
  resolveGloamwoodPreyAroundPlayer,
  stepGloamwoodNest,
} from '../src/gloamwood-3d-ecology'

describe('Gloamwood first ecology nest', () => {
  it('stays dormant until approached, then starts a bounded three-wave encounter', () => {
    let state = createGloamwoodNestState()
    state = stepGloamwoodNest(state, 0.05, { x: -6, z: 3, alive: true }).state
    expect(state.phase).toBe('dormant')
    const frame = stepGloamwoodNest(state, 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true })
    expect(frame.state).toMatchObject({ phase: 'wave', wave: 1 })
    expect(frame.state.prey).toHaveLength(2)
    expect(frame.state.prey.every((prey) => prey.kind === 'fang')).toBe(true)
    expect(frame.events.map((event) => event.type)).toEqual(['nest-started', 'wave-started'])
  })

  it('gives each prey family a distinct tactical profile', () => {
    expect(GLOAMWOOD_PREY.fang.moveSpeed).toBeGreaterThan(GLOAMWOOD_PREY.shell.moveSpeed * 2)
    expect(GLOAMWOOD_PREY.shell.maxHealth).toBeGreaterThan(GLOAMWOOD_PREY.fang.maxHealth * 1.8)
    expect(GLOAMWOOD_PREY.swarm.damage).toBeLessThan(GLOAMWOOD_PREY.fang.damage)
    expect(GLOAMWOOD_NEST.maximumActivePrey).toBe(6)
  })

  it('reserves body and authored action space before an enemy may attack', () => {
    const playerRadius = 1.28
    const shellStop = gloamwoodPreyStopDistance('shell', playerRadius)
    const fangStop = gloamwoodPreyStopDistance('fang', playerRadius)
    expect(shellStop).toBeCloseTo(playerRadius + GLOAMWOOD_PREY_BODY_RADII.shell + GLOAMWOOD_COMBAT_SPACING.actionSpace.shell)
    expect(fangStop).toBeCloseTo(playerRadius + GLOAMWOOD_PREY_BODY_RADII.fang + GLOAMWOOD_COMBAT_SPACING.actionSpace.fang)
    expect(shellStop).toBeGreaterThan(fangStop)
    const slot = gloamwoodCombatSlotPosition(3, 'shell', { x: 4, z: -2 }, shellStop)
    expect(Math.hypot(slot.x - 4, slot.z + 2)).toBeCloseTo(shellStop)
  })

  it('blocks frontal shell hits but rewards flanking', () => {
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    state = { ...state, prey: [{ ...state.prey[0], id: 'shell', kind: 'shell', health: 92, maxHealth: 92, x: 0, z: 0, facingRadians: 0 }] }
    const front = damageGloamwoodNestPrey(state, 'shell', 20, 'Pounce', { x: 2, z: 0 }, 0.5)
    const rear = damageGloamwoodNestPrey(state, 'shell', 20, 'Pounce', { x: -2, z: 0 }, 0.5)
    expect(front.blocked).toBe(true)
    expect(front.effectiveDamage).toBeLessThan(10)
    expect(rear.blocked).toBe(false)
    expect(rear.effectiveDamage).toBeGreaterThan(20)
  })

  it('lets a committed shell be flanked, so the onboarding advice is reachable', () => {
    // Regression for G-1: shell turnSpeed 3.1 rad/s used to exceed the ~2.4 rad/s a
    // player can orbit at, so "绕到侧后攻击" was geometrically impossible.
    const spacing = 2.6
    const orbitSpeed = 6.2 / spacing
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    state = { ...state, prey: [{ ...state.prey[0], id: 'shell', kind: 'shell', health: 999, maxHealth: 999, x: 0, z: 0, facingRadians: 0, phase: 'telegraph' as const, phaseElapsed: 0 }] }
    const committedFacing = state.prey[0].facingRadians

    // Orbit the shell for the duration of its telegraph, exactly as a player would.
    let angle = 0
    let elapsed = 0
    const delta = 0.05
    while (elapsed < GLOAMWOOD_PREY.shell.telegraphSeconds) {
      angle += orbitSpeed * delta
      elapsed += delta
      state = stepGloamwoodNest(state, delta, { x: Math.cos(angle) * spacing, z: Math.sin(angle) * spacing, alive: true }).state
    }

    expect(state.prey[0].facingRadians).toBeCloseTo(committedFacing, 6)
    const rear = damageGloamwoodNestPrey(state, 'shell', 20, 'Pounce', { x: Math.cos(angle) * spacing, z: Math.sin(angle) * spacing }, 0.5)
    expect(rear.blocked).toBe(false)
    expect(rear.effectiveDamage).toBeGreaterThan(20)
  })

  it('keeps the shell facing locked from telegraph through recover, then re-acquires', () => {
    const committed = { phase: 'telegraph', elapsed: 0 } as const
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    state = { ...state, prey: [{ ...state.prey[0], id: 'shell', kind: 'shell', health: 999, maxHealth: 999, x: 0, z: 0, facingRadians: 0, phase: committed.phase, phaseElapsed: committed.elapsed }] }
    const behind = { x: -2.6, z: 0, alive: true }
    const seen = new Set<string>()
    let framesUntilChase = 0
    // Only the first committed sequence is under test; once chase resumes the
    // creature legitimately turns and commits to a fresh facing next telegraph.
    while (framesUntilChase < 80) {
      state = stepGloamwoodNest(state, 0.05, behind).state
      const prey = state.prey[0]
      framesUntilChase += 1
      if (prey.phase === 'chase') break
      seen.add(prey.phase)
      expect(prey.facingRadians).toBeCloseTo(0, 6)
    }
    // The window must actually span every committed phase before chase resumes.
    expect(seen.has('strike')).toBe(true)
    expect(seen.has('recover')).toBe(true)
    expect(state.prey[0].phase).toBe('chase')
    // And re-acquisition must still work: chase turns back toward the player.
    state = stepGloamwoodNest(state, 0.2, behind).state
    expect(state.prey[0].facingRadians).not.toBeCloseTo(0, 2)
  })

  it('leaves fang and swarm tracking every frame, since neither has a frontal rule', () => {
    for (const kind of ['fang', 'swarm'] as const) {
      expect(GLOAMWOOD_PREY[kind].commitsFacingWhileAttacking).toBe(false)
      let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
      state = { ...state, prey: [{ ...state.prey[0], id: kind, kind, x: 0, z: 0, facingRadians: 0, phase: 'telegraph' as const, phaseElapsed: 0 }] }
      state = stepGloamwoodNest(state, 0.05, { x: -2.6, z: 0, alive: true }).state
      expect(state.prey[0].facingRadians).not.toBeCloseTo(0, 6)
    }
    expect(GLOAMWOOD_PREY.shell.commitsFacingWhileAttacking).toBe(true)
  })

  it('records family genes and biomass only on authoritative kills', () => {
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    const target = state.prey[0]
    const hit = damageGloamwoodNestPrey(state, target.id, 10, 'Claw', { x: target.x - 1, z: target.z }, 0)
    expect(hit.killed).toBe(false)
    expect(hit.state.biomass).toBe(0)
    const kill = damageGloamwoodNestPrey(hit.state, target.id, 1000, 'Claw', { x: target.x - 1, z: target.z }, 0)
    expect(kill).toMatchObject({ killed: true, biomassGained: GLOAMWOOD_PREY.fang.biomass, geneGained: 'fang' })
    expect(kill.state).toMatchObject({ kills: 1, biomass: GLOAMWOOD_PREY.fang.biomass, genes: { fang: 1, shell: 0, swarm: 0 } })
  })

  it('makes attack choice matter for fang and swarm prey', () => {
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    const fang = state.prey[0]
    const bite = damageGloamwoodNestPrey(state, fang.id, 20, 'Bite', { x: fang.x - 1, z: fang.z }, 0)
    const claw = damageGloamwoodNestPrey(state, fang.id, 20, 'Claw', { x: fang.x - 1, z: fang.z }, 0)
    expect(claw.effectiveDamage).toBeGreaterThan(bite.effectiveDamage)

    state = { ...state, prey: [{ ...fang, id: 'swarm', kind: 'swarm', health: 24, maxHealth: 24 }] }
    const pounce = damageGloamwoodNestPrey(state, 'swarm', 18, 'Pounce', { x: fang.x - 1, z: fang.z }, 0)
    const sweep = damageGloamwoodNestPrey(state, 'swarm', 18, 'TailSwipe', { x: fang.x - 1, z: fang.z }, 0)
    expect(sweep.effectiveDamage).toBeGreaterThan(pounce.effectiveDamage)
  })

  it('emits readable attacks only after each family telegraph', () => {
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    state = { ...state, prey: state.prey.map((prey) => ({ ...prey, x: 0, z: 0, phase: 'telegraph' as const, phaseElapsed: 0 })) }
    const early = stepGloamwoodNest(state, GLOAMWOOD_PREY.fang.telegraphSeconds * 0.5, { x: 0, z: 0, alive: true })
    expect(early.events.some((event) => event.type === 'prey-attack')).toBe(false)
    let frame = early
    for (let index = 0; index < 20 && !frame.events.some((event) => event.type === 'prey-attack'); index += 1) {
      frame = stepGloamwoodNest(frame.state, 0.05, { x: 0, z: 0, alive: true })
    }
    expect(frame.events.filter((event) => event.type === 'prey-attack')).toHaveLength(2)
  })

  it('keeps the player body outside living prey during movement and attacks', () => {
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    const fang = { ...state.prey[0], x: 0, z: 0 }
    state = { ...state, prey: [fang] }
    const bodyRadius = 1.28
    const result = resolveGloamwoodPlayerPreyCollision({ x: 0.2, z: 0 }, bodyRadius, state.prey)
    expect(result.contacts).toBeGreaterThan(0)
    expect(result.minimumClearance).toBeGreaterThanOrEqual(-0.00001)
    expect(Math.hypot(result.x, result.z)).toBeCloseTo(bodyRadius + GLOAMWOOD_PREY_BODY_RADII.fang)
  })

  it('moves incoming prey out of overlap without moving a stationary player', () => {
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    state = { ...state, prey: [{ ...state.prey[0], x: 0.1, z: 0 }] }
    const player = { x: 0, z: 0 }
    const separated = resolveGloamwoodPreyAroundPlayer(state.prey, player, 1.28)
    expect(player).toEqual({ x: 0, z: 0 })
    expect(Math.hypot(separated[0].x, separated[0].z)).toBeCloseTo(1.28 + GLOAMWOOD_PREY_BODY_RADII.fang + 0.32)
    expect(inspectGloamwoodPlayerPreyActionClearance(player, 1.28, separated)).toBeGreaterThanOrEqual(-0.00001)
  })

  it('stops chasing at the combined player and prey body distance', () => {
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    state = { ...state, prey: [{ ...state.prey[0], x: -3, z: 0, phase: 'chase', phaseElapsed: 0 }] }
    for (let index = 0; index < 180; index += 1) {
      state = stepGloamwoodNest(state, 1 / 60, { x: 2.1, z: 0, alive: true, bodyRadius: 1.28 }).state
      if (state.prey[0].phase !== 'chase') break
    }
    expect(state.prey[0].phase).toBe('telegraph')
    expect(inspectGloamwoodPlayerPreyClearance({ x: 2.1, z: 0 }, 1.28, state.prey)).toBeGreaterThanOrEqual(-0.00001)
  })

  it('separates multiple living prey before returning the ecology frame', () => {
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    state = {
      ...state,
      prey: state.prey.map((prey, index) => ({ ...prey, x: 0, z: 0, slot: index, phase: 'stunned' as const })),
    }
    state = stepGloamwoodNest(state, 0.01, { x: 8, z: 8, alive: true, bodyRadius: 1.28 }).state
    const distance = Math.hypot(state.prey[0].x - state.prey[1].x, state.prey[0].z - state.prey[1].z)
    expect(distance).toBeGreaterThanOrEqual(GLOAMWOOD_PREY_BODY_RADII.fang * 2 + GLOAMWOOD_COMBAT_SPACING.pairGap - 0.001)
    expect(inspectGloamwoodPreyPairClearance(state.prey)).toBeGreaterThanOrEqual(-0.001)
  })

  it('advances through escalation and emits a final clear result', () => {
    let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }).state
    const events: string[] = []
    for (let safety = 0; safety < 600 && state.phase !== 'cleared'; safety += 1) {
      if (state.phase === 'wave') {
        for (const prey of state.prey.filter((candidate) => candidate.phase !== 'dead')) {
          state = damageGloamwoodNestPrey(state, prey.id, 1000, 'TailSwipe', { x: prey.x - 1, z: prey.z }, 0).state
        }
      }
      const frame = stepGloamwoodNest(state, 0.05, { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true })
      state = frame.state
      events.push(...frame.events.map((event) => event.type))
    }
    expect(state).toMatchObject({ phase: 'cleared', wave: 3, kills: 11, genes: { fang: 3, shell: 2, swarm: 6 } })
    expect(events.filter((event) => event === 'wave-cleared')).toHaveLength(3)
    expect(events).toContain('nest-cleared')
  })

  it('awakens a distinct elite guardian without replacing the accepted three-wave hunt record', () => {
    const cleared = {
      ...createGloamwoodNestState(),
      phase: 'cleared' as const,
      wave: GLOAMWOOD_NEST.waveCount,
      kills: 11,
      biomass: 76,
      genes: { fang: 3, shell: 2, swarm: 6 },
    }
    const guarded = awakenGloamwoodNestGuardian(cleared)
    expect(guarded).toMatchObject({ phase: 'wave', wave: 3, kills: 11, biomass: 76 })
    expect(guarded.prey).toHaveLength(1)
    expect(guarded.prey[0]).toMatchObject({
      id: GLOAMWOOD_NEST_GUARDIAN.id,
      kind: 'shell',
      health: GLOAMWOOD_NEST_GUARDIAN.maxHealth,
      maxHealth: GLOAMWOOD_NEST_GUARDIAN.maxHealth,
    })
    expect(gloamwoodPreyBodyRadius(guarded.prey[0])).toBe(GLOAMWOOD_NEST_GUARDIAN.bodyRadius)
    const clamped = clampGloamwoodPreyToArena({ ...guarded.prey[0], x: 9, z: 0 }, { x: 0, z: 0 }, 4.2)
    expect(clamped.x).toBeCloseTo(4.2)
    expect(clamped.z).toBeCloseTo(0)
    const defeated = damageGloamwoodNestPrey(guarded, GLOAMWOOD_NEST_GUARDIAN.id, 1000, 'TailSwipe', { x: -2, z: 0 }, 0).state
    const transition = stepGloamwoodNest(defeated, 0.05, { x: -4, z: 0, alive: true })
    expect(transition.state.phase).toBe('cleared')
    expect(transition.events.map((event) => event.type)).toContain('nest-cleared')
  })
})
