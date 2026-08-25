import {describe, expect, test} from "bun:test"
import {Object3D, Space, type Renderer, type ViewPoint} from "@engine/core"
import type {StoryScene} from "../../core/storybook/story"
import {renderStoryScene} from "./webgpu-stage"

describe("WebGpuStage rendering", () => {
  test("refreshes the complete world-matrix chain immediately before render", () => {
    const events: string[] = []
    const space = new Space()
    const parent = new Object3D()
    const child = new Object3D()
    parent.position.set(12, -4, 3)
    child.position.set(5, 2, 1)
    parent.add(child)
    space.add(parent)
    const scene = {
      space,
      camera: {position: {x: 0, y: 0, z: 10}, target: {x: 0, y: 0, z: 0}},
    } satisfies StoryScene
    const renderer = {
      render(renderedSpace: Space) {
        expect(renderedSpace).toBe(space)
        events.push(`render:${child.matrixWorld.elements[12]},${child.matrixWorld.elements[13]},${child.matrixWorld.elements[14]}`)
      },
    } as Pick<Renderer, "render">

    expect(child.matrixWorld.elements[12]).toBe(0)
    renderStoryScene(renderer, scene, {} as ViewPoint)

    expect(events).toEqual(["render:17,-2,4"])
  })
})
