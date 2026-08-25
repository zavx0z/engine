import {describe, expect, test} from "bun:test"

describe("Engine Storybook shared Workbench application", () => {
  test("uses all five shared regions around one owner-rendered Engine canvas", async () => {
    const source = await Bun.file(new URL("./app.ts", import.meta.url)).text()

    expect(source).toContain('from "@zavx0z/storybook/route-tree"')
    expect(source).toContain('from "@zavx0z/storybook/stories"')
    expect(source).toContain('from "@zavx0z/storybook/workbench"')
    expect(source).toContain('from "@zavx0z/storybook/environment"')
    for (const region of [
      "StorybookNavigationSurface",
      "EnginePreviewSurface",
      "StorybookDockSurface",
      "StorybookStoryPanelSurface",
    ]) expect(source).toContain(region)
    for (const frame of [".catalog", ".section", ".preview", ".dock", ".info"]) {
      expect(source).toContain(`frames(w, h)${frame}`)
    }
    expect(source).toContain('workbenchCanvas.id = "engine-workbench-canvas"')
    expect(source).toContain('document.getElementById("engine-story-canvas")')
    expect(source).toContain("await stage.show(story)")
    expect(source).toContain('dataset.engineStorybook = "ready"')
    expect(source).not.toContain("location.hash")
    expect(source).not.toContain("hashchange")
    expect(source).not.toContain("innerHTML")
  })

  test("positions the real perspective preview inside shared preview chrome", async () => {
    const app = await Bun.file(new URL("./app.ts", import.meta.url)).text()
    const preview = await Bun.file(new URL("./engine-preview-surface.ts", import.meta.url)).text()
    const style = await Bun.file(new URL("./styles.css", import.meta.url)).text()

    expect(preview).toContain("drawStorybookPreviewChrome")
    expect(preview).toContain('from "../../core/storybook/story.ts"')
    expect(app).toContain("ENGINE_PREVIEW_CONTENT_TOP")
    expect(app).toContain('engineCanvas.style.left = `${x}px`')
    expect(app).toContain('engineCanvas.style.visibility = "visible"')
    expect(style).toContain("#engine-workbench-canvas")
    expect(style).toContain("#engine-story-canvas")
    expect(style).toContain("position: fixed")
    expect(style).toContain("touch-action: none")
  })

  test("publishes readiness only after a real synchronous Engine render", async () => {
    const app = await Bun.file(new URL("./app.ts", import.meta.url)).text()
    const stage = await Bun.file(new URL("./webgpu-stage.ts", import.meta.url)).text()

    expect(stage).toContain("#renderNow(): void")
    expect(stage).toContain("renderStoryScene(this.#renderer, this.#scene, this.#viewPoint)")
    expect(stage).toContain("this.#presentedFrames += 1")
    expect(app.indexOf("await stage.show(story)")).toBeLessThan(
      app.lastIndexOf('dataset.engineStorybook = "ready"'),
    )
  })

  test("rechecks bootstrap and reset work against the latest pathname selection", async () => {
    const app = await Bun.file(new URL("./app.ts", import.meta.url)).text()
    const stage = await Bun.file(new URL("./webgpu-stage.ts", import.meta.url)).text()

    expect(app).toContain("const initial = await loadStableEngineStory(router)")
    expect(app).toContain("if (router.current !== initialNode)")
    expect(app).toContain("router.current === node")
    expect(app).toContain("const revision = selectionRevision")
    expect(app).toContain("if (!committed || revision !== selectionRevision) return")
    expect(stage).toContain("async reset(): Promise<boolean>")
  })
})
