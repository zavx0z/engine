import {describe, expect, test} from "bun:test"
import {join} from "node:path"
import {
  ENGINE_REPOSITORY_ROOT,
  ENGINE_STORYBOOK_OUTPUT_ROOT,
  createEngineStorybookStaticBuildOptions,
} from "./static-build.ts"

describe("Engine Storybook static build source", () => {
  test("keeps the document pipeline in private development manifests only", async () => {
    const root = await Bun.file(new URL("../../../package.json", import.meta.url)).json() as {
      devDependencies?: Record<string, string>
    }
    const storybook = await Bun.file(new URL("../package.json", import.meta.url)).json() as {
      dependencies?: Record<string, string>
    }
    const core = await Bun.file(new URL("../../core/package.json", import.meta.url)).json() as {
      dependencies?: Record<string, string>
    }
    const owners = [
      "@zavx0z/dom",
      "@zavx0z/renderer",
      "@zavx0z/renderer-browser",
      "@zavx0z/renderer-webgpu",
      "@zavx0z/storybook",
    ]
    for (const name of owners) {
      expect(root.devDependencies?.[name], name).toBe(`link:${name}`)
      expect(storybook.dependencies?.[name], name).toBe(`link:${name}`)
    }
    expect(storybook.dependencies?.["@engine/core"]).toBe("workspace:*")
    expect(core.dependencies).toBeUndefined()
    for (const retired of ["@layout/core", "@ui/components", "@ui/elements", "@zavx0z/highlighter"]) {
      expect(root.devDependencies?.[retired]).toBeUndefined()
      expect(storybook.dependencies?.[retired]).toBeUndefined()
    }
  })

  test("records exact Engine and document-pipeline identities", async () => {
    const options = await createEngineStorybookStaticBuildOptions()
    expect(options.app.id).toBe("engine")
    expect(options.app.basePath).toBe("/engine")
    expect(options.outputRoot).toBe(join(ENGINE_REPOSITORY_ROOT, "packages/storybook/dist"))
    expect(options.outputRoot).toBe(ENGINE_STORYBOOK_OUTPUT_ROOT)
    expect(options.dependencies.map(({name}) => name)).toEqual([
      "@engine/core",
      "@zavx0z/dom",
      "@zavx0z/renderer",
      "@zavx0z/renderer-browser",
      "@zavx0z/renderer-webgpu",
      "@zavx0z/storybook",
    ])
    for (const dependency of options.dependencies) {
      expect(dependency.revision, dependency.name).toMatch(/^[0-9a-f]{40,64}$/)
      expect(typeof dependency.dirty, dependency.name).toBe("boolean")
    }
    expect(options.dependencies[0]?.revision).toBe(options.source.revision)
    expect(options.staticFiles[0]?.publicPath).toBe("/fonts/jetbrains-mono-bold.ttf")
  })

  test("delegates schema-1 output to the shared atomic builder", async () => {
    const source = await Bun.file(new URL("../scripts/build.ts", import.meta.url)).text()
    expect(source).toContain('from "@zavx0z/storybook/build"')
    expect(source).toContain("buildStaticStorybook(options)")
    expect(source).toContain("ENGINE_STORYBOOK_BASE_PATH ?? \"/engine\"")
    expect(source).not.toContain("Bun.build")
    expect(source).not.toContain("rm(outputRoot")
  })
})
