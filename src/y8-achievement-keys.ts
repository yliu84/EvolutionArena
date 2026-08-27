/**
 * Y8's unlock keys for this game's achievements.
 *
 * Y8 generates these itself - an opaque twenty-character id, unrelated to the
 * title, handed out when the achievement is created on their dashboard. There
 * is no way to choose or derive one, so the game cannot simply send its own
 * achievement id and hope: a key that does not match an existing achievement
 * awards nothing, silently, forever.
 *
 * That makes this table the join between two systems that share no identifier,
 * and it is the one place a mistake here is invisible from inside the game.
 * Do not hand-copy these. `npm run y8:keys` reads them from Y8's own API and
 * prints this block ready to paste, which is the only way nine twenty-digit
 * hex strings get transcribed without an error.
 *
 * An id missing from this table is simply not mirrored to the portal. Its
 * local achievement still unlocks and still shows in the game's own list, so a
 * half-filled table degrades rather than breaks.
 */
export const GLOAMWOOD_Y8_ACHIEVEMENT_KEYS: Readonly<Record<string, string>> = {
  'altar-wave-six': '7150613e9af31a6ac9fc',
  'valley-cleared': '331d330138e23495e99a',
  // Pending: created on Y8, then filled in by `npm run y8:keys`.
  // 'many-mutations': '',
  // 'altar-held': '',
  // 'hundred-kills': '',
  // 'valley-unspent': '',
  // 'altar-unspent': '',
  // 'altar-untouched': '',
  // 'both-ways': '',
}

/** Y8's own shape for a key: twenty lowercase hex characters. */
export const GLOAMWOOD_Y8_KEY_PATTERN = /^[0-9a-f]{20}$/

export function gloamwoodY8AchievementKey(achievementId: string): string | null {
  return GLOAMWOOD_Y8_ACHIEVEMENT_KEYS[achievementId] ?? null
}
