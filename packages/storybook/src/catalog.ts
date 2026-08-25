import {coordinateSpaceStory} from "./stories/foundations/coordinate-space.stories"
import {instancedBoxesStory} from "./stories/geometry/instanced-boxes.stories"
import {holographicTorusStory} from "./stories/materials/holographic-torus.stories"
import {thinFilmSphereStory} from "./stories/materials/thin-film-sphere.stories"
import {textStencilClippingStory} from "./stories/text/stencil-clipping.stories"
import type {EngineStory} from "./story"

export const stories: readonly EngineStory[] = Object.freeze([
  coordinateSpaceStory,
  instancedBoxesStory,
  holographicTorusStory,
  thinFilmSphereStory,
  textStencilClippingStory,
])

export function storyHash(story: EngineStory): string {
  return `#/story/${story.id}`
}

export function resolveStory(hash: string): EngineStory {
  const match = /^#\/story\/([a-z0-9-]+)$/.exec(hash)
  const requestedId = match?.[1]
  return stories.find((story) => story.id === requestedId) ?? stories[0]!
}
