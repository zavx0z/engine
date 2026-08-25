import {describe, expect, test} from "bun:test"
import {resolveStory, stories, storyHash} from "./catalog"
import {storyIcons} from "./icons"

describe("engine story catalog", () => {
  test("uses unique lowercase semantic ids and story filenames", () => {
    const ids = stories.map((story) => story.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const story of stories) {
      expect(story.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(story.sourceFile).toMatch(/^[a-z0-9/-]+\.stories\.ts$/)
    }
  })

  test("associates every story with a local Atom Material icon name", () => {
    for (const story of stories) {
      expect(storyIcons[story.icon].materialIcon).toBe(story.materialIcon)
    }
  })

  test("round-trips hashes and falls back to the first story", () => {
    for (const story of stories) expect(resolveStory(storyHash(story))).toBe(story)
    expect(resolveStory("#/missing")).toBe(stories[0]!)
  })

  test("publishes the text stencil clipping regression story", () => {
    const story = stories.find((candidate) => candidate.id === "text-stencil-clipping")

    expect(story?.group).toBe("Text")
    expect(story?.title).toBe("Stencil-обрезка текста")
    expect(story?.description).toMatch(/[\u0400-\u04ff]/)
    expect(story?.description).toContain("Пиксели")
    expect(story?.description).toContain("не заходят под border")
    expect(story?.description).toContain("Z-up камерой")
    expect(story?.source).toContain("PresentationClipShape")
    expect(story?.source).toContain("const PANEL_BORDER_WIDTH = 2")
    expect(story?.source).toContain("const PANEL_CLIP_INSET = 4")
    expect(story?.source).toContain("halfSize: [135 - PANEL_CLIP_INSET, 100 - PANEL_CLIP_INSET]")
    expect(story?.source.match(/24 - PANEL_CLIP_INSET/g)).toHaveLength(4)
    expect(story?.source).toContain("const board = new Object3D()")
    expect(story?.source).toContain("board.rotation.x = Math.PI / 2")
    expect(story?.source).toContain('kind: "rounded-rect"')
    expect(story?.source.match(/\.presentationClips = /g)).toHaveLength(2)
    expect(story?.source).not.toContain("clipBounds")
    expect(story === undefined ? "" : storyHash(story)).toBe("#/story/text-stencil-clipping")
  })

  test("implements the text clipping proof through the public Engine clip API", async () => {
    const source = await Bun.file(new URL("./stories/text/stencil-clipping.stories.ts", import.meta.url)).text()

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
