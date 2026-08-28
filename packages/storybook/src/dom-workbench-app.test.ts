import {describe, expect, test} from "bun:test"

describe("Engine DOM Workbench application", () => {
  test("uses one semantic Workbench and keeps the Engine preview as an independent canvas", async () => {
    const source = await Bun.file(new URL("./app.ts", import.meta.url)).text()
    expect(source).toContain('from "@zavx0z/dom"')
    expect(source).toContain('from "@zavx0z/renderer-browser"')
    expect(source).toContain('from "@zavx0z/storybook/workbench"')
    expect(source).not.toContain("@zavx0z/storybook/dom/")
    expect(source).toContain("createStorybookDomWorkbench")
    expect(source).toContain("createEngineInspector")
    expect(source).toContain("createDocumentCanvasRuntime")
    expect(source).toContain('shellCanvas.id = "engine-workbench-canvas"')
    expect(source).toContain('document.getElementById("engine-story-canvas")')
    expect(source).toContain("runtime.currentFrame.boxes.find")
    expect(source).toContain("workbench.elements.previewHost")
    expect(source).toContain("await stage.show(nextStory)")
    expect(source).toContain("runtime.render()")
    expect(source).toContain('"inspector.node": inspector.element')
    expect(source).toContain("inspector.update(overviewInspectorState")
    expect(source).toContain("inspector.update(storyInspectorState")
    expect(source).not.toContain('"inspector.label"')
    expect(source).not.toContain('"inspector.source"')
    expect(source).not.toContain('workbench.update("inspector.source"')
    for (const forbidden of [
      "@layout/",
      "@ui/elements",
      "@ui/components",
      "UiRuntime",
      "UiSurface",
      "StorybookNavigationSurface",
      "StorybookStoryPanelSurface",
    ]) expect(source).not.toContain(forbidden)
  })

  test("owns real overview presentations instead of selecting a hidden first leaf", async () => {
    const source = await Bun.file(new URL("./app.ts", import.meta.url)).text()
    const overviewBranch = source.slice(
      source.indexOf('if (node.kind === "overview")'),
      source.indexOf("const nextIndex = requireStory"),
    )
    expect(overviewBranch).toContain("applyOverview")
    expect(overviewBranch).toContain("story = null")
    expect(overviewBranch).not.toContain("ENGINE_STORYBOOK_CATALOG.load")
    expect(source).toContain("routeTree.children(node.path)")
    expect(source).toContain('workbench.update("scenarios.active", null)')
    expect(source).toContain('dataset.engineStorybookCanvas = story === null ? "hidden" : "visible"')
  })

  test("publishes exact route/source/readiness after Engine and Workbench frames", async () => {
    const source = await Bun.file(new URL("./app.ts", import.meta.url)).text()
    for (const dataset of [
      "engineStorybookRoute",
      "engineStorybookRouteKind",
      "engineStorybookStory",
      "engineStorybookFrames",
      "engineStorybookHtml",
      "engineStorybookCss",
      "engineStorybookTypescript",
    ]) expect(source).toContain(`dataset.${dataset}`)
    expect(source).toContain("await waitForStorybookFrameBoundary()")
    expect(source.indexOf("await waitForStorybookFrameBoundary()"))
      .toBeLessThan(source.lastIndexOf('dataset.engineStorybook = "ready"'))
    expect(source).toContain("stage.dispose()")
    expect(source).toContain("runtime.dispose()")
    expect(source).toContain("workbench.dispose()")
  })

  test("keeps source as provenance while mounting an Engine-owned metadata Inspector", async () => {
    const source = await Bun.file(new URL("./app.ts", import.meta.url)).text()
    const inspector = await Bun.file(new URL("./inspector.ts", import.meta.url)).text()

    expect(source).toContain('"inspector.node": inspector.element')
    expect(source).toContain("dataset.engineStorybookHtml = source.html")
    expect(source).toContain("dataset.engineStorybookCss = source.css")
    expect(source).toContain("dataset.engineStorybookTypescript = source.typescript")
    expect(inspector).toContain('heading.textContent = "Props"')
    expect(inspector).toContain('sectionHeading.textContent = "Metadata"')
    expect(inspector).not.toContain("@ui/")
    expect(inspector).not.toContain("StorybookDomStorySource")
  })

  test("declares only exact Engine and document-pipeline development owners", async () => {
    const manifest = await Bun.file(new URL("../package.json", import.meta.url)).json() as {
      dependencies: Record<string, string>
    }
    expect(manifest.dependencies).toEqual({
      "@engine/core": "workspace:*",
      "@zavx0z/dom": "link:@zavx0z/dom",
      "@zavx0z/renderer": "link:@zavx0z/renderer",
      "@zavx0z/renderer-browser": "link:@zavx0z/renderer-browser",
      "@zavx0z/renderer-webgpu": "link:@zavx0z/renderer-webgpu",
      "@zavx0z/storybook": "link:@zavx0z/storybook",
    })
  })
})
