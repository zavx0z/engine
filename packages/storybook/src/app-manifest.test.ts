import {describe, expect, test} from "bun:test"
import {storybookPageRoutes} from "@zavx0z/storybook/app"
import {ENGINE_STORYBOOK_CATALOG} from "./catalog"
import {createEngineStorybookApp} from "./storybook-app"

describe("Engine Storybook app manifest", () => {
  test("owns one WebGPU page under /engine with exact evidence and Russian shell text", () => {
    const app = createEngineStorybookApp()

    expect(app.id).toBe("engine")
    expect(app.basePath).toBe("/engine")
    expect(app.home).toEqual({
      path: "/",
      label: "Главная",
      ariaLabel: "На главную Engine Storybook",
    })
    expect(app.footer).toEqual({
      lead: "Создано для",
      owner: {
        label: "MetaFor",
        href: "https://github.com/zavx0z/metafor",
      },
      detail: "переиспользуемая WebGPU-инфраструктура Engine",
    })
    expect(app.head.meta).toEqual([{
      kind: "public-path",
      name: "engine-default-font",
      path: "/fonts/jetbrains-mono-bold.ttf",
    }])
    expect(app.pages).toHaveLength(1)

    const page = app.pages[0]!
    expect(page.id).toBe("engine")
    expect(page.mountPath).toBe("/")
    expect(page.body).toEqual({kind: "canvas", canvasId: "engine-story-canvas"})
    expect(page.capability).toBe("webgpu")
    expect(page.readiness).toEqual({dataset: "engineStorybook", value: "ready"})
    expect(page.canvas).toEqual({id: "engine-story-canvas", evidence: "non-black"})
    expect(page.routeTree).toBe(ENGINE_STORYBOOK_CATALOG.routeTree)
    expect(storybookPageRoutes(app, page)[0]).toBe("/engine/")
  })
})
