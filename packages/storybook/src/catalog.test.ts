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
    expect(story?.source).toContain("clipBounds")
    expect(story === undefined ? "" : storyHash(story)).toBe("#/story/text-stencil-clipping")
  })
})
