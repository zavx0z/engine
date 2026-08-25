import {describe, expect, test} from "bun:test"
import {Space} from "@engine/core"
import type {EngineStory, StoryScene} from "./story"
import {StorySceneState} from "./story-scene-state"

const scene = (x: number): StoryScene => ({
  space: new Space(),
  camera: {
    position: {x, y: 0, z: 10},
    target: {x: 0, y: 0, z: 0},
  },
})

const story = (id: string, createScene: () => StoryScene | Promise<StoryScene>): EngineStory => ({
  id,
  group: "Foundations",
  title: id,
  icon: "architecture",
  materialIcon: "Hub",
  description: id,
  sourceFile: `stories/foundations/${id}.stories.ts`,
  tags: [],
  source: "",
  createScene,
})

describe("StorySceneState", () => {
  test("ignores a scene that resolves after a newer selection", async () => {
    let resolveFirst: ((value: StoryScene) => void) | undefined
    const firstScene = scene(1)
    const secondScene = scene(2)
    const first = story("first", () => new Promise<StoryScene>((resolve) => {
      resolveFirst = resolve
    }))
    const state = new StorySceneState()

    const stale = state.show(first)
    await expect(state.show(story("second", () => secondScene))).resolves.toBe(secondScene)
    resolveFirst?.(firstScene)

    await expect(stale).resolves.toBeNull()
  })

  test("recreates the current story on reset", async () => {
    let version = 0
    const state = new StorySceneState()
    const current = story("current", () => scene(++version))

    const initial = await state.show(current)
    const reset = await state.reset()

    expect(initial?.camera.position.x).toBe(1)
    expect(reset?.camera.position.x).toBe(2)
  })
})
