import {describe, expect, test} from "bun:test"
import {createDocument} from "@zavx0z/dom"
import {createDocumentRenderer} from "@zavx0z/renderer"
import {
  createEngineInspector,
  engineInspectorCss,
} from "./inspector.ts"

describe("Engine Storybook Props inspector", () => {
  test("updates keyed same-Document metadata without source-code sections", () => {
    const document = createDocument()
    const inspector = createEngineInspector(document, {
      context: "Engine · Обзор",
      entries: [
        {id: "kind", label: "Тип", value: "Обзор"},
        {id: "route", label: "Маршрут", value: "/"},
        {id: "children", label: "Разделы", value: "4"},
      ],
    })
    document.appendChild(inspector.element)
    const route = inspector.element.querySelector('[data-property-id="route"]')

    expect(inspector.element.localName).toBe("aside")
    expect(inspector.element.className).toBe("")
    expect([...inspector.element.querySelectorAll("*")].every(element => element.className === "")).toBeTrue()
    expect(inspector.element.ownerDocument).toBe(document)
    expect(inspector.element.getAttribute("aria-label")).toBe("Engine Storybook Props")
    expect(inspector.element.textContent).toContain("Props")
    expect(inspector.element.textContent).toContain("Metadata")
    expect(inspector.element.textContent).not.toContain("HTML")
    expect(inspector.element.textContent).not.toContain("CSS")
    expect(inspector.element.textContent).not.toContain("TypeScript")

    inspector.update({
      context: "Instanced boxes",
      entries: [
        {id: "api", label: "API", value: "InstancedMesh"},
        {id: "route", label: "Маршрут", value: "/geometry/instancing/boxes"},
        {id: "story-id", label: "Story ID", value: "instanced-boxes"},
      ],
    })

    expect(inspector.element.querySelector('[data-property-id="route"]')).toBe(route)
    expect(inspector.element.querySelector('[data-property-id="kind"]')).toBeNull()
    expect(inspector.element.textContent).toContain("InstancedMesh")
    expect(inspector.state.context).toBe("Instanced boxes")
    expect(inspector.state.entries).toHaveLength(3)
  })

  test("validates the full update before mutating the current panel", () => {
    const document = createDocument()
    const inspector = createEngineInspector(document, {
      context: "Engine",
      entries: [{id: "route", label: "Маршрут", value: "/"}],
    })
    const before = inspector.element.textContent

    expect(() => inspector.update({
      context: "Broken",
      entries: [
        {id: "route", label: "A", value: "/a"},
        {id: "route", label: "B", value: "/b"},
      ],
    })).toThrow("Duplicate Inspector entry id: route")
    expect(inspector.element.textContent).toBe(before)
  })

  test("owns one flat Engine sheet without UI or source-viewer selectors", () => {
    expect(engineInspectorCss).toContain("[data-engine-storybook-inspector]")
    expect(engineInspectorCss).toContain("[data-property-id]")
    expect(engineInspectorCss).toContain("display: flex")
    expect(engineInspectorCss).toContain("height: 100%")
    expect(engineInspectorCss).not.toContain(".engine-storybook-inspector")
    expect(engineInspectorCss).not.toContain("storybook-dom-workbench__source")
    expect(engineInspectorCss).not.toContain("@ui/")
    expect(engineInspectorCss.match(/\{/gu)?.length).toBe(engineInspectorCss.match(/\}/gu)?.length)
  })

  test("fills the supplied right-panel viewport through the document renderer", () => {
    const document = createDocument()
    const inspector = createEngineInspector(document, {
      context: "Coordinate space",
      entries: [
        {id: "api", label: "API", value: "Space"},
        {id: "route", label: "Маршрут", value: "/foundations/coordinates/z-up"},
      ],
    })
    document.appendChild(inspector.element)
    const renderer = createDocumentRenderer({
      document,
      root: inspector.element,
      viewport: {width: 400, height: 600},
      styleSheets: [engineInspectorCss],
    })
    const frame = renderer.flush()
    const rows = inspector.element.querySelector('[role="list"]')!

    expect(frame.boxByNode.get(inspector.element)).toMatchObject({width: 400, height: 600})
    expect(frame.boxByNode.get(rows)?.width).toBeGreaterThan(0)
    expect(frame.boxByNode.get(rows)?.height).toBeGreaterThan(0)
    renderer.dispose()
  })
})
