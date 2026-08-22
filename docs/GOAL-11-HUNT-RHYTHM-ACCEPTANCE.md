# Goal 11 — Hunt Rhythm Acceptance

## Player promise

The game still has one basic attack input. Boss encounters now name the beat
already present in the authoritative fight:

- **EVADE NOW / 立即闪避** during `telegraph`, `strike`, or `attack`.
- **COUNTER WINDOW / 反击空档** during `recover`.
- **HOLD GROUND / 保持距离** while the Boss is otherwise setting up.

The standing attack order pauses only its automatic approach and chain
continuation during the evade beat. It keeps the target locked and leaves
manual steering unrestricted. A player who presses movement still uses the
Goal 9 cancellation path; a recovery permits the same basic attack to resume.

## Explicit non-goals

- No skill button, ranged attack, new combat resource, or extra combo.
- No changes to Boss/prey damage, health, collision, attack reach, hit checks,
  evolution rules, map layout, or models.
- No automatic dodge movement: the prompt tells the player to move, rather
  than making a successful evade happen without them.

## Verification

```bash
npx vitest run tests/gloamwood-hunt-rhythm.test.ts tests/gloamwood-lock-range.test.ts tests/i18n.test.ts
npm test
npm run build
```

Review River Valley Boss behaviour locally with:

```text
http://127.0.0.1:5185/?maplab=5&debug=1&bossGate=1&bossIndex=0&weather=rain
```

Pass condition: the plate visibly alternates between the three beat labels;
the order does not auto-close during **EVADE NOW**; manual movement remains
immediate; on mobile landscape the Boss plate, Lock and Attack controls stay
visible without horizontal overflow.
