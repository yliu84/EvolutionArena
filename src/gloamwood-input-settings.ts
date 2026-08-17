export type GloamwoodInputAction = 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'lock' | 'attack' | 'pause'

export type GloamwoodInputBindings = Record<GloamwoodInputAction, string>

export const GLOAMWOOD_INPUT_BINDINGS_STORAGE_KEY = 'evolution-arena-input-bindings-v1'

export const DEFAULT_GLOAMWOOD_INPUT_BINDINGS: GloamwoodInputBindings = {
  moveUp: 'KeyW',
  moveDown: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  lock: 'Tab',
  attack: 'Space',
  pause: 'Escape',
}

const ACTIONS = Object.keys(DEFAULT_GLOAMWOOD_INPUT_BINDINGS) as GloamwoodInputAction[]
const VALID_CODE = /^(Key[A-Z]|Digit[0-9]|Arrow(?:Up|Down|Left|Right)|Space|Tab|Escape|Enter|Shift(?:Left|Right)|Control(?:Left|Right)|Alt(?:Left|Right)|Numpad[0-9]|Backquote|Backslash|Bracket(?:Left|Right)|Comma|Equal|Minus|Period|Quote|Semicolon|Slash)$/

export function normalizeGloamwoodInputBindings(value: unknown): GloamwoodInputBindings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_GLOAMWOOD_INPUT_BINDINGS }
  const candidate = value as Partial<GloamwoodInputBindings>
  const normalized = { ...DEFAULT_GLOAMWOOD_INPUT_BINDINGS }
  const used = new Set<string>()
  for (const action of ACTIONS) {
    const code = candidate[action]
    const desired = typeof code === 'string' && VALID_CODE.test(code) ? code : DEFAULT_GLOAMWOOD_INPUT_BINDINGS[action]
    const available = !used.has(desired)
      ? desired
      : [DEFAULT_GLOAMWOOD_INPUT_BINDINGS[action], ...Object.values(DEFAULT_GLOAMWOOD_INPUT_BINDINGS)].find((fallback) => !used.has(fallback))!
    normalized[action] = available
    used.add(available)
  }
  return normalized
}

export function rebindGloamwoodInput(
  bindings: GloamwoodInputBindings,
  action: GloamwoodInputAction,
  code: string,
) {
  if (!VALID_CODE.test(code)) return { ...bindings }
  const next = { ...bindings }
  const previousCode = next[action]
  const conflict = ACTIONS.find((candidate) => candidate !== action && next[candidate] === code)
  next[action] = code
  if (conflict) next[conflict] = previousCode
  return next
}

export function formatGloamwoodInputCode(code: string) {
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  // Arrow keys read as an English glyph in both locales; the label is a key cap,
  // not prose, so it stays language-neutral rather than being translated.
  if (code.startsWith('Arrow')) return ({ Up: '↑', Down: '↓', Left: '←', Right: '→' } as Record<string, string>)[code.slice(5)] ?? code.slice(5)
  if (code === 'Space') return 'Space'
  if (code === 'Escape') return 'Esc'
  if (code === 'Tab') return 'Tab'
  return code.replace('Left', ' L').replace('Right', ' R')
}

export function gloamwoodMovementBindingLabel(bindings: GloamwoodInputBindings) {
  return [bindings.moveUp, bindings.moveLeft, bindings.moveDown, bindings.moveRight].map(formatGloamwoodInputCode).join('/')
}
