import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_MUTATION_BIOMASS_STEP,
  GLOAMWOOD_MUTATION_POOL,
  accumulateGloamwoodMutationEffects,
  createGloamwoodMutationState,
  generateGloamwoodMutationOffers,
  gloamwoodMutationOffersEarned,
  openGloamwoodMutationOffer,
  selectGloamwoodMutation,
} from '../src/gloamwood-3d-mutations'
import { TRANSLATIONS } from '../src/i18n'
import { gloamwoodMutationIconIds } from '../src/gloamwood-mutation-icons'

const GENES = { fang: 4, shell: 1, swarm: 1 }

describe('Mutation pool', () => {
  it('charges for every entry, because a choice without a cost is not a choice', () => {
    for (const mutation of GLOAMWOOD_MUTATION_POOL) {
      const cost = TRANSLATIONS[`mutation.${mutation.id}.cost` as keyof typeof TRANSLATIONS]
      expect(cost, mutation.id).toBeDefined()
      expect(cost.en.trim(), mutation.id).not.toBe('')
    }
  })

  it('changes rules rather than nudging percentages', () => {
    // The evolution options this layer exists to replace read "damage -6%" and
    // "speed +14%", which no player feels and none plays differently for. Every
    // entry here either changes a rule outright or moves a number far enough to
    // notice.
    for (const mutation of GLOAMWOOD_MUTATION_POOL) {
      const values = Object.entries(mutation.effects)
      const rewritesARule = values.some(([key]) =>
        !key.endsWith('Multiplier') || key === 'executeMultiplier')
      const movesANumberHard = values.some(([key, value]) =>
        key.endsWith('Multiplier') && typeof value === 'number' && Math.abs(value - 1) >= 0.1)
      expect(rewritesARule || movesANumberHard, mutation.id).toBe(true)
    }
  })

  it('has a label for every family it uses, including neutral', () => {
    // The offer panel prints t(`family.${family}`). Neutral entries had no such
    // key, so the first neutral draw threw inside the render and the panel never
    // appeared - a crash no unit test caught, only running the game did.
    for (const mutation of GLOAMWOOD_MUTATION_POOL) {
      expect(TRANSLATIONS[`family.${mutation.family}` as keyof typeof TRANSLATIONS], mutation.family).toBeDefined()
    }
  })

  it('covers every family plus neutral', () => {
    const families = new Set(GLOAMWOOD_MUTATION_POOL.map((mutation) => mutation.family))
    expect([...families].sort()).toEqual(['fang', 'neutral', 'shell', 'swarm'])
  })
})

describe('Mutation pacing', () => {
  it('spreads offers across the run rather than lumping them at the end', () => {
    // A full run yields 76 biomass from prey: 16 + 22 + 38 across three waves.
    expect(GLOAMWOOD_MUTATION_BIOMASS_STEP).toBe(14)
    expect(gloamwoodMutationOffersEarned(0)).toBe(0)
    expect(gloamwoodMutationOffersEarned(13)).toBe(0)
    expect(gloamwoodMutationOffersEarned(16)).toBe(1)
    expect(gloamwoodMutationOffersEarned(38)).toBe(2)
    expect(gloamwoodMutationOffersEarned(76)).toBe(5)
  })
})

