import {buildStaticStorybook} from "@zavx0z/storybook/build"
import {normalizeStorybookBasePath} from "@zavx0z/storybook/environment"
import {createEngineStorybookStaticBuildOptions} from "../src/static-build"

const publicBasePath = normalizeStorybookBasePath(
  Bun.env.ENGINE_STORYBOOK_BASE_PATH ?? "/engine",
)
const options = await createEngineStorybookStaticBuildOptions(publicBasePath)
const manifest = await buildStaticStorybook(options)

console.log(
  `[Engine Storybook] built ${manifest.pages.length} static page in ${options.outputRoot} for ${publicBasePath}/`,
)
