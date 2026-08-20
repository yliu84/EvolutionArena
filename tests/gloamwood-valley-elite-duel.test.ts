import { describe, expect, it } from 'vitest'

import { gloamwoodPlayerDamageTaken } from '../src/gloamwood-3d-combat'
import {
  GLOAMWOOD_PREY,
  damageGloamwoodPreyList,
  gloamwoodPreyAttackDistance,
  stepPrey,
  type GloamwoodNestPrey,
} from '../src/gloamwood-3d-ecology'
import { createGloamwoodValleyCreatures } from '../src/gloamwood-valley-creatures'
import { ELITE_AFFIX_IDS } from '../src/elite-affixes'
import {
  gloamwoodEliteAffixDeal,
  gloamwoodEliteBroodHealth,
  gloamwoodEliteBroodPositions,
  gloamwoodEliteDeathBurst,
  gloamwoodEliteSplits,
} from '../src/gloamwood-elite'
import { CORAL_GECKO_PRESENTATION } from '../src/quality-3d-character-presentation'

/**
 * Can the first elite actually be beaten?
 *
 * Reported from a playtest as unbeatable. Walking there in the running game to
 * find out cost sixty seconds and most of the player's health before the branch
 * was even reached, so the fight is run here instead: the real creature from the
 * real spawn plan, the real chase and attack authority, the real damage gate,
 * and the real player numbers.
 *
 * What it measures is the floor, not a good player - stand in reach and trade,
 * and separately step out when the wind-up starts. If the floor cannot win, the
 * encounter is not asking for skill, it is asking for a different build.
 */

const PLAYER = {
  // Stage one, after one evolution: 100 base plus the growth every stage
  // carries, and one point of armour off every blow.
  maxHealth: 110,
  armour: 1,
  bodyRadius: 1.28,
  speed: 6.2,
  // The chain the stage-one forms run, at the authored damage.
  combo: [
    CORAL_GECKO_PRESENTATION.combat.hitFeedback.biteDamage,
    CORAL_GECKO_PRESENTATION.combat.hitFeedback.pounceDamage,
    CORAL_GECKO_PRESENTATION.combat.hitFeedback.tailSwipeDamage,
  ],
  comboSeconds: CORAL_GECKO_PRESENTATION.combat.biteDurationSeconds
    + CORAL_GECKO_PRESENTATION.combat.pounceDurationSeconds
    + CORAL_GECKO_PRESENTATION.combat.tailSwipeDurationSeconds,
}

const elite = createGloamwoodValleyCreatures(0x5a11e)
  .filter((creature) => creature.tier === 'elite')
  .sort((a, b) => a.spawnS - b.spawnS)[0]

interface DuelResult {
  won: boolean
  seconds: number
  healthLeft: number
  hitsTaken: number
}

/** One fight. `dodge` steps out of reach the moment the wind-up begins. */
function duel(dodge: boolean, damageMultiplier = 1): DuelResult {
  const step = 1 / 60
  let creature: GloamwoodNestPrey = { ...elite, x: 4, z: 0, phase: 'chase', phaseElapsed: 0 }
  let health = PLAYER.maxHealth
  let player = { x: 0, z: 0, alive: true, bodyRadius: PLAYER.bodyRadius }
  let sinceSwing = 0
  let comboStep = 0
  let hitsTaken = 0
  let seconds = 0

  for (let tick = 0; tick < 60 * 120; tick += 1) {
    seconds += step
    const reach = gloamwoodPreyAttackDistance(creature, PLAYER.bodyRadius)
    const gap = Math.hypot(creature.x - player.x, creature.z - player.z)

    // The player: back out of the circle while it winds up, otherwise close and
    // keep the chain running.
    // Out for the whole committed window, not just the wind-up. Backing out and
    // stepping straight back in as the phase flips to 'strike' walks the player
    // into the blow 0.1s later - which is the contact delay, not a dodge.
    const retreating = dodge && (creature.phase === 'telegraph' || creature.phase === 'strike')
    const want = retreating ? reach + 0.6 : reach - 0.5
    const move = Math.min(PLAYER.speed * step, Math.abs(gap - want))
    const sign = gap < want ? -1 : 1
    if (gap > 0.001) {
      player = { ...player, x: player.x + (creature.x - player.x) / gap * move * sign }
    }

    sinceSwing += step
    if (!retreating && gap <= reach && sinceSwing >= PLAYER.comboSeconds / PLAYER.combo.length) {
      sinceSwing = 0
      const hit = damageGloamwoodPreyList(
        [creature], creature.id,
        PLAYER.combo[comboStep % PLAYER.combo.length] * damageMultiplier,
        'Bite', player, 0,
      )
      comboStep += 1
      creature = hit.prey[0]
      if (hit.killed) return { won: true, seconds, healthLeft: health, hitsTaken }
    }

    const frame = stepPrey(creature, step, player)
    creature = frame.state
    for (const event of frame.events) {
      if (event.type !== 'prey-attack') continue
      hitsTaken += 1
      health -= gloamwoodPlayerDamageTaken(event.damage, 0, PLAYER.armour)
      if (health <= 0) return { won: false, seconds, healthLeft: 0, hitsTaken }
    }
  }
  return { won: false, seconds, healthLeft: health, hitsTaken }
}

