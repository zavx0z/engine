import type {Document, HTMLElement, Text} from "@zavx0z/dom"

export type EngineInspectorEntry = Readonly<{
  id: string
  label: string
  value: string
}>

export type EngineInspectorState = Readonly<{
  context: string
  entries: readonly EngineInspectorEntry[]
}>

export type EngineInspector = Readonly<{
  element: HTMLElement
  readonly state: EngineInspectorState
  update(state: EngineInspectorState): void
}>

type InspectorRow = Readonly<{
  element: HTMLElement
  label: Text
  value: Text
}>

export const engineInspectorCss = String.raw`
[data-engine-storybook-inspector] { box-sizing: border-box; display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; overflow: hidden; border: 1px solid #111111; border-radius: 6px; background: #303030; color: #d8d8d8; }
[data-inspector-heading] { box-sizing: border-box; display: flex; align-items: center; width: 100%; height: 30px; margin: 0; padding: 4px 8px; border-bottom: 1px solid #1d1d1d; color: #e0e0e0; font-size: 12px; }
[data-inspector-context] { box-sizing: border-box; display: block; width: 100%; min-height: 28px; padding: 6px 8px; border-bottom: 1px solid #1d1d1d; background: #292929; color: #c8c8c8; font-size: 11px; }
[data-inspector-section] { box-sizing: border-box; display: flex; flex-direction: column; min-height: 0; flex-grow: 1; padding: 7px; overflow: hidden; }
[data-inspector-section-heading] { box-sizing: border-box; display: block; min-height: 24px; margin: 0; padding: 4px 6px; border-radius: 4px 4px 0 0; background: #3d3d3d; color: #d8d8d8; font-size: 11px; }
[data-inspector-properties] { box-sizing: border-box; display: flex; flex-direction: column; min-height: 0; flex-grow: 1; gap: 2px; padding: 6px; overflow: auto; border-radius: 0 0 4px 4px; background: #3d3d3d; }
[data-property-id] { box-sizing: border-box; display: flex; flex-direction: row; align-items: center; width: 100%; min-height: 28px; gap: 4px; padding: 3px 6px; border: 1px solid #303030; border-radius: 3px; background: #353535; }
[data-property-label] { box-sizing: border-box; display: block; width: 38%; min-width: 0; color: #b8b8b8; font-size: 11px; }
[data-property-value] { box-sizing: border-box; display: block; min-width: 0; flex-grow: 1; overflow: hidden; color: #e0e0e0; font-size: 11px; }
`.trim()

export function createEngineInspector(
  document: Document,
  initial: EngineInspectorState,
): EngineInspector {
  const root = document.createElement("aside")
  root.setAttribute("aria-label", "Engine Storybook Props")
  root.setAttribute("data-engine-storybook-inspector", "")

  const heading = document.createElement("h2")
  heading.setAttribute("data-inspector-heading", "")
  heading.textContent = "Props"
  const context = document.createElement("div")
  context.setAttribute("data-inspector-context", "")
  const contextText = document.createTextNode("")
  context.appendChild(contextText)
  const section = document.createElement("section")
  section.setAttribute("data-inspector-section", "metadata")
  section.setAttribute("aria-label", "Metadata")
  const sectionHeading = document.createElement("h3")
  sectionHeading.setAttribute("data-inspector-section-heading", "")
  sectionHeading.textContent = "Metadata"
  const rowsHost = document.createElement("div")
  rowsHost.setAttribute("data-inspector-properties", "")
  rowsHost.setAttribute("role", "list")
  section.append(sectionHeading, rowsHost)
  root.append(heading, context, section)

  const rows = new Map<string, InspectorRow>()
  let state = normalizeState(initial)

  const update = (nextState: EngineInspectorState): void => {
    const next = normalizeState(nextState)
    const retained = new Set(next.entries.map(({id}) => id))
    document.transaction(() => {
      contextText.data = next.context
      context.title = next.context
      for (const [id, row] of rows) {
        if (retained.has(id)) continue
        rows.delete(id)
        if (row.element.parentNode === rowsHost) rowsHost.removeChild(row.element)
      }
      const ordered = next.entries.map((entry) => {
        let row = rows.get(entry.id)
        if (row === undefined) {
          row = createRow(document, entry.id)
          rows.set(entry.id, row)
        }
        row.label.data = entry.label
        row.value.data = entry.value
        row.element.title = `${entry.label}: ${entry.value}`
        return row.element
      })
      rowsHost.replaceChildren(...ordered)
    })
    state = next
  }

  const inspector: EngineInspector = Object.freeze({
    element: root,
    get state() {
      return state
    },
    update,
  })
  update(state)
  return inspector
}

function createRow(document: Document, id: string): InspectorRow {
  const row = document.createElement("div")
  row.setAttribute("role", "listitem")
  row.setAttribute("data-property-id", id)
  const label = document.createElement("span")
  label.setAttribute("data-property-label", "")
  const labelText = document.createTextNode("")
  label.appendChild(labelText)
  const value = document.createElement("span")
  value.setAttribute("data-property-value", "")
  const valueText = document.createTextNode("")
  value.appendChild(valueText)
  row.append(label, value)
  return Object.freeze({element: row, label: labelText, value: valueText})
}

function normalizeState(input: EngineInspectorState): EngineInspectorState {
  const context = requiredText("Inspector context", input.context)
  if (!Array.isArray(input.entries)) throw new TypeError("Inspector entries must be an array")
  const ids = new Set<string>()
  const entries = input.entries.map((entry, index) => {
    if (entry === null || typeof entry !== "object") {
      throw new TypeError(`Inspector entry ${index} must be an object`)
    }
    const id = requiredId(entry.id)
    if (ids.has(id)) throw new Error(`Duplicate Inspector entry id: ${id}`)
    ids.add(id)
    return Object.freeze({
      id,
      label: requiredText("Inspector entry label", entry.label),
      value: requiredText("Inspector entry value", entry.value),
    })
  })
  return Object.freeze({context, entries: Object.freeze(entries)})
}

function requiredId(value: unknown): string {
  const id = requiredText("Inspector entry id", value)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) throw new Error(`Invalid Inspector entry id: ${id}`)
  return id
}

function requiredText(label: string, value: unknown): string {
  if (typeof value !== "string") throw new TypeError(`${label} must be a string`)
  if (value.trim().length === 0) throw new Error(`${label} must not be empty`)
  return value
}
