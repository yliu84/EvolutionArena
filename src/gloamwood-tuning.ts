/**
 * Live-tunable numbers, and a way to get them back into the source.
 *
 * Every visual value in this game has been arrived at the same way: edit a
 * constant, reload, look, guess again. That loop cost more than any other
 * single thing in the last few days of work - the sporehaze motes and the
 * metabolic veins each took a dozen rounds of it, and twice the brightness came
 * out wrong by a factor of five, which was only caught by cranking a value to
 * 0.95 to prove the effect rendered at all and then walking it back down.
 *
 * The sliders are the obvious half. The half that actually closes the loop is
 * `gloamwoodTuningReport`: a panel that only moves sliders leaves someone
 * squinting at a number and retyping it, and what is wanted at the end of a
 * tuning session is a list of exactly which constants changed and to what.
 *
 * Registration is free of charge in the shipped game - a Map of a few dozen
 * entries built at module load - and the panel that reads it is behind
 * `?tune=1` and dynamically imported, so it costs players nothing.
 */

export interface GloamwoodTunableSpec {
  /** Dotted, and it names the constant a value is going back into. */
  id: string
  group: string
  label: string
  value: number
  min: number
  max: number
  step: number
  /**
   * What the number means, for whoever is dragging the slider three weeks from
   * now. Optional, and worth writing for anything measured rather than chosen.
   */
  note?: string
}

export interface GloamwoodTunable {
  readonly spec: GloamwoodTunableSpec
  /** The live value. Effects read this every frame; the panel writes it. */
  value: number
  readonly initial: number
}

const registry = new Map<string, GloamwoodTunable>()
const listeners = new Set<() => void>()

/**
 * Told when a new entry registers, because not every effect exists yet.
 *
 * The boss FX scene is dynamically imported the first time a boss winds up, so
 * its numbers - the ones sent back as "too bright" twice - are not in the
 * registry when the panel mounts. A panel built once at startup would be
 * missing exactly the group most in need of a slider.
 */
export function onGloamwoodTunablesChanged(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function defineGloamwoodTunable(spec: GloamwoodTunableSpec): GloamwoodTunable {
  if (registry.has(spec.id)) {
    // Two constants under one id would make the report ambiguous about which
    // file to edit, which is the one thing this has to get right.
    throw new Error(`Duplicate tunable id: ${spec.id}`)
  }
  const entry: GloamwoodTunable = { spec, value: spec.value, initial: spec.value }
  registry.set(spec.id, entry)
  for (const listener of listeners) listener()
  return entry
}

export function gloamwoodTunables(): readonly GloamwoodTunable[] {
  return [...registry.values()]
}

export function gloamwoodTunableGroups() {
  const groups = new Map<string, GloamwoodTunable[]>()
  for (const entry of registry.values()) {
    const bucket = groups.get(entry.spec.group)
    if (bucket) bucket.push(entry)
    else groups.set(entry.spec.group, [entry])
  }
  return groups
}

/** Clamped and snapped, so a dragged slider cannot write a value out of range. */
export function setGloamwoodTunable(id: string, value: number) {
  const entry = registry.get(id)
  if (!entry) return null
  if (!Number.isFinite(value)) return entry.value
  const clamped = Math.min(entry.spec.max, Math.max(entry.spec.min, value))
  const snapped = entry.spec.step > 0
    ? Math.round(clamped / entry.spec.step) * entry.spec.step
    : clamped
  // Rounded away from float noise: a step of 0.005 otherwise produces values
  // like 0.15000000000000002, which is not what anyone wants to paste back in.
  entry.value = Number(snapped.toFixed(6))
  return entry.value
}

export function resetGloamwoodTunables() {
  for (const entry of registry.values()) entry.value = entry.initial
}

/**
 * What changed, and what to change it to. The output of a tuning session.
 *
 * Only the moved values, because a report listing all forty is a report nobody
 * reads to the end.
 */
export function gloamwoodTuningReport(entries: readonly GloamwoodTunable[] = gloamwoodTunables()) {
  const moved = entries.filter((entry) => entry.value !== entry.initial)
  if (moved.length === 0) return ''
  return moved
    .map((entry) => `${entry.spec.id}  ${entry.initial}  ->  ${entry.value}`)
    .join('\n')
}

export function gloamwoodTuningRequested(search: string) {
  return new URLSearchParams(search).get('tune') === '1'
}