describe('The first elite, fought alone', () => {
  it('is the creature the playtest ran into', () => {
    expect(elite.id).toBe('fern-hollow-elite')
    expect(elite.kind).toBe('fang')
    expect(elite.maxHealth).toBe(Math.round(GLOAMWOOD_PREY.fang.maxHealth * 2.2))
  })

  it('can be beaten by trading blindly, with health to spare', () => {
    // The floor: never dodge, never flank, just stand in reach and swing. If
    // this loses, the encounter is not asking for skill.
    const result = duel(false)
    expect(result.won, `lost after ${result.seconds.toFixed(1)}s`).toBe(true)
    expect(result.healthLeft).toBeGreaterThan(0)
  })

  it('is a decisively different fight if the whole committed window is respected', () => {
    const traded = duel(false)
    const dodged = duel(true)
    expect(dodged.won).toBe(true)
    // Untouched, against four hits taken standing still. The encounter is
    // entirely avoidable - which is the whole claim the telegraph makes.
    expect(dodged.hitsTaken).toBe(0)
    expect(dodged.healthLeft).toBe(PLAYER.maxHealth)
    expect(traded.hitsTaken).toBeGreaterThan(0)
  })

  it('does not drag past the point where something else arrives', () => {
    // Road packs return on a ninety second clock. An elite that outlasts it
    // stops being a duel.
    expect(duel(false).seconds).toBeLessThan(90)
  })
})

describe('Why it did not feel avoidable', () => {
  it('is not dodged by leaving during the wind-up alone', () => {
    // Contact resolves 0.1s into the strike, not at the end of the wind-up. A
    // player who backs out, sees the mark vanish, and steps straight back in
    // takes the blow anyway - measured at the same four hits as never moving.
    // That is why the runtime now holds the mark up through the strike.
    const spec = GLOAMWOOD_PREY[elite.kind]
    expect(spec.contactSeconds).toBeGreaterThan(0)
    expect(spec.contactSeconds).toBeLessThan(spec.strikeSeconds)
  })
})

describe('The Volatile elite leaves something behind', () => {
  it('is the affix the first two elites actually carry', () => {
    // Which is why it mattered that nothing read it: the damage gate computed
    // the burst, returned it, and the runtime dropped it. Both of the first two
    // elites were a bigger health bar and nothing else.
    const elites = createGloamwoodValleyCreatures(0x5a11e)
      .filter((creature) => creature.tier === 'elite')
      .sort((a, b) => a.spawnS - b.spawnS)
    expect(elites[0].elite?.affix).toBe('volatile')
  })

  it('reaches further than the creature it comes from, and less far than a boss', () => {
    // A parting shot is worth stepping away from. It must not out-reach the
    // region boss it leads to.
    const burst = gloamwoodEliteDeathBurst({ affix: 'volatile', shield: 0, broodTriggered: false }, 0, 0)!
    expect(burst.radius).toBeGreaterThan(gloamwoodPreyAttackDistance(elite, 1.28) - 1.28)
    expect(burst.radius).toBeLessThan(4.3)
  })

  it('gives long enough to walk out of it', () => {
    // At the player's 6.2 units a second, the telegraph has to cover the gap
    // between standing on the corpse and standing outside the ring.
    const burst = gloamwoodEliteDeathBurst({ affix: 'volatile', shield: 0, broodTriggered: false }, 0, 0)!
    expect(burst.telegraphSeconds * 6.2).toBeGreaterThan(burst.radius)
  })

  it('leaves nothing behind for any other affix', () => {
    for (const affix of ['berserker', 'siphon', 'brood', 'barrier'] as const) {
      expect(gloamwoodEliteDeathBurst({ affix, shield: 0, broodTriggered: false }, 0, 0)).toBeNull()
    }
  })
})

