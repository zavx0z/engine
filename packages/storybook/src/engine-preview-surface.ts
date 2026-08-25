/**
Engine-owned preview chrome inside the shared five-region Workbench.

The shared canvas renders the panel and text. The real Engine renderer keeps a
separate HTML canvas positioned over the content slot, so story camera,
orbit/pan input and production WebGPU semantics remain unchanged.

@packageDocumentation
*/

import {UiSurface} from "@layout/core/surface"
import type {StorybookStoryIndexItem} from "@zavx0z/storybook/stories"
import {drawStorybookPreviewChrome} from "@zavx0z/storybook/workbench"
import type {EngineStory} from "../../core/storybook/story.ts"

export const ENGINE_PREVIEW_CONTENT_TOP = 58
export const ENGINE_PREVIEW_CONTENT_INSET = 2

export class EnginePreviewSurface extends UiSurface {
  readonly #content = this.createRetainedParent()
  #index: StorybookStoryIndexItem
  #story: EngineStory
  #signature = ""
  #geometry: Readonly<{w: number; h: number; pixelScale: number; font: unknown}> | null = null

  constructor(index: StorybookStoryIndexItem, story: EngineStory) {
    super({bgColor: null, borderColor: null})
    this.node.name = "EnginePreviewSurface"
    this.#content.name = "EnginePreviewSurface.content"
    this.#index = index
    this.#story = story
  }

  setStory(index: StorybookStoryIndexItem, story: EngineStory): void {
    this.#index = index
    this.#story = story
    this.requestRender()
  }

  protected override render(): void {
    const signature = `${this.#index.route}:${this.#story.description}`
    const geometryChanged = this.#geometry === null ||
      this.#geometry.w !== this.rectW ||
      this.#geometry.h !== this.rectH ||
      this.#geometry.pixelScale !== this.pixelScale ||
      this.#geometry.font !== this.font
    if (!geometryChanged && signature === this.#signature) return

    this.materializeRetainedParent(this.#content, () => {
      drawStorybookPreviewChrome(this, this.rectW, this.rectH, {
        title: this.#story.title,
        description: this.#story.description,
      })
    })
    this.#signature = signature
    this.#geometry = {
      w: this.rectW,
      h: this.rectH,
      pixelScale: this.pixelScale,
      font: this.font,
    }
  }
}
