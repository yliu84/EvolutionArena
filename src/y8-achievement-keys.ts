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
  'altar-held': '7d8626be7d92196561e9',
  'altar-unspent': '16dd756feb28cfdfbcc7',
  'altar-untouched': '04e4ef2a6ecfc3c50f38',
  'altar-wave-six': '7150613e9af31a6ac9fc',
  'both-ways': 'ad66dd03eca17565459a',
  'hundred-kills': 'f4d55ee7fb8abf356649',
  'many-mutations': 'e4552f82c1935901a3aa',
  'valley-cleared': '331d330138e23495e99a',
  'valley-unspent': '6d6c16baa4c40c8535c9',
}

/** Y8's own shape for a key: twenty lowercase hex characters. */
export const GLOAMWOOD_Y8_KEY_PATTERN = /^[0-9a-f]{20}$/

export function gloamwoodY8AchievementKey(achievementId: string): string | null {
  return GLOAMWOOD_Y8_ACHIEVEMENT_KEYS[achievementId] ?? null
}