describe('The Brood elite breaks into two', () => {
  const parent = { affix: 'brood' as const, shield: 0, broodTriggered: false }

  it('splits once, at half health, and never again', () => {
    // The gate stamps the parent so a long fight cannot farm splits out of it.
    expect(gloamwoodEliteSplits(parent, 101, 50, 101)).toBe(true)
    expect(gloamwoodEliteSplits(parent, 50, 40, 101)).toBe(false)
    expect(gloamwoodEliteSplits({ ...parent, broodTriggered: true }, 101, 50, 101)).toBe(false)
  })

  it('makes splits that are a real threat rather than a lap of honour', () => {
    const health = gloamwoodEliteBroodHealth(101)
    expect(health).toBeGreaterThan(GLOAMWOOD_PREY.fang.maxHealth * 0.5)
    expect(health).toBeLessThan(101)
  })

  it('stands them apart rather than inside each other', () => {
    // Two creatures born overlapping spend their first seconds being shoved
    // apart by the separation pass instead of coming for the player.
    const places = gloamwoodEliteBroodPositions(0, 0, 1.55, 0)
    expect(places).toHaveLength(2)
    const gap = Math.hypot(places[0].x - places[1].x, places[0].z - places[1].z)
    expect(gap).toBeGreaterThan(0)
    for (const place of places) {
      expect(Math.hypot(place.x, place.z)).toBeGreaterThan(1.55)
    }
  })

  it('widens the ring with the body, rather than being a constant', () => {
    const small = gloamwoodEliteBroodPositions(0, 0, 0.64, 0)
    const large = gloamwoodEliteBroodPositions(0, 0, 1.98, 0)
    expect(Math.hypot(large[0].x, large[0].z)).toBeGreaterThan(Math.hypot(small[0].x, small[0].z))
  })

  it('puts them behind the parent, not in the player\'s lap', () => {
    // Facing +X means the player is that way; the splits belong on the far side.
    for (const place of gloamwoodEliteBroodPositions(0, 0, 1.55, 0)) {
      expect(place.x).toBeLessThan(0)
    }
  })
})

describe('Which affix each elite gets', () => {
  const elites = createGloamwoodValleyCreatures(0x5a11e).filter((creature) => creature.tier === 'elite')

  it('shows every affix before it shows any twice', () => {
    // Rolled independently, the valley's six elites came out as volatile,
    // volatile, barrier, berserker, berserker, barrier - three affixes doubled,
    // with brood and siphon never appearing at all. Two of the five were dead
    // content, and the tier exists so the optional fight at the end of a branch
    // is a different fight each time.
    const seen = new Set(elites.map((elite) => elite.elite?.affix))
    expect(seen.size).toBe(ELITE_AFFIX_IDS.length)
  })

  it('deals the same hand from the same run seed', () => {
    // A recorded run has to replay against the elites it actually happened to.
    const ids = elites.map((elite) => elite.id)
    expect(gloamwoodEliteAffixDeal('valley-run', ids)).toEqual(gloamwoodEliteAffixDeal('valley-run', ids))
  })

  it('deals a different hand from a different run', () => {
    const ids = elites.map((elite) => elite.id)
    expect(gloamwoodEliteAffixDeal('valley-run', ids)).not.toEqual(gloamwoodEliteAffixDeal('another-run', ids))
  })

  it('keeps dealing past the end of the deck', () => {
    const many = Array.from({ length: ELITE_AFFIX_IDS.length * 2 + 1 }, (_, index) => `e${index}`)
    const deal = gloamwoodEliteAffixDeal('valley-run', many)
    expect(Object.keys(deal)).toHaveLength(many.length)
    // The first full deck holds one of each, so no affix appears twice before
    // all of them have appeared once.
    const first = many.slice(0, ELITE_AFFIX_IDS.length).map((id) => deal[id])
    expect(new Set(first).size).toBe(ELITE_AFFIX_IDS.length)
  })
})
