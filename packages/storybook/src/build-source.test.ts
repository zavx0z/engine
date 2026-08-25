import {describe, expect, test} from "bun:test"
import {join} from "node:path"
import {
  ENGINE_REPOSITORY_ROOT,
  ENGINE_STORYBOOK_OUTPUT_ROOT,
  createEngineStorybookStaticBuildOptions,
} from "./static-build"

describe("Engine Storybook static build source", () => {
  test("keeps shared UI providers in private development manifests only", async () => {
    const root = await Bun.file(new URL("../../../package.json", import.meta.url)).json() as {
      devDependencies?: Record<string, string>
    }
    const storybook = await Bun.file(new URL("../package.json", import.meta.url)).json() as {
      dependencies?: Record<string, string>
    }
    const core = await Bun.file(new URL("../../core/package.json", import.meta.url)).json() as {
      dependencies?: Record<string, string>
    }
    const providers = {
      "@layout/core": "link:@layout/core",
      "@ui/components": "link:@ui/components",
      "@ui/elements": "link:@ui/elements",
      "@zavx0z/highlighter": "link:@zavx0z/highlighter",
      "@zavx0z/storybook": "link:@zavx0z/storybook",
    }

    for (const [name, specifier] of Object.entries(providers)) {
      expect(root.devDependencies?.[name], name).toBe(specifier)
      expect(storybook.dependencies?.[name], name).toBe(specifier)
    }
    expect(core.dependencies).toBeUndefined()
  })

  test("records exact Engine, Layout, UI, Highlighter and shared identities", async () => {
    const options = await createEngineStorybookStaticBuildOptions()

    expect(options.app.id).toBe("engine")
    expect(options.app.basePath).toBe("/engine")
    expect(options.outputRoot).toBe(join(ENGINE_REPOSITORY_ROOT, "packages/storybook/dist"))
    expect(options.outputRoot).toBe(ENGINE_STORYBOOK_OUTPUT_ROOT)
    expect(options.source.revision).toMatch(/^[0-9a-f]{40,64}$/)
    expect(typeof options.source.dirty).toBe("boolean")
    expect(options.dependencies.map(({name}) => name)).toEqual([
      "@engine/core",
      "@layout/core",
      "@ui/workspace",
      "@zavx0z/highlighter",
      "@zavx0z/storybook",
    ])
    for (const dependency of options.dependencies) {
      expect(dependency.revision, dependency.name).toMatch(/^[0-9a-f]{40,64}$/)
      expect(typeof dependency.dirty, dependency.name).toBe("boolean")
    }
    expect(options.dependencies[0]?.revision).toBe(options.source.revision)
    expect(options.staticFiles).toHaveLength(1)
    expect(options.staticFiles[0]?.publicPath).toBe("/fonts/jetbrains-mono-bold.ttf")
    expect(await Bun.file(options.staticFiles[0]!.sourcePath).exists()).toBeTrue()
  })

  test("delegates schema-1 output to the shared atomic builder", async () => {
    const source = await Bun.file(new URL("../scripts/build.ts", import.meta.url)).text()

    expect(source).toContain('from "@zavx0z/storybook/build"')
    expect(source).toContain("buildStaticStorybook(options)")
    expect(source).toContain("ENGINE_STORYBOOK_BASE_PATH ?? \"/engine\"")
    expect(source).not.toContain("Bun.build")
    expect(source).not.toContain("rm(outputRoot")
    expect(source).not.toContain("copyFile")
  })
})
