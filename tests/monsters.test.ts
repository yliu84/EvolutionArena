import { describe, expect, it } from 'vitest'
import {
  MONSTERS,
  MONSTER_TYPES,
  LINEAGE_TALENTS,
  canDealContactDamage,
  lineageIncomingDamage,
  lineageOutgoingDamage,
  lineageProjectileCount,
  lineagePursuitSpeed,
  lineageRecoveryMs,
  lifeStealHealth,
  projectileAngles,
} from '../src/monsters'

describe('monster definitions', () => {
  it('defines twenty-four visually distinct species over six combat roles', () => {
    expect(MONSTER_TYPES).toHaveLength(24)
    expect(new Set(MONSTER_TYPES.map((type) => MONSTERS[type].texture)).size).toBe(24)
    expect(new Set(MONSTER_TYPES.map((type) => MONSTERS[type].attackKind)).size).toBe(6)
  })

  it('prepares every species for future lineage talents', () => {
    for (const type of MONSTER_TYPES) {
      expect(MONSTERS[type].lineage.length).toBeGreaterThan(0)
      expect(MONSTERS[type].talentHint.length).toBeGreaterThan(0)
    }
  })

  it('defines and applies all six lineage talents', () => {
    expect(Object.keys(LINEAGE_TALENTS)).toHaveLength(6)
    expect(lineageOutgoingDamage(20, 'fang', 0.4)).toBe(25)
    expect(lineageOutgoingDamage(20, 'fang', 0.41)).toBe(20)
    expect(lineageIncomingDamage(10, 'carapace')).toBeCloseTo(7.8)
    expect(lineageIncomingDamage(10, 'carapace', true)).toBe(0)
    expect(lineageRecoveryMs(1000, 'wing')).toBe(780)
    expect(lineageProjectileCount(3, 'rift')).toBe(4)
    expect(lineagePursuitSpeed(100, 'swarm', 1)).toBeCloseTo(118)
    expect(lineagePursuitSpeed(100, 'swarm', 0)).toBe(100)
  })

  it('telegraphs every special action for at least 500ms', () => {
    for (const type of MONSTER_TYPES) expect(MONSTERS[type].telegraphMs).toBeGreaterThanOrEqual(500)
  })

  it('makes the shellback the durable slow role', () => {
    expect(MONSTERS.shellback.health).toBeGreaterThan(MONSTERS.pouncer.health * 2)
    expect(MONSTERS.shellback.speed).toBeLessThan(MONSTERS.pouncer.speed)
  })

  it('makes the spitter a ranged projectile role', () => {
    expect(MONSTERS.spitter.preferredMinRange).toBeGreaterThan(200)
    expect(MONSTERS.spitter.projectileDamage).toBeGreaterThan(0)
    expect(MONSTERS.spitter.projectileSpeed).toBeGreaterThan(0)
  })

  it('creates pressure without removing readable warnings', () => {
    expect(MONSTERS.pouncer.speed).toBeGreaterThanOrEqual(170)
    expect(MONSTERS.pouncer.lostRange).toBeGreaterThan(800)
    expect(MONSTERS.pouncer.health).toBeGreaterThan(3)
    expect(MONSTERS.spitter.projectileSpeed).toBeGreaterThanOrEqual(350)
    expect(MONSTERS.spitter.cooldownMs).toBeGreaterThan(MONSTERS.spitter.telegraphMs)
  })

  it('keeps contact damage inside explicit attack windows', () => {
    expect(canDealContactDamage('pounce', 'pursue')).toBe(false)
    expect(canDealContactDamage('pounce', 'attack')).toBe(true)
    expect(canDealContactDamage('brace', 'brace')).toBe(true)
    expect(canDealContactDamage('spread', 'attack')).toBe(false)
  })

  it('creates a centered three-shot spread for the riftweaver', () => {
    const angles = projectileAngles(1, 3, 0.2)
    expect(angles).toHaveLength(3)
    expect(angles[0]).toBeCloseTo(0.8)
    expect(angles[1]).toBeCloseTo(1)
    expect(angles[2]).toBeCloseTo(1.2)
  })

  it('lets bloodleeches recover on a successful drain without overhealing', () => {
    expect(lifeStealHealth(2, 10, 0.22)).toBeCloseTo(4.2)
    expect(lifeStealHealth(9, 10, 0.22)).toBe(10)
  })

  it('gives every monster a readable perception and recovery profile', () => {
    for (const type of MONSTER_TYPES) {
      const monster = MONSTERS[type]
      expect(monster.visionRange).toBeGreaterThan(monster.hearingRange)
      expect(monster.lostRange).toBeGreaterThan(monster.visionRange)
      expect(monster.leashRange).toBeGreaterThan(monster.preferredMaxRange)
      expect(monster.alertMs).toBeGreaterThanOrEqual(400)
      expect(monster.regenPercentPerSecond).toBeGreaterThan(0)
    }
  })
})