describe('Mutation draw', () => {
  it('is reproducible from the seed, so Goal 3 acceptance survives', () => {
    const first = generateGloamwoodMutationOffers(1234, 0, GENES, [])
    const again = generateGloamwoodMutationOffers(1234, 0, GENES, [])
    expect(again.map((offer) => offer.id)).toEqual(first.map((offer) => offer.id))
    const other = generateGloamwoodMutationOffers(9876, 0, GENES, [])
    expect(other.map((offer) => offer.id)).not.toEqual(first.map((offer) => offer.id))
  })

  it('offers three distinct entries and never repeats one already taken', () => {
    const offers = generateGloamwoodMutationOffers(77, 0, GENES, ['fang-thin-hide'])
    expect(offers).toHaveLength(3)
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(3)
    expect(offers.map((offer) => offer.id)).not.toContain('fang-thin-hide')
  })

  it('weights by banked genes without ever guaranteeing', () => {
    // The form evolution teaches "Genes weight random candidates, never
    // guarantee a skin", and a mutation layer that guaranteed would make every
    // run with the same diet identical - the opposite of what it is for.
    const fangHeavy = { fang: 40, shell: 0, swarm: 0 }
    let fangDraws = 0
    let nonFangSeen = 0
    for (let seed = 0; seed < 200; seed += 1) {
      const offers = generateGloamwoodMutationOffers(seed, 0, fangHeavy, [])
      if (offers[0].family === 'fang') fangDraws += 1
      if (offers.some((offer) => offer.family === 'shell' || offer.family === 'swarm')) nonFangSeen += 1
    }
    expect(fangDraws).toBeGreaterThan(40)
    // Low weight must stay reachable.
    expect(nonFangSeen).toBeGreaterThan(20)
  })

  it('stops offering once the pool is exhausted instead of repeating', () => {
    const everything = GLOAMWOOD_MUTATION_POOL.map((mutation) => mutation.id)
    expect(generateGloamwoodMutationOffers(5, 0, GENES, everything)).toEqual([])
    const state = openGloamwoodMutationOffer({ ...createGloamwoodMutationState('x'), taken: everything }, GENES)
    expect(state.offering).toBe(false)
  })
})

describe('Taking a mutation', () => {
  it('records it, closes the offer and advances the index', () => {
    let state = openGloamwoodMutationOffer(createGloamwoodMutationState('run-1'), GENES)
    expect(state.offering).toBe(true)
    const chosen = state.candidates[1].id
    state = selectGloamwoodMutation(state, chosen)
    expect(state).toMatchObject({ offering: false, candidates: [], taken: [chosen], offerIndex: 1 })
  })

  it('ignores an id that was not on offer', () => {
    const state = openGloamwoodMutationOffer(createGloamwoodMutationState('run-2'), GENES)
    expect(selectGloamwoodMutation(state, 'not-offered')).toBe(state)
  })
})

describe('Stacking', () => {
  it('compounds multipliers and sums bonuses, so a second cost still bites', () => {
    const effects = accumulateGloamwoodMutationEffects(['fang-thin-hide', 'shell-quake'])
    expect(effects.damageMultiplier).toBeCloseTo(1.35)
    expect(effects.moveSpeedMultiplier).toBeCloseTo(0.9)
    expect(effects.maximumHealthBonus).toBe(-40)
  })

  it('charges Gluttony for every mutation held, including itself', () => {
    // Otherwise the entry is free after the first pick, which is the opposite
    // of what a high-risk option should be.
    const alone = accumulateGloamwoodMutationEffects(['neutral-gluttony'])
    expect(alone.maximumHealthBonus).toBe(-8)
    const withThree = accumulateGloamwoodMutationEffects(['neutral-gluttony', 'swarm-moult', 'shell-quake'])
    expect(withThree.maximumHealthBonus).toBe(-24)
  })

  it('keeps a suppression flag once anything sets it', () => {
    const effects = accumulateGloamwoodMutationEffects(['shell-symbiosis', 'swarm-moult'])
    expect(effects.suppressKillHeal).toBe(true)
    expect(effects.reflectFraction).toBeCloseTo(0.3)
    expect(effects.reviveFraction).toBeCloseTo(0.3)
  })

  it('is empty for a run that has taken nothing', () => {
    expect(accumulateGloamwoodMutationEffects([])).toEqual({})
  })
})

