import {describe, expect, test} from "bun:test"
import {storybookPageRoutes} from "@zavx0z/storybook/app"
import {startStorybookHubServer} from "@zavx0z/storybook/server"
import {
  createEngineStorybookApp,
  engineStorybookStaticFiles,
} from "./storybook-app"

describe("Engine Storybook no-HMR server", () => {
  test("serves only canonical /engine routes, the exact canvas and Engine font", async () => {
    const app = createEngineStorybookApp()
    const server = startStorybookHubServer({
      app,
      hostname: "127.0.0.1",
      port: 0,
      staticFiles: engineStorybookStaticFiles(),
    })

    try {
      const origin = server.url.origin
      const redirect = await fetch(`${origin}/engine`, {redirect: "manual"})
      expect(redirect.status).toBe(308)
      expect(redirect.headers.get("location")).toBe("/engine/")

      const routes = storybookPageRoutes(app, app.pages[0]!)
      for (const pathname of [routes[0]!, routes.at(-1)!]) {
        const response = await fetch(`${origin}${pathname}`)
        const html = await response.text()
        expect(response.status, pathname).toBe(200)
        expect(html, pathname).toContain('<base href="/engine/">')
        expect(html, pathname).toContain('<meta name="engine-default-font" content="/engine/fonts/jetbrains-mono-bold.ttf">')
        expect(html, pathname).toContain('<canvas id="engine-story-canvas"></canvas>')
        expect(html, pathname).toContain("Создано для&nbsp;<a")
        expect(html, pathname).toContain("переиспользуемая WebGPU-инфраструктура Engine")
        expect(html, pathname).not.toContain("Built for MetaFor")
      }

      expect(await fetch(`${origin}/engine/missing`).then(({status}) => status)).toBe(404)
      expect(await fetch(`${origin}/missing`).then(({status}) => status)).toBe(404)
      const font = await fetch(`${origin}/engine/fonts/jetbrains-mono-bold.ttf`)
      expect(font.status).toBe(200)
      expect((await font.arrayBuffer()).byteLength).toBeGreaterThan(0)
    } finally {
      server.stop(true)
    }
  })

  test("keeps the runnable lifecycle on the shared server and exact port", async () => {
    const source = await Bun.file(new URL("../scripts/serve.ts", import.meta.url)).text()
    const manifest = await Bun.file(new URL("../package.json", import.meta.url)).json() as {
      scripts?: Record<string, string>
    }

    expect(source).toContain('from "@zavx0z/storybook/server"')
    expect(source).toContain("ENGINE_STORYBOOK_PORT ?? 4173")
    expect(source).not.toContain("Bun.serve")
    expect(manifest.scripts?.dev).toBe("bun scripts/serve.ts")
    expect(manifest.scripts?.preview).toBe("bun scripts/serve.ts")
  })
})
