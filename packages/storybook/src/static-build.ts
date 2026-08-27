import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"
import {
  readGitIdentity,
  type StorybookDependencyIdentity,
  type StorybookStaticBuildOptions,
} from "@zavx0z/storybook/build"
import {normalizeStorybookBasePath} from "@zavx0z/storybook/environment"
import {
  createEngineStorybookApp,
  engineStorybookStaticFiles,
} from "./storybook-app"

export const ENGINE_STORYBOOK_OUTPUT_ROOT = resolve(import.meta.dir, "../dist")
export const ENGINE_REPOSITORY_ROOT = resolve(import.meta.dir, "../../..")

export async function createEngineStorybookStaticBuildOptions(
  publicBasePath = "/engine",
): Promise<StorybookStaticBuildOptions> {
  return Object.freeze({
    app: createEngineStorybookApp({
      publicBasePath: normalizeStorybookBasePath(publicBasePath),
    }),
    outputRoot: ENGINE_STORYBOOK_OUTPUT_ROOT,
    source: await readGitIdentity(ENGINE_REPOSITORY_ROOT),
    dependencies: await engineStorybookDependencyIdentities(),
    staticFiles: engineStorybookStaticFiles(),
  })
}

export async function engineStorybookDependencyIdentities(): Promise<readonly StorybookDependencyIdentity[]> {
  const inputs = [
    ["@engine/core", import.meta.resolve("@engine/core/default-font")],
    ["@zavx0z/dom", import.meta.resolve("@zavx0z/dom")],
    ["@zavx0z/renderer", import.meta.resolve("@zavx0z/renderer")],
    ["@zavx0z/renderer-browser", import.meta.resolve("@zavx0z/renderer-browser")],
    ["@zavx0z/renderer-webgpu", import.meta.resolve("@zavx0z/renderer-webgpu")],
    ["@zavx0z/storybook", import.meta.resolve("@zavx0z/storybook/app")],
  ] as const
  return Object.freeze(await Promise.all(inputs.map(async ([name, entry]) => ({
    name,
    ...await readGitIdentity(dirname(fileURLToPath(entry))),
  }))))
}
