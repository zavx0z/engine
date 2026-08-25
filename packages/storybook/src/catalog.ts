import {defineStorybookStoryCatalog} from "@zavx0z/storybook/stories"
import {
  ENGINE_STORYBOOK_GROUPS,
  ENGINE_STORYBOOK_REPRESENTATIVE,
} from "../../core/storybook/catalog"
import {
  ENGINE_STORYBOOK_METADATA_BY_ROUTE,
  type EngineStoryMetadata,
} from "../../core/storybook/metadata"
import type {EngineStory} from "../../core/storybook/story"

type EngineStoryRoute = keyof typeof ENGINE_STORYBOOK_METADATA_BY_ROUTE

const metadataForRoute = (route: string): EngineStoryMetadata => {
  const metadata = ENGINE_STORYBOOK_METADATA_BY_ROUTE[route as EngineStoryRoute]
  if (metadata === undefined) throw new Error(`Unknown Engine story route: ${route}`)
  return metadata
}

const normalizeEngineStory = (route: string, loaded: unknown): EngineStory => {
  if (loaded === null || typeof loaded !== "object") {
    throw new Error(`Engine story did not load an object: ${route}`)
  }
  const story = loaded as Partial<EngineStory>
  const metadata = metadataForRoute(route)
  if (story.id !== metadata.id) throw new Error(`Engine story id does not match route: ${route}`)
  if (story.group !== metadata.group) throw new Error(`Engine story group does not match route: ${route}`)
  if (story.title !== metadata.title) throw new Error(`Engine story title does not match route: ${route}`)
  if (story.description !== metadata.description) {
    throw new Error(`Engine story description does not match route: ${route}`)
  }
  if (story.sourceFile !== metadata.sourceFile) {
    throw new Error(`Engine story source file does not match route: ${route}`)
  }
  if (story.icon !== metadata.icon || story.materialIcon !== metadata.materialIcon) {
    throw new Error(`Engine story icon does not match route: ${route}`)
  }
  if (!Array.isArray(story.tags) || story.tags.length !== metadata.tags.length ||
    story.tags.some((tag, index) => tag !== metadata.tags[index])) {
    throw new Error(`Engine story tags do not match route: ${route}`)
  }
  if (story.source !== metadata.source) throw new Error(`Engine story source does not match route: ${route}`)
  if (typeof story.createScene !== "function") {
    throw new Error(`Engine story createScene must be a function: ${route}`)
  }
  return loaded as EngineStory
}

/** Typed pathname hierarchy with one lazy module per Engine story. */
export const ENGINE_STORYBOOK_CATALOG = defineStorybookStoryCatalog<unknown, EngineStory>({
  groups: ENGINE_STORYBOOK_GROUPS,
  representative: ENGINE_STORYBOOK_REPRESENTATIVE,
  normalizeModule: normalizeEngineStory,
})

/**
 * Selects the first registered detail below an overview for presentation.
 * Exact leaves stay exact and unknown paths fail closed.
 */
export function engineStorybookPresentationRoute(path: string): string {
  const node = ENGINE_STORYBOOK_CATALOG.routeTree.find(path)
  if (node === undefined) throw new Error(`Unknown Engine story route: ${path}`)
  if (node.kind === "leaf") return node.path
  const prefix = node.path === "" ? "" : `${node.path}/`
  const descendant = ENGINE_STORYBOOK_CATALOG.index.find(({route}) => route.startsWith(prefix))
  if (descendant === undefined) throw new Error(`Engine story overview has no detail route: ${path}`)
  return descendant.route
}