describe('Runtime wiring', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
  const ecology = readFileSync(new URL('../src/gloamwood-3d-ecology.ts', import.meta.url), 'utf8')

  it('folds evolution and mutations in exactly one place', () => {
    // A mutation writing damageMultiplier on its own would become a fourth site
    // that decides damage, after the three stage-keyed lookups consolidated
    // earlier. One writer, or the drift starts again.
    expect(source).toContain('private applyProgressionModifiers()')
    expect(source).toContain('this.evolutionModifiers = {')
    const writes = source.match(/this\.damageMultiplier = /g) ?? []
    expect(writes).toHaveLength(1)
  })

  it('routes every hit the player takes through one gate', () => {
    // Prey damage and boss damage arrive in two different event loops. A
    // mutation wired to only one of them is a bug nobody finds until the boss.
    expect(source).toContain('private takePlayerDamage(rawDamage: number)')
    const gates = source.match(/this\.takePlayerDamage\(event\.damage\)/g) ?? []
    expect(gates).toHaveLength(2)
    expect(source).not.toMatch(/Math\.max\(1, Math\.round\(event\.damage \* \(1 - this\.damageReduction\)\)\)/)
  })

  it('applies target-dependent multipliers to prey and boss alike', () => {
    // Exactly two call sites: the prey path and the boss path. Killer Instinct
    // paying out on prey but not on the boss would be the same split this file
    // spent the day consolidating.
    const uses = source.match(/this\.mutationDamageMultiplierAgainst\(/g) ?? []
    expect(uses).toHaveLength(2)
  })

  it('withholds an offer while another choice is already on screen', () => {
    // Two panels stacked on each other means the player remembers neither.
    expect(source).toMatch(/if \(this\.runPhase !== 'hunt'\) return/)
    expect(source).toContain("if (this.evolutionState.phase === 'choosing') return")
  })

  it('seeds mutations from the same seed as the form evolution', () => {
    // One seed has to reproduce a whole run, which is what Goal 3 checks.
    expect(source).toContain("createGloamwoodMutationState(params.get('evolutionSeed') ?? 'gloamwood-first-run')")
  })

  it('never pulls more prey in, and reads the aura it does grant', () => {
    // Every prey here closes unconditionally, so a lure could only raise the
    // death rate; and once the larger map separates aggressive creatures from
    // passive ones, a lure would still have to pull only the passive ones to be
    // a tool rather than a trap. Nothing may widen aggro until then.
    expect(ecology).not.toContain('lureRadiusBonus')
    expect(ecology).toContain('player.slowAuraRadius')
    expect(ecology).toContain('function preyMoveSpeed(')
    expect(ecology).not.toMatch(/activationRadius \+/)
  })
})

describe('The player can read their own build back', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('draws an icon for every entry in the pool', () => {
    // A missing glyph falls back to a bare circle, which reads as "some
    // mutation" and tells the player nothing.
    for (const mutation of GLOAMWOOD_MUTATION_POOL) {
      expect(gloamwoodMutationIconIds(), mutation.id).toContain(mutation.id)
    }
  })

  it('opens the tooltip on tap and on keyboard focus, not only on hover', () => {
    // The HUD is built for landscape phones first, and a phone has no hover.
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
    expect(source).toContain('<button type="button" class="g3d-mutation-chip"')
    expect(source).toContain("aria-expanded=\"false\"")
    expect(css).toContain('.g3d-mutation-chip[aria-expanded="true"] i')
    expect(css).toContain('.g3d-mutation-chip:focus-visible i')
  })

  it('shows every mutation held, not just the last one taken', () => {
    // Effects accumulate, so by the end of a run the player carries five at
    // once. With nowhere to read that back the stacking is invisible and there
    // is nothing to plan the next pick around.
    expect(source).toContain('data-g3d-mutations')
    expect(source).toContain('private updateMutationList()')
    expect(source).toContain('const held = this.mutationState.taken')
    // Every held id is rendered, rather than a single current one.
    expect(source).toMatch(/held\.map\(\(id\) =>/)
  })

  it('updates on the click rather than on the next frame', () => {
    // The panel closes on that click; the chip should already be there when it
    // does, not one HUD tick later.
    expect(source).toMatch(/private chooseMutation\(index: number\)[\s\S]*?this\.updateMutationList\(\)/)
  })

  it('stays out of the way until the first mutation is taken', () => {
    expect(source).toContain("'<div class=\"g3d-mutation-list\" data-g3d-mutations hidden></div>'")
    expect(source).toMatch(/if \(held\.length === 0\) \{\s*\n\s*list\.hidden = true/)
  })
})

describe('The chips are actually reachable by a cursor', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  it('opts back into pointer events, since the HUD around them does not take any', () => {
    // The HUD is pointer-events: none so it never blocks the play surface.
    // Anything interactive inside it has to opt back in or hover and tap never
    // arrive - the tooltip looked broken while the CSS was entirely correct.
    expect(css).toMatch(/\.gloamwood-3d-hud \{[^}]*pointer-events: none/s)
    expect(css).toMatch(/\.g3d-mutation-chip \{[^}]*pointer-events: auto/s)
  })
})
