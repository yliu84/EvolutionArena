import {
  gloamwoodTunableGroups,
  onGloamwoodTunablesChanged,
  gloamwoodTuningReport,
  resetGloamwoodTunables,
  setGloamwoodTunable,
  type GloamwoodTunable,
} from './gloamwood-tuning'

/**
 * The panel. Dynamically imported, and only when `?tune=1` asks for it.
 *
 * Deliberately hand-built rather than lil-gui, for one reason: sliders were
 * never the hard part. The hard part is getting the number that finally looked
 * right back into the file it came from, and a general-purpose GUI leaves
 * someone squinting at a readout and retyping it. Every id here is the name of
 * the constant it writes to, and the copy button emits the whole diff.
 *
 * No i18n. This is a workshop tool for whoever is building the game, not
 * player-facing copy, and it is never reachable without the query string.
 */
export function mountGloamwoodTuningPanel(container: HTMLElement, onChange?: () => void) {
  const panel = document.createElement('section')
  panel.className = 'g3d-tuning'
  panel.innerHTML = [
    '<header>',
    '<strong>Tuning</strong>',
    '<div><button type="button" data-copy>Copy diff</button>',
    '<button type="button" data-reset>Reset</button>',
    '<button type="button" data-fold>&minus;</button></div>',
    '</header>',
    '<div class="g3d-tuning-body"></div>',
    '<output class="g3d-tuning-report" hidden></output>',
  ].join('')

  const body = panel.querySelector<HTMLElement>('.g3d-tuning-body')!
  const report = panel.querySelector<HTMLOutputElement>('.g3d-tuning-report')!
  let rows = new Map<string, { input: HTMLInputElement; readout: HTMLElement; entry: GloamwoodTunable }>()

  const build = () => {
    body.replaceChildren()
    rows = new Map()
    for (const [group, entries] of gloamwoodTunableGroups()) {
      const section = document.createElement('div')
      section.className = 'g3d-tuning-group'
      section.innerHTML = `<h3>${escape(group)}</h3>`
      for (const entry of entries) {
        const row = document.createElement('label')
        row.title = entry.spec.note ?? entry.spec.id
        row.dataset.moved = entry.value !== entry.initial ? 'true' : 'false'
        row.innerHTML = [
          `<span>${escape(entry.spec.label)}</span>`,
          `<b data-readout>${entry.value}</b>`,
          `<input type="range" min="${entry.spec.min}" max="${entry.spec.max}" step="${entry.spec.step}" value="${entry.value}">`,
        ].join('')
        const input = row.querySelector('input')!
        const readout = row.querySelector<HTMLElement>('[data-readout]')!
        input.addEventListener('input', () => {
          const applied = setGloamwoodTunable(entry.spec.id, Number(input.value))
          if (applied === null) return
          readout.textContent = String(applied)
          // Marked so a glance says which of forty numbers this session moved.
          row.dataset.moved = applied !== entry.initial ? 'true' : 'false'
          onChange?.()
        })
        rows.set(entry.spec.id, { input, readout, entry })
        section.append(row)
      }
      body.append(section)
    }
  }
  build()
  // Rebuilt rather than appended to: a dynamically imported effect can bring a
  // whole new group with it, and rebuilding keeps the groups in registry order
  // instead of in the order modules happened to load.
  const unsubscribe = onGloamwoodTunablesChanged(build)

  panel.querySelector('[data-copy]')?.addEventListener('click', async () => {
    const text = gloamwoodTuningReport()
    report.hidden = false
    report.textContent = text || 'Nothing moved yet.'
    // Clipboard first, but the text stays on screen either way - this is often
    // run in a preview pane where clipboard access is denied, and losing the
    // numbers at the end of a tuning session would be the worst possible
    // failure for this tool.
    try {
      if (text) await navigator.clipboard.writeText(text)
    } catch {
      report.textContent = `${text}\n\n(clipboard blocked - select and copy)`
    }
  })

  panel.querySelector('[data-reset]')?.addEventListener('click', () => {
    resetGloamwoodTunables()
    for (const { input, readout, entry } of rows.values()) {
      input.value = String(entry.value)
      readout.textContent = String(entry.value)
      ;(input.closest('label') as HTMLElement).dataset.moved = 'false'
    }
    report.hidden = true
    onChange?.()
  })

  const fold = panel.querySelector<HTMLButtonElement>('[data-fold]')
  fold?.addEventListener('click', () => {
    const folded = panel.dataset.folded === 'true'
    panel.dataset.folded = folded ? 'false' : 'true'
    fold.textContent = folded ? '−' : '+'
  })

  container.append(panel)
  return () => {
    unsubscribe()
    panel.remove()
  }
}

function escape(value: string) {
  const span = document.createElement('span')
  span.textContent = value
  return span.innerHTML
}
