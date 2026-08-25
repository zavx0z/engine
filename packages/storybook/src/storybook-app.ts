import {fileURLToPath} from "node:url"
import {join} from "node:path"
import {
  defineStorybookApp,
  type StorybookAppManifest,
  type StorybookStaticFile,
} from "@zavx0z/storybook/app"
import {ENGINE_STORYBOOK_CATALOG} from "./catalog"

export type EngineStorybookAppOptions = Readonly<{
  publicBasePath?: string
}>

const storybookRoot = join(import.meta.dir, "..")

export function createEngineStorybookApp(
  options: EngineStorybookAppOptions = {},
): StorybookAppManifest {
  return defineStorybookApp({
    id: "engine",
    title: "Engine Storybook",
    basePath: options.publicBasePath ?? "/engine",
    home: {
      path: "/",
      label: "Главная",
      ariaLabel: "На главную Engine Storybook",
    },
    footer: {
      lead: "Создано для",
      owner: {
        label: "MetaFor",
        href: "https://github.com/zavx0z/metafor",
      },
      detail: "переиспользуемая WebGPU-инфраструктура Engine",
    },
    head: {meta: [{
      kind: "public-path",
      name: "engine-default-font",
      path: "/fonts/jetbrains-mono-bold.ttf",
    }]},
    pages: [{
      id: "engine",
      title: "Engine Storybook · @engine/core",
      mountPath: "/",
      entrypoint: join(storybookRoot, "src/app.ts"),
      stylePath: join(storybookRoot, "src/styles.css"),
      body: {kind: "canvas", canvasId: "engine-story-canvas"},
      capability: "webgpu",
      readiness: {dataset: "engineStorybook", value: "ready"},
      canvas: {id: "engine-story-canvas", evidence: "non-black"},
      routeTree: ENGINE_STORYBOOK_CATALOG.routeTree,
    }],
  })
}

export function engineStorybookStaticFiles(): readonly StorybookStaticFile[] {
  return Object.freeze([{
    publicPath: "/fonts/jetbrains-mono-bold.ttf",
    sourcePath: fileURLToPath(import.meta.resolve("@engine/core/fonts/jetbrains-mono-bold.ttf")),
  }])
}
