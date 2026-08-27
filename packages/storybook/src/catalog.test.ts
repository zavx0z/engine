import {describe, expect, test} from "bun:test"
import {ENGINE_STORYBOOK_CATALOG} from "./catalog"
import {storyIcons} from "../../core/storybook/icons"

const EXPECTED_ROUTES = [
  "space/coordinate-system/z-up",
  "instanced-mesh/geometry/boxes",
  "holographic-material/geometry/torus",
  "thin-film-material/geometry/sphere",
  "text/presentation-clip/stencil",
] as const

describe("engine story catalog", () => {
  test("publishes the exact three-level pathname hierarchy", () => {
    expect(ENGINE_STORYBOOK_CATALOG.index.map(({route}) => route)).toEqual([...EXPECTED_ROUTES])
    expect(ENGINE_STORYBOOK_CATALOG.routeTree.leaves).toEqual([...EXPECTED_ROUTES])
    expect(ENGINE_STORYBOOK_CATALOG.representative).toBe("space/coordinate-system/z-up")
  })

  test("keeps Russian labels with exact public Engine identifiers", () => {
    expect(ENGINE_STORYBOOK_CATALOG.index.map((item) => ({
      group: item.groupLabel,
      component: item.componentLabel,
      section: item.sectionLabel,
      variant: item.variantLabel,
      title: item.title,
      apiName: item.apiName,
    }))).toEqual([
      {
        group: "Основы",
        component: "Пространство",
        section: "Система координат",
        variant: "Ось Z вверх",
        title: "Система координат Z-up",
        apiName: "Space",
      },
      {
        group: "Геометрия",
        component: "Инстансированный mesh",
        section: "Геометрия",
        variant: "Боксы",
        title: "Инстансированные боксы",
        apiName: "InstancedMesh",
      },
      {
        group: "Материалы",
        component: "Голографический материал",
        section: "Геометрия",
        variant: "Тор",
        title: "Голографический тор",
        apiName: "HolographicMaterial",
      },
      {
        group: "Материалы",
        component: "Тонкоплёночный материал",
        section: "Геометрия",
        variant: "Сфера",
        title: "Тонкоплёночная сфера",
        apiName: "ThinFilmMaterial",
      },
      {
        group: "Текст",
        component: "Текст",
        section: "Обрезка представления",
        variant: "Трафарет",
        title: "Трафаретная обрезка текста",
        apiName: "Text",
      },
    ])
  })

  test("loads every owner module independently through its exact route", async () => {
    const loaded = await Promise.all(EXPECTED_ROUTES.map((route) => ENGINE_STORYBOOK_CATALOG.load(route)))
    expect(loaded.map(({id}) => id)).toEqual([
      "foundations-coordinate-space",
      "geometry-instanced-boxes",
      "materials-holographic-torus",
      "materials-thin-film-sphere",
      "text-stencil-clipping",
    ])
    expect(new Set(loaded).size).toBe(loaded.length)
  })

  test("fails closed for unknown routes", async () => {
    expect(ENGINE_STORYBOOK_CATALOG.find("space/coordinate-system/missing")).toBeUndefined()
    await expect(ENGINE_STORYBOOK_CATALOG.load("space/coordinate-system/missing"))
      .rejects.toThrow("Unknown Storybook DOM route")
  })

  test("preserves unique ids, owner paths and icon associations", async () => {
    const loaded = await Promise.all(EXPECTED_ROUTES.map((route) => ENGINE_STORYBOOK_CATALOG.load(route)))
    const ids = loaded.map((story) => story.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const story of loaded) {
      expect(story.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(story.sourceFile).toMatch(/^packages\/core\/storybook\/[a-z0-9/-]+\.stories\.ts$/)
      expect(storyIcons[story.icon].materialIcon).toBe(story.materialIcon)
    }
  })

  test("preserves the text stencil clipping source contract", async () => {
    const story = await ENGINE_STORYBOOK_CATALOG.load("text/presentation-clip/stencil")

    expect(story.title).toBe("Трафаретная обрезка текста")
    expect(story.description).toContain("Пиксели")
    expect(story.description).toContain("не заходят под border")
    expect(story.description).toContain("Z-up камерой")
    expect(story.source).toContain("PresentationClipShape")
    expect(story.source).toContain("const PANEL_BORDER_WIDTH = 2")
    expect(story.source).toContain("const PANEL_CLIP_INSET = 4")
    expect(story.source).toContain("halfSize: [135 - PANEL_CLIP_INSET, 100 - PANEL_CLIP_INSET]")
    expect(story.source.match(/24 - PANEL_CLIP_INSET/g)).toHaveLength(4)
    expect(story.source).toContain("const board = new Object3D()")
    expect(story.source).toContain("board.rotation.x = Math.PI / 2")
    expect(story.source).toContain('kind: "rounded-rect"')
    expect(story.source.match(/\.presentationClips = /g)).toHaveLength(2)
    expect(story.source).not.toContain("clipBounds")
  })

  test("implements clipping through the public Engine API in the owner module", async () => {
    const source = await Bun.file(
      new URL("../../core/storybook/text/stencil-clipping.stories.ts", import.meta.url),
    ).text()

    expect(source).toContain('from "@engine/core"')
    expect(source).toContain("type PresentationClipShape")
    expect(source).toContain("const PANEL_BORDER_WIDTH = 2")
    expect(source).toContain("const PANEL_CLIP_INSET = 4")
    expect(source).toContain("borderWidth: PANEL_BORDER_WIDTH")
    expect(source).toContain("PANEL_WIDTH / 2 - PANEL_CLIP_INSET")
    expect(source).toContain("PANEL_RADIUS - PANEL_CLIP_INSET")
    expect(source).toContain("const board = new Object3D()")
    expect(source).toContain("board.rotation.x = Math.PI / 2")
    expect(source.match(/board\.add\(/g)?.length).toBeGreaterThanOrEqual(7)
    expect(source).toContain("position: {x: 0, y: -480, z: 0}")
    expect(source).not.toContain("position: {x: 0, y: 0, z: 480}")
    expect(source).toContain('kind: "rounded-rect"')
    expect(source.match(/\.presentationClips = /g)?.length).toBeGreaterThanOrEqual(4)
    expect(source.match(/position\.set\([^\n]+, lineY, 3\)/g)).toHaveLength(2)
    expect(source).not.toContain("clipBounds")
  })
})
